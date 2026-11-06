const test = require('node:test');
const assert = require('node:assert/strict');
const { parseWeatherQuery } = require('../src/utils/weather-query');

test('trims and accepts a valid city name', () => {
  assert.deepEqual(parseWeatherQuery({ city: '  Kolkata  ' }), { city: 'Kolkata' });
});

test('rejects an empty or overlong city name', () => {
  assert.throws(() => parseWeatherQuery({ city: '   ' }), { status: 400, code: 'INVALID_CITY' });
  assert.throws(() => parseWeatherQuery({ city: 'x'.repeat(101) }), { status: 400, code: 'INVALID_CITY' });
});

test('rejects city and coordinates supplied together', () => {
  assert.throws(
    () => parseWeatherQuery({ city: 'Kolkata', lat: '22.5', lon: '88.3' }),
    { status: 400, code: 'INVALID_QUERY' },
  );
});

test('accepts valid coordinates and converts them to numbers', () => {
  assert.deepEqual(
    parseWeatherQuery({ lat: '22.5726', lon: '88.3639' }),
    { lat: 22.5726, lon: 88.3639 },
  );
});

test('requires both coordinates', () => {
  assert.throws(
    () => parseWeatherQuery({ lat: '22.5' }),
    { status: 400, code: 'INCOMPLETE_COORDINATES' },
  );
  assert.throws(
    () => parseWeatherQuery({ lon: '88.3' }),
    { status: 400, code: 'INCOMPLETE_COORDINATES' },
  );
});

test('rejects non-numeric, non-finite, and out-of-range coordinates', () => {
  for (const [lat, lon] of [
    ['north', '88'],
    ['NaN', '88'],
    ['91', '88'],
    ['-91', '88'],
    ['22', 'east'],
    ['22', '181'],
    ['22', '-181'],
  ]) {
    assert.throws(() => parseWeatherQuery({ lat, lon }), { status: 400 });
  }
});

test('rejects repeated query parameters represented as arrays', () => {
  assert.throws(
    () => parseWeatherQuery({ lat: ['22', '23'], lon: '88' }),
    { status: 400, code: 'INVALID_COORDINATES' },
  );
});

test('requires a location', () => {
  assert.throws(() => parseWeatherQuery({}), { status: 400, code: 'MISSING_LOCATION' });
});
