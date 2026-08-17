# Deploy Render

## Configuracion real auditada

- Servicio: `SistemasPsicologicos`
- Repo: `DanielPalacios9806/SistemasPsicologicos`
- Branch: `main`
- Build Command: `npm install`
- Start Command: `npm start`
- Auto Deploy: On Commit

## Variables a agregar

- `APP_SESSION_SECRET`
- `PASSWORD_HASH_PEPPER`
- `NODE_ENV=production`

## Health

La version local responde:

```http
GET /health
GET /api/health
```

con:

```json
{
  "status": "ok",
  "storage": "supabase",
  "version": "...",
  "commit": "..."
}
```

Despues del deploy configurar `Health Check Path` como `/health`.

