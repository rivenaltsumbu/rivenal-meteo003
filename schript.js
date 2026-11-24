const API_BASE = "https://api.open-meteo.com/v1";
const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1";
const ASSET_PATH = "assets/images/";

const elements = {
  form: document.querySelector(".search-form"),
  search: document.querySelector(".search-field input"),
  locationButton: document.querySelector(".location-button"),
  status: document.querySelector(".search-status"),
  statusIcon: document.querySelector(".status-icon"),
  statusMessage: document.querySelector(".status-message"),
  unitsControl: document.querySelector(".units-control"),
  unitsButton: document.querySelector(".units-button"),
  unitsMenu: document.querySelector("#units-menu"),
  location: document.querySelector(".location-name"),
  date: document.querySelector(".current-date"),
  currentIcon: document.querySelector(".current-icon"),
  currentMoonIcon: document.querySelector(".current-moon-icon"),
  currentTemperature: document.querySelector(".current-temperature"),
  weatherAdvice: document.querySelector(".weather-advice"),
  currentDescription: document.querySelector(".current-description"),
  feelsLike: document.querySelector(".feels-like"),
  humidity: document.querySelector(".humidity-value"),
  wind: document.querySelector(".wind-value"),
  windUnit: document.querySelector(".wind-unit"),
  precipitation: document.querySelector(".precipitation-value"),
  precipitationUnit: document.querySelector(".precipitation-unit"),
  dailyList: document.querySelector(".daily-list"),
  daySelect: document.querySelector(".day-select"),
  hourlyList: document.querySelector(".hourly-list"),
};

let activeRequest;
let weatherData;
let locationRequestId = 0;

const weatherConditions = {
  0: ["Ciel dégagé", "sunny"],
  1: ["Ciel principalement dégagé", "sunny"],
  2: ["Ciel partiellement nuageux", "partly-cloudy"],
  3: ["Ciel couvert", "overcast"],
  45: ["Brouillard", "overcast"],
  48: ["Brouillard givrant", "overcast"],
  51: ["Bruine légère", "rain"],
  53: ["Bruine", "rain"],
  55: ["Bruine dense", "rain"],
  56: ["Bruine verglaçante", "rain"],
  57: ["Bruine verglaçante dense", "rain"],
  61: ["Pluie légère", "rain"],
  63: ["Pluie modérée", "rain"],
  65: ["Forte pluie", "rain"],
  66: ["Pluie verglaçante", "rain"],
  67: ["Forte pluie verglaçante", "rain"],
  71: ["Neige légère", "snow"],
  73: ["Chutes de neige", "snow"],
  75: ["Fortes chutes de neige", "snow"],
  77: ["Neige en grains", "snow"],
  80: ["Faibles averses", "rain"],
  81: ["Averses de pluie", "rain"],
  82: ["Fortes averses", "rain"],
  85: ["Averses de neige", "snow"],
  86: ["Fortes averses de neige", "snow"],
  95: ["Orage", "storm"],
  96: ["Orage avec grêle", "storm"],
  99: ["Violent orage avec grêle", "storm"],
};

const frenchWeatherDescriptions = {
  0: "Ciel dégagé",
  1: "Ciel principalement dégagé",
  2: "Ciel partiellement nuageux",
  3: "Ciel nuageux",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine",
  55: "Forte bruine",
  56: "Bruine verglaçante",
  57: "Forte bruine verglaçante",
  61: "Pluie légère",
  63: "Pluie modérée",
  65: "Forte pluie",
  66: "Pluie verglaçante",
  67: "Forte pluie verglaçante",
  71: "Neige légère",
  73: "Chutes de neige",
  75: "Fortes chutes de neige",
  77: "Neige en grains",
  80: "Faibles averses",
  81: "Averses de pluie",
  82: "Fortes averses",
  85: "Averses de neige",
  86: "Fortes averses de neige",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Violent orage avec grêle",
};

const rainyWeatherCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const stormWeatherCodes = new Set([95, 96, 99]);

function getCondition(code, isDay = 1) {
  const [description, daytimeIcon] = weatherConditions[code] || ["Conditions inconnues", "overcast"];
  if (Number(isDay) === 0 && (code === 0 || code === 1)) {
    return [description, "moon"];
  }
  if (Number(isDay) === 0 && code === 2) {
    return [description, "partly-cloudy-night"];
  }
  return [description, daytimeIcon];
}

function setStatus(message, state = "") {
  elements.statusMessage.textContent = message;
  elements.status.dataset.state = state;
  elements.status.hidden = !message;
  const icon = state === "loading" ? "icon-loading.svg" : state === "error" ? "icon-retry.svg" : "";
  elements.statusIcon.hidden = !icon;
  if (icon) {
    elements.statusIcon.src = `${ASSET_PATH}${icon}`;
  }
}

function getSelectedUnit(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function formatTemperature(celsius) {
  const value = getSelectedUnit("temperature-unit") === "fahrenheit"
    ? Math.round((celsius * 9) / 5 + 32)
    : Math.round(celsius);
  return `${value}°`;
}

function formatWind(kilometersPerHour) {
  const useMph = getSelectedUnit("wind-unit") === "mph";
  return {
    value: String(Math.round(useMph ? kilometersPerHour * 0.621371 : kilometersPerHour)),
    unit: useMph ? "mph" : "km/h",
  };
}

function formatPrecipitation(millimeters) {
  const useInches = getSelectedUnit("precipitation-unit") === "inches";
  const amount = useInches ? millimeters / 25.4 : millimeters;
  return {
    value: useInches ? amount.toFixed(2) : String(Math.round(amount * 10) / 10),
    unit: useInches ? "in" : "mm",
  };
}

function formatDate(dateString, options) {
  return new Intl.DateTimeFormat("fr-FR", options).format(new Date(`${dateString}T12:00:00`));
}

function setWeatherIcon(image, code, isDay = 1) {
  const [description, icon] = getCondition(code, isDay);
  const extension = icon === "moon" || icon.endsWith("-night") ? "svg" : "webp";
  image.src = `${ASSET_PATH}icon-${icon}.${extension}`;
  image.alt = description;
}

function createWeatherIcon(code, isDay = 1) {
  const wrapper = document.createElement("span");
  wrapper.className = "weather-icon-wrap";

  const icon = document.createElement("img");
  setWeatherIcon(icon, code, isDay);
  wrapper.append(icon);

  if (Number(isDay) === 0 && ![0, 1, 2].includes(Number(code))) {
    const moon = document.createElement("img");
    moon.className = "night-moon-icon";
    moon.src = `${ASSET_PATH}icon-moon.svg`;
    moon.alt = "";
    moon.setAttribute("aria-hidden", "true");
    wrapper.append(moon);
  }

  return wrapper;
}

function getUpcomingPrecipitation(forecast) {
  const { current, hourly } = forecast;
  const currentHour = current.time.slice(0, 13);
  const currentDate = current.time.slice(0, 10);
  let rainExpected = false;
  let stormExpected = false;
  let maxProbability = null;

  hourly.time.forEach((time, index) => {
    if (time.slice(0, 10) !== currentDate || time.slice(0, 13) < currentHour) {
      return;
    }

    const code = hourly.weather_code[index];
    const probability = hourly.precipitation_probability?.[index];
    if (Number.isFinite(probability)) {
      maxProbability = maxProbability === null
        ? probability
        : Math.max(maxProbability, probability);
      if (probability >= 50) {
        rainExpected = true;
      }
    }
    if (stormWeatherCodes.has(code)) {
      stormExpected = true;
    } else if (rainyWeatherCodes.has(code)) {
      rainExpected = true;
    }
  });

  return { rainExpected, stormExpected, maxProbability };
}

function getWeatherAdvice(current, precipitationForecast) {
  const temperature = current.temperature_2m;
  const formattedTemperature = formatTemperature(temperature);
  const rainRisk = Number.isFinite(precipitationForecast.maxProbability) &&
    precipitationForecast.maxProbability > 0
    ? ` Risque de pluie : ${Math.round(precipitationForecast.maxProbability)} %.`
    : "";

  if (stormWeatherCodes.has(current.weather_code)) {
    return `Orage en cours.${rainRisk} Restez à l’abri.`;
  }
  if (precipitationForecast.stormExpected) {
    return `Orage prévu aujourd’hui.${rainRisk} Restez à l’abri.`;
  }
  if (rainyWeatherCodes.has(current.weather_code)) {
    return `Il pleut en ce moment.${rainRisk} Pensez au parapluie.`;
  }
  if (precipitationForecast.rainExpected) {
    return `Pluie prévue aujourd’hui.${rainRisk} Pensez au parapluie.`;
  }
  if (temperature >= 35) {
    return `Forte chaleur (${formattedTemperature}) : hydratez-vous et restez à l’ombre.`;
  }
  if (temperature >= 30) {
    return `Il fait chaud (${formattedTemperature}) : buvez de l’eau et limitez les efforts au soleil.`;
  }
  if (temperature <= 10) {
    return `Il fait froid (${formattedTemperature}) : couvrez-vous bien.`;
  }
  if (temperature <= 18) {
    return `Temps frais (${formattedTemperature}) : prévoyez un vêtement chaud.`;
  }
  return `Température agréable (${formattedTemperature}) : profitez de votre journée.`;
}

function createDailyCard(date, high, low, code) {
  const [condition] = getCondition(code);
  const card = document.createElement("article");
  card.className = "day-card";

  const day = document.createElement("h3");
  day.textContent = formatDate(date, { weekday: "short" });

  const icon = createWeatherIcon(code);

  const temperatures = document.createElement("p");
  const highElement = document.createElement("span");
  highElement.className = "temperature";
  highElement.textContent = formatTemperature(high);
  const lowElement = document.createElement("span");
  lowElement.className = "temperature";
  lowElement.textContent = formatTemperature(low);
  temperatures.append(highElement, lowElement);

  card.setAttribute(
    "aria-label",
    `${day.textContent}: ${condition}, high ${formatTemperature(high)}, low ${formatTemperature(low)}`,
  );
  card.append(day, icon, temperatures);
  return card;
}

function createHourlyRow(time, temperature, code, isDay) {
  const row = document.createElement("article");
  row.className = "hour-row";

  const icon = createWeatherIcon(code, isDay);

  const hour = document.createElement("h3");
  hour.textContent = new Intl.DateTimeFormat("fr-FR", {
    hour: "numeric",
    hour12: false,
  }).format(new Date(time));

  const value = document.createElement("p");
  value.className = "temperature";
  value.textContent = formatTemperature(temperature);

  row.append(icon, hour, value);
  return row;
}

function renderHourlyForecast() {
  const { hourly, current } = weatherData.forecast;
  const selectedDate = elements.daySelect.value;
  const dayHours = hourly.time
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => time.startsWith(selectedDate));

  elements.hourlyList.replaceChildren();
  if (!dayHours.length) {
    elements.hourlyList.textContent = "Aucune prévision horaire disponible.";
    return;
  }

  const currentDate = current.time.slice(0, 10);
  const selectedHour = selectedDate === currentDate
    ? Math.max(Number(current.time.slice(11, 13)), 15)
    : 15;
  const start = dayHours.findIndex(({ time }) => Number(time.slice(11, 13)) >= selectedHour);
  const startIndex = start < 0 ? 0 : start;

  dayHours.slice(startIndex, startIndex + 8).forEach(({ time, index }) => {
    elements.hourlyList.append(
      createHourlyRow(
        time,
        hourly.temperature_2m[index],
        hourly.weather_code[index],
        hourly.is_day?.[index] ?? 1,
      ),
    );
  });
}

