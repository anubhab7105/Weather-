const path = require('path');

// Load backend/.env first, then use the repository-root .env as a fallback.
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

function readPositiveInteger(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(name + ' must be a positive integer');
  }
  return value;
}

module.exports = {
  PORT: readPositiveInteger('PORT', 5000),
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
  OPENWEATHER_BASE_URL: process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
  CACHE_TTL: readPositiveInteger('CACHE_TTL_SECONDS', 600),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  REQUEST_TIMEOUT: readPositiveInteger('REQUEST_TIMEOUT_MS', 8000),
  WEATHER_DEMO_MODE: process.env.WEATHER_DEMO_MODE === 'true',
};
