# Auditoria Supabase

Fecha: 2026-08-17

## Alcance

Se inspecciono configuracion local y se intento consultar Supabase usando credenciales locales sin imprimir valores secretos ni datos individuales.

## Configuracion local

Variables Supabase presentes en `.env` local:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_TABLE`

El host publico configurado en `.env` local es:

```text
qridloesomdlhpekxfyf.supabase.co
```

## Resultado de conexion y dashboard

Intentos contra REST Supabase:

Primer intento:

- OpenAPI REST: fallo de conexion.
- Tablas principales: fallo de DNS/conexion.

PowerShell reporto:

```text
Host desconocido: qridloesomdlhpekxfyf.supabase.co:443
```

Reintento posterior:

- DNS resuelve `qridloesomdlhpekxfyf.supabase.co`.
- DNS resuelve `db.qridloesomdlhpekxfyf.supabase.co`.
- REST Supabase responde, pero las credenciales locales reciben `401 Unauthorized` para:
  - `survey_submissions`
  - `people`
  - `applications`
  - `responses`
  - `partial_results`
  - `final_results`

Interpretacion: el proyecto existe/resuelve, pero la clave local no autoriza acceso REST. Puede ser clave vencida/incorrecta, proyecto pausado con credenciales no validables en este momento, o diferencia entre `.env` local y las variables reales de Render.

Con sesion interactiva del operador se confirmo en Supabase Dashboard:

- Organization: `DanielPalacios9806's Org`
- Project: `DanielPalacios9806's Project`
- Project ref: `qridloesomdlhpekxfyf`
- Branch: `main`
- Environment: `Production`
- Plan: Free
- Esquema revisado: `public`

## Tablas reales visibles en Dashboard

| tabla | columnas | filas estimadas | tamano estimado | realtime |
|---|---:|---:|---:|---|
| `applications` | 14 | 0 | 4184 kB | Disabled |
| `final_results` | 9 | 0 | 2976 kB | Disabled |
| `partial_results` | 11 | 0 | 6136 kB | Disabled |
| `people` | 10 | 0 | 88 kB | Disabled |
| `responses` | 9 | 0 | 8920 kB | Disabled |
| `survey_submissions` | 13 | 0 | 40 kB | Disabled |

El dashboard reporta 6 tablas y todas con 0 filas estimadas.

## Esquema local esperado

`supabase/schema.sql` define:

### `survey_submissions`

- `id text primary key`
- `created_at timestamptz`
- `id_number text unique not null`
- `full_name text not null`
- `career text not null`
- `age text not null`
- `gender text not null`
- `email text`
- `google_id text`
- `picture text`
- `participant jsonb not null`
- `answers jsonb not null`
- `scoring jsonb not null`

Indices:

- `survey_submissions_created_at_idx`
- `survey_submissions_career_idx`

### `people`

- `id text primary key default gen_random_uuid()::text`
- `created_at timestamptz`
- `id_number text unique not null`
- `full_name text not null`
- `age text not null`
- `gender text not null`
- `career text not null`
- `email text`
- `google_id text`
- `picture text`

### `applications`

- `id text primary key`
- `created_at timestamptz`
- `person_id text references people(id) on delete cascade`
- `instrument_code text not null`
- `instrument_name text not null`
- `instrument_version text not null`
- `status text not null`
- `current_module_key text`
- `percentage_complete numeric(5,2)`
- `valid boolean`
- `started_at timestamptz`
- `completed_at timestamptz`
- `participant_snapshot jsonb`
- `scoring_snapshot jsonb`

Indices:

- `applications_person_idx`
- `applications_status_idx`

### `responses`

- `id text primary key`
- `created_at timestamptz`
- `application_id text references applications(id) on delete cascade`
- `item_id integer not null`
- `response integer not null`
- `adjusted_response integer`
- `module_key text`
- `component_key text`
- `subcomponent_keys jsonb`

Indice unico:

- `responses_application_item_uidx` sobre `(application_id, item_id)`

### `partial_results`

- `id text primary key`
- `created_at timestamptz`
- `application_id text references applications(id) on delete cascade`
- `scope_type text not null`
- `scope_key text not null`
- `scope_label text not null`
- `raw_score numeric`
- `normalized_score numeric`
- `category text`
- `completion_ratio numeric`
- `detail_json jsonb`

Indice:

- `partial_results_application_idx`

### `final_results`

- `id text primary key`
- `created_at timestamptz`
- `application_id text unique references applications(id) on delete cascade`
- `total_raw numeric`
- `total_normalized numeric`
- `profile_global text`
- `valid boolean`
- `interpretation_json jsonb`
- `detail_json jsonb`

## Diagrama logico

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

## Pendiente de confirmar contra base real

No se pudo confirmar en la base real:

- Tablas existentes.
- Columnas reales.
- Tipos reales.
- PK/FK reales.
- Indices reales.
- Constraints reales.
- Policies y RLS.
- Conteos reales.
- Diferencias reales entre `supabase/schema.sql` y produccion.

## Riesgo de seguridad a verificar

Se verifico en Supabase Dashboard que RLS esta deshabilitado en todas las tablas reales:

- `applications`: RLS Disabled, no policies.
- `final_results`: RLS Disabled, no policies.
- `partial_results`: RLS Disabled, no policies.
- `people`: RLS Disabled, no policies.
- `responses`: RLS Disabled, no policies.
- `survey_submissions`: RLS Disabled, no policies.

Supabase muestra advertencia: las tablas pueden ser accedidas por cualquiera via Data API cuando RLS esta deshabilitado.

Antes de importar datos reales debe evitarse cualquier exposicion publica. Debe habilitarse RLS y/o retirar el uso de anon key para acceso directo a tablas sensibles desde navegador.

Ademas debe evitarse cualquier policy publica equivalente a:

```sql
USING (true)
```

para lectura anonima de:

- `people`
- `applications`
- `responses`
- `partial_results`
- `final_results`
- futuras tablas de cuentas/asignaciones

## Bloqueo / decision operativa

La auditoria por dashboard confirma que las tablas estan vacias, pero la conexion tecnica local para backup SQL sigue bloqueada por credenciales REST `401 Unauthorized`.

Antes de ejecutar SQL destructivo o migraciones reales se requiere:

- Backup verificable o confirmacion documentada de que no hay datos que preservar porque las tablas reales estan en 0 filas.
- Credenciales validas para backup/migracion desde CLI o ejecucion SQL controlada desde dashboard.
- Migracion RLS antes de importar personal.

No se deben ejecutar migraciones ni importaciones reales hasta confirmar el proyecto productivo.

El usuario autorizo considerar operaciones destructivas despues de sacar respaldo. Criterio operativo: no ejecutar `DROP` ni cambios destructivos hasta tener un respaldo verificable y conteos previos/posteriores.
