# PLAN BARON IMPLEMENTACION

## 1. Que se encontro

### Estado original del proyecto
- El sistema original estaba construido para un solo instrumento: EMA.
- La logica de negocio validaba unicidad por `cedula`, lo que bloqueaba multi-instrumento y continuidad por niveles.
- El almacenamiento local y remoto estaba centrado en una sola estructura de `submission`.
- La exportacion Excel, el panel admin y la SPA publica estaban acoplados a EMA.

### Hallazgos metodologicos de BarOn
- El manual y la hoja Excel corresponden a `BarOn ICE-JA` para adolescentes tardios, jovenes y adultos.
- El instrumento opera con:
  - 133 items
  - 5 componentes
  - 15 subcomponentes
  - 2 escalas de validez observables en la plantilla
- Se confirmaron desde la plantilla:
  - textos de los 133 reactivos
  - items invertidos
  - asignacion de items a subcomponentes
  - medias y desviaciones para conversion a CE
  - rangos cualitativos `Muy bajo`, `Bajo`, `Promedio`, `Alto`, `Muy alto`

### Observacion metodologica importante
- El `indice de inconsistencia` aparece mencionado en el manual, pero no quedo completamente cerrado desde la plantilla analizada.
- La implementacion actual lo deja documentado como pendiente metodologico, sin inventar una formula no confirmada.

## 2. Que se cambio

### Arquitectura
- Se agrego una capa multi-instrumento:
  - `lib/instruments/index.js`
  - `lib/instruments/ema.js`
  - `lib/instruments/baron.js`
- Se agrego scoring especifico de BarOn:
  - `lib/scoring/index.js`
  - `lib/scoring/baronScoring.js`
- Se agrego interpretacion de BarOn:
  - `lib/interpretation/baronInterpretation.js`

### Persistencia
- Se reescribio `lib/storage.js` para soportar:
  - personas
  - aplicaciones
  - respuestas
  - resultados parciales
  - resultados finales
- Se mantuvo compatibilidad de lectura con EMA legado:
  - local `data/ema_submissions.json`
  - remoto `survey_submissions`

### API
- Se reemplazo el servidor por un contrato multi-instrumento en `server.js`.

### UI publica
- La SPA ahora soporta:
  - captura de datos personales
  - seleccion de instrumento
  - vista de modulos
  - continuidad de avance
  - flujo EMA intacto
  - flujo BarOn por modulos

### UI admin
- El panel admin ahora permite:
  - filtrar por instrumento
  - filtrar por estado
  - consultar por cedula
  - ver parciales y finales
  - exportar por instrumento o consolidado

## 3. Como quedo la arquitectura

### Backend
- `server.js`
  - Router HTTP principal
- `lib/instruments`
  - definiciones por instrumento
- `lib/scoring`
  - calculo por instrumento
- `lib/interpretation`
  - interpretacion por instrumento
- `lib/storage.js`
  - persistencia local / Supabase
- `lib/exportExcel.js`
  - exportacion consolidada

### Frontend
- `public/index.html`
  - formulario + seleccion + modulos + preguntas + resultados
- `public/app.js`
  - flujo de usuario multi-instrumento
- `public/admin.html`
  - panel administrativo
- `public/admin.js`
  - filtros y detalle tecnico

## 4. Como se calcula EMA

- EMA conserva su scoring original.
- Se siguen usando:
  - 45 reactivos
  - escala Likert 1 a 5
  - dimensiones:
    - asertividad directa
    - no asertividad
    - asertividad indirecta
- La conversion sigue el scoring ya existente del proyecto:
  - puntaje bruto
  - puntaje ajustado
  - promedio
  - porcentaje favorable
  - perfil global
  - observaciones automaticas

## 5. Como se calcula BarOn

### Escala
- 1 = Rara vez o nunca es mi caso
- 2 = Pocas veces es mi caso
- 3 = A veces es mi caso
- 4 = Muchas veces es mi caso
- 5 = Con mucha frecuencia o siempre es mi caso

### Scoring implementado
- Se cargaron los 133 items desde la hoja `ENTRADA`.
- Se cargaron los items invertidos desde la comparacion de respuesta original vs ajustada en la plantilla.
- Se calcularon subcomponentes usando el mapa de items confirmado desde la hoja Excel.
- Los componentes se calcularon como union de items por componente, evitando doble conteo en items compartidos.
- El `CE total` se calculo como union de items de los 15 subcomponentes sustantivos.
- La conversion CE se implemento con la formula observada en la plantilla:

`CE = ((puntaje_bruto - media) / desviacion_estandar) * 15 + 100`

- Las categorias cualitativas se implementaron con los rangos visibles en la hoja:
  - 0 a 79 = Muy bajo
  - 80 a 90 = Bajo
  - 91 a 109 = Promedio
  - 110 a 120 = Alto
  - 121 o mas = Muy alto

### Validez implementada
- Revisa sinceridad por item 133.
- Marca revision si hay 8 o mas omisiones en los 132 items sustantivos.
- Marca cautela si:
  - impresion positiva >= 130
  - impresion negativa >= 130

## 6. Que dudas metodologicas siguen abiertas

- No se cerro aun una formula verificable del `indice de inconsistencia`.
- La implementacion actual no inventa ese calculo.
- El sistema deja una advertencia metodologica en BarOn para documentar ese punto.
- Si luego se confirma la formula oficial, puede agregarse sin romper la arquitectura ya creada.

## 7. Que endpoints existen

### Publicos
- `GET /api/config`
- `GET /api/instruments`
- `GET /api/instruments/:code`
- `GET /api/instrument`
- `GET /api/check-id/:cedula?instrument=ema|baron`
- `POST /api/applications/start`
- `GET /api/applications/resume?cedula=...&instrument=...`
- `GET /api/applications/:id`
- `POST /api/applications/:id/answers`

### Admin
- `POST /api/admin/login`
- `GET /api/results?cedula=...&instrument=...`
- `GET /api/admin/applications?cedula=...&instrument=...&status=...`
- `GET /api/admin/applications/:id`
- `GET /api/submissions`
- `GET /api/submissions/:cedula?instrument=...`
- `GET /api/export/excel?instrument=...`

## 8. Que tablas nuevas existen

En `supabase/schema.sql` quedaron:

- `survey_submissions`
  - se conserva por compatibilidad con EMA legado
- `people`
- `applications`
- `responses`
- `partial_results`
- `final_results`

## 9. Como probar localmente

### 1. Instalar dependencias
```powershell
cd "C:\Users\Mauro\Documents\New project"
npm install
```

### 2. Ejecutar local
```powershell
cd "C:\Users\Mauro\Documents\New project"
npm start
```

### 3. Probar en navegador
- Abrir `http://localhost:3000`
- Registrar datos
- Elegir:
  - EMA
  - BarOn ICE
- En BarOn:
  - completar un modulo
  - salir y volver si quieres
  - continuar avance
- En admin:
  - filtrar por instrumento
  - consultar por cedula
  - exportar Excel

## 10. Como desplegar en Render

### Base de datos
- Ejecutar el SQL nuevo de `supabase/schema.sql` en tu proyecto Supabase antes de publicar BarOn.

### Variables de entorno
- `STORAGE_DRIVER=supabase`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `SUPABASE_ANON_KEY=...`
- `ADMIN_USERNAME=...`
- `ADMIN_PASSWORD=...`
- `GOOGLE_CLIENT_ID=...` (opcional mientras no se reactive)

### Render
- El despliegue sigue siendo compatible con el esquema actual de Render.
- No se requirio framework nuevo.
- `render.yaml` puede seguir usandose con el mismo servicio Node.

## Archivos creados o modificados principales

### Nuevos
- `lib/instruments/index.js`
- `lib/instruments/ema.js`
- `lib/instruments/baron.js`
- `lib/scoring/index.js`
- `lib/scoring/baronScoring.js`
- `lib/interpretation/baronInterpretation.js`
- `PLAN_BARON_IMPLEMENTACION.md`

### Reescritos / actualizados
- `lib/storage.js`
- `lib/exportExcel.js`
- `server.js`
- `supabase/schema.sql`
- `public/index.html`
- `public/app.js`
- `public/admin.html`
- `public/admin.js`
- `public/styles.css`

## Estado actual

- EMA sigue operativo dentro de la arquitectura nueva.
- BarOn ya existe como instrumento nuevo con:
  - 133 items
  - modulos
  - parciales por componente
  - resultado integral al completar
  - chequeos de validez disponibles
- Queda pendiente solamente cerrar el indice de inconsistencia si se confirma metodologicamente desde una fuente oficial mas precisa.
