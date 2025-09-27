/* ========================================
   ATMOS - Premium Weather Dashboard
   Advanced JavaScript with stunning features
   ======================================== */

// Configuration
const CONFIG = {
  API_KEY: "1f1f46c29e61fa36d6e95f74a01618a5",
  BASE_URL: "https://api.openweathermap.org/data/2.5",
  ICON_URL: (code) => `https://openweathermap.org/img/wn/${code}@2x.png`,
  DEMO_CITIES: ["London", "New York", "Tokyo", "Paris", "Sydney", "Dubai"],
  PARTICLE_COUNT: 50,
  ANIMATION_DURATION: 800
};

// State Management
const STATE = {
  useCelsius: true,
  savedCities: [],
  isLoading: false,
  searchSuggestions: [],
  lastUpdated: {} // Track last update time for each city
};

// DOM Elements
const ELEMENTS = {
  loadingScreen: document.getElementById("loading-screen"),
  mainContent: document.getElementById("main-content"),
  cards: document.getElementById("cards"),
  addBtn: document.getElementById("addBtn"),
  searchForm: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  clearBtn: document.getElementById("clearBtn"),
  geoBtn: document.getElementById("geoBtn"),
  toast: document.getElementById("toast"),
  empty: document.getElementById("empty"),
  sky: document.getElementById("sky"),
  unitToggle: document.getElementById("unitToggle"),
  toggleKnob: document.getElementById("toggleKnob"),
  refreshBtn: document.getElementById("refreshBtn"),
  searchSuggestions: document.getElementById("searchSuggestions"),
  weatherModal: document.getElementById("weatherModal"),
  modalContent: document.getElementById("modalContent"),
  animatedBg: document.getElementById("animated-bg"),
  particles: document.getElementById("particles")
};

/* ========================================
   INITIALIZATION & SETUP
   ======================================== */

// Initialize the application
async function initializeApp() {
  try {
    // Load saved data
    loadSavedData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize visual effects
    initializeVisualEffects();
    
    // Show main content
    await showMainContent();
    
    // Restore saved cities
    await restoreSavedCities();
    
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to initialize app', 'error');
  }
}

// Load saved data from localStorage
function loadSavedData() {
  try {
    const saved = localStorage.getItem("atmos:weather-data");
    if (saved) {
      const data = JSON.parse(saved);
      STATE.savedCities = data.cities || [];
      STATE.useCelsius = data.useCelsius !== false;
      STATE.lastUpdated = data.lastUpdated || {};
      
      // Initialize timestamps for cities that don't have them
      STATE.savedCities.forEach(cityKey => {
        if (!STATE.lastUpdated[cityKey]) {
          STATE.lastUpdated[cityKey] = Date.now();
        }
      });
    }
  } catch (error) {
    console.warn('Failed to load saved data:', error);
  }
}

// Save data to localStorage
function saveData() {
  try {
    const data = {
      cities: STATE.savedCities,
      useCelsius: STATE.useCelsius,
      lastUpdated: STATE.lastUpdated,
      timestamp: Date.now()
    };
    localStorage.setItem("atmos:weather-data", JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save data:', error);
  }
}

// Show main content with animation
async function showMainContent() {
  ELEMENTS.loadingScreen.style.opacity = '0';
  await new Promise(resolve => setTimeout(resolve, 500));
  ELEMENTS.loadingScreen.style.display = 'none';
  ELEMENTS.mainContent.classList.remove('hidden');
  ELEMENTS.mainContent.style.animation = 'fadeInUp 1s ease-out';
  
  // Always show empty state first for beautiful opening experience
  showEmptyState();
}

/* ========================================
   VISUAL EFFECTS & ANIMATIONS
   ======================================== */

// Initialize visual effects
function initializeVisualEffects() {
  createParticleSystem();
  createAnimatedBackground();
  createEmptyStateWeatherScene();
}

// Create floating particle system
function createParticleSystem() {
  for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
    createParticle();
  }
}

