export const WEATHER_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export function weatherCacheKey(params) {
  if (typeof params?.city === 'string') {
    const city = params.city.trim().toLocaleLowerCase();
    return city ? 'weather:v1:city:' + city : null;
  }

  const lat = Number(params?.lat);
  const lon = Number(params?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  // Geolocation can vary by a few decimal places between requests.
  return 'weather:v1:coords:' + lat.toFixed(5) + ':' + lon.toFixed(5);
}

export function isFreshWeatherCache(entry, now = Date.now(), maxAge = WEATHER_CACHE_MAX_AGE_MS) {
  return Boolean(
    entry &&
    typeof entry === 'object' &&
    entry.data &&
    typeof entry.data === 'object' &&
    Number.isFinite(entry.ts) &&
    entry.ts <= now &&
    now - entry.ts <= maxAge
  );
}
