const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeForecast } = require('../src/services/openweather');

const timezoneOffset = 5.5 * 60 * 60;
const currentTimestamp = Date.parse('2026-11-06T03:00:00Z') / 1000;

function forecastItem(localDate, localHour, temp, offset = timezoneOffset) {
  const localWallClock = Date.parse(localDate + 'T' + String(localHour).padStart(2, '0') + ':00:00Z');
  return {
    dt: localWallClock / 1000 - offset,
    main: { temp, humidity: 60 },
    wind: { speed: 3.5 },
    weather: [{ description: 'clear sky', icon: '01d' }],
  };
}

test('excludes the current local day and groups upcoming days using the location timezone', () => {
  const data = {
    list: [
      forecastItem('2026-11-06', 8, 20),
      forecastItem('2026-11-06', 15, 22),
      forecastItem('2026-11-07', 6, 18),
      forecastItem('2026-11-07', 12, 24),
      forecastItem('2026-11-08', 6, 17),
      forecastItem('2026-11-09', 6, 16),
      forecastItem('2026-11-10', 6, 15),
      forecastItem('2026-11-11', 6, 14),
    ],
  };

  const result = normalizeForecast(data, timezoneOffset, currentTimestamp);

  assert.deepEqual(result.map((day) => day.date), [
    '2026-11-07',
    '2026-11-08',
    '2026-11-09',
    '2026-11-10',
    '2026-11-11',
  ]);
  assert.equal(result[0].tempMin, 18);
  assert.equal(result[0].tempMax, 24);
});

test('returns only the future days that the provider actually supplied', () => {
  const data = {
    list: [
      forecastItem('2026-11-06', 9, 20),
      forecastItem('2026-11-07', 9, 21),
      forecastItem('2026-11-08', 9, 22),
    ],
  };

  const result = normalizeForecast(data, timezoneOffset, currentTimestamp);

  assert.deepEqual(result.map((day) => day.date), ['2026-11-07', '2026-11-08']);
});

test('ignores malformed forecast timestamps', () => {
  const result = normalizeForecast({
    list: [{ dt: 'not-a-time', main: { temp: 20 } }],
  }, timezoneOffset, currentTimestamp);

  assert.deepEqual(result, []);
});
