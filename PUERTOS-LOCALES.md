# Puertos locales de Restaurante

| Servicio | Puerto |
|---|---:|
| Backend Express/TypeScript | 3007 |
| Frontend Next.js | 4007 |

## Arranque

Backend:

```powershell
cd backend
$env:PORT='3007'
$env:CORS_ORIGIN='http://localhost:4007'
$env:ALLOWED_ORIGINS='http://localhost:4007,http://localhost:3007'
npm run dev
```

Frontend:

```powershell
cd frontend
$env:NEXT_PUBLIC_API_URL='http://localhost:3007/api'
$env:NEXT_PUBLIC_WS_URL='ws://localhost:3007'
npx next dev -p 4007
```

Estos valores corresponden al desarrollo local y no reemplazan el Compose productivo.

