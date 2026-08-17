# Auditoria de estado actual

Fecha: 2026-08-17

## Alcance

Esta auditoria distingue instrucciones del usuario de los documentos adjuntos. Los PDFs, Excel e imagen se tratan como referencias. La solicitud operativa esta en el texto pegado y ordena iniciar solo con Fase 0 a Fase 3.

## Estado Git inicial

- Repositorio remoto: `https://github.com/DanielPalacios9806/SistemasPsicologicos.git`
- Rama inicial: `main`
- `git pull --ff-only`: actualizado, sin cambios remotos pendientes.
- SHA inicial documentado: `9f9068d8e71f3a5546a755755b1323df377d9353`
- Rama creada: `feature/auth-disc-personal-militar`
- Estado previo no rastreado preservado: varios archivos Excel/NDJSON locales ya existian antes de esta auditoria.

## Estructura del repositorio

```text
.
|-- server.js
|-- package.json
|-- package-lock.json
|-- render.yaml
|-- README.md
|-- PLAN_BARON_IMPLEMENTACION.md
|-- data/
|   |-- ema_submissions.json
|   `-- instrument_store.json
|-- lib/
|   |-- env.js
|   |-- exportExcel.js
|   |-- instrument.js
|   |-- interpretation.js
|   |-- scoring.js
|   |-- storage.js
|   |-- instruments/
|   |   |-- baron.js
|   |   |-- ema.js
|   |   `-- index.js
|   |-- interpretation/
|   |   `-- baronInterpretation.js
|   `-- scoring/
|       |-- baronScoring.js
|       `-- index.js
|-- public/
|   |-- index.html
|   |-- app.js
|   |-- admin.html
|   |-- admin.js
|   |-- styles.css
|   `-- assets visuales
`-- supabase/
    `-- schema.sql
```

## Aplicacion actual

La aplicacion es Node.js sin framework HTTP externo. `server.js` usa `http.createServer`, sirve archivos estaticos desde `public/` y expone APIs JSON.

`package.json` solo define:

```json
{
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
```

No hay script de pruebas definido actualmente.

## Variables de entorno

`lib/env.js` carga `.env` local si existe. Variables actuales reconocidas:

- `PORT`
- `GOOGLE_CLIENT_ID`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `STORAGE_DRIVER`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Variables presentes en `.env` local, sin imprimir valores:

- `ADMIN_PASSWORD`
- `ADMIN_USERNAME`
- `GOOGLE_CLIENT_ID`
- `PORT`
- `STORAGE_DRIVER`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_TABLE`
- `SUPABASE_URL`

Variables solicitadas para el futuro y aun no presentes localmente:

- `APP_SESSION_SECRET`
- `PASSWORD_HASH_PEPPER`
- `NODE_ENV`

## Rutas HTTP actuales

Publicas:

- `GET /`
- `GET /api/config`
- `GET /api/health`
- `GET /api/instruments`
- `GET /api/instruments/:code`
- `GET /api/instrument`
- `GET /api/check-id/:idNumber`
- `POST /api/auth/google`
- `POST /api/applications/start`
- `GET /api/applications/resume`
- `POST /api/applications/:id/answers`
- `GET /api/applications/:id`
- `GET /api/results`
- `GET /api/submissions`
- `GET /api/submissions/:idNumber`

Administrativas:

- `POST /api/admin/login`
- `GET /api/admin/applications`
- `GET /api/admin/applications/:id`
- `GET /api/export/excel`

La proteccion administrativa actual usa un token en memoria (`adminTokens`) enviado por header `x-admin-token`. El frontend admin guarda el token en `sessionStorage`.

## Frontend

- `public/index.html` contiene flujo publico: bienvenida, seleccion de instrumento, modulos, preguntas y resultado.
- `public/app.js` consume `/api/instruments`, inicia aplicaciones y guarda respuestas por `/api/applications/:id/answers`.
- `public/admin.html` y `public/admin.js` contienen login administrativo, filtros por cedula/instrumento/estado, vista de resultados y exportacion Excel.

No existe portal de participante autenticado por cedula. La persona se identifica en el formulario publico con cedula y datos demograficos.

## Login actual

- Admin: `ADMIN_USERNAME` + `ADMIN_PASSWORD`, token aleatorio en memoria.
- Participante: no hay login propio. Puede iniciar/reanudar por cedula e instrumento.
- Google: `/api/auth/google` solo valida token de Google y devuelve payload; no crea sesion segura.

Riesgo: una cedula puede consultarse desde endpoints publicos sin sesion individual.

## Instrumentos actuales

### EMA

- Definicion base en `lib/instrument.js`.
- Adaptador en `lib/instruments/ema.js`.
- Scoring en `lib/scoring.js`.
- Interpretacion en `lib/interpretation.js`.
- 45 reactivos, respuesta 1 a 5.

### Bar-On ICE

- Definicion en `lib/instruments/baron.js`.
- Scoring en `lib/scoring/baronScoring.js`.
- Interpretacion en `lib/interpretation/baronInterpretation.js`.
- 133 items, componentes/subcomponentes y validez.

### DISC

No esta implementado.

## Modelo de instrumentos

Existe una arquitectura parcial:

```text
lib/instruments/index.js
  ema -> lib/instruments/ema.js
  baron -> lib/instruments/baron.js