function renderWeather() {
  const { place, forecast } = weatherData;
  const { current, daily } = forecast;

  elements.location.textContent = [place.name, place.country].filter(Boolean).join(", ");
  elements.date.textContent = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${current.time.slice(0, 10)}T12:00:00`));
  elements.currentTemperature.textContent = formatTemperature(current.temperature_2m);
  elements.currentDescription.textContent =
    frenchWeatherDescriptions[current.weather_code] || "Conditions météo inconnues";
  const precipitationForecast = getUpcomingPrecipitation(forecast);
  elements.weatherAdvice.textContent = getWeatherAdvice(current, precipitationForecast);
  elements.weatherAdvice.hidden = false;
  elements.feelsLike.textContent = formatTemperature(current.apparent_temperature);
  elements.humidity.textContent = String(current.relative_humidity_2m);
  setWeatherIcon(elements.currentIcon, current.weather_code, current.is_day);
  elements.currentMoonIcon.hidden =
    Number(current.is_day) !== 0 || [0, 1, 2].includes(Number(current.weather_code));

  const wind = formatWind(current.wind_speed_10m);
  elements.wind.textContent = wind.value;
  elements.windUnit.textContent = wind.unit;

  const precipitation = formatPrecipitation(current.precipitation);
  elements.precipitation.textContent = precipitation.value;
  elements.precipitationUnit.textContent = precipitation.unit;

  elements.dailyList.replaceChildren();
  daily.time.forEach((date, index) => {
    elements.dailyList.append(
      createDailyCard(
        date,
        daily.temperature_2m_max[index],
        daily.temperature_2m_min[index],
        daily.weather_code[index],
      ),
    );
  });

  const previousDate = elements.daySelect.value;
  elements.daySelect.replaceChildren();
  daily.time.forEach((date) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = formatDate(date, { weekday: "long" });
    elements.daySelect.append(option);
  });
  elements.daySelect.value = daily.time.includes(previousDate) ? previousDate : daily.time[0];
  renderHourlyForecast();
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.reason || "Le service météo a renvoyé une erreur.");
  }
  return data;
}

async function loadWeatherForPlace(place, signal, notice = "") {
  const forecastUrl = new URL(`${API_BASE}/forecast`);
  forecastUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",
    hourly: "temperature_2m,weather_code,is_day,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timezone: "auto",
    forecast_days: "7",
  });
  const forecast = await fetchJson(forecastUrl, signal);
  if (
    !forecast.current ||
    !Number.isFinite(forecast.current.temperature_2m) ||
    !forecast.daily ||
    !forecast.hourly
  ) {
    throw new Error("Les données météo de cette ville sont incomplètes. Réessayez.");
  }

  weatherData = { place, forecast };
  elements.search.value = "";
  renderWeather();
  setStatus(notice, notice ? "notice" : "");
}

async function searchWeather(query) {
  locationRequestId += 1;
  activeRequest?.abort();
  activeRequest = new AbortController();
  const { signal } = activeRequest;
  setStatus(`Recherche de ${query}…`, "loading");

  try {
    const geocodingUrl = new URL(`${GEOCODING_BASE}/search`);
    geocodingUrl.search = new URLSearchParams({
      name: query,
      count: "1",
      language: "fr",
      format: "json",
    });
    const locations = await fetchJson(geocodingUrl, signal);
    const place = locations.results?.[0];
    if (!place) {
      throw new Error(`Aucun lieu trouvé pour « ${query} ». Essayez une autre ville.`);
    }

    await loadWeatherForPlace(place, signal);
  } catch (error) {
    if (error.name !== "AbortError") {
      setStatus(error.message || "Impossible de charger la météo. Réessayez.", "error");
    }
  }
}

function getPlaceName(address) {
  if (address.municipality && address.state) {
    return {
      name: `${address.municipality}, ${address.state}`,
      country: address.country || "",
    };
  }

  const district =
    address.city_district || address.suburb || address.borough || address.quarter || address.neighbourhood;
  const city =
    address.city || address.town || address.village || address.municipality || address.county ||
    address.state_district || address.state;
  const name = district && city && district.toLowerCase() !== city.toLowerCase()
    ? `${district}, ${city}`
    : city || district;
  return name ? { name, country: address.country || "" } : null;
}

async function loadWeatherFromCoordinates(coords, requestId) {
  if (requestId !== locationRequestId) {
    return;
  }

  activeRequest?.abort();
  activeRequest = new AbortController();
  const { signal } = activeRequest;
  setStatus("Recherche de votre quartier…", "loading");

  let place = { name: "Votre position", country: "" };
  let notice = "";
  try {
    const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    reverseUrl.search = new URLSearchParams({
      format: "jsonv2",
      lat: String(coords.latitude),
      lon: String(coords.longitude),
      zoom: "14",
      addressdetails: "1",
    });
    const result = await fetchJson(reverseUrl, signal);
    const namedPlace = getPlaceName(result.address || {});
    if (namedPlace) {
      place = namedPlace;
    } else {
      notice = "La météo est affichée, mais le nom du quartier est indisponible.";
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    notice = "La météo est affichée, mais le nom du quartier est indisponible.";
  }

  try {
    await loadWeatherForPlace(
      { ...place, latitude: coords.latitude, longitude: coords.longitude },
      signal,
      notice,
    );
  } catch (error) {
    if (error.name !== "AbortError") {
      setStatus(error.message || "Impossible de charger la météo de votre position.", "error");
    }
  }
}

async function useDefaultLocation(message) {
  await searchWeather("Berlin");
  if (weatherData) {
    setStatus(message, "notice");
  }
}

function loadCurrentLocation() {
  const requestId = ++locationRequestId;
  if (!navigator.geolocation) {
    useDefaultLocation("La géolocalisation est indisponible. La météo de Berlin est affichée.");
    return;
  }

  setStatus("Recherche de votre position…", "loading");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => loadWeatherFromCoordinates(coords, requestId),
    (error) => {
      if (requestId !== locationRequestId) {
        return;
      }
      const message = error.code === error.PERMISSION_DENIED
        ? "Autorisez l’accès à votre position pour afficher la météo près de vous. Berlin est affichée en attendant."
        : "Votre position n’a pas pu être détectée. La météo de Berlin est affichée.";
      useDefaultLocation(message);
    },
    { enableHighAccuracy: false, maximumAge: 600000, timeout: 12000 },
  );
}

function setUnitsMenuOpen(isOpen) {
  elements.unitsButton.setAttribute("aria-expanded", String(isOpen));
  elements.unitsMenu.hidden = !isOpen;
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = elements.search.value.trim();
  if (!query) {
    setStatus("Saisissez le nom d’une ville à rechercher.", "error");
    elements.search.focus();
    return;
  }
  searchWeather(query);
});

elements.locationButton.addEventListener("click", () => loadCurrentLocation());

elements.unitsButton.addEventListener("click", () => {
  setUnitsMenuOpen(elements.unitsMenu.hidden);
});

document.addEventListener("click", (event) => {
  if (!elements.unitsControl.contains(event.target)) {
    setUnitsMenuOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.unitsMenu.hidden) {
    setUnitsMenuOpen(false);
    elements.unitsButton.focus();
  }
});

document.querySelectorAll(".units-menu input").forEach((input) => {
  input.addEventListener("change", () => {
    if (weatherData) {
      renderWeather();
    }
    setUnitsMenuOpen(false);
    elements.unitsButton.focus();
  });
});

elements.daySelect.addEventListener("change", renderHourlyForecast);
loadCurrentLocation();