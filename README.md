# Weather Forecast Application

Full-stack weather app: React.js frontend, Node.js/Express backend, OpenWeatherMap API.

## Features
- External API integration with async/await
- Backend proxy for API key security
- Error handling and fallback (mock data + cached last result)
- Dynamic UI updates
- Environment-based configuration
- Optional caching (node-cache on backend, localStorage on frontend)

## Structure
```
backend/   Express API proxy
frontend/  React (Vite) client
```

## Setup

### Backend
```bash
cd backend
cp .env.example .env
# add OPENWEATHER_API_KEY (optional; mock data used if empty)
npm install
npm run dev
```
Runs on http://localhost:5000

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Runs on http://localhost:5173 (proxies /api to backend)

## API
- `GET /api/health`
- `GET /api/weather?city=London`
- `GET /api/weather?lat=..&lon=..`

## Environment
See `.env.example` files.