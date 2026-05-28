import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = new PrismaClient({ adapter } as any) as any;

  const HASH_ROUNDS = 12;

  const manager = await db.user.upsert({
    where: { email: "manager@winos.internal" },
    update: {},
    create: {
      email: "manager@winos.internal",
      name: "Mohit (Manager)",
      password: await bcrypt.hash("password123", HASH_ROUNDS),
      role: "MANAGER",
    },
  });

  const member = await db.user.upsert({
    where: { email: "member@winos.internal" },
    update: {},
    create: {
      email: "member@winos.internal",
      name: "Test Member",
      password: await bcrypt.hash("password123", HASH_ROUNDS),
      role: "TEAM_MEMBER",
    },
  });

  console.log("Seeded users:");
  console.log(" ", manager.email, "→", manager.role);
  console.log(" ", member.email, "→", member.role);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
