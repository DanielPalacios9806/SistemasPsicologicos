const http = require('http');
const fs = require('fs');
const path = require('path');
const { listInstruments, getInstrumentDefinition } = require('../lib/instruments');

const PORT = Number(process.env.QA_PORT || 3011);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const LUCIDE_FILE = path.join(__dirname, '..', 'node_modules', 'lucide', 'dist', 'umd', 'lucide.min.js');
const assessmentApplications = new Map();

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

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function buildAssessmentPayload(instrumentCode) {
  const instrument = getInstrumentDefinition(instrumentCode);
  if (!assessmentApplications.has(instrumentCode)) {
    assessmentApplications.set(instrumentCode, {
      id: `qa-${instrumentCode}-application`,
      participant: authPayload.user.person,
      instrumentCode,
      instrumentName: instrument.name,
      instrumentVersion: instrument.version,
      status: 'in_progress',
      currentModuleKey: instrument.modules[0].key,
      percentageComplete: 0,
      valid: null,
      startedAt: '2026-08-24T12:00:00.000Z',
      completedAt: null,
      answers: [],
      partialResults: null,
      finalResult: null,
      scoring: null,
    });
  }
  return { ...assessmentApplications.get(instrumentCode), instrument };
}

function saveAssessmentAnswers(applicationId, submittedAnswers) {
  const application = [...assessmentApplications.values()].find((candidate) => candidate.id === applicationId);
  if (!application) return null;
  const instrument = getInstrumentDefinition(application.instrumentCode);
  const answers = new Map(application.answers.map((answer) => [answer.itemId, answer.value]));
  submittedAnswers.forEach((answer) => answers.set(Number(answer.itemId), Number(answer.value)));
  application.answers = [...answers.entries()].map(([itemId, value]) => ({ itemId, value }));
  application.percentageComplete = Math.round((application.answers.length / instrument.items.length) * 100);
  application.scoring = {
    modules: instrument.modules.map((module) => {
      const answeredCount = module.itemIds.filter((itemId) => answers.has(itemId)).length;
      return {
        key: module.key,
        label: module.label,
        answeredCount,
        expectedCount: module.itemIds.length,
        completionRatio: Math.round((answeredCount / module.itemIds.length) * 100),
        isComplete: answeredCount === module.itemIds.length,
      };
    }),
  };
  return { ...application, instrument };
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

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/config') return sendJson(res, {});
  if (url.pathname === '/api/auth/me') return sendJson(res, authPayload);
  if (url.pathname === '/api/me/applications') return sendJson(res, applicationPayload);
  if (url.pathname === '/api/instruments') return sendJson(res, { instruments: listInstruments() });
  if (url.pathname.startsWith('/api/instruments/')) {
    try {
      return sendJson(res, getInstrumentDefinition(url.pathname.split('/').pop()));
    } catch (error) {
      return sendJson(res, { error: error.message }, 404);
    }
  }
  if (url.pathname === '/api/applications/start' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      return sendJson(res, buildAssessmentPayload(String(body.instrumentCode || '').toLowerCase()));
    } catch (error) {
      return sendJson(res, { error: error.message }, 400);
    }
  }
  if (/^\/api\/applications\/[^/]+\/answers$/.test(url.pathname) && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const application = saveAssessmentAnswers(url.pathname.split('/')[3], body.answers || []);
      return application
        ? sendJson(res, application)
        : sendJson(res, { error: 'Aplicacion QA no encontrada.' }, 404);
    } catch (error) {
      return sendJson(res, { error: error.message }, 400);
    }
  }
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
