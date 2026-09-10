const test = require("node:test");
const assert = require("node:assert/strict");

process.env.STORAGE_DRIVER = "supabase";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.SUPABASE_REQUEST_TIMEOUT_MS = "1000";
process.env.SUPABASE_READ_RETRIES = "1";

const originalFetch = global.fetch;
const { supabaseRequest } = require("../lib/storage");

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
