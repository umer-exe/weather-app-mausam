const CONFIG = {
  API_KEY: "1f1f46c29e61fa36d6e95f74a01618a5", 
  BASE_URL: "https://api.openweathermap.org/data/2.5",
};

const STATE = {
  useCelsius: true,
  savedCities: [],
  lastUpdated: {},
};

const $ = (sel) => document.querySelector(sel);
const EL = {
  cards: $("#cards"),
  empty: $("#empty"),
  toast: $("#toast"),
  unitC: $("#unitC"),
  unitF: $("#unitF"),
  addBtn: $("#addBtn"),
  refreshBtn: $("#refreshBtn"),
  geoBtn: $("#geoBtn"),
  clearBtn: $("#clearBtn"),
  searchForm: $("#searchForm"),
  cityInput: $("#cityInput"),
  sugg: $("#searchSuggestions"),
};

// ---------- Theme (day/night + condition → gradient) ----------
const THEME = {
  clear_day:   { start: "#FFB457", end: "#6EC6FF" },
  clear_night: { start: "#0B1020", end: "#4A2B8C" },
  clouds:      { start: "#9AA8C1", end: "#44546E" },
  rain:        { start: "#33415A", end: "#1B2438" },
  thunder:     { start: "#1C2237", end: "#542E91" },
  snow:        { start: "#E6F3FF", end: "#9BC8FF" },
  default:     { start: "#0B1020", end: "#18294d" },
};

function setGradient(main, isNight){
  const c = (main || "").toLowerCase();
  let key =
    c.includes("thunder") ? "thunder" :
    (c.includes("rain") || c.includes("drizzle")) ? "rain" :
    c.includes("snow") ? "snow" :
    (c.includes("mist") || c.includes("haze") || c.includes("fog") || c.includes("cloud")) ? "clouds" :
    c.includes("clear") ? (isNight ? "clear_night" : "clear_day") :
    (isNight ? "clear_night" : "default");
  const { start, end } = THEME[key] || THEME.default;
  document.documentElement.style.setProperty("--bg-start", start);
  document.documentElement.style.setProperty("--bg-end", end);
}

// ---------- Icons (duotone inline SVG) ----------
function iconKind(main, isNight){
  const c = (main || "").toLowerCase();
  if (c.includes("thunder")) return "thunder";
  if (c.includes("rain") || c.includes("drizzle")) return "rain";
  if (c.includes("snow")) return "snow";
  if (c.includes("mist") || c.includes("haze") || c.includes("fog")) return "clouds";
  if (c.includes("cloud")) return "clouds";
  if (c.includes("clear")) return isNight ? "clear_night" : "clear_day";
  return isNight ? "clear_night" : "clear_day";
}