lib/scoring/index.js
  ema -> lib/scoring.js
  baron -> lib/scoring/baronScoring.js
```

Esto permite agregar DISC sin reescribir todo, pero conviene completar el contrato versionado por instrumento.

## Flujo de evaluacion

1. Frontend carga configuracion e instrumentos.
2. Participante introduce datos.
3. Frontend envia `POST /api/applications/start`.
4. Backend normaliza participante, crea/actualiza `people`, crea `applications`.
5. Las respuestas se guardan con `POST /api/applications/:id/answers`.
6. Backend recalcula scoring y progreso en cada guardado.
7. Al completar, crea/actualiza `final_results`.
8. Admin consulta y exporta.

## Guardado de progreso

El progreso se calcula por cantidad de respuestas contestadas contra total de items. En Supabase se reemplazan respuestas y resultados parciales por aplicacion al guardar progreso. En almacenamiento local se actualiza `data/instrument_store.json`.

## Identificacion de persona

`people.id_number` es el identificador humano unico. La version heredada EMA usa `survey_submissions.id_number`.

## Resultado

El resultado se obtiene desde el scoring snapshot de la aplicacion y/o `final_results`. En el modelo moderno:

- `applications.scoring_snapshot`
- `partial_results`
- `final_results`

En legado EMA:

- `survey_submissions.scoring`

## Almacenamiento

`lib/storage.js` soporta:

- Supabase, si `STORAGE_DRIVER=supabase` o hay configuracion Supabase.
- Local JSON si no hay Supabase.
- Lectura de compatibilidad desde `survey_submissions`.

## Modelo local

`data/instrument_store.json` contiene:

```json
{
  "people": [],
  "applications": [],
  "responses": [],
  "partialResults": [],
  "finalResults": []
}
```

`data/ema_submissions.json` conserva legado EMA local.

## Modelo Supabase local esperado

`supabase/schema.sql` define:

- `survey_submissions`
- `people`
- `applications`
- `responses`
- `partial_results`
- `final_results`

Diagrama logico:

```text
people
   |
   +---- applications
              |
              +---- responses
              |
              +---- partial_results
              |
              +---- final_results
```

## Compatibilidad legada

`listApplications` combina aplicaciones modernas con filas legadas EMA cuando corresponde. `startApplication` evita duplicar EMA si ya existe en legado. Esto debe conservarse.

## Problemas principales encontrados

- No hay autenticacion individual de participantes.
- Endpoints publicos permiten consulta por cedula.
- Admin token vive en memoria y se guarda en `sessionStorage`.
- No hay rate limit ni bloqueo de login.
- No hay pruebas automatizadas declaradas.
- `GET /api/health` existe localmente, pero produccion publica parece no exponerlo como JSON.
- DISC no existe.
- `applications` representa evaluaciones iniciadas, no asignaciones pendientes.
- No existe capa de campañas/asignaciones.

