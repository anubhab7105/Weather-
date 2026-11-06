function parseCorsOrigins(value) {
  const configured = typeof value === 'string' ? value.trim() : '';

  if (!configured || configured === '*') return '*';

  const origins = configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN must contain at least one origin or *');
  }

  if (origins.includes('*')) {
    throw new Error('CORS_ORIGIN cannot combine * with specific origins');
  }

  return origins;
}

module.exports = { parseCorsOrigins };