// Create individual particle
function createParticle() {
  const particle = document.createElement('div');
  particle.className = 'particle';
  
  // Random properties
  const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
  const top = Math.random() * 100;
  const delay = Math.random() * 6;
  const duration = 6 + Math.random() * 4;
  
  particle.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${left}%;
    top: ${top}%;
    animation-delay: ${delay}s;
    animation-duration: ${duration}s;
  `;
  
  ELEMENTS.particles.appendChild(particle);
  
  // Remove and recreate particle after animation
  setTimeout(() => {
    if (particle.parentNode) {
      particle.remove();
      createParticle();
    }
  }, (delay + duration) * 1000);
}

// Create animated background
function createAnimatedBackground() {
  // Add gradient animation
  ELEMENTS.animatedBg.style.animation = 'gradientShift 15s ease infinite';
}

// Enhanced sky visuals
function setSkyVisual(weatherData) {
  if (!weatherData || !weatherData.weather) return;
  
  clearSky();
  
  const condition = weatherData.weather[0].main.toLowerCase();
  const isNight = isNightTime(weatherData);
  
  // Set sky class based on weather
  const skyClass = getSkyClass(condition, isNight);
  ELEMENTS.sky.className = `fixed inset-0 -z-5 transition-all duration-1000 ${skyClass}`;
  
  // Create weather elements
  createWeatherElements(condition, isNight);
}

// Get sky class based on weather and time
function getSkyClass(condition, isNight) {
  if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
    return 'sky--rain';
  } else if (condition.includes('snow')) {
    return 'sky--snow';
  } else if (condition.includes('cloud') || condition.includes('mist') || condition.includes('haze') || condition.includes('fog')) {
    return 'sky--cloudy';
  } else {
    return isNight ? 'sky--clear-night' : 'sky--clear-day';
  }
}

// Create weather-specific visual elements
function createWeatherElements(condition, isNight) {
  if (isNight) {
    createMoon();
    createStars(120);
  } else {
    createSun();
  }
  
  if (condition.includes('cloud')) {
    createClouds(5);
  }
  
  if (condition.includes('rain') || condition.includes('drizzle')) {
    createRain(30);
  }
  
  if (condition.includes('snow')) {
    createSnow(35);
  }
  
  if (condition.includes('thunderstorm')) {
    createStorm();
  }
}

// Create enhanced sun
function createSun() {
  const sun = document.createElement('div');
  sun.className = 'sun';
  ELEMENTS.sky.appendChild(sun);
}

// Create enhanced moon
function createMoon() {
  const moon = document.createElement('div');
  moon.className = 'moon';
  ELEMENTS.sky.appendChild(moon);
}

// Create enhanced stars
function createStars(count = 80) {
  const layer = document.createElement('div');
  layer.className = 'sky-layer';
  
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    
    const left = Math.random() * 100;
    const top = Math.random() * 70;
    const duration = (1 + Math.random() * 3).toFixed(2) + 's';
    const size = Math.random() * 2 + 1;
    
    star.style.cssText = `
      left: ${left}%;
      top: ${top}%;
      --d: ${duration};
      width: ${size}px;
      height: ${size}px;
      opacity: ${Math.random() * 0.8 + 0.2};
    `;
    
    layer.appendChild(star);
  }
  
  ELEMENTS.sky.appendChild(layer);
}

// Create enhanced clouds
function createClouds(count = 3) {
  for (let i = 0; i < count; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    
    const sizeW = 200 + Math.random() * 400;
    const sizeH = 100 + Math.random() * 150;
    const top = 5 + Math.random() * 75;
    const duration = 60 + Math.random() * 80;
    const delay = Math.random() * -40;
    
    cloud.style.cssText = `
      width: ${sizeW}px;
      height: ${sizeH}px;
      top: ${top}%;
      left: ${-30 - Math.random() * 50}px;
      --duration: ${duration}s;
      --delay: ${delay}s;
    `;
    
    ELEMENTS.sky.appendChild(cloud);
  }
}

// Create enhanced rain
function createRain(strength = 25) {
  const layer = document.createElement('div');
  layer.className = 'sky-layer';
  
  for (let i = 0; i < strength; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    
    const left = Math.random() * 100;
    const top = Math.random() * 10;
    const duration = (0.5 + Math.random() * 1).toFixed(2) + 's';
    const delay = Math.random() * 2;
    
    drop.style.cssText = `
      left: ${left}%;
      top: ${top}%;
      animation-duration: ${duration};
      animation-delay: ${delay}s;
    `;
    
    layer.appendChild(drop);
  }
  
  ELEMENTS.sky.appendChild(layer);
}

// Create enhanced snow
function createSnow(strength = 30) {
  const layer = document.createElement('div');
  layer.className = 'sky-layer';
  
  for (let i = 0; i < strength; i++) {
    const flake = document.createElement('div');
    flake.className = 'snow-flake';
    
    const left = Math.random() * 100;
    const top = Math.random() * 5;
    const duration = (3 + Math.random() * 5).toFixed(2) + 's';
    const delay = Math.random() * 3;
    const size = Math.random() * 6 + 4;
    
    flake.style.cssText = `
      left: ${left}%;
      top: ${top}%;
      animation-duration: ${duration};
      animation-delay: ${delay}s;
      width: ${size}px;
      height: ${size}px;
    `;
    
    layer.appendChild(flake);
  }
  
  ELEMENTS.sky.appendChild(layer);
}

// Create storm effects
function createStorm() {
  // Add lightning flashes
  const lightning = document.createElement('div');
  lightning.className = 'lightning';
  lightning.style.cssText = `
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.3);
    opacity: 0;
    pointer-events: none;
    z-index: 1;
  `;
  
  ELEMENTS.sky.appendChild(lightning);
  
  // Flash lightning randomly
  const flashLightning = () => {
    lightning.style.opacity = '1';
    setTimeout(() => {
      lightning.style.opacity = '0';
    }, 100);
    
    setTimeout(flashLightning, Math.random() * 3000 + 2000);
  };
  
  flashLightning();
}

// Clear sky elements
function clearSky() {
  ELEMENTS.sky.className = 'fixed inset-0 -z-5 transition-all duration-1000';
  while (ELEMENTS.sky.firstChild) {
    ELEMENTS.sky.removeChild(ELEMENTS.sky.firstChild);
  }
}

// Check if it's night time
function isNightTime(weatherData) {
  if (weatherData.sys?.sunrise && weatherData.sys?.sunset) {
    const now = weatherData.dt * 1000;
    const sunrise = weatherData.sys.sunrise * 1000;
    const sunset = weatherData.sys.sunset * 1000;
    return now < sunrise || now > sunset;
  }
  
  const hour = new Date().getHours();
  return hour < 6 || hour > 18;
}

/* ========================================
   WEATHER DATA & API
   ======================================== */

// Fetch weather data with enhanced error handling
async function fetchWeatherData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch weather data');
  }
}

// Get current weather by city name
async function getCurrentWeather(city) {
  const url = `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${CONFIG.API_KEY}`;
  return fetchWeatherData(url);
}

// Get forecast by city name
async function getForecast(city) {
  const url = `${CONFIG.BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${CONFIG.API_KEY}`;
  return fetchWeatherData(url);
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
  const currentUrl = `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`;
  const forecastUrl = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`;
  
  const [current, forecast] = await Promise.all([
    fetchWeatherData(currentUrl),
    fetchWeatherData(forecastUrl)
  ]);
  
  return { current, forecast };
}

/* ========================================
   WEATHER CARDS & RENDERING
   ======================================== */

// Render enhanced weather card
function renderWeatherCard(weatherData, forecastData) {
  const key = generateCityKey(weatherData);
  const existingCard = document.querySelector(`[data-key="${key}"]`);
  
  if (existingCard) {
    existingCard.remove();
  }
  
  hideEmptyState();
  
  const card = createWeatherCardElement(weatherData, forecastData);
  ELEMENTS.cards.prepend(card);
  
  // Update timestamp for this city
  updateCityTimestamp(key);
  
  // Set sky visuals
  setSkyVisual(weatherData);
  
  // Add entrance animation
  setTimeout(() => {
    card.classList.add('card-appear');
  }, 100);
}

// Create weather card element
function createWeatherCardElement(weatherData, forecastData) {
  const card = document.createElement('article');
  card.className = 'weather-card p-6 relative';
  card.dataset.key = generateCityKey(weatherData);
  
  const dailyForecast = getDailyForecast(forecastData);
  
  card.innerHTML = `
    <div class="relative">
      <!-- Remove Button -->
      <button class="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 group" title="Remove city">
        <i class="fas fa-times text-white/70 group-hover:text-white transition-colors"></i>
      </button>
      
      <!-- Header -->
      <div class="flex items-center justify-between gap-4 mb-6">
        <div class="flex-1">
          <h3 class="text-xl font-bold text-white mb-1">${weatherData.name}${weatherData.sys?.country ? `, ${weatherData.sys.country}` : ''}</h3>
          <p class="text-blue-200/80 capitalize">${weatherData.weather[0].description}</p>
        </div>
        <div class="text-right">
          <img src="${CONFIG.ICON_URL(weatherData.weather[0].icon)}" 
               alt="${weatherData.weather[0].description}" 
               class="w-24 h-24 weather-icon" />
          <div class="text-4xl font-black text-white">${formatTemperature(weatherData.main.temp)}</div>
        </div>
      </div>

      <!-- Weather Details -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="small-forecast">
          <div class="text-xs text-blue-200/60 mb-1">Feels Like</div>
          <div class="font-semibold text-white">${formatTemperature(weatherData.main.feels_like)}</div>
      </div>
          <div class="small-forecast">
          <div class="text-xs text-blue-200/60 mb-1">Humidity</div>
          <div class="font-semibold text-white">${weatherData.main.humidity}%</div>
        </div>
        <div class="small-forecast">
          <div class="text-xs text-blue-200/60 mb-1">Wind</div>
          <div class="font-semibold text-white">${Math.round(weatherData.wind.speed)} m/s</div>
        </div>
      </div>

      <!-- Daily Forecast -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        ${dailyForecast.map(day => `
          <div class="small-forecast cursor-pointer hover:bg-white/10 transition-all duration-300" onclick="showDayDetails('${weatherData.name}', '${day.date}')">
            <div class="text-xs text-blue-200/70 mb-2">${day.day}</div>
            <img src="${CONFIG.ICON_URL(day.icon)}" alt="${day.description}" class="w-12 h-12 mx-auto mb-2" />
            <div class="text-sm text-white">
              <div class="font-semibold">${Math.round(day.max)}°</div>
              <div class="text-blue-200/70">${Math.round(day.min)}°</div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Additional Info -->
      <div class="flex items-center justify-between text-xs text-blue-200/60">
        <span>Pressure: ${weatherData.main.pressure} hPa</span>
        <span>Last updated: ${getTimeSinceUpdate(STATE.lastUpdated[generateCityKey(weatherData)])}</span>
      </div>
    </div>
  `;

  // Add remove functionality
  const removeBtn = card.querySelector('button');
  removeBtn.addEventListener('click', () => removeCity(generateCityKey(weatherData)));
  
  return card;
}

// Get daily forecast data
function getDailyForecast(forecastData) {
  const dailyData = [];
  const today = new Date().toISOString().split('T')[0];
  
  // Group forecast by day
  const dailyGroups = {};
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (date !== today && Object.keys(dailyGroups).length < 3) {
      if (!dailyGroups[date]) {
        dailyGroups[date] = [];
      }
      dailyGroups[date].push(item);
    }
  });
  
  // Get 3-day forecast
  Object.keys(dailyGroups).slice(0, 3).forEach(date => {
    const dayData = dailyGroups[date];
    const midDay = dayData.find(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 12 && hour <= 14;
    }) || dayData[0];
    
    dailyData.push({
      date: date,
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      icon: midDay.weather[0].icon,
      description: midDay.weather[0].description,
      max: Math.max(...dayData.map(d => d.main.temp_max)),
      min: Math.min(...dayData.map(d => d.main.temp_min))
    });
  });
  
  return dailyData;
}

// Create skeleton loading card
function createSkeletonCard() {
  const skeleton = document.createElement('article');
  skeleton.className = 'weather-card p-6 skeleton card-appear';
  skeleton.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="h-6 w-32 rounded skeleton"></div>
        <div class="h-24 w-24 rounded skeleton"></div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="h-16 rounded skeleton"></div>
        <div class="h-16 rounded skeleton"></div>
        <div class="h-16 rounded skeleton"></div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="h-20 rounded skeleton"></div>
        <div class="h-20 rounded skeleton"></div>
        <div class="h-20 rounded skeleton"></div>
      </div>
    </div>
  `;
  
  ELEMENTS.cards.prepend(skeleton);
  hideEmptyState();
  return skeleton;
}

/* ========================================
   UTILITIES & HELPERS
   ======================================== */

// Generate city key
function generateCityKey(weatherData) {
  if (weatherData.coord) {
    return `@${weatherData.coord.lat.toFixed(3)},${weatherData.coord.lon.toFixed(3)}`;
  }
  return weatherData.name.toLowerCase();
}

// Format temperature
function formatTemperature(temp) {
  if (STATE.useCelsius) {
    return `${Math.round(temp)}°C`;
  }
  return `${Math.round(temp * 9/5 + 32)}°F`;
}

// Format time
function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Show toast notification
function showToast(message, type = 'info') {
  ELEMENTS.toast.textContent = message;
  ELEMENTS.toast.className = `fixed right-6 bottom-6 z-50 px-6 py-4 rounded-2xl text-sm bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl transform translate-y-2 opacity-0 transition-all duration-300`;
  
  // Add type-specific styling
  if (type === 'error') {
    ELEMENTS.toast.classList.add('border-rose-500/50', 'bg-rose-500/10');
  } else if (type === 'success') {
    ELEMENTS.toast.classList.add('border-emerald-500/50', 'bg-emerald-500/10');
  }
  
  ELEMENTS.toast.classList.remove('hidden');
  
  // Animate in
  setTimeout(() => {
    ELEMENTS.toast.classList.add('show');
  }, 100);
  
  // Auto hide
  setTimeout(() => {
    ELEMENTS.toast.classList.remove('show');
    setTimeout(() => {
      ELEMENTS.toast.classList.add('hidden');
    }, 300);
  }, 3000);
}

