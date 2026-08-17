# Plan de implementacion

Fecha: 2026-08-17

## Estado

Plan preliminar generado despues de Fase 0 a Fase 3. No se ha modificado codigo de aplicacion ni base de datos.

## Bloqueos antes de tocar produccion

- Render Dashboard no auditado por falta de sesion autenticada.
- Supabase real no confirmado: el host local no resuelve y Render podria usar otro proyecto.
- RLS/policies reales no auditadas.
- Conteos reales de produccion no auditados.

## Fase 4: clasificacion final de personal

- Objetivo: cerrar reglas de grados/promociones y validar excepciones.
- Archivos afectados: `docs/REGLAS_ASIGNACION_PERSONAL.md`, `scripts/import_personal.js`.
- Tablas afectadas: ninguna.
- Riesgo: MEDIO.
- Rollback: revertir script/documentacion.
- Pruebas: fixtures de grados y promociones.
- Criterio de aceptacion: totales validados por responsable funcional.

## Fase 5-6: cuentas y sesiones

- Objetivo: agregar autenticacion individual por cedula y cambio obligatorio de clave.
- Archivos afectados: `server.js`, `lib/auth/*`, `public/*`, docs.
- Tablas afectadas: `user_accounts`, posibles `sessions` si se decide persistir sesiones.
- Riesgo: ALTO.
- Rollback: desactivar rutas nuevas y mantener admin actual.
- Pruebas: login correcto/incorrecto, password temporal, cambio obligatorio, rutas protegidas.
- Criterio de aceptacion: usuario solo accede a su informacion y no puede abrir instrumentos sin asignacion.

## Fase 7-8: importador y asignaciones

- Objetivo: importar personal de forma idempotente y crear campana/asignaciones.
- Archivos afectados: `scripts/import_personal.js`, `lib/personnel/*`, `lib/assignments/*`.
- Tablas afectadas: `people`, `personnel_profiles`, `assessment_campaigns`, `assessment_assignments`, `user_accounts`.
- Riesgo: ALTO.
- Rollback: migraciones no destructivas con scripts de desactivacion documentados; no borrar datos.
- Pruebas: dry-run, duplicados, cedulas, asignaciones por grado/promocion.
- Criterio de aceptacion: no duplicar personas ni resetear cuentas existentes sin flag explicito.

## Fase 9-10: DISC y versionado

- Objetivo: implementar DISC con 28 grupos, MAS/MENOS y scoring deterministico desde manuales.
- Archivos afectados: `lib/instruments/disc/*`, `lib/scoring/disc*`, `public/app.js`, `public/styles.css`, `tests/disc-scoring.test.js`.
- Tablas afectadas: `applications`, `responses`, `partial_results`, `final_results`; posible metadato de version.
- Riesgo: ALTO.
- Rollback: retirar DISC de registry sin tocar EMA/Bar-On.
- Pruebas: fixtures del manual, validacion MAS/MENOS, reanudacion y finalizacion.
- Criterio de aceptacion: scoring coincide con manual y DISC no usa aprobado/reprobado.

## Fase 11-12: admin y reportes

- Objetivo: panel de personal/cuentas/progreso y exportaciones seguras.
- Archivos afectados: `public/admin.*`, `server.js`, `lib/exportExcel.js`.
- Tablas afectadas: `user_accounts`, `assessment_assignments`, tablas de resultados.
- Riesgo: ALTO.
- Rollback: mantener admin actual y ocultar acciones nuevas.
- Pruebas: filtros, reset, desbloqueo, exportaciones sin secretos.
- Criterio de aceptacion: admin ve progreso y no exporta hashes, salts ni secretos.

## Fase 13-14: migraciones y RLS

- Objetivo: migraciones no destructivas y privacidad.
- Archivos afectados: `supabase/migrations/*.sql`, `docs/MIGRACIONES.md`.
- Tablas afectadas: todas las sensibles.
- Riesgo: ALTO.
- Rollback: documentado por migracion; preferir desactivar/revocar antes que borrar.
- Pruebas: revision SQL, entorno staging, usuario A no lee usuario B.
- Criterio de aceptacion: no hay SELECT publico anonimo sobre resultados psicologicos.

## Fase 15-18: pruebas, health y deploy

- Objetivo: suite automatizada, health real y procedimiento Render.
- Archivos afectados: `tests/*`, `server.js`, `docs/DEPLOY_RENDER.md`.
- Tablas afectadas: ninguna directa.
- Riesgo: ALTO para deploy, MEDIO para health.
- Rollback: revert de rama o redeploy del commit previo.
- Pruebas: `npm test`, import dry-run, migracion dry-run, regresion EMA/Bar-On.
- Criterio de aceptacion: produccion HTTP 200 y `/api/health` JSON sin secretos.

## Migraciones SQL propuestas

Orden preliminar:

```text
001_baseline.sql
002_personnel_profiles.sql
003_user_accounts.sql
004_assessment_campaigns.sql
005_assessment_assignments.sql
006_disc_support.sql
007_security_rls.sql
```

Todas deben ser no destructivas y revisables.

## Archivos a modificar en implementacion

Previstos:

- `server.js`
- `lib/env.js`
- `lib/storage.js`
- `lib/instruments/index.js`
- `lib/instruments/disc/*`
- `lib/scoring/index.js`
- `lib/scoring/discScoring.js`
- `lib/auth/*`
- `lib/personnel/*`
- `scripts/import_personal.js`
- `public/index.html`
- `public/app.js`
- `public/admin.html`
- `public/admin.js`
- `public/styles.css`
- `supabase/migrations/*.sql`
- `tests/*.test.js`
- `docs/*.md`

