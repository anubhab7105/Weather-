const axios = require('axios');
const { createCache } = require('./cache');
const env = require('../config/env');
const { HttpError } = require('../errors/http-error');

const cache = createCache(env.CACHE_TTL);

function buildKey(params) {
  if (params.city) return 'wx:city:' + params.city.trim().toLocaleLowerCase();
  return 'wx:coords:' + Number(params.lat) + ':' + Number(params.lon);
}

function locationParams({ city, lat, lon }) {
  if (lat != null && lon != null) {
    return { lat: Number(lat), lon: Number(lon) };
  }
  return { q: city };
}

async function request(path, params) {
  const url = env.OPENWEATHER_BASE_URL.replace(/\/$/, '') + path;
  const response = await axios.get(url, {
    params: { ...params, appid: env.OPENWEATHER_API_KEY, units: 'metric' },
    timeout: env.REQUEST_TIMEOUT,
  });
  return response.data;
}

function mockWeather({ city, lat, lon }) {
  const name = city || 'Location (' + Number(lat).toFixed(2) + ', ' + Number(lon).toFixed(2) + ')';
  const now = new Date();
  const baseTemp = 18 + Math.round(Math.sin(now.getHours() / 24 * Math.PI) * 6);

  return {
    city: name,
    country: 'XX',
    current: {
      temp: baseTemp,
      feelsLike: baseTemp - 1,
      humidity: 55,
      windSpeed: 3.6,
      description: 'clear sky',
      icon: '01d',
      pressure: 1013,
      visibility: 10000,
      sunrise: Math.floor(Date.now() / 1000) - 3600 * 2,
      sunset: Math.floor(Date.now() / 1000) + 3600 * 6,
      dt: Math.floor(Date.now() / 1000),
    },
    forecast: Array.from({ length: 5 }, (_, index) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() + index + 1);
      return {
        date: date.toISOString().slice(0, 10),
        tempMin: baseTemp - 3 - index,
        tempMax: baseTemp + 4 - index,
        description: index % 2 === 0 ? 'partly cloudy' : 'light rain',
        icon: index % 2 === 0 ? '02d' : '10d',
        humidity: 50 + index * 5,
        windSpeed: 3 + index,
      };
    }),
    source: 'demo',
    cached: false,
  };
}

function normalizeCurrent(data) {
  return {
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    description: data.weather?.[0]?.description || '',
    icon: data.weather?.[0]?.icon || '01d',
    pressure: data.main.pressure,
    visibility: data.visibility,
    sunrise: data.sys?.sunrise,
    sunset: data.sys?.sunset,
    dt: data.dt,
  };
}

function localDate(epochSeconds, timezoneOffsetSeconds) {
  return new Date((epochSeconds + timezoneOffsetSeconds) * 1000)
    .toISOString()
    .slice(0, 10);
}

function normalizeForecast(data, timezoneOffsetSeconds = 0, currentTimestamp = Math.floor(Date.now() / 1000)) {
  const today = localDate(currentTimestamp, timezoneOffsetSeconds);
  const byDay = new Map();

  for (const item of data.list || []) {
    const timestamp = Number(item.dt);
    if (!Number.isFinite(timestamp)) continue;

    const date = localDate(timestamp, timezoneOffsetSeconds);
    // The current calendar day is partial; only show upcoming forecast days.
    if (date <= today) continue;

    if (!byDay.has(date)) byDay.set(date, { temps: [], items: [] });

    const group = byDay.get(date);
    if (Number.isFinite(item.main?.temp)) group.temps.push(item.main.temp);
    group.items.push(item);
  }

  return Array.from(byDay.entries()).slice(0, 5).map(([date, group]) => {
    const middle = group.items[Math.floor(group.items.length / 2)] || group.items[0];
    return {
      date,
      tempMin: group.temps.length ? Math.min(...group.temps) : null,
      tempMax: group.temps.length ? Math.max(...group.temps) : null,
      description: middle.weather?.[0]?.description || '',
      icon: middle.weather?.[0]?.icon || '01d',
      humidity: middle.main?.humidity,
      windSpeed: middle.wind?.speed,
    };
  });
}

function mapProviderError(err) {
  const providerStatus = err?.response?.status;

  if (providerStatus === 404) {
    return new HttpError(404, 'City or location was not found', 'LOCATION_NOT_FOUND');
  }
  if (providerStatus === 401 || providerStatus === 403) {
    return new HttpError(502, 'Weather provider rejected the API key. Check OPENWEATHER_API_KEY.', 'WEATHER_PROVIDER_AUTH_ERROR');
  }
  if (providerStatus === 429) {
    return new HttpError(503, 'Weather provider rate limit reached. Please try again later.', 'WEATHER_PROVIDER_RATE_LIMIT');
  }
  if (providerStatus === 400) {
    return new HttpError(400, 'Weather provider rejected the requested location', 'INVALID_LOCATION');
  }
  if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT') {
    return new HttpError(504, 'Weather provider request timed out', 'WEATHER_PROVIDER_TIMEOUT');
  }
  return new HttpError(502, 'Unable to retrieve weather from the provider', 'WEATHER_PROVIDER_UNAVAILABLE');
}

async function getWeather(params) {
  const key = buildKey(params);
  const cached = cache.get(key);

  if (cached) return { ...cached, cached: true };

  if (!env.OPENWEATHER_API_KEY) {
    if (env.WEATHER_DEMO_MODE) {
      const demo = mockWeather(params);
      cache.set(key, demo);
      return demo;
    }

    throw new HttpError(
      503,
      'Weather API is not configured. Set OPENWEATHER_API_KEY, or enable WEATHER_DEMO_MODE for demo data.',
      'WEATHER_NOT_CONFIGURED'
    );
  }

  const location = locationParams(params);

  try {
    const [currentData, forecastData] = await Promise.all([
      request('/weather', location),
      request('/forecast', location),
    ]);

    const result = {
      city: currentData.name,
      country: currentData.sys?.country,
      current: normalizeCurrent(currentData),
      forecast: normalizeForecast(
        forecastData,
        Number(currentData.timezone) || 0,
        Number(currentData.dt) || Math.floor(Date.now() / 1000)
      ),
      source: 'openweathermap',
      cached: false,
    };

    // Only successful provider responses enter the cache.
    cache.set(key, result);
    return result;
  } catch (err) {
    throw mapProviderError(err);
  }
}

module.exports = {
  getWeather,
  hasApiKey: () => Boolean(env.OPENWEATHER_API_KEY),
  normalizeForecast,
  mapProviderError,
  locationParams,
  buildKey,
};
