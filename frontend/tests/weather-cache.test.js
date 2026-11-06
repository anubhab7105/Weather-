import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isFreshWeatherCache,
  weatherCacheKey,
  WEATHER_CACHE_MAX_AGE_MS,
} from '../src/weather-cache.js';

test('city cache keys are case-insensitive and ignore surrounding whitespace', () => {
  assert.equal(weatherCacheKey({ city: ' Kolkata ' }), weatherCacheKey({ city: 'kolkata' }));
});

test('coordinate cache keys are stable to minor geolocation precision changes', () => {
  assert.equal(
    weatherCacheKey({ lat: 22.572645, lon: 88.363892 }),
    weatherCacheKey({ lat: 22.572646, lon: 88.363891 }),
  );
});

test('city and coordinate searches use separate cache entries', () => {
  assert.notEqual(
    weatherCacheKey({ city: 'Kolkata' }),
    weatherCacheKey({ lat: 22.5726, lon: 88.3639 }),
  );
});

test('rejects incomplete or non-finite coordinate cache keys', () => {
  assert.equal(weatherCacheKey({ lat: 22.5 }), null);
  assert.equal(weatherCacheKey({ lat: Number.NaN, lon: 10 }), null);
});

test('accepts a fresh well-formed cache entry', () => {
  const now = 1_800_000_000_000;
  assert.equal(isFreshWeatherCache({ data: { city: 'Kolkata' }, ts: now - 1000 }, now), true);
});

test('rejects expired, future-dated, and malformed cache entries', () => {
  const now = 1_800_000_000_000;
  assert.equal(isFreshWeatherCache({ data: {}, ts: now - WEATHER_CACHE_MAX_AGE_MS - 1 }, now), false);
  assert.equal(isFreshWeatherCache({ data: {}, ts: now + 1 }, now), false);
  assert.equal(isFreshWeatherCache({ data: {}, ts: 'yesterday' }, now), false);
  assert.equal(isFreshWeatherCache(null, now), false);
});
