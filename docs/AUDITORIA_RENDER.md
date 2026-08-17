# Auditoria Render

Fecha: 2026-08-17

## Alcance

Esta auditoria se realizo primero sin acceso autenticado y luego con sesion interactiva del operador en Render. No se imprimieron secretos ni valores de variables.

## Evidencia local

`render.yaml` define:

```text
type: web
name: evaluacion-asertividad
runtime: node
plan: free
buildCommand: npm install
startCommand: npm start
autoDeploy: true
NODE_VERSION=20
STORAGE_DRIVER=supabase
SUPABASE_URL=sync:false
SUPABASE_ANON_KEY=sync:false
SUPABASE_SERVICE_ROLE_KEY=sync:false
SUPABASE_TABLE=survey_submissions
GOOGLE_CLIENT_ID=sync:false
ADMIN_USERNAME=sync:false
ADMIN_PASSWORD=sync:false
```

El nombre del servicio local (`evaluacion-asertividad`) no coincide con el dominio publico `sistemaspsicologicos.onrender.com`; por tanto no se debe asumir que produccion usa este Blueprint.

## Evidencia Dashboard Render

- Workspace: `Daniel's workspace`
- Project: `My project`
- Environment: `Production`
- Service Name: `SistemasPsicologicos`
- Service ID: `srv-d7cotuu7r5hc73crdihg`
- Service Type: Web Service
- Runtime: Node
- Plan: Free
- Region: Ohio (US East)
- Status: Deployed
- Domain: `https://sistemaspsicologicos.onrender.com`
- Repository: `DanielPalacios9806/SistemasPsicologicos`
- Branch: `main`
- Root Directory: vacio
- Build Command: `npm install`
- Pre-Deploy Command: vacio/no configurado
- Start Command: `npm start`
- Auto Deploy: On Commit
- PR Previews: Off
- Health Check Path: vacio
- Git credentials: usuario propietario conectado
- `render.yaml` local no parece ser Blueprint activo obligatorio, porque el servicio real se llama `SistemasPsicologicos` y el YAML local `evaluacion-asertividad`.

## Variables de entorno vistas en Render

Presentes, sin mostrar valores:

- `ADMIN_PASSWORD`
- `ADMIN_USERNAME`
- `GOOGLE_CLIENT_ID`
- `STORAGE_DRIVER`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

No visibles en Render:

- `SUPABASE_TABLE`
- `PORT`
- `NODE_VERSION`
- `APP_SESSION_SECRET`
- `PASSWORD_HASH_PEPPER`
- `NODE_ENV`

Render inyecta `PORT` en runtime aunque no aparezca como variable manual; los logs muestran puerto `10000`.

## Logs

Logs revisados el 2026-08-17:

```text
10:22:07 AM ==> Running 'npm start'
10:22:08 AM > evaluacion-multiinstrumento@1.0.0 start
10:22:08 AM > node server.js
10:22:08 AM Servidor iniciado en http://localhost:10000
10:22:08 AM Almacenamiento activo: supabase
```

No se observaron errores 5xx en los logs visibles.

## Evidencia publica de produccion

Dominio revisado:

```text
https://sistemaspsicologicos.onrender.com/
```

Resultados:

- `GET /`: HTTP 200, devuelve HTML de Mente de Acero.
- `GET /api/config`: HTTP 200 JSON, reporta `storageDriver=supabase`.
- `GET /api/instruments`: HTTP 200 JSON, lista EMA y Bar-On.
- `GET /api/health`: HTTP 200 pero devuelve HTML, no JSON.

Interpretacion:

- La produccion esta viva y sirve la app.
- La ruta `/api/health` implementada en el codigo local no esta disponible como API JSON en produccion publica. Puede ser un commit desplegado anterior o que la version desplegada no incluya esa ruta.
- No se observo 5xx en las rutas publicas probadas.

## Pendiente

- Determinar commit exacto desplegado: Events muestra `Build not found` y no hay eventos de los ultimos 90 dias visibles.
- Configurar `Health Check Path` cuando exista `/api/health` JSON real.
- Agregar variables futuras antes de activar autenticacion segura:
  - `APP_SESSION_SECRET`
  - `PASSWORD_HASH_PEPPER`
  - `NODE_ENV`
