# Evaluacion Orientativa de Asertividad

Aplicacion web Node.js para aplicar la Escala Multidimensional de Asertividad (EMA) en contexto academico, registrar estudiantes, consultar por cedula y exportar resultados a Excel.

## Caracteristicas

- Registro de encuestados con datos academicos
- Aplicacion de 45 reactivos con escala Likert oficial
- Calculo automatico por dimensiones y perfil global
- Consulta individual por cedula
- Exportacion de todos los registros a Excel
- Inicio de sesion opcional con Google para precargar nombre, correo y foto

## Escala de respuesta

- 1 = Completamente en desacuerdo
- 2 = En desacuerdo
- 3 = Ni de acuerdo ni en desacuerdo
- 4 = De acuerdo
- 5 = Completamente de acuerdo

## Ejecucion local

```powershell
cd "C:\Users\Mauro\Documents\New project"
$env:GOOGLE_CLIENT_ID="TU_CLIENT_ID.apps.googleusercontent.com"
npm start
```

La app queda disponible en [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Consulta el archivo `.env.example` para ver todas las variables disponibles.

- `STORAGE_DRIVER=auto`
  Usa Supabase si detecta configuracion y, si no, conserva el JSON local.

- `STORAGE_DRIVER=supabase`
  Fuerza almacenamiento remoto en Supabase. Es la opcion recomendada para produccion.

- `STORAGE_DRIVER=local`
  Fuerza el comportamiento anterior con `data/ema_submissions.json`.

## Supabase

La app ya esta preparada para mover el almacenamiento a Supabase Postgres sin cambiar la interfaz.

### 1. Crear la tabla

En el SQL Editor de Supabase, ejecuta el contenido de:

- `supabase/schema.sql`

### 2. Configurar variables

En local o en tu hosting define:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_TABLE=survey_submissions`
- `STORAGE_DRIVER=supabase`

Nota:
La clave realmente importante para el backend es `SUPABASE_SERVICE_ROLE_KEY`. La `anon key` puede mantenerse para futuras integraciones publicas, pero no debe reemplazar la `service role key` en el servidor.

### 3. Ejemplo local con Supabase

```powershell
cd "C:\Users\Mauro\Documents\New project"
$env:STORAGE_DRIVER="supabase"
$env:SUPABASE_URL="https://tu-proyecto.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
$env:SUPABASE_ANON_KEY="TU_ANON_KEY"
$env:GOOGLE_CLIENT_ID="TU_CLIENT_ID.apps.googleusercontent.com"
npm start
```

## Despliegue recomendado

La opcion mas simple para esta arquitectura actual es:

- Backend + frontend estatico en `Render`
- Base de datos en `Supabase`
- HTTPS automatico del proveedor

El archivo `render.yaml` ya deja preparada una configuracion base para desplegar el servicio web en Render.

## Archivos clave

- `lib/instrument.js`
  Aqui viven las 45 preguntas oficiales, la escala de respuesta, las dimensiones y la marca de puntuacion directa o inversa para el indice global.

- `lib/scoring.js`
  Aqui se calcula el puntaje total, promedio total, porcentaje total, resultados por dimension y dimension mas fuerte / dimension con mayor necesidad de atencion.

- `lib/interpretation.js`
  Aqui se define la interpretacion automatica del perfil global, fortalezas, areas de atencion y sugerencias prudentes.

- `lib/storage.js`
  Abstraccion de almacenamiento. Puede usar JSON local o Supabase segun las variables de entorno.

- `lib/env.js`
  Centraliza lectura de configuracion del servidor.

- `lib/exportExcel.js`
  Genera el archivo Excel descargable con todos los encuestados.

- `server.js`
  Expone la API, valida registros, evita duplicados por cedula, sirve la interfaz y entrega la exportacion Excel.

- `public/index.html`
  Estructura principal de la interfaz.

- `public/app.js`
  Maneja el flujo del formulario, el render de preguntas, el resultado y la consulta por cedula.

- `public/styles.css`
  Contiene los estilos de la interfaz.

- `supabase/schema.sql`
  Define la tabla y los indices necesarios para subir la app a Supabase.

- `render.yaml`
  Configuracion base para desplegar la app completa en Render.

## API

- `GET /api/config`
- `GET /api/instrument`
- `POST /api/auth/google`
- `POST /api/submit`
- `GET /api/submissions/:cedula`
- `GET /api/export/excel`

## Notas metodologicas

- La app presenta el instrumento como herramienta orientativa y academica.
- No entrega diagnosticos clinicos ni afirmaciones psiquiatricas.
- El indice global usa puntuacion ajustada: los reactivos de no asertividad y asertividad indirecta se invierten para el resumen global favorable, pero tambien se conservan como dimensiones propias del instrumento.
