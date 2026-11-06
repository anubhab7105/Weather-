const express = require('express');
const { getWeather } = require('../services/openweather');
const { parseWeatherQuery } = require('../utils/weather-query');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.get('/weather', async (req, res, next) => {
  try {
    const params = parseWeatherQuery(req.query);
    const data = await getWeather(params);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
