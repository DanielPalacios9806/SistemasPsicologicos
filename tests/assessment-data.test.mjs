import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEvaluationRows,
  getDimensions,
  getOverallProgress,
  getScoreSummary,
} from '../public/js/core/assessmentData.mjs';

test('participant dashboard derives progress from assignments and applications', () => {
  const assignments = [
    { instrumentCode: 'ema', status: 'in_progress', percentageComplete: 40 },
    { instrumentCode: 'disc', status: 'pending', percentageComplete: 0 },
  ];
  const applications = [
    { id: 'app-ema', instrumentCode: 'ema', status: 'in_progress', percentageComplete: 60 },
  ];

  const rows = buildEvaluationRows(assignments, applications);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].percentageComplete, 60);
  assert.equal(rows[1].percentageComplete, 0);
  assert.equal(getOverallProgress(rows), 30);
});

test('Bar-On summary and dimensions use the saved scoring payload', () => {
  const application = {
    instrumentCode: 'baron',
    status: 'completed',
    valid: true,
    scoring: {
      profile: 'Capacidad emocional adecuada',
      total: { ceScore: 107 },
      components: [
        { key: 'intrapersonal', label: 'Intrapersonal', ceScore: 104, category: 'average' },
        { key: 'interpersonal', label: 'Interpersonal', ceScore: 112, category: 'average' },
      ],
    },
  };

  const summary = getScoreSummary(application);
  const dimensions = getDimensions(application);
  assert.equal(summary.value, 'CE 107');
  assert.equal(summary.profile, 'Capacidad emocional adecuada');
  assert.deepEqual(dimensions.map((item) => item.displayValue), ['CE 104', 'CE 112']);
});

test('EMA and DISC preserve their own scoring models', () => {
  const ema = {
    instrumentCode: 'ema',
    status: 'completed',
    finalResult: { totalNormalized: 64, profileGlobal: 'Asertividad media' },
    scoring: {
      dimensions: [
        { key: 'directa', label: 'Asertividad directa', favorablePercentage: 72, band: 'high' },
      ],
    },
  };
  const disc = {
    instrumentCode: 'disc',
    status: 'completed',
    finalResult: { profileGlobal: 'Promotor' },
    scoring: {
      most: { D: 8 },
      dimensions: [
        { key: 'D', label: 'Dominancia', rawTotal: 3, interpretiveLevel: 'MAS 8 / MENOS 5 / DIF 3' },
      ],
    },
  };

  assert.equal(getScoreSummary(ema).value, '64%');
  assert.equal(getDimensions(ema)[0].displayValue, '72%');
  assert.equal(getScoreSummary(disc).profile, 'Promotor');
  assert.equal(getDimensions(disc)[0].displayValue, 'MAS 8 / MENOS 5 / DIF 3');
});

test('empty data produces honest zero and null states', () => {
  assert.deepEqual(buildEvaluationRows([], []), []);
  assert.equal(getOverallProgress([]), 0);
  assert.equal(getScoreSummary(null), null);
  assert.deepEqual(getDimensions(null), []);
});
