const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const weatherRouter = require('./routes/weather');

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',') }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ name: 'Weather API', version: '1.0.0', endpoints: ['/api/health', '/api/weather?city=London', '/api/weather?lat=&lon='] });
});

app.use('/api', weatherRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`Weather backend listening on http://localhost:${env.PORT}`);
  });
}

module.exports = app;