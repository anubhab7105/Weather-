# Weather Forecast Application

A full-stack weather application built with React, Vite, Node.js, and Express. The backend proxies OpenWeatherMap requests so the API key is never exposed in the browser.

## Features

- Current weather by city or browser geolocation
- Upcoming daily forecast, grouped using the location's timezone
- Backend response caching and location-specific browser fallback
- Request cancellation to prevent older searches overwriting newer results
- Validated city and coordinate inputs
- Explicit demo mode for local development
- Automated backend/frontend tests and CI checks

## Project structure

```
backend/    Express API, provider integration, validation, and tests
frontend/   React + Vite user interface and browser cache tests
.github/    GitHub Actions CI
```

## Requirements

- Node.js 22 or newer
- npm
- An OpenWeatherMap API key for live weather

## Local setup

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Set `OPENWEATHER_API_KEY` in `backend/.env`, then install and start the API:

```bash
npm ci
npm run dev
```

The API runs at `http://localhost:5000`.

For a local UI-only demo without an API key, explicitly set `WEATHER_DEMO_MODE=true` in `backend/.env`. Demo values are fabricated and must not be used as live weather.

### 2. Frontend

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Vite runs at `http://localhost:5173` and proxies `/api` requests to the backend.

For a separately hosted backend, set `VITE_API_BASE_URL` in `frontend/.env` to its base URL. Do not put the OpenWeatherMap API key in frontend environment variables.

## Environment variables

| Variable | Default | Description |
|---|---:|---|
| `OPENWEATHER_API_KEY` | empty | OpenWeatherMap API key |
| `WEATHER_DEMO_MODE` | `false` | Enables clearly identified fabricated demo data only when no API key is configured |
| `PORT` | `5000` | Backend port |
| `CACHE_TTL_SECONDS` | `600` | Server weather cache lifetime |
| `CORS_ORIGIN` | `*` | Wildcard or comma-separated exact frontend origins |
| `REQUEST_TIMEOUT_MS` | `8000` | Provider request timeout |
| `VITE_API_BASE_URL` | empty | Optional backend base URL for the frontend |

For production, set `CORS_ORIGIN` to the exact deployed frontend origin(s), for example:

```env
CORS_ORIGIN=https://weather.example.com
WEATHER_DEMO_MODE=false
```

## API

- `GET /api/health`
- `GET /api/weather?city=Kolkata`
- `GET /api/weather?lat=22.5726&lon=88.3639`

Provide either a city or both coordinates. Coordinates are validated against latitude `[-90, 90]` and longitude `[-180, 180]`. Invalid locations return a 400 response; unknown locations return 404; provider availability/configuration errors return an appropriate 5xx response. Failed provider responses are never cached as successful weather.

The forecast contains up to five upcoming local calendar days. The current partial day is excluded; the number of available days depends on the provider's forecast window.

## Tests and quality checks

Run backend tests:

```bash
cd backend
npm test
```

Run frontend tests, lint, and production build:

```bash
cd frontend
npm test
npm run lint
npm run build
```

GitHub Actions runs these checks for pushes and pull requests targeting `main`.
