# Plataforma de Evaluacion Orientativa

Aplicacion web Node.js para aplicar instrumentos orientativos en contexto academico. Actualmente soporta EMA y BarOn ICE, con almacenamiento local o Supabase, panel administrativo, exportacion Excel y continuidad por instrumento.

## Caracteristicas

- Registro de encuestados con datos academicos
- Seleccion de instrumento por persona
- EMA con scoring original y flujo de una pregunta por pantalla
- BarOn ICE por modulos con guardado automatico de avance
- Consulta administrativa por cedula, instrumento y estado
- Exportacion Excel por instrumento o consolidada

## Escala de respuesta

### EMA

- 1 = Completamente en desacuerdo
- 2 = En desacuerdo
- 3 = Ni de acuerdo ni en desacuerdo
- 4 = De acuerdo
- 5 = Completamente de acuerdo

### BarOn ICE

- 1 = Rara vez o nunca es mi caso
- 2 = Pocas veces es mi caso
- 3 = A veces es mi caso
- 4 = Muchas veces es mi caso
- 5 = Con mucha frecuencia o siempre es mi caso

## Ejecucion local

```powershell
cd "C:\Users\Mauro\Documents\New project"
$env:GOOGLE_CLIENT_ID="TU_CLIENT_ID.apps.googleusercontent.com"
npm start
```

