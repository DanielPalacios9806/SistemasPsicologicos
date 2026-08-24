const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.QA_PORT || 3011);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const LUCIDE_FILE = path.join(__dirname, '..', 'node_modules', 'lucide', 'dist', 'umd', 'lucide.min.js');

const authPayload = {
  user: {
    username: 'qa-participant',
    role: 'participant',
    mustChangePassword: false,
    person: {
      fullName: 'Andrés Castillo',
      idNumber: '0000000000',
      rankName: 'Soldado Profesional',
      unitName: 'Unidad de pruebas',
    },
  },
  assignments: [
    { instrumentCode: 'baron', status: 'completed', percentageComplete: 100, required: true },
    { instrumentCode: 'ema', status: 'in_progress', percentageComplete: 42, required: true },
    { instrumentCode: 'disc', status: 'pending', percentageComplete: 0, required: true },
  ],
};

const applicationPayload = {
  applications: [
    {
      id: 'qa-baron-completed',
      instrumentCode: 'baron',
      instrumentName: 'Inventario de Cociente Emocional Bar-On ICE',
      status: 'completed',
      percentageComplete: 100,
      valid: true,
      startedAt: '2026-08-20T12:00:00.000Z',
      completedAt: '2026-08-21T15:30:00.000Z',
      finalResult: { totalNormalized: 106, profileGlobal: 'Capacidad emocional adecuada' },
      scoring: {
        profile: 'Capacidad emocional adecuada',
        total: { ceScore: 106 },
        components: [
          { key: 'intrapersonal', label: 'Intrapersonal', ceScore: 108, category: 'average' },
          { key: 'interpersonal', label: 'Interpersonal', ceScore: 103, category: 'average' },
          { key: 'adaptability', label: 'Adaptabilidad', ceScore: 112, category: 'average' },
          { key: 'stress', label: 'Manejo del estrés', ceScore: 98, category: 'average' },
          { key: 'mood', label: 'Estado de ánimo', ceScore: 105, category: 'average' },
        ],
        observations: {
          strengths: ['Recursos interpersonales y de adaptación dentro del rango esperado.'],
          attentionAreas: ['Conviene revisar estrategias de manejo del estrés en situaciones exigentes.'],
          suggestions: ['Practicar pausas breves de autorregulación antes de decisiones de alta presión.'],
        },
      },
    },
    {
      id: 'qa-ema-progress',
      instrumentCode: 'ema',
      instrumentName: 'Escala Multidimensional de Asertividad',
      status: 'in_progress',
      percentageComplete: 42,
      startedAt: '2026-08-23T10:00:00.000Z',
      completedAt: null,
      finalResult: null,
      scoring: null,
    },
  ],
};

function sendJson(res, payload) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };
  res.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/auth/me') return sendJson(res, authPayload);
  if (url.pathname === '/api/me/applications') return sendJson(res, applicationPayload);
  if (url.pathname === '/vendor/lucide.js') return sendFile(res, LUCIDE_FILE);

  const requested = url.pathname === '/' ? '/portal.html' : url.pathname;
  const filePath = path.resolve(PUBLIC_DIR, `.${requested}`);
  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  sendFile(res, filePath);
}).listen(PORT, () => {
  console.log(`Visual QA server: http://localhost:${PORT}/portal.html`);
});
