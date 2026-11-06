const { HttpError } = require('../errors/http-error');

function parseWeatherQuery(query) {
  const cityProvided = query.city !== undefined;
  const latitudeProvided = query.lat !== undefined;
  const longitudeProvided = query.lon !== undefined;

  if (cityProvided) {
    if (latitudeProvided || longitudeProvided) {
      throw new HttpError(400, 'Provide either a city or coordinates, not both', 'INVALID_QUERY');
    }

    if (typeof query.city !== 'string') {
      throw new HttpError(400, 'City must be a single string', 'INVALID_CITY');
    }

    const city = query.city.trim();
    if (!city) {
      throw new HttpError(400, 'City cannot be empty', 'INVALID_CITY');
    }
    if (city.length > 100) {
      throw new HttpError(400, 'City name must be 100 characters or fewer', 'INVALID_CITY');
    }

    return { city };
  }

  if (!latitudeProvided && !longitudeProvided) {
    throw new HttpError(400, 'Provide a city or both latitude and longitude', 'MISSING_LOCATION');
  }

  if (!latitudeProvided || !longitudeProvided) {
    throw new HttpError(400, 'Both latitude and longitude are required', 'INCOMPLETE_COORDINATES');
  }

  if (typeof query.lat !== 'string' || typeof query.lon !== 'string' ||
      query.lat.trim() === '' || query.lon.trim() === '') {
    throw new HttpError(400, 'Latitude and longitude must be valid numbers', 'INVALID_COORDINATES');
  }

  const lat = Number(query.lat);
  const lon = Number(query.lon);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new HttpError(400, 'Latitude must be a number between -90 and 90', 'INVALID_LATITUDE');
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new HttpError(400, 'Longitude must be a number between -180 and 180', 'INVALID_LONGITUDE');
  }

  return { lat, lon };
}

module.exports = { parseWeatherQuery };