// Hide empty state
function hideEmptyState() {
  if (ELEMENTS.empty) {
    ELEMENTS.empty.style.display = 'none';
  }
}

// Show empty state
function showEmptyState() {
  if (ELEMENTS.empty) {
    ELEMENTS.empty.style.display = 'block';
    // Ensure the empty state weather scene initializes each time it's shown
    try { createEmptyStateWeatherScene(); } catch (_) {}
  }
}

/* ========================================
   CITY MANAGEMENT
   ======================================== */

// Add city by name
async function addCityByName(cityName, save = true) {
  const key = cityName.trim().toLowerCase();
  if (!key) return;
  
  // Check if city is already displayed (not just in saved list)
  const existingCard = document.querySelector(`[data-key="${key}"]`);
  if (existingCard) {
    showToast('City already displayed', 'info');
    return;
  }
  
  const skeleton = createSkeletonCard();
  
  try {
    const [weather, forecast] = await Promise.all([
      getCurrentWeather(cityName),
      getForecast(cityName)
    ]);
    
    skeleton.remove();
    renderWeatherCard(weather, forecast);
    
    if (save) {
      STATE.savedCities.push(key);
      saveData();
    }
    
    showToast(`Added ${weather.name}`, 'success');
    
  } catch (error) {
    skeleton.remove();
    showToast(error.message, 'error');
    console.error('Failed to add city:', error);
  }
}

// Add city by coordinates
async function addCityByCoords(lat, lon, save = true) {
  const key = `@${lat.toFixed(3)},${lon.toFixed(3)}`;
  
  // Check if location is already displayed (not just in saved list)
  const existingCard = document.querySelector(`[data-key="${key}"]`);
  if (existingCard) {
    showToast('Location already displayed', 'info');
    return;
  }
  
  const skeleton = createSkeletonCard();
  
  try {
    const { current, forecast } = await getWeatherByCoords(lat, lon);
    
    skeleton.remove();
    renderWeatherCard(current, forecast);
    
    if (save) {
      STATE.savedCities.push(key);
      saveData();
    }
    
    showToast('Location added successfully', 'success');
    
  } catch (error) {
    skeleton.remove();
    showToast('Failed to get location weather', 'error');
    console.error('Failed to add location:', error);
  }
}

// Remove city
function removeCity(key) {
  const card = document.querySelector(`[data-key="${key}"]`);
  if (card) {
    card.style.animation = 'cardSlideOut 400ms ease-in forwards';
    setTimeout(() => {
      card.remove();
      STATE.savedCities = STATE.savedCities.filter(k => k !== key);
      delete STATE.lastUpdated[key];
      saveData();
      
      if (ELEMENTS.cards.children.length === 0) {
        showEmptyState();
        clearSky();
      }
    }, 400);
  }
}

// Clear all cities
function clearAllCities() {
  ELEMENTS.cards.innerHTML = '';
  STATE.savedCities = [];
  STATE.lastUpdated = {};
  saveData();
  showEmptyState();
  clearSky();
  showToast('All cities cleared', 'info');
}

// Restore saved cities
async function restoreSavedCities() {
  // Always show empty state first for a beautiful opening experience
  showEmptyState();
  
  if (STATE.savedCities.length === 0) {
    return;
  }
  
  // Hide empty state after a delay to show the welcome animation
  setTimeout(() => {
    hideEmptyState();
    
    // Clear any existing cards first
    ELEMENTS.cards.innerHTML = '';
    
    // Add cities with a delay to ensure smooth transition
    setTimeout(async () => {
      for (const key of STATE.savedCities) {
        try {
          if (key.startsWith('@')) {
            const [lat, lon] = key.slice(1).split(',').map(Number);
            await addCityByCoords(lat, lon, false);
    } else {
            await addCityByName(key, false);
          }
          // Small delay between city additions to prevent conflicts
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to restore city ${key}:`, error);
          // Remove failed city from saved list
          STATE.savedCities = STATE.savedCities.filter(k => k !== key);
        }
      }
      
      saveData();
    }, 500);
  }, 3000); // Show empty state for 3 seconds before loading cities
}

// Create dynamic weather scene for empty state
function createEmptyStateWeatherScene() {
  // Add some randomness to the weather elements
  const weatherElements = document.querySelectorAll('.cloud, .rain-drop, .snow-flake, .lightning');
  
  weatherElements.forEach(element => {
    // Randomize animation delays
    const randomDelay = Math.random() * 5;
    element.style.animationDelay = `${randomDelay}s`;
    
    // Randomize positions slightly
    const currentLeft = parseFloat(element.style.left) || 0;
    const currentTop = parseFloat(element.style.top) || 0;
    element.style.left = `${currentLeft + (Math.random() - 0.5) * 10}%`;
    element.style.top = `${currentTop + (Math.random() - 0.5) * 10}%`;
  });
  
  // Toggle precipitation: choose either rain or snow for the initial screen
  const rainContainer = document.querySelector('.rain-container');
  const snowContainer = document.querySelector('.snow-container');
  if (rainContainer && snowContainer) {
    const showSnow = Math.random() < 0.5;
    rainContainer.style.display = showSnow ? 'none' : 'block';
    snowContainer.style.display = showSnow ? 'block' : 'none';
  }
  
  // Create additional floating elements
  createFloatingElements();
}

// Create additional floating weather elements
function createFloatingElements() {
  const container = document.querySelector('.cloud-container');
  if (!container) return;
  
  // Add some floating particles
  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 4 + 2}px;
      height: ${Math.random() * 4 + 2}px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: floatParticle ${3 + Math.random() * 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 3}s;
    `;
    container.appendChild(particle);
  }
  
  // Add some sparkles
  createSparkles();
}

// Create sparkle effects
function createSparkles() {
  const container = document.querySelector('.cloud-container');
  if (!container) return;
  
  for (let i = 0; i < 8; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.cssText = `
      position: absolute;
      width: 3px;
      height: 3px;
      background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.3));
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: sparkle ${2 + Math.random() * 3}s ease-in-out infinite;
      animation-delay: ${Math.random() * 4}s;
    `;
    container.appendChild(sparkle);
  }
}

/* ========================================
   EVENT LISTENERS
   ======================================== */

// Setup all event listeners
function setupEventListeners() {
  // Search form
  ELEMENTS.searchForm.addEventListener('submit', handleSearchSubmit);
  
  // Add button
  ELEMENTS.addBtn.addEventListener('click', handleAddClick);
  
  // Geolocation button
  ELEMENTS.geoBtn.addEventListener('click', handleGeolocation);
  
  // Clear button
  ELEMENTS.clearBtn.addEventListener('click', clearAllCities);
  
  // Unit toggle
  ELEMENTS.unitToggle.addEventListener('change', handleUnitToggle);
  
  // Refresh button
  ELEMENTS.refreshBtn.addEventListener('click', handleRefreshClick);
  
  // Keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Suggestions disabled
  if (ELEMENTS.searchSuggestions) {
    ELEMENTS.searchSuggestions.classList.add('hidden');
  }
}

// Handle search form submission
function handleSearchSubmit(event) {
  event.preventDefault();
  const cityName = ELEMENTS.cityInput.value.trim();
  if (cityName) {
    addCityByName(cityName, true);
    ELEMENTS.cityInput.value = '';
  }
}

// Handle add button click
function handleAddClick(event) {
  event.preventDefault();
  const cityName = ELEMENTS.cityInput.value.trim();
  if (cityName) {
    addCityByName(cityName, true);
    ELEMENTS.cityInput.value = '';
  }
}

// Handle geolocation
function handleGeolocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported', 'error');
    return;
  }
  
  showToast('Detecting your location...', 'info');
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      addCityByCoords(position.coords.latitude, position.coords.longitude, true);
    },
    (error) => {
      console.warn('Geolocation error:', error);
      showToast('Location permission denied', 'error');
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
}

// Handle refresh button click
function handleRefreshClick() {
  if (STATE.savedCities.length === 0) {
    showToast('No cities to refresh. Add a city first!', 'info');
    return;
  }
  
  // Add loading state to refresh button
  const refreshBtn = ELEMENTS.refreshBtn;
  const originalContent = refreshBtn.innerHTML;
  refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-blue-300 mr-2"></i><span class="text-blue-200 font-medium hidden sm:inline">Refreshing...</span>';
  refreshBtn.disabled = true;
  
  // Add a subtle click animation
  refreshBtn.style.transform = 'scale(0.95)';
  setTimeout(() => {
    refreshBtn.style.transform = 'scale(1)';
  }, 150);
  
  // Refresh all weather data
  refreshAllWeather().finally(() => {
    // Restore button state
    refreshBtn.innerHTML = originalContent;
    refreshBtn.disabled = false;
  });
}

// Handle unit toggle
function handleUnitToggle(event) {
  STATE.useCelsius = !event.target.checked;
  
  // Animate toggle knob
  if (event.target.checked) {
    ELEMENTS.toggleKnob.style.transform = 'translateX(28px)';
    ELEMENTS.toggleKnob.innerHTML = '<span class="text-xs font-bold text-white">°F</span>';
    } else {
    ELEMENTS.toggleKnob.style.transform = 'translateX(0)';
    ELEMENTS.toggleKnob.innerHTML = '<span class="text-xs font-bold text-white">°C</span>';
  }
  
  // Update existing cards without refreshing (just change the temperature display)
  updateExistingCardsTemperature();
  saveData();
}

// Update temperature display on existing cards without refreshing
function updateExistingCardsTemperature() {
  const tempElements = document.querySelectorAll('.weather-card .text-4xl');
  tempElements.forEach(tempEl => {
    const tempText = tempEl.textContent;
    if (tempText.includes('°C') || tempText.includes('°F')) {
      const tempValue = parseFloat(tempText);
      if (!isNaN(tempValue)) {
        if (tempText.includes('°C') && !STATE.useCelsius) {
          // Convert C to F
          const fahrenheit = Math.round(tempValue * 9/5 + 32);
          tempEl.textContent = `${fahrenheit}°F`;
        } else if (tempText.includes('°F') && STATE.useCelsius) {
          // Convert F to C
          const celsius = Math.round((tempValue - 32) * 5/9);
          tempEl.textContent = `${celsius}°C`;
        }
      }
    }
  });
  
  // Update "Feels Like" temperatures
  const feelsLikeElements = document.querySelectorAll('.small-forecast .font-semibold');
  feelsLikeElements.forEach(el => {
    const text = el.textContent;
    if (text.includes('°C') || text.includes('°F')) {
      const tempValue = parseFloat(text);
      if (!isNaN(tempValue)) {
        if (text.includes('°C') && !STATE.useCelsius) {
          const fahrenheit = Math.round(tempValue * 9/5 + 32);
          el.textContent = `${fahrenheit}°F`;
        } else if (text.includes('°F') && STATE.useCelsius) {
          const celsius = Math.round((tempValue - 32) * 5/9);
          el.textContent = `${celsius}°C`;
        }
      }
    }
  });
}

// Refresh all weather data
async function refreshAllWeather() {
  if (STATE.savedCities.length === 0) {
    showToast('No cities to refresh', 'info');
    return;
  }
  
  showToast('Refreshing weather data...', 'info');
  
  // Clear existing cards first
  ELEMENTS.cards.innerHTML = '';
  
  // Add a small delay to ensure DOM is ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const keys = [...STATE.savedCities];
  
  for (const key of keys) {
    try {
      if (key.startsWith('@')) {
        const [lat, lon] = key.slice(1).split(',').map(Number);
        await addCityByCoords(lat, lon, false);
      } else {
        await addCityByName(key, false);
      }
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between refreshes
    } catch (error) {
      console.error(`Failed to refresh city ${key}:`, error);
    }
  }
  
  showToast('Weather data refreshed!', 'success');
}

// Update timestamp for a specific city
function updateCityTimestamp(cityKey) {
  STATE.lastUpdated[cityKey] = Date.now();
  saveData();
}

// Get formatted time since last update
function getTimeSinceUpdate(timestamp) {
  if (!timestamp) return 'Never updated';
  
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
}

// Update timestamp display on all existing cards
function updateAllTimestampDisplays() {
  const cards = document.querySelectorAll('.weather-card');
  cards.forEach(card => {
    const cityKey = card.dataset.key;
    const timestampSpan = card.querySelector('span:last-child');
    if (timestampSpan && cityKey) {
      const timestamp = STATE.lastUpdated[cityKey];
      timestampSpan.textContent = `Last updated: ${getTimeSinceUpdate(timestamp)}`;
    }
  });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + K to focus search
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      ELEMENTS.cityInput.focus();
      ELEMENTS.cityInput.select();
    }
    
    // Escape to close modals
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });
}

// Setup search input events
function setupSearchEvents() {
  let searchTimeout;
  
  // Suggestions disabled: no-op listeners
}

// Show search suggestions (FIXED VERSION with real API)
async function showSearchSuggestions(query) {
  try {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${CONFIG.API_KEY}`);
    const cities = await response.json();
    
    if (cities && cities.length > 0) {
      const suggestions = cities.map(city => ({
        name: city.name,
        country: city.country,
        state: city.state,
        fullName: city.state ? `${city.name}, ${city.state}, ${city.country}` : `${city.name}, ${city.country}`
      }));
      
      ELEMENTS.searchSuggestions.innerHTML = suggestions.map(suggestion => `
        <div class="search-suggestion" onclick="selectSuggestion('${suggestion.fullName}')">
          <i class="fas fa-map-marker-alt text-blue-400 mr-3"></i>
          <div>
            <div class="font-medium">${suggestion.name}</div>
            <div class="text-sm text-blue-200/70">${suggestion.state ? suggestion.state + ', ' : ''}${suggestion.country}</div>
          </div>
        </div>
      `).join('');
    } else {
      ELEMENTS.searchSuggestions.innerHTML = `
        <div class="px-4 py-3 text-blue-200/70 text-center">
          No cities found for "${query}"
        </div>
      `;
    }
    
    // Move search suggestions to body level to ensure highest z-index
    if (ELEMENTS.searchSuggestions.parentNode !== document.body) {
      document.body.appendChild(ELEMENTS.searchSuggestions);
    }
    
    // Position search suggestions below the search input
    const searchInput = ELEMENTS.cityInput;
    const inputRect = searchInput.getBoundingClientRect();
    
    ELEMENTS.searchSuggestions.style.position = 'fixed';
    ELEMENTS.searchSuggestions.style.top = (inputRect.bottom + 8) + 'px';
    ELEMENTS.searchSuggestions.style.left = inputRect.left + 'px';
    ELEMENTS.searchSuggestions.style.width = inputRect.width + 'px';
    ELEMENTS.searchSuggestions.style.zIndex = '999999';
    ELEMENTS.searchSuggestions.style.pointerEvents = 'auto';
    ELEMENTS.searchSuggestions.classList.remove('hidden');
    
    // Force repaint to ensure z-index is applied
    ELEMENTS.searchSuggestions.offsetHeight;
  } catch (error) {
    console.error('Failed to fetch city suggestions:', error);
    ELEMENTS.searchSuggestions.innerHTML = `
      <div class="px-4 py-3 text-center">
        Type a city name to search
      </div>
    `;
    
    // Move search suggestions to body level to ensure highest z-index
    if (ELEMENTS.searchSuggestions.parentNode !== document.body) {
      document.body.appendChild(ELEMENTS.searchSuggestions);
    }
    
    // Position search suggestions below the search input
    const searchInput = ELEMENTS.cityInput;
    const inputRect = searchInput.getBoundingClientRect();
    
    ELEMENTS.searchSuggestions.style.position = 'fixed';
    ELEMENTS.searchSuggestions.style.top = (inputRect.bottom + 8) + 'px';
    ELEMENTS.searchSuggestions.style.left = inputRect.left + 'px';
    ELEMENTS.searchSuggestions.style.width = inputRect.width + 'px';
    ELEMENTS.searchSuggestions.style.zIndex = '999999';
    ELEMENTS.searchSuggestions.style.pointerEvents = 'auto';
    ELEMENTS.searchSuggestions.classList.remove('hidden');
    
    // Force repaint to ensure z-index is applied
    ELEMENTS.searchSuggestions.offsetHeight;
  }
}

// Hide search suggestions
function hideSearchSuggestions() {
  ELEMENTS.searchSuggestions.classList.add('hidden');
  // Reset positioning
  ELEMENTS.searchSuggestions.style.position = '';
  ELEMENTS.searchSuggestions.style.top = '';
  ELEMENTS.searchSuggestions.style.left = '';
  ELEMENTS.searchSuggestions.style.width = '';
  
  // Return search suggestions to original container if they were moved to body
  const originalContainer = document.querySelector('#searchForm').parentNode;
  if (ELEMENTS.searchSuggestions.parentNode === document.body && originalContainer) {
    originalContainer.appendChild(ELEMENTS.searchSuggestions);
  }
}

// Select search suggestion
function selectSuggestion(suggestion) {
  ELEMENTS.cityInput.value = suggestion;
  hideSearchSuggestions();
  addCityByName(suggestion, true);
}

// Refresh all weather cards
async function refreshAllCards() {
  const keys = [...STATE.savedCities];
  ELEMENTS.cards.innerHTML = '';
  
  for (const key of keys) {
    try {
      if (key.startsWith('@')) {
        const [lat, lon] = key.slice(1).split(',').map(Number);
        await addCityByCoords(lat, lon, false);
      } else {
        await addCityByName(key, false);
      }
    } catch (error) {
      console.error(`Failed to refresh city ${key}:`, error);
    }
  }
}

// Close all modals
function closeAllModals() {
  ELEMENTS.weatherModal.classList.add('hidden');
}

// Show day details modal
function showDayDetails(cityName, date) {
  showToast(`Detailed forecast for ${cityName} on ${date}`, 'info');
}

/* ========================================
   INITIALIZATION
   ======================================== */

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Update timestamps every minute
setInterval(() => {
  if (STATE.savedCities.length > 0) {
    updateAllTimestampDisplays();
  }
}, 60000); // Update every minute

// Add CSS animation for card removal
const style = document.createElement('style');
style.textContent = `
  @keyframes cardSlideOut {
    to {
      transform: translateX(100%) scale(0.8);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);