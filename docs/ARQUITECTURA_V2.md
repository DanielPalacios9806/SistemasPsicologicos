# Arquitectura V2

## Estado implementado

La V2 agrega una capa de autenticacion y asignaciones sin reemplazar `people`, `applications`, `responses`, `partial_results` ni `final_results`.

```text
login.html / portal.html / index.html
        |
        v
server.js
        |
        +-- lib/auth/password.js
        +-- lib/auth/session.js
        +-- lib/personnel/*
        +-- lib/storage.js
        |
        v
Supabase service role backend
```

## Flujo participante

```text
POST /api/auth/login
  -> cookie HttpOnly
  -> must_change_password?
      -> POST /api/auth/change-password
      -> portal
  -> GET /api/auth/me
  -> portal asignaciones
  -> POST /api/applications/start
  -> POST /api/applications/:id/answers
```

## Principios

- El navegador no recibe `SUPABASE_SERVICE_ROLE_KEY`.
- El backend accede a Supabase con service role.
- `people.id_number` sigue siendo el identificador de persona.
- `applications` sigue representando evaluaciones iniciadas.
- `assessment_assignments` representa obligaciones pendientes.
- EMA/Bar-On no fueron reescritos.

