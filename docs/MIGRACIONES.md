# Migraciones

## Archivos

- `001_baseline_documented.sql`
- `002_personnel_profiles.sql`
- `003_user_accounts.sql`
- `004_assessment_campaigns.sql`
- `005_assessment_assignments.sql`
- `006_disc_support.sql`
- `007_security_rls.sql`

## Politica

- No destructivas por defecto.
- No ejecutan `DROP TABLE`.
- Preservan tablas existentes.
- Habilitan RLS para tablas sensibles.
- El backend debe usar service role.

## Orden de ejecucion

Ejecutar en Supabase SQL Editor o CLI en orden numerico.

Antes de ejecutar en produccion:

1. Confirmar conteos.
2. Respaldar esquema/datos o documentar que las tablas estan vacias.
3. Ejecutar migraciones.
4. Verificar tablas, indices y RLS.
5. Ejecutar importador en `--dry-run`.
6. Ejecutar importador en `--apply`.

