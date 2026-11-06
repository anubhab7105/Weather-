const axios = require('axios');
const { createCache } = require('./cache');
const env = require('../config/env');

const cache = createCache(env.CACHE_TTL);

function buildKey(params) {
  return 'wx:' + JSON.stringify(params);
}

function locationParams({ city, lat, lon }) {
  if (lat != null && lon != null) {
    return { lat: Number(lat), lon: Number(lon) };
  }
  return { q: city };
}

async function request(path, params) {
  const url = `${env.OPENWEATHER_BASE_URL}${path}`;
  const response = await axios.get(url, {
    params: { ...params, appid: env.OPENWEATHER_API_KEY, units: 'metric' },
    timeout: env.REQUEST_TIMEOUT,
  });
  return response.data;
}

function mockWeather({ city, lat, lon }) {
  const name = city || `Location (${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)})`;
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
    forecast: Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + i + 1);
      return {
        date: d.toISOString().slice(0, 10),
        tempMin: baseTemp - 3 - i,
        tempMax: baseTemp + 4 - i,
        description: i % 2 === 0 ? 'partly cloudy' : 'light rain',
        icon: i % 2 === 0 ? '02d' : '10d',
        humidity: 50 + i * 5,
        windSpeed: 3 + i,
      };
    }),
    source: 'mock',
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

function normalizeForecast(data) {
  // data.list is 3-hourly; group by day
  const byDay = new Map();
  for (const item of data.list || []) {
    const date = item.dt_txt.slice(0, 10);
    if (!byDay.has(date)) {
      byDay.set(date, { temps: [], items: [] });
    }
    const g = byDay.get(date);
    g.temps.push(item.main.temp);
    g.items.push(item);
  }
  const result = [];
  for (const [date, g] of byDay) {
    if (result.length >= 5) break;
    // skip today partially? keep all
    const mid = g.items[Math.floor(g.items.length / 2)] || g.items[0];
    result.push({
      date,
      tempMin: Math.min(...g.temps),
      tempMax: Math.max(...g.temps),
      description: mid.weather?.[0]?.description || '',
      icon: mid.weather?.[0]?.icon || '01d',
      humidity: mid.main.humidity,
      windSpeed: mid.wind.speed,
    });
  }
  return result.slice(0, 5);
}

async function getWeather(params) {
  const key = buildKey(params);
  const cached = cache.get(key);
  if (cached) {
    return { ...cached, cached: true };
  }

  // Fallback to mock if no API key
  if (!env.OPENWEATHER_API_KEY) {
    const mock = mockWeather(params);
    cache.set(key, mock);
    return mock;
  }

  const lp = locationParams(params);
  try {
    const [currentData, forecastData] = await Promise.all([
      request('/weather', lp),
      request('/forecast', lp),
    ]);
    const result = {
      city: currentData.name,
      country: currentData.sys?.country,
      current: normalizeCurrent(currentData),
      forecast: normalizeForecast(forecastData),
      source: 'openweathermap',
      cached: false,
    };
    cache.set(key, result);
    return result;
  } catch (err) {
    // Fallback to mock on error
    const mock = mockWeather(params);
    mock.error = err?.response?.data?.message || err.message;
    cache.set(key, mock);
    return mock;
  }
}

module.exports = { getWeather, hasApiKey: () => Boolean(env.OPENWEATHER_API_KEY) };