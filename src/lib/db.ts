import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  prismaReady: boolean;
};

const isDev = process.env.NODE_ENV !== "production";

function maskUrl(url: string) {
  return url.replace(/:([^:@]+)@/, ":***@");
}

function dbLog(...args: unknown[]) {
  if (isDev) console.log("[db]", ...args);
}

function dbError(operation: string, err: unknown) {
  if (!isDev) return;
  const e = err as Record<string, unknown>;
  console.error("[db] error during", operation, {
    code: e?.code,
    message: e?.message ?? String(err),
    meta: e?.meta,
  });
  if (e?.code === "P1017" || String(e?.message).includes("terminated")) {
    console.error("[db] → stale pool connection detected. Run: npm run db:restart");
  }
}

function createClient() {
  const url = process.env.DATABASE_URL ?? "";
  dbLog("connecting to:", maskUrl(url));

  const adapter = new PrismaPg({ connectionString: url });
  const client = new PrismaClient({ adapter, log: ["error"] });

  // Startup connectivity check — runs once per process in dev.
  if (isDev && !globalForPrisma.prismaReady) {
    globalForPrisma.prismaReady = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).user
      .count()
      .then((n: number) => dbLog("startup check: user.count =", n))
      .catch((e: unknown) => dbError("startup user.count()", e));
  }

  return client;
}

export const db = globalForPrisma.prisma ?? createClient();

if (isDev) globalForPrisma.prisma = db;
