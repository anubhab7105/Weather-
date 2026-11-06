# Weather Forecast frontend

React 19 + Vite client for the Weather Forecast API.

## Development

```bash
npm ci
npm run dev
```

By default, Vite proxies `/api` to `http://localhost:5000`. Start the backend separately. For a separately hosted API, set `VITE_API_BASE_URL` to its base URL in `.env`.

## Checks

```bash
npm test
npm run lint
npm run build
```

The browser stores successful responses under a location-specific cache key. A saved response is only used for the same city or rounded coordinates and expires after six hours. A saved-result notice is shown when it is used.
