
(() => {
  // -------- CONFIG --------
  const API_KEY = "1f1f46c29e61fa36d6e95f74a01618a5";
  const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
  const REV_URL = "https://api.openweathermap.org/geo/1.0/reverse";
  const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
  const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

  const STORAGE = { CITIES: "mausam:cities", UNIT: "mausam:unit" };

  // -------- DOM --------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const cardsEl = $("#cards");
  const emptyEl = $("#empty");
  const toastEl = $("#toast");

  const btnC = $("#btnC");
  const btnF = $("#btnF");
  const refreshBtn = $("#refreshBtn");
  const geoBtn = $("#geoBtn");
  const clearBtn = $("#clearBtn");
  const searchForm = $("#searchForm");
  const cityInput = $("#cityInput");

  // -------- STATE --------
  const state = {
    unit: load(STORAGE.UNIT) || "metric",
    cities: load(STORAGE.CITIES) || [],
    updating: false
  };

  // -------- UTIL --------
  function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
  function load(k){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch{return null;} }
  async function getJSON(u){ const r=await fetch(u); if(!r.ok) throw new Error(`${r.status}`); return r.json(); }
  function showToast(m, ms=2000){ toastEl.textContent=m; toastEl.style.display="block"; clearTimeout(showToast._t); showToast._t=setTimeout(()=>toastEl.style.display='none', ms); }
  const unit = () => state.unit==="metric"?"°C":"°F";
  const windUnit = () => state.unit==="metric"?"m/s":"mph";
  const slug = (lat,lon)=>`${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cap = s => String(s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toggleEmpty(){ emptyEl.style.display = state.cities.length? "none" : ""; }

  // -------- WEATHER ICONS (simple + stable sizes) --------
  function wxIcon(code, night=false, size=56){
    const color = night ? "#93c5fd" : "#f8fafc";
    const stroke = "rgba(0,0,0,.18)";
    const n = String(size);
    const sun = `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.5" fill="${color}" stroke="${stroke}"/><g stroke="${color}" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></g></svg>`;
    const cloud = `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none"><path d="M7 18h8a4 4 0 1 0-1.1-7.85A5.5 5.5 0 0 0 3 12.5 3.5 3.5 0 0 0 7 18Z" fill="${color}" stroke="${stroke}"/></svg>`;
    const rain = `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none"><path d="M7 15h8a4 4 0 1 0-1.1-7.85A5.5 5.5 0 0 0 3 9.5 3.5 3.5 0 0 0 7 15Z" fill="${color}" stroke="${stroke}"/><g stroke="${color}" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M8 17v3M12 17v3M16 17v3"/></g></svg>`;
    const storm = `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none"><path d="M7 15h8a4 4 0 1 0-1.1-7.85A5.5 5.5 0 0 0 3 9.5 3.5 3.5 0 0 0 7 15Z" fill="${color}" stroke="${stroke}"/><path d="M11 16l-2 4h2l-1 3 3-5h-2l1-2z" fill="${color}"/></svg>`;
    const snow = `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none"><path d="M7 15h8a4 4 0 1 0-1.1-7.85A5.5 5.5 0 0 0 3 9.5 3.5 3.5 0 0 0 7 15Z" fill="${color}" stroke="${stroke}"/><g fill="${color}"><circle cx="9" cy="18" r="1.2"/><circle cx="12" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></g></svg>`;
    if (code===800) return sun;
    if (code>=200 && code<300) return storm;
    if (code>=300 && code<600) return rain;
    if (code>=600 && code<700) return snow;
    return cloud;
  }

  // -------- API --------
  async function geocodeCity(q){
    const url = `${GEO_URL}?q=${encodeURIComponent(q)}&limit=1&appid=${API_KEY}`;
    const [first] = await getJSON(url);
    if(!first) throw new Error("Not found");
    return { name:first.name, country:first.country, lat:first.lat, lon:first.lon };
  }
  async function reverseGeocode(lat,lon){
    const url = `${REV_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    const [first] = await getJSON(url);
    return { name:first?.name || "My location", country:first?.country || "", lat, lon };
  }
  async function fetchWeather(lat,lon){
    const [cur, fc] = await Promise.all([
      getJSON(`${WEATHER_URL}?lat=${lat}&lon=${lon}&units=${state.unit}&appid=${API_KEY}`),
      getJSON(`${FORECAST_URL}?lat=${lat}&lon=${lon}&units=${state.unit}&appid=${API_KEY}`)
    ]);
    return { cur, days: compressDays(fc.list) };
  }
  function compressDays(list){
    const map = new Map();
    list.forEach(item=>{
      const d = new Date(item.dt*1000);
      const key = d.toISOString().slice(0,10);
      const ref = map.get(key) || { min: Infinity, max: -Infinity, codes:[], night:false };
      ref.min = Math.min(ref.min, item.main.temp_min);
      ref.max = Math.max(ref.max, item.main.temp_max);
      ref.codes.push(item.weather?.[0]?.id || 800);
      const h = d.getHours(); if(h<6 || h>=19) ref.night=true;
      map.set(key, ref);
    });
    const names = Array.from(map.values()).slice(1,4);
    return names.map(x => ({ min:Math.round(x.min), max:Math.round(x.max), code: mode(x.codes), night:x.night }));
  }
  function mode(a){ const m=new Map(); let best=a[0],c=0; a.forEach(v=>{m.set(v,(m.get(v)||0)+1)}); m.forEach((n,k)=>{if(n>c){c=n;best=k}}); return best; }

  // -------- RENDER --------
  function renderAll(){
    cardsEl.innerHTML="";
    state.cities.forEach(city=>{
      drawCard(city);
      updateCard(city).catch(()=>showToast(`Failed: ${city.name}`));
    });
    toggleEmpty();
    setUnitUI();
  }

  function drawCard(city){
    const el = document.createElement("article");
    el.className="wx-card"; el.dataset.id=city.id;
    el.innerHTML = `
      <header class="wx-card__header">
        <div class="wx-card__title">
          <strong>${cap(city.name)}, ${cap(city.country||"")}</strong>
          <div class="wx-card__subtitle" data-sub="${city.id}">—</div>
        </div>
        <button class="wx-close" data-rm="${city.id}" aria-label="Remove">×</button>
      </header>

      <div class="wx-card__main">
        <div class="wx-card__icon" data-icon="${city.id}" aria-hidden="true"></div>
        <div class="wx-card__temp"><span data-temp="${city.id}">--</span>${unit()}</div>
      </div>

      <section class="wx-stats">
        ${stat("Feels Like", `<span data-feels="${city.id}">--</span>${unit()}`)}
        ${stat("Humidity", `<span data-hum="${city.id}">--</span>%`)}
        ${stat("Wind", `<span data-wind="${city.id}">--</span> ${windUnit()}`)}
      </section>

      <section class="wx-days" data-days="${city.id}">
        ${mini("Sun")} ${mini("Mon")} ${mini("Tue")}
      </section>

      <footer class="wx-foot">
        <div class="wx-foot__left">Pressure: <span data-pre="${city.id}">--</span> hPa</div>
        <div class="wx-foot__right" data-age="${city.id}">—</div>
      </footer>`;
    cardsEl.appendChild(el);
    el.querySelector(`[data-rm="${city.id}"]`).addEventListener("click", ()=>{
      state.cities = state.cities.filter(c=>c.id!==city.id);
      save(STORAGE.CITIES, state.cities);
      renderAll(); showToast("City removed");
    });
  }

  const stat = (label, val) => `<div class="wx-stat"><div class="wx-stat__label">${label}</div><div class="wx-stat__value">${val}</div></div>`;
  const mini = (name) => `<div class="wx-mini"><div class="wx-mini__name">${name}</div><div class="wx-mini__icon"></div><div class="wx-mini__temp"><span class="hi">--</span>${unit()} <span class="lo">--</span>${unit()}</div></div>`;

  async function updateCard(city){
    const { cur, days } = await fetchWeather(city.lat, city.lon);
    const code = cur.weather?.[0]?.id || 800;
    const night = (()=>{ const { sunrise, sunset } = cur.sys||{}; const now=cur.dt; if(!sunrise||!sunset) return false; return now<sunrise || now>sunset; })();

    $(`[data-sub="${city.id}"]`).textContent = cur.weather?.[0]?.description || "—";
    $(`[data-temp="${city.id}"]`).textContent = Math.round(cur.main.temp);
    $(`[data-feels="${city.id}"]`).textContent = Math.round(cur.main.feels_like);
    $(`[data-hum="${city.id}"]`).textContent = Math.round(cur.main.humidity);
    $(`[data-wind="${city.id}"]`).textContent = Math.round(cur.wind.speed);
    $(`[data-pre="${city.id}"]`).textContent = Math.round(cur.main.pressure);
    $(`[data-age="${city.id}"]`).textContent = "Just now";
    $(`[data-icon="${city.id}"]`).innerHTML = wxIcon(code, night, 56);

    const holder = $(`[data-days="${city.id}"]`);
    const names = nextThree();
    $$(".wx-mini", holder).forEach((node, i)=>{
      const d = days[i];
      node.querySelector(".wx-mini__name").textContent = names[i] || "";
      node.querySelector(".wx-mini__icon").innerHTML = d ? wxIcon(d.code, d.night, 28) : "";
      node.querySelector(".hi").textContent = d ? d.max : "--";
      node.querySelector(".lo").textContent = d ? d.min : "--";
    });
  }

  function nextThree(){
    const n=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const t=new Date(); const out=[];
    for(let i=1;i<=3;i++){ const d=new Date(t.getFullYear(),t.getMonth(),t.getDate()+i); out.push(n[d.getDay()]); }
    return out;
  }

  // -------- ACTIONS --------
  function setUnitUI(){
    if(state.unit==="metric"){ btnC.classList.add("seg-active"); btnF.classList.remove("seg-active"); }
    else { btnF.classList.add("seg-active"); btnC.classList.remove("seg-active"); }
    // update unit symbols shown on existing cards
    $$(".wx-card").forEach(card=>{
      card.querySelectorAll(".wx-stat__value, .wx-mini__temp, .wx-card__temp").forEach(el=>{
        el.innerHTML = el.innerHTML.replace(/°C|°F/g, unit()).replace(/m\/s|mph/g, windUnit());
      });
    });
  }

  async function addCityByName(q){
    if(!q.trim()){ showToast("Enter a city"); return; }
    try{
      const g = await geocodeCity(q.trim());
      await addCity(g);
    }catch{ showToast("City not found"); }
  }

  async function addCity(geo){
    const id = slug(geo.lat, geo.lon);
    if(state.cities.some(c=>c.id===id)){ showToast("Already added"); return; }
    const city = { id, name:geo.name, country:geo.country||"", lat:geo.lat, lon:geo.lon };
    state.cities.push(city); save(STORAGE.CITIES, state.cities);
    drawCard(city); toggleEmpty();
    try{ await updateCard(city); showToast(`Added ${city.name}`); }catch{ showToast("Failed to load weather"); }
  }

  async function refreshAll(){
    if(state.updating) return;
    state.updating = true;
    try{
      await Promise.all(state.cities.map(c=>updateCard(c).catch(()=>{})));
      showToast("Updated");
    }finally{ state.updating = false; }
  }

  function clearAll(){ state.cities=[]; save(STORAGE.CITIES, state.cities); renderAll(); showToast("Cleared"); }

  function useMyLocation(){
    if(!navigator.geolocation){ showToast("Geolocation unavailable"); return; }
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const { latitude:lat, longitude:lon } = pos.coords;
        const g = await reverseGeocode(lat,lon);
        await addCity(g);
      }catch{ showToast("Could not add your location"); }
    }, ()=>showToast("Location denied"), { enableHighAccuracy:true, timeout:10000 });
  }

  // -------- EVENTS --------
  searchForm.addEventListener("submit", e=>{ e.preventDefault(); addCityByName(cityInput.value); cityInput.value=""; cityInput.blur(); });
  btnC.addEventListener("click", async ()=>{ if(state.unit==="metric") return; state.unit="metric"; save(STORAGE.UNIT, state.unit); setUnitUI(); await refreshAll(); });
  btnF.addEventListener("click", async ()=>{ if(state.unit==="imperial") return; state.unit="imperial"; save(STORAGE.UNIT, state.unit); setUnitUI(); await refreshAll(); });
  refreshBtn.addEventListener("click", refreshAll);
  clearBtn.addEventListener("click", clearAll);
  geoBtn.addEventListener("click", useMyLocation);

  // -------- INIT --------
  (function init(){
    renderAll();
    if(state.cities.length) refreshAll();
  })();
})();
