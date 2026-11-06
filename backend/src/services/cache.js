const NodeCache = require('node-cache');

function createCache(ttlSeconds) {
  return new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false });
}

module.exports = { createCache };