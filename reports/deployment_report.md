# Deployment report

Fecha: 2026-08-17

## Git

- Rama de trabajo empujada: `feature/auth-disc-personal-militar`
- Commit desplegado en `main`: `3abedce3c21c1cab6d48e702c0386d291d52d009`
- Mensaje: `feat: add personnel auth assignments and secure import`

## Supabase

Migraciones ejecutadas desde SQL Editor.

Importacion real ejecutada:

```json
{
  "personas_procesadas": 6007,
  "personas_creadas": 0,
  "personas_actualizadas": 6007,
  "cuentas_creadas": 5862,
  "cuentas_ya_existentes": 145,
  "baron_asignados": 6007,
  "ema_asignados": 6007,
  "disc_asignados": 1504,
  "registros_excluidos": 366,
  "errores": 0
}
```

Conteos post-import:

- `people`: 6015
- `personnel_profiles`: 6007
- `user_accounts`: 6007
- `assessment_campaigns`: 1
- `assessment_assignments`: 13518

## Render

Manual Deploy ejecutado por incidencia visible de GitHub deploys.

Resultado:

- Estado: live
- Hora visible en Render: 11:36:41
- URL: `https://sistemaspsicologicos.onrender.com`

## Validacion publica

```text
GET /health       200 application/json
GET /login.html   200 text/html
GET /api/instruments 200 application/json
```

`/health` respondio:

```json
{
  "status": "ok",
  "version": "3abedce3c21c1cab6d48e702c0386d291d52d009",
  "commit": "3abedce3c21c1cab6d48e702c0386d291d52d009",
  "storage": "supabase"
}
```

## Pendientes

- Agregar `APP_SESSION_SECRET`, `PASSWORD_HASH_PEPPER`, `NODE_ENV=production` en Render.
- Configurar Health Check Path `/health` en Render.
- Completar transcripcion auditable de DISC antes de activar scoring.
