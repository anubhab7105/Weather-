const express = require('express');
const { getWeather } = require('../services/openweather');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.get('/weather', async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;
    if (!city && (lat == null || lon == null)) {
      return res.status(400).json({ error: 'Provide city or lat & lon' });
    }
    if (city && city.trim().length === 0) {
      return res.status(400).json({ error: 'City cannot be empty' });
    }
    const data = await getWeather({ city: city?.trim(), lat, lon });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;