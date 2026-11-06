import { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function iconUrl(icon) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function App() {
  const [query, setQuery] = useState('London');
  const [input, setInput] = useState('London');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const loadWeather = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/api/weather?${qs}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }
      setData(json);
      try {
        localStorage.setItem('lastWeather', JSON.stringify({ params, data: json, ts: Date.now() }));
      } catch (_) { /* ignore */ }
    } catch (err) {
      setError(err.message || 'Failed to load weather');
      // Fallback to cached
      try {
        const cached = JSON.parse(localStorage.getItem('lastWeather') || 'null');
        if (cached?.data) setData(cached.data);
      } catch (_) { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather({ city: 'London' });
  }, [loadWeather]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setQuery(input.trim());
    loadWeather({ city: input.trim() });
  };

  const handleGeo = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        loadWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        setGeoLoading(false);
        setError(err.message || 'Unable to get location');
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌤 Weather Forecast</h1>
        <p className="subtitle">Powered by OpenWeatherMap via secure backend proxy</p>
      </header>

      <form className="search" onSubmit={handleSearch}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter city name..."
          aria-label="City name"
        />
        <button type="submit" disabled={loading}>Search</button>
        <button type="button" onClick={handleGeo} disabled={geoLoading || loading} className="geo">
          {geoLoading ? 'Locating…' : '📍 My Location'}
        </button>
      </form>

      {error && <div className="error">⚠ {error}</div>}

      {loading && !data && <div className="loading">Loading weather…</div>}

      {data && (
        <main className="content">
          <section className="current">
            <div className="current-left">
              <h2>
                {data.city}{data.country ? `, ${data.country}` : ''}
              </h2>
              <div className="temp-row">
                <img src={iconUrl(data.current.icon)} alt={data.current.description} />
                <span className="temp">{Math.round(data.current.temp)}°C</span>
              </div>
              <p className="desc">{data.current.description}</p>
              {data.source && (
                <p className="meta">
                  Source: {data.source}{data.cached ? ' (cached)' : ''}
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

          <section className="forecast">
            <h3>5-Day Forecast</h3>
            <div className="forecast-grid">
              {data.forecast.map((f) => (
                <div className="forecast-card" key={f.date}>
                  <div className="f-date">{formatDate(f.date)}</div>
                  <img src={iconUrl(f.icon)} alt={f.description} />
                  <div className="f-temps">
                    <span className="max">{Math.round(f.tempMax)}°</span>
                    <span className="min">{Math.round(f.tempMin)}°</span>
                  </div>
                  <div className="f-desc">{f.description}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        <small>Tip: set OPENWEATHER_API_KEY in backend/.env for live data. Without it, demo (mock) data is shown.</small>
      </footer>
    </div>
  );
}