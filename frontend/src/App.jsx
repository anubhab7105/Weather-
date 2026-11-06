import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { isFreshWeatherCache, weatherCacheKey } from './weather-cache';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function iconUrl(icon) {
  const safeIcon = /^[0-9]{2}[dn]$/.test(icon || '') ? icon : '01d';
  return 'https://openweathermap.org/img/wn/' + safeIcon + '@2x.png';
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function App() {
  const [input, setInput] = useState('London');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [usingSavedData, setUsingSavedData] = useState(false);
  const activeRequestRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  const loadWeather = useCallback(async (params) => {
    activeRequestRef.current?.abort();

    const controller = new AbortController();
    activeRequestRef.current = controller;
    const requestId = ++latestRequestIdRef.current;
    const cacheKey = weatherCacheKey(params);

    setLoading(true);
    setError(null);
    setData(null);
    setUsingSavedData(false);

    try {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(API_BASE + '/api/weather?' + query, {
        signal: controller.signal,
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.error || 'Weather request failed (' + response.status + ')');
      }
      if (!json || typeof json !== 'object' || !json.current || !Array.isArray(json.forecast)) {
        throw new Error('The weather service returned an invalid response');
      }
      if (requestId !== latestRequestIdRef.current) return;

      setData(json);

      if (cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            params,
            data: json,
            ts: Date.now(),
          }));
        } catch (_) {
          // Storage can be unavailable or full; the live response is still usable.
        }
      }
    } catch (requestError) {
      if (requestError.name === 'AbortError' || requestId !== latestRequestIdRef.current) return;

      const message = requestError.message || 'Failed to load weather';
      let savedEntry = null;

      if (cacheKey) {
        try {
          savedEntry = JSON.parse(localStorage.getItem(cacheKey) || 'null');
        } catch (_) {
          savedEntry = null;
        }
      }

      if (isFreshWeatherCache(savedEntry)) {
        setData(savedEntry.data);
        setUsingSavedData(true);
        setError(message + '. Showing saved weather for this location.');
      } else {
        setData(null);
        setError(message);
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
        activeRequestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    loadWeather({ city: 'London' });

    return () => {
      latestRequestIdRef.current += 1;
      activeRequestRef.current?.abort();
    };
  }, [loadWeather]);

  const handleSearch = (event) => {
    event.preventDefault();
    const city = input.trim();
    if (!city) {
      setError('Enter a city name to search');
      return;
    }
    loadWeather({ city });
  };

  const handleGeo = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        loadWeather({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (geoError) => {
        setGeoLoading(false);
        const message = geoError.code === 1
          ? 'Location permission was denied'
          : geoError.code === 3
            ? 'Location request timed out'
            : 'Unable to determine your location';
        setError(message);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌤 Weather Forecast</h1>
        <p className="subtitle">Current conditions and upcoming forecast</p>
      </header>

      <form className="search" onSubmit={handleSearch}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Enter city name..."
          aria-label="City name"
          maxLength={100}
        />
        <button type="submit" disabled={loading || geoLoading}>Search</button>
        <button
          type="button"
          onClick={handleGeo}
          disabled={geoLoading || loading}
          className="geo"
        >
          {geoLoading ? 'Locating…' : '📍 My Location'}
        </button>
      </form>

      {error && <div className="error" role="alert" aria-live="polite">⚠ {error}</div>}
      {loading && <div className="loading" role="status" aria-live="polite">Loading weather…</div>}

      {data && (
        <main className="content">
          <section className="current" aria-labelledby="current-weather-heading">
            <div className="current-left">
              <h2 id="current-weather-heading">
                {data.city}{data.country ? ', ' + data.country : ''}
              </h2>
              <div className="temp-row">
                <img src={iconUrl(data.current.icon)} alt={data.current.description || 'Weather'} />
                <span className="temp">{Math.round(data.current.temp)}°C</span>
              </div>
              <p className="desc">{data.current.description}</p>
              {data.source && (
                <p className="meta">
                  Source: {data.source}
                  {data.cached ? ' (server cache)' : ''}
                  {usingSavedData ? ' (saved result)' : ''}
                </p>
              )}
            </div>
            <div className="current-right">
              <ul className="details">
                <li><span>Feels like</span><strong>{Math.round(data.current.feelsLike)}°C</strong></li>
                <li><span>Humidity</span><strong>{data.current.humidity}%</strong></li>
                <li><span>Wind</span><strong>{data.current.windSpeed} m/s</strong></li>
                <li><span>Pressure</span><strong>{data.current.pressure} hPa</strong></li>
                {data.current.visibility != null && (
                  <li><span>Visibility</span><strong>{(data.current.visibility / 1000).toFixed(1)} km</strong></li>
                )}
              </ul>
            </div>
          </section>

          <section className="forecast" aria-labelledby="forecast-heading">
            <h3 id="forecast-heading">Upcoming Forecast ({data.forecast.length} days)</h3>
            {data.forecast.length > 0 ? (
              <div className="forecast-grid">
                {data.forecast.map((forecast) => (
                  <div className="forecast-card" key={forecast.date}>
                    <div className="f-date">{formatDate(forecast.date)}</div>
                    <img src={iconUrl(forecast.icon)} alt={forecast.description || 'Weather'} />
                    <div className="f-temps">
                      <span className="max">{Math.round(forecast.tempMax)}°</span>
                      <span className="min">{Math.round(forecast.tempMin)}°</span>
                    </div>
                    <div className="f-desc">{forecast.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="meta">No upcoming forecast data is available.</p>
            )}
          </section>
        </main>
      )}

      <footer className="footer">
        <small>
          Live weather requires OPENWEATHER_API_KEY on the backend. Demo data is only
          enabled when WEATHER_DEMO_MODE=true.
        </small>
      </footer>
    </div>
  );
}
