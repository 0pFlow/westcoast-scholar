import { handleApiError } from "@/utils/errorHandler.js";

const envWeatherKey =
  typeof import.meta !== "undefined" &&
  import.meta &&
  import.meta.env &&
  import.meta.env.VITE_WEATHER_KEY
    ? import.meta.env.VITE_WEATHER_KEY
    : "";

const API_KEY = envWeatherKey;
const THUNDERSTORM_MAX = 232;
const DRIZZLE_MAX = 321;
const RAIN_MAX = 531;
const SNOW_MAX = 622;
const ATMOSPHERE_MAX = 781;
const CLEAR_SKY_ID = 800;

function getWeatherIcon(weatherId) {
  if (weatherId <= THUNDERSTORM_MAX) return "thunderstorm.svg";
  if (weatherId <= DRIZZLE_MAX) return "drizzle.svg";
  if (weatherId <= RAIN_MAX) return "rain.svg";
  if (weatherId <= SNOW_MAX) return "snow.svg";
  if (weatherId <= ATMOSPHERE_MAX) return "atmosphere.svg";
  if (weatherId === CLEAR_SKY_ID) return "clear.svg";
  return "clouds.svg";
}

async function fetchCurrentWeatherByCoords(lat, lon) {
  if (!API_KEY) throw new Error("Weather API key missing");

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}

// refactor: extract weather style application into reusable class toggling utility
function applyWeatherStyles(condition) {
  const weatherEl = document.getElementById("weather");
  const tempEl = document.getElementById("temp");
  const iconEl = document.getElementById("weatherIcon");

  if (!weatherEl || !tempEl || !iconEl) return;

  weatherEl.classList.add("weather-widget");
  weatherEl.classList.toggle("weather-widget--home", condition === "home");
  tempEl.classList.add("weather-temp");
  iconEl.classList.add("weather-icon");
}

function updateWeatherUI({ tempC, weatherId }) {
  const tempEl = document.getElementById("temp");
  const iconEl = document.getElementById("weatherIcon");
  if (!tempEl || !iconEl) return;

  const page = window.location.pathname.split("/").pop() || "index.html";
  applyWeatherStyles(page === "index.html" ? "home" : "default"); // refactor: replace inline style assignments with class toggling

  tempEl.innerHTML = `${Math.round(tempC)}<span class="weather-temp-degree">&deg;C</span>`; // refactor: remove inline HTML styles in favor of CSS class
  iconEl.src = `/assets/${getWeatherIcon(weatherId)}`;
}

function showWeatherFallback() {
  const tempEl = document.getElementById("temp");
  const iconEl = document.getElementById("weatherIcon");
  if (tempEl) tempEl.textContent = "Väder saknas";
  if (iconEl) iconEl.removeAttribute("src");
}

function getCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 },
    );
  });
}

export default async function startWeather() {
  let coords;

  try {
    coords = await getCoords();
  } catch (error) {
    showWeatherFallback();
    handleApiError(error, { fallbackMessage: "Väder kunde inte visas just nu." });
    return;
  }

  try {
    const data = await fetchCurrentWeatherByCoords(coords.latitude, coords.longitude);
    const tempC = data?.main?.temp;
    const weatherId = data?.weather?.[0]?.id;

    if (typeof tempC !== "number" || typeof weatherId !== "number") {
      throw new Error("Incomplete weather response");
    }

    updateWeatherUI({ tempC, weatherId });
  } catch (error) {
    showWeatherFallback();
    handleApiError(error, { fallbackMessage: "Väder kunde inte hamtas just nu." });
  }
}
