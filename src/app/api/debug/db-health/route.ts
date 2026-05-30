import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Dev-only endpoint — hard-blocked in production.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = process.env.DATABASE_URL ?? "";
  // Extract host and port from the connection string for display.
  const match = url.match(/\/\/[^:@]+:[^@]+@([^:/]+):(\d+)\//);
  const host = match?.[1] ?? "(unknown)";
  const port = match?.[2] ?? "(unknown)";

  try {
    // Sequential — parallel queries saturate the local Prisma dev PG pool (P1017).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userCount = await (db as any).user.count();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const otpTokenCount = await (db as any).otpToken.count();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationCount = await (db as any).notification.count();

    return NextResponse.json({
      ok: true,
      databaseUrlHost: host,
      databaseUrlPort: port,
      userCount,
      otpTokenCount,
      notificationCount,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e), databaseUrlHost: host, databaseUrlPort: port },
      { status: 500 },
    );
  }
}
