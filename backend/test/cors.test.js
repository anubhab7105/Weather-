const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCorsOrigins } = require('../src/config/cors');

test('allows a wildcard when it is the only configured origin', () => {
  assert.equal(parseCorsOrigins('*'), '*');
  assert.equal(parseCorsOrigins('  *  '), '*');
});

test('trims whitespace around each configured origin', () => {
  assert.deepEqual(
    parseCorsOrigins('https://weather.example.com, http://localhost:5173 '),
    ['https://weather.example.com', 'http://localhost:5173'],
  );
});

test('rejects an empty origin list and mixed wildcard configuration', () => {
  assert.throws(() => parseCorsOrigins(' ,  '), /at least one origin/);
  assert.throws(() => parseCorsOrigins('*,https://weather.example.com'), /cannot combine/);
});
