/**
 * Smoke tests — run against a live WinOS server.
 *
 *   # start the server first (dev or built):
 *   npm run dev          # or: npm run build && npm start
 *
 *   # then in a second terminal:
 *   node scripts/smoke.mjs
 *
 * Override the base URL:
 *   SMOKE_URL=https://staging.example.com node scripts/smoke.mjs
 */

const BASE = process.env.SMOKE_URL ?? "http://localhost:3000";
let passed = 0;
let failed = 0;

async function check(description, fn) {
  try {
    await fn();
    console.log(`  ✓  ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${description}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function get(path, options = {}) {
  return fetch(`${BASE}${path}`, { redirect: "manual", ...options });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function isRedirectToLogin(res) {
  const loc = res.headers.get("location") ?? "";
  return (res.status === 307 || res.status === 302) && loc.includes("/login");
}

// ── Auth protection ───────────────────────────────────────────────────────────

console.log("\nSmoke tests →", BASE);
console.log("\nAuth protection (unauthenticated requests):");

await check("/dashboard redirects to /login", async () => {
  const res = await get("/dashboard");
  assert(isRedirectToLogin(res), `Expected redirect to /login, got ${res.status} → ${res.headers.get("location")}`);
});

await check("/notes redirects to /login", async () => {
  const res = await get("/notes");
  assert(isRedirectToLogin(res), `Expected redirect to /login, got ${res.status} → ${res.headers.get("location")}`);
});

await check("/dsm redirects to /login", async () => {
  const res = await get("/dsm");
  assert(isRedirectToLogin(res), `Expected redirect to /login, got ${res.status} → ${res.headers.get("location")}`);
});

// ── Public routes ─────────────────────────────────────────────────────────────

console.log("\nPublic routes:");

await check("/login page returns 200", async () => {
  const res = await get("/login");
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

await check("/ redirects (to /dashboard or /login)", async () => {
  const res = await get("/");
  assert(
    res.status === 307 || res.status === 302,
    `Expected redirect, got ${res.status}`
  );
});

// ── Server action endpoints exist ─────────────────────────────────────────────

console.log("\nServer action POST endpoints (unauthenticated → should not 404):");

// Server actions are called via POST to the page URL with a specific header.
// Without auth they should return a redirect or an error response — not 404.
for (const path of ["/notes", "/dsm"]) {
  await check(`POST ${path} does not 404`, async () => {
    const res = await get(path, { method: "POST" });
    assert(res.status !== 404, `Got unexpected 404 for POST ${path}`);
  });
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
