# Correccion de flujo autenticado y asignaciones

## Root cause

A. El mensaje "Completa cedula, nombre, carrera, edad y genero antes de continuar." aparecia porque `public/app.js` cargaba la sesion militar en `loadSession()`, pero `startSelectedInstrument()` seguia llamando `validateParticipantLocally()`, una validacion heredada del formulario publico.

B. El grado no se mostraba porque `/api/auth/me` devolvia solamente datos legacy de `people` y no enriquecia la persona con `personnel_profiles`.

C. Un usuario sin asignaciones podia ver EMA/Bar-On porque `loadInstruments()` filtraba por asignaciones solo si existian codigos asignados; cuando la lista venia vacia, hacia fallback a todos los instrumentos.

D. DISC no aparecia porque no estaba registrado en `lib/instruments/index.js` ni tenia definicion/scoring compatible con el flujo de aplicaciones.

## Solucion aplicada

- La identidad autenticada proviene de `user_accounts -> people -> personnel_profiles`.
- El portal muestra grado, unidad y promocion desde Supabase.
- El frontend autenticado ya no valida carrera, edad ni genero antes de abrir instrumentos.
- Los instrumentos se filtran siempre por `assessment_assignments`; cero asignaciones muestra cero instrumentos.
- `POST /api/applications/start` devuelve `403` cuando el instrumento no pertenece al usuario.
- Las asignaciones pasan a `in_progress` al iniciar y a `completed` al finalizar o invalidar.
- DISC queda registrado con 28 grupos de eleccion forzada MAS/MENOS y scoring estructural D/I/S/C.

## Tablas afectadas

- `people`: lectura de identidad y compatibilidad legacy.
- `personnel_profiles`: lectura de grado, unidad, promocion y clasificacion.
- `assessment_assignments`: autoridad de instrumentos y estado de progreso.
- `applications`, `responses`, `partial_results`, `final_results`: guardado de aplicaciones, respuestas y resultados.

## Verificacion local

- `npm test`: 9 pruebas OK.
- `/api/auth/me`: devuelve nombre, grado y asignaciones.
- `POST /api/applications/start` con Bar-On asignado: `200`.
- `POST /api/applications/start` con DISC no asignado: `403`.
