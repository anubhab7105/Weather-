const path = require('path');
// Load backend/.env then root .env (fallback, non-overriding)
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

module.exports = {
  PORT: Number(process.env.PORT) || 5000,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
  OPENWEATHER_BASE_URL: process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
  CACHE_TTL: Number(process.env.CACHE_TTL_SECONDS) || 600,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  REQUEST_TIMEOUT: Number(process.env.REQUEST_TIMEOUT_MS) || 8000,
};