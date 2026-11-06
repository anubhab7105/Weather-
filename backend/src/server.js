const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { parseCorsOrigins } = require('./config/cors');
const weatherRouter = require('./routes/weather');

const app = express();
const corsOrigin = parseCorsOrigins(env.CORS_ORIGIN);

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '16kb' }));

app.get('/', (req, res) => {
  res.json({
    name: 'Weather API',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/weather?city=London', '/api/weather?lat=51.5&lon=-0.12'],
  });
});

app.use('/api', weatherRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
    ? err.status
    : 500;
  const isOperational = err.isOperational === true;

  if (!isOperational) {
    console.error('[weather-api] Unexpected error:', err);
  }

  res.status(status).json({
    error: isOperational ? err.message : 'Internal server error',
    code: isOperational ? err.code : 'INTERNAL_SERVER_ERROR',
  });
});

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log('Weather backend listening on http://localhost:' + env.PORT);
  });
}

module.exports = app;