function iconSVG(kind){
  switch(kind){
    case "clear_day": return `
      <svg viewBox="0 0 64 64" class="icon-duo" xmlns="http://www.w3.org/2000/svg">
        <circle class="p" cx="32" cy="32" r="12"/>
        <g class="s" opacity="0.6">
          <rect x="31" y="4"  width="2" height="10" rx="1"/>
          <rect x="31" y="50" width="2" height="10" rx="1"/>
          <rect x="4"  y="31" width="10" height="2" rx="1"/>
          <rect x="50" y="31" width="10" height="2" rx="1"/>
          <rect x="11" y="11" width="2" height="10" rx="1" transform="rotate(-45 12 16)"/>
          <rect x="51" y="43" width="2" height="10" rx="1" transform="rotate(-45 52 48)"/>
          <rect x="43" y="11" width="2" height="10" rx="1" transform="rotate(45 44 16)"/>
          <rect x="11" y="43" width="2" height="10" rx="1" transform="rotate(45 12 48)"/>
        </g>
      </svg>`;
    case "clear_night": return `
      <svg viewBox="0 0 64 64" class="icon-duo" xmlns="http://www.w3.org/2000/svg">
        <path class="p" d="M42 10c-9 2-16 10-16 20 0 11 9 20 20 20 5 0 9-2 12-4-3 9-12 16-22 16C22 62 10 50 10 35 10 20 22 8 37 8c2 0 3 0 5 2z"/>
        <circle class="s" cx="45" cy="22" r="2"/>
        <circle class="s" cx="50" cy="28" r="1.6"/>
        <circle class="s" cx="40" cy="27" r="1.3"/>
      </svg>`;
    case "clouds": return `
      <svg viewBox="0 0 64 64" class="icon-duo" xmlns="http://www.w3.org/2000/svg">
        <path class="s" d="M23 38a11 11 0 1 1 3-21 12 12 0 0 1 23 5h1a8 8 0 1 1 0 16H23z"/>
        <rect class="p" x="14" y="34" width="36" height="14" rx="7"/>
      </svg>`;
    case "rain": return `
      <svg viewBox="0 0 64 64" class="icon-duo" xmlns="http://www.w3.org/2000/svg">
        <path class="s" d="M23 34a11 11 0 1 1 3-21 12 12 0 0 1 23 5h1a8 8 0 1 1 0 16H23z"/>
        <g class="p">
          <path d="M22 44c0 2-2 6-3 8-1 2 2 3 3 1 1-2 3-6 3-8s-1-3-3-1z"/>
          <path d="M34 44c0 2-2 6-3 8-1 2 2 3 3 1 1-2 3-6 3-8s-1-3-3-1z"/>
          <path d="M46 44c0 2-2 6-3 8-1 2 2 3 3 1 1-2 3-6 3-8s-1-3-3-1z"/>
        </g>
      </svg>`;
    case "thunder": return `
      <svg viewBox="0 0 64 64" class="icon-duo" xmlns="http://www.w3.org/2000/svg">
        <path class="s" d="M23 32a11 11 0 1 1 3-21 12 12 0 0 1 23 5h1a8 8 0 1 1 0 16H23z"/>
        <path class="p" d="M32 36l-6 12h6l-2 10 10-14h-6l4-8z"/>
      </svg>`;
    case "snow": return `
      <svg viewBox="0 0 64 64" class="icon-duo" xmlns="http://www.w3.org/2000/svg">
        <path class="s" d="M23 34a11 11 0 1 1 3-21 12 12 0 0 1 23 5h1a8 8 0 1 1 0 16H23z"/>
        <g class="p" opacity="0.95">
          <circle cx="22" cy="46" r="2"/><circle cx="32" cy="46" r="2"/><circle cx="42" cy="46" r="2"/>
          <circle cx="27" cy="52" r="2"/><circle cx="37" cy="52" r="2"/>
        </g>
      </svg>`;
    default: return iconSVG("clouds");
  }
}

// ---------- Storage ----------
function loadSaved(){
  try{
    const data = JSON.parse(localStorage.getItem("mausam:v2")) || {};
    STATE.savedCities = data.cities || [];
    STATE.useCelsius = data.useCelsius !== false;
    STATE.lastUpdated = data.lastUpdated || {};
  }catch(e){}
}
function save(){
  localStorage.setItem("mausam:v2", JSON.stringify({
    cities: STATE.savedCities,
    useCelsius: STATE.useCelsius,
    lastUpdated: STATE.lastUpdated
  }));
}

// ---------- API ----------
async function api(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
const weatherByCity = (q)=> api(`${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(q)}&units=metric&appid=${CONFIG.API_KEY}`);
const forecastByCity = (q)=> api(`${CONFIG.BASE_URL}/forecast?q=${encodeURIComponent(q)}&units=metric&appid=${CONFIG.API_KEY}`);
const byCoords = async (lat,lon)=>{
  const [current, forecast] = await Promise.all([
    api(`${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`),
    api(`${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`)
  ]);
  return { current, forecast };
};

// ---------- Helpers ----------
const cityKey = (w)=> (w.coord ? `@${w.coord.lat.toFixed(3)},${w.coord.lon.toFixed(3)}` : (w.name||"").toLowerCase());
const fmtTemp = (t)=> STATE.useCelsius ? `${Math.round(t)}°C` : `${Math.round(t*9/5+32)}°F`;
const since = (ts)=>{
  if(!ts) return "Never updated";
  const diff = Date.now()-ts, m=Math.floor(diff/60000), h=Math.floor(diff/3600000), d=Math.floor(diff/86400000);
  if(m<1) return "Just now";
  if(m<60) return `${m} min${m===1?"":"s"} ago`;
  if(h<24) return `${h} hour${h===1?"":"s"} ago`;
  if(d<7) return `${d} day${d===1?"":"s"} ago`;
  const w=Math.floor(d/7); return `${w} week${w===1?"":"s"} ago`;
};
function isNight(w){
  if(w.sys?.sunrise && w.sys?.sunset){
    const now=w.dt*1000, sr=w.sys.sunrise*1000, ss=w.sys.sunset*1000;
    return now<sr || now>ss;
  }
  const h=new Date().getHours(); return h<6 || h>18;
}

// 3-day daily forecast from 3-hourly list
function daily3(forecast){
  const out=[], today=(new Date()).toISOString().slice(0,10), groups={};
  forecast.list.forEach(it=>{
    const date=new Date(it.dt*1000).toISOString().slice(0,10);
    if(date===today) return;
    (groups[date] ||= []).push(it);
  });
  Object.keys(groups).slice(0,3).forEach(date=>{
    const arr=groups[date];
    const mid = arr.find(i=>{const h=new Date(i.dt*1000).getHours();return h>=12&&h<=14;})||arr[0];
    out.push({
      date,
      day:new Date(date).toLocaleDateString('en-US',{weekday:'short'}),
      max: Math.max(...arr.map(i=>i.main.temp_max)),
      min: Math.min(...arr.map(i=>i.main.temp_min)),
      iconKind: iconKind(mid.weather[0].main,false)
    });
  });
  return out;
}

// ---------- UI ----------
function showToast(msg, type="info"){
  const el=EL.toast;
  el.textContent=msg;
  el.className="toast show";
  if(type==="error") el.style.borderColor="rgba(239,68,68,.6)";
  if(type==="success") el.style.borderColor="rgba(16,185,129,.6)";
  setTimeout(()=>{ el.classList.remove("show"); setTimeout(()=>el.classList.add("hidden"),250); }, 2400);
  el.classList.remove("hidden");
}

function hideEmpty(){ EL.empty.style.display="none"; }
function showEmpty(){ EL.empty.style.display="block"; }

function skeleton(){
  const a=document.createElement("article");
  a.className="card p-5";
  a.innerHTML=`
    <div class="space-y-4">
      <div class="h-6 w-40 bg-white/10 rounded"></div>
      <div class="h-28 w-full bg-white/10 rounded"></div>
      <div class="grid grid-cols-3 gap-3">
        <div class="h-16 bg-white/10 rounded"></div>
        <div class="h-16 bg-white/10 rounded"></div>
        <div class="h-16 bg-white/10 rounded"></div>
      </div>
    </div>`;
  return a;
}

function renderCard(current, forecast){
  const key=cityKey(current);
  const exists=document.querySelector(`[data-key="${key}"]`); if(exists) exists.remove();
  hideEmpty();

  const night=isNight(current);
  setGradient(current.weather?.[0]?.main || "Clear", night);
  const heroKind=iconKind(current.weather?.[0]?.main, night);
  const days=daily3(forecast);

  const card=document.createElement("article");
  card.className="card p-5";
  card.dataset.key=key;
  card.innerHTML=`
    <button class="card-kill" title="Remove"><i class="fa-solid fa-xmark"></i></button>
    <div class="card-head">
      <div>
        <div class="card-city text-lg">${current.name}${current.sys?.country?`, ${current.sys.country}`:''}</div>
        <div class="card-sub">${current.weather[0].description}</div>
      </div>
      <div class="text-right">
        <div class="hero-icon ml-auto">${iconSVG(heroKind)}</div>
        <div class="hero-temp font-mono mt-1">${fmtTemp(current.main.temp)}</div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3 mt-5">
      <div class="kpi">
        <label>Feels Like</label>
        <div class="val">${fmtTemp(current.main.feels_like)}</div>
      </div>
      <div class="kpi">
        <label>Humidity</label>
        <div class="val">${current.main.humidity}%</div>
      </div>
      <div class="kpi">
        <label>Wind</label>
        <div class="val">${Math.round(current.wind.speed)} m/s</div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3 mt-4">
      ${days.map(d=>`
        <div class="tile">
          <label>${d.day}</label>
          <div class="w-10 h-10 mx-auto">${iconSVG(d.iconKind)}</div>
          <div class="mt-1">
            <span class="hi font-mono">${Math.round(d.max)}°</span>
            <span class="lo font-mono">&nbsp;${Math.round(d.min)}°</span>
          </div>
        </div>
      `).join("")}
    </div>

    <div class="text-[11px] text-slate-300/80 mt-4 flex items-center justify-between">
      <span>Pressure: ${current.main.pressure} hPa</span>
      <span class="ts">Last updated: ${since(STATE.lastUpdated[key])}</span>
    </div>
  `;

  // events
  card.querySelector(".card-kill").addEventListener("click", ()=>{
    card.remove();
    STATE.savedCities = STATE.savedCities.filter(k=>k!==key);
    delete STATE.lastUpdated[key];
    save();
    if(!EL.cards.children.length) showEmpty();
  });

  EL.cards.prepend(card);
  STATE.lastUpdated[key]=Date.now(); save();
}

// ---------- Actions ----------
async function addCityByName(name, saveIt=true){
  const key=name.trim().toLowerCase(); if(!key) return;
  if(document.querySelector(`[data-key="${key}"]`)) return showToast("City already displayed");
  const skel=skeleton(); EL.cards.prepend(skel); hideEmpty();
  try{
    const [cur, fc]=await Promise.all([weatherByCity(name), forecastByCity(name)]);
    skel.remove(); renderCard(cur, fc);
    if(saveIt){ STATE.savedCities.push(key); save(); }
    showToast(`Added ${cur.name}`, "success");
  }catch(e){
    skel.remove(); showToast("City not found", "error");
  }
}

async function addByCoords(lat,lon, saveIt=true){
  const key=`@${lat.toFixed(3)},${lon.toFixed(3)}`;
  if(document.querySelector(`[data-key="${key}"]`)) return showToast("Location already displayed");
  const skel=skeleton(); EL.cards.prepend(skel); hideEmpty();
  try{
    const {current, forecast}=await byCoords(lat,lon);
    skel.remove(); renderCard(current, forecast);
    if(saveIt){ STATE.savedCities.push(key); save(); }
    showToast("Location added", "success");
  }catch(e){
    skel.remove(); showToast("Location failed", "error");
  }
}

async function refreshAll(){
  if(!STATE.savedCities.length) return showToast("No cities to refresh");
  showToast("Refreshing…");
  EL.cards.innerHTML="";
  for(const k of [...STATE.savedCities]){
    try{
      if(k.startsWith("@")){
        const [lat,lon]=k.slice(1).split(",").map(Number);
        await addByCoords(lat,lon,false);
      }else{
        await addCityByName(k,false);
      }
    }catch(e){}
    await new Promise(r=>setTimeout(r,150));
  }
  showToast("Updated!", "success");
}

// ---------- Units ----------
function setUnits(useC){
  STATE.useCelsius=useC;
  EL.unitC.classList.toggle("seg-active", useC);
  EL.unitF.classList.toggle("seg-active", !useC);
  // Update temps on existing cards (no refetch)
  document.querySelectorAll(".hero-temp").forEach(el=>{
    const t=parseFloat(el.textContent); if(Number.isNaN(t)) return;
    el.textContent = useC ? `${Math.round((t-32)*5/9)}°C` : `${Math.round((t*9/5)+32)}°F`;
  });
  document.querySelectorAll(".kpi .val").forEach(el=>{
    if(!/°[CF]/.test(el.textContent)) return;
    const t=parseFloat(el.textContent); if(Number.isNaN(t)) return;
    el.textContent = useC ? `${Math.round((t-32)*5/9)}°C` : `${Math.round((t*9/5)+32)}°F`;
  });
  save();
}

// ---------- Events ----------
function bind(){
  // search
  EL.searchForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const q=EL.cityInput.value.trim();
    if(q){ addCityByName(q,true); EL.cityInput.value=""; }
  });

  // unit segmented
  EL.unitC.addEventListener("click", ()=> setUnits(true));
  EL.unitF.addEventListener("click", ()=> setUnits(false));

  // geolocation
  EL.geoBtn.addEventListener("click", ()=>{
    if(!navigator.geolocation) return showToast("Geolocation not supported","error");
    showToast("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      pos=> addByCoords(pos.coords.latitude, pos.coords.longitude, true),
      ()=> showToast("Location permission denied","error"),
      { enableHighAccuracy:false, timeout:10000 }
    );
  });

  // clear & refresh
  EL.clearBtn.addEventListener("click", ()=>{
    EL.cards.innerHTML=""; STATE.savedCities=[]; STATE.lastUpdated={}; save(); showEmpty();
    showToast("Cleared");
  });
  EL.refreshBtn.addEventListener("click", refreshAll);

  // keyboard: Cmd/Ctrl+K to focus search
  window.addEventListener("keydown", (e)=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); EL.cityInput.focus(); }
  });

  // Update "last updated" every minute
  setInterval(()=>{
    document.querySelectorAll("[data-key]").forEach(card=>{
      const key=card.dataset.key; const span=card.querySelector(".ts");
      if(span) span.textContent=`Last updated: ${since(STATE.lastUpdated[key])}`;
    });
  }, 60000);
}

// ---------- Boot ----------
async function init(){
  loadSaved();
  bind();

  // restore saved
  if(!STATE.savedCities.length){ EL.empty.style.display="block"; return; }
  EL.empty.style.display="none";
  for(const k of STATE.savedCities){
    try{
      if(k.startsWith("@")){
        const [lat,lon]=k.slice(1).split(",").map(Number);
        await addByCoords(lat,lon,false);
      }else{
        await addCityByName(k,false);
      }
      await new Promise(r=>setTimeout(r,120));
    }catch(e){}
  }
}

document.addEventListener("DOMContentLoaded", init);
