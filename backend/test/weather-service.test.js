// Set explicit values before importing the configuration module. dotenv does not override
// existing environment variables, including an explicitly empty API key.
process.env.OPENWEATHER_API_KEY = '';
process.env.WEATHER_DEMO_MODE = 'false';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getWeather,
  buildKey,
  mapProviderError,
} = require('../src/services/openweather');

test('does not fabricate weather when the API key is missing and demo mode is disabled', async () => {
  await assert.rejects(
    getWeather({ city: 'NoKeyTestCity' }),
    (error) => error.status === 503 && error.code === 'WEATHER_NOT_CONFIGURED',
  );
});

test('creates consistent cache keys for city searches', () => {
  assert.equal(buildKey({ city: ' Kolkata ' }), buildKey({ city: 'kolkata' }));
});

test('maps provider failures to safe, actionable API errors', () => {
  assert.equal(mapProviderError({ response: { status: 404 } }).status, 404);
  assert.equal(mapProviderError({ response: { status: 429 } }).status, 503);
  assert.equal(mapProviderError({ response: { status: 401 } }).status, 502);
  assert.equal(mapProviderError({ code: 'ECONNABORTED' }).status, 504);
  assert.equal(mapProviderError({ code: 'ECONNRESET' }).status, 502);
});
