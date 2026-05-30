import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const url = process.env.DATABASE_URL!;

function maskUrl(u: string) {
  return u.replace(/:([^:@]+)@/, ":***@");
}

function fmt(rows: unknown[]) {
  return rows.length === 0 ? "  (none)" : null;
}

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();

  console.log("\n═══════════════════════════════════════════════");
  console.log("  WinOS — DB Inspection");
  console.log("═══════════════════════════════════════════════");
  console.log("  URL :", maskUrl(url));
  console.log("═══════════════════════════════════════════════\n");

  // ── Counts ────────────────────────────────────────────────────────────────────
  const userCount = (await client.query(`SELECT COUNT(*) FROM "User"`)).rows[0].count;
  const otpCount = (await client.query(`SELECT COUNT(*) FROM "OtpToken"`)).rows[0].count;
  const notifCount = (await client.query(`SELECT COUNT(*) FROM "Notification"`)).rows[0].count;

  console.log("── Counts ──────────────────────────────────────");
  console.log("  Users        :", userCount);
  console.log("  OTP tokens   :", otpCount);
  console.log("  Notifications:", notifCount);
  console.log();

  // ── Users (first 10) ─────────────────────────────────────────────────────────
  const users = (
    await client.query(
      `SELECT id, email, name, role, "createdAt" FROM "User" ORDER BY "createdAt" ASC LIMIT 10`,
    )
  ).rows;
  console.log("── Users (first 10) ─────────────────────────────");
  if (fmt(users)) console.log(fmt(users));
  for (const u of users) {
    console.log(`  [${u.role}] ${u.email} — ${u.name ?? "(no name)"}`);
  }
  console.log();

  // ── OTP tokens (latest 10) ───────────────────────────────────────────────────
  const otps = (
    await client.query(
      `SELECT id, email, "expiresAt", "usedAt", "failedAttempts", "createdAt" FROM "OtpToken" ORDER BY "createdAt" DESC LIMIT 10`,
    )
  ).rows;
  console.log("── OTP tokens (latest 10) ───────────────────────");
  if (fmt(otps)) console.log(fmt(otps));
  for (const o of otps) {
    const now = new Date();
    const status = o.usedAt ? "USED" : now > new Date(o.expiresAt) ? "EXPIRED" : "ACTIVE";
    console.log(
      `  [${status}] ${o.email}  attempts:${o.failedAttempts}  created:${new Date(o.createdAt).toISOString()}`,
    );
  }
  console.log();

  // ── Notifications (latest 10) ────────────────────────────────────────────────
  const notifs = (
    await client.query(
      `SELECT n.id, n.type, n.title, n."readAt", n."createdAt", u.email AS "userEmail"
       FROM "Notification" n
       JOIN "User" u ON u.id = n."userId"
       ORDER BY n."createdAt" DESC LIMIT 10`,
    )
  ).rows;
  console.log("── Notifications (latest 10) ────────────────────");
  if (fmt(notifs)) console.log(fmt(notifs));
  for (const n of notifs) {
    const read = n.readAt ? "READ" : "UNREAD";
    console.log(`  [${read}] ${n.type} → ${n.userEmail}  "${n.title}"`);
  }
  console.log();
  console.log("═══════════════════════════════════════════════\n");

  await client.end();
}

main().catch((e) => {
  console.error("DB inspection failed:", e.message);
  process.exit(1);
});
