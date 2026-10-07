-- 009: Evita aplicaciones "En progreso" duplicadas por persona e instrumento.
--
-- Origen del problema: varios inicios simultaneos (doble clic, varias pestanas,
-- reintentos con Supabase lento) pasaban la verificacion "ya existe una en progreso"
-- al mismo tiempo y cada uno insertaba una fila nueva.
--
-- Paso 1 (limpieza segura): elimina solo duplicados VACIOS — aplicaciones en progreso
-- sin ninguna respuesta guardada, cuando la misma persona ya tiene otra aplicacion
-- del mismo instrumento. Nunca toca aplicaciones con respuestas ni completadas.
-- Paso 2: indice unico parcial para que la base rechace un segundo "en progreso".

begin;

with ranked as (
  select
    a.id,
    a.person_id,
    a.instrument_code,
    exists (select 1 from public.responses r where r.application_id = a.id) as has_answers,
    row_number() over (
      partition by a.person_id, a.instrument_code
      order by
        exists (select 1 from public.responses r where r.application_id = a.id) desc,
        a.percentage_complete desc,
        a.started_at asc
    ) as keep_rank
  from public.applications a
  where a.status = 'in_progress'
)
delete from public.applications a
using ranked
where a.id = ranked.id
  and a.status = 'in_progress'
  and ranked.keep_rank > 1
  and ranked.has_answers = false;

do $$
begin
  if exists (
    select 1
    from public.applications
    where status = 'in_progress'
    group by person_id, instrument_code
    having count(*) > 1
  ) then
    raise notice 'Quedan duplicados en progreso CON respuestas; revisalos manualmente antes de crear el indice unico.';
  else
    create unique index if not exists applications_one_in_progress_per_instrument
      on public.applications (person_id, instrument_code)
      where status = 'in_progress';
  end if;
end $$;

commit;