La app queda disponible en [http://localhost:3000](http://localhost:3000).

## Estructura del Proyecto

```
evaluacion-asertividad-ema/
├── server.js                 # API HTTP (Node.js puro)
├── package.json              # Metadatos y dependencias
├── render.yaml              # Configuracion Render (deploy)
├── README.md                # Esta documentacion
├── .env.example             # Variables de entorno plantilla
│
├── lib/                      # Modulos backend
│   ├── env.js              # Lectura variables de entorno
│   ├── instrument.js       # 45 preguntas + 3 dimensiones EMA
│   ├── scoring.js          # Calculo de puntajes
│   ├── interpretation.js   # Perfiles e interpretaciones
│   ├── exportExcel.js      # Generacion de Excel
│   └── storage.js          # Abstraccion (local/Supabase)
│
├── public/                   # Frontend (SPA vanilla)
│   ├── index.html          # Interfaz principal
│   ├── admin.html          # Panel administrativo
│   ├── app.js              # Logica de encuesta
│   ├── admin.js            # Logica admin
│   ├── styles.css          # Estilos glassmorphism
│   └── assets/             # Imagenes SVG, backgrounds
│
├── data/                     # Almacenamiento local (JSON)
│   ├── ema_submissions.json
│   └── submissions.json
│
└── supabase/                 # Esquema base de datos
    └── schema.sql           # Tabla survey_submissions
```

## Instalacion y Setup Local

### Requisitos
- Node.js 18+ (recomendado 20+)
- npm
- (Opcional) Supabase account para almacenamiento remoto

### Pasos

1. **Clonar y dependencias**
```bash
git clone <tu-repo>
cd evaluacion-asertividad-ema
npm install
```

2. **Crear archivo `.env` local**
```bash
# Copia .env.example a .env
cp .env.example .env

# Edita .env con valores reales:
# - GOOGLE_CLIENT_ID: Tu ID de Google OAuth
# - ADMIN_USERNAME y ADMIN_PASSWORD: Credenciales panel admin
# - STORAGE_DRIVER: auto (recomendado)
```

3. **Ejecutar localmente**
```bash
npm start
# La app estara en http://localhost:3000
```

## Variables de Entorno Explicadas

| Variable | Tipo | Obligatoria | Descripcion |
|----------|------|-------------|-------------|
| `PORT` | Integer | No | Puerto servidor (default: 3000) |
| `GOOGLE_CLIENT_ID` | String | No | ID cliente Google OAuth |
| `ADMIN_USERNAME` | String | No | Usuario panel admin |
| `ADMIN_PASSWORD` | String | No | Contraseña panel admin |
| `STORAGE_DRIVER` | Enum | No | `auto`\|`local`\|`supabase` |
| `SUPABASE_URL` | URL | Condicional | URL de proyecto Supabase |
| `SUPABASE_ANON_KEY` | String | Condicional | API key anonima Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | String | Condicional | API key servicio Supabase (escritura) |
| `SUPABASE_TABLE` | String | No | Nombre tabla (default: survey_submissions) |

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

### 3. (Opcional) Habilitar Row Level Security (RLS)

Si quieres asegurar que los datos solo sean legibles públicamente (sin escritura sin autenticación):

1. En Supabase dashboard, ve a **SQL Editor**
2. Ejecuta:
```sql
ALTER TABLE survey_submissions ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Allow public read" ON survey_submissions
  FOR SELECT USING (true);

-- Escritura solo backend (con SERVICE_ROLE_KEY)
-- Ya validada en el codigo del servidor
```

3. Confirma que `RLS` está ON en la tabla (badge verde)

---

## Deploy en Render

### Requisitos previos
1. Proyecto en [render.com](https://render.com) (cuenta gratuita o pagada)
2. Repositorio en GitHub/GitLab
3. Variables Supabase configuradas

### Pasos de deploy

1. **Conectar repositorio**
   - Ir a https://dashboard.render.com/new/web
   - Seleccionar "Web Service"
   - Conectar tu repositorio

2. **Configurar servicio**
   - **Name**: `evaluacion-asertividad`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (o pagado según necesidad)

3. **Agregar variables de entorno**
   - Click en "Advanced"
   - En "Environment Variables", agrega:

   | Key | Value | Nota |
   |-----|-------|------|
   | `NODE_VERSION` | `20.11.0` | Versión Node |
   | `STORAGE_DRIVER` | `supabase` | Almacenamiento remoto |
   | `SUPABASE_URL` | Tu URL | Desde Supabase settings |
   | `SUPABASE_SERVICE_ROLE_KEY` | Tu key | **SENSIBLE** |
   | `SUPABASE_ANON_KEY` | Tu key | Desde Supabase |
   | `GOOGLE_CLIENT_ID` | Tu ID | Desde Google Console |
   | `ADMIN_USERNAME` | `admin` | Personalizable |
   | `ADMIN_PASSWORD` | **tu_password** | **CAMBIAR EN PRODUCCION** |

4. **Deploy**
   - Click "Create Web Service"
   - Espera 2-3 minutos
   - Obtén URL pública en dashboard

### Limpieza recomendada

Nota: El plan **Free** de Render se duerme tras 15 minutos sin tráfico. Para producción, considera **Pro** ($12/mes).

---

## ⚠️ Consideraciones de Seguridad

### Findings identificados (nivel bajo a medio)

| Hallazgo | Impacto | Status | Mitigation |
|----------|---------|--------|-----------|
| Cedula enumerable | Permite saber qué cédulas ya respondieron | 🟡 Medio | Rate limit en Render + WAF |
| Admin tokens sin expiración | Tokens válidos toda la sesión | 🟡 Medio | Implementar TTL (próxima versión) |
| Google OAuth ID público | Expuesto en cliente, pero no crítico | 🟢 Bajo | Validación server-side ✓ |
| Survey sin RLS | Datos públicamente legibles | 🟢 Bajo | Activar RLS (ver sección Supabase) |

### Prácticas implementadas ✓

- ✅ Validación de Google ID token en servidor
- ✅ Escape HTML en cliente (XSS prevention)
- ✅ Admin login con credentials (no OAuth)
- ✅ Abstracción de almacenamiento (flexible para cambios)
- ✅ CORS permitido globalmente (necesario para SPA pública)

### Recomendaciones a futuro

1. **Rate limiting** en `GET /api/check-id/` (anti-enumeration)
2. **Expiración de tokens admin** (implementar JWT o TTL sessionStorage)
3. **RLS habilitado** en Supabase (ver sección Supabase)
4. **HTTPS obligatorio** (autom. en Render)
5. **Logs centralizados** (Winston, Datadog, etc.)

---

## FAQ

**¿Cómo cambio la contraseña admin en producción?**
En Render dashboard → Variables de entorno → edita `ADMIN_PASSWORD` → redeploy automático.

**¿Los datos se guardan en local si Supabase falla?**
No, la app falla. Ver código en `lib/storage.js` para añadir fallback automático (próximo release).

**¿Puedo exportar solo resultados de hoy?**
El Excel actual exporta TODO. Para filtrar por fecha, edita `lib/exportExcel.js` y filtra antes de construir workbook.

**¿Cómo agrego más preguntas?**
Edita `lib/instrument.js`, sección `QUESTIONS`. Recalcula índices en `DIMENSION_MAPPING`.

**¿Funciona sin Google OAuth?**
Sí. Si `GOOGLE_CLIENT_ID` no existe, el botón de Google no aparece. Email es opcional en formulario.

---

## Licencia

MIT (o la que prefieras documentar)

## Contacto

mauro@tudominio.com (o el que prefieras)



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
#   S i s t e m a s P s i c o l o g i c o s 
 
 #   S i s t e m a s P s i c o l o g i c o s 
 
 #   S i s t e m a s P s i c o l o g i c o s 
 
 
