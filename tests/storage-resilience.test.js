const test = require("node:test");
const assert = require("node:assert/strict");

process.env.STORAGE_DRIVER = "supabase";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.SUPABASE_REQUEST_TIMEOUT_MS = "1000";
process.env.SUPABASE_READ_RETRIES = "1";

const originalFetch = global.fetch;
const { saveApplicationProgress, supabaseRequest } = require("../lib/storage");

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("Supabase: retries a transient read once", async () => {
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("temporary network failure");
    return new Response('[{"id":"person-1"}]', { status: 200 });
  };

  const rows = await supabaseRequest("/rest/v1/people?select=id", { timeoutMs: 1000, retryCount: 1 });

  assert.deepEqual(rows, [{ id: "person-1" }]);
  assert.equal(calls, 2);
});

test("Supabase: does not retry writes that could be duplicated", async () => {
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    throw new TypeError("network failure");
  };

  await assert.rejects(
    () => supabaseRequest("/rest/v1/applications", { method: "POST", body: "{}" }),
    (error) => error.code === "SUPABASE_UNAVAILABLE" && error.statusCode === 503
  );
  assert.equal(calls, 1);
});

test("Supabase: preserves conflict metadata for idempotent recovery", async () => {
  global.fetch = async () => new Response(JSON.stringify({
    code: "23505",
    message: "duplicate key value violates unique constraint",
    details: "Key (person_id, instrument_code) already exists.",
  }), {
    status: 409,
    headers: { "Content-Type": "application/json" },
  });

  await assert.rejects(
    () => supabaseRequest("/rest/v1/applications", { method: "POST", body: "{}" }),
    (error) => error.statusCode === 409
      && error.supabaseCode === "23505"
      && /duplicate key/.test(error.message)
  );
});

test("Supabase: aborts an unresponsive request and returns a service error", async () => {
  global.fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    }, { once: true });
  });

  const startedAt = Date.now();
  await assert.rejects(
    () => supabaseRequest("/rest/v1/people?select=id", { timeoutMs: 1000, retryCount: 0 }),
    (error) => error.code === "SUPABASE_UNAVAILABLE" && error.statusCode === 503
  );
  assert.ok(Date.now() - startedAt < 1600);
});

test("Supabase: incremental autosave writes only the changed answer", async () => {
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url: String(url), method: options.method, body: options.body });
    return new Response(null, { status: 204 });
  };

  const aggregate = {
    id: "application-1",
    personId: "person-1",
    participant: { idNumber: "1234567890", fullName: "Persona Prueba" },
    instrumentCode: "ema",
    instrumentName: "EMA",
    instrumentVersion: "1",
    status: "in_progress",
    currentModuleKey: "ema",
    percentageComplete: 4,
    valid: null,
    startedAt: "2026-09-10T12:00:00.000Z",
    completedAt: null,
    scoringSnapshot: { dimensions: [] },
    answers: [
      { itemId: 1, value: 3, adjustedValue: 3, moduleKey: "ema" },
      { itemId: 2, value: 4, adjustedValue: 4, moduleKey: "ema" },
    ],
    partialResults: [{ scopeType: "dimension", scopeKey: "example" }],
    finalResult: null,
  };

  const saved = await saveApplicationProgress(aggregate, { changedItemIds: [2] });

  assert.equal(saved.answers.length, 2);
  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /responses\?on_conflict=application_id,item_id/);
  assert.match(requests[1].url, /applications$/);
  assert.equal(requests.some((request) => request.method === "DELETE"), false);
  assert.equal(requests.some((request) => request.url.includes("people")), false);
  assert.equal(requests.some((request) => request.url.includes("partial_results")), false);
  assert.deepEqual(JSON.parse(requests[0].body).map((row) => row.item_id), [2]);
});
