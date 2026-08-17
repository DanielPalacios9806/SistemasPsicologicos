# Render y APIs - validacion

Fecha: 2026-08-17

## Render Dashboard

- Servicio: `SistemasPsicologicos`
- ID: `srv-d7cotuu7r5hc73crdihg`
- Tipo: Web Service
- Runtime: Node
- Region: Ohio (US East)
- Plan: Free
- Repo: `DanielPalacios9806/SistemasPsicologicos`
- Branch: `main`
- Root Directory: vacio
- Build Command: `npm install`
- Start Command: `npm start`
- Auto Deploy: On Commit
- Health Check Path: vacio
- Dominio: `https://sistemaspsicologicos.onrender.com`

## Variables presentes

- `ADMIN_PASSWORD`
- `ADMIN_USERNAME`
- `GOOGLE_CLIENT_ID`
- `STORAGE_DRIVER`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

## Variables faltantes para la version nueva

- `APP_SESSION_SECRET`
- `PASSWORD_HASH_PEPPER`
- `NODE_ENV`

## Logs visibles

```text
Running 'npm start'
node server.js
Servidor iniciado en http://localhost:10000
Almacenamiento activo: supabase
```

## APIs publicas probadas

| endpoint | estado | resultado |
|---|---:|---|
| `/api/config` | 200 | JSON OK, `storageDriver=supabase` |
| `/api/instruments` | 200 | JSON OK, lista EMA y Bar-On |
| `/api/health` | 200 | Devuelve HTML, no JSON |

## Observaciones

- Produccion esta activa.
- El servicio usa Supabase.
- No hay health check configurado en Render.
- `/api/health` debe corregirse/desplegarse antes de usarlo como health check.
- Render muestra alerta de posible incidencia de GitHub para deploys desde repositorios.
