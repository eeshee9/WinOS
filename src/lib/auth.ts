import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { verifyAndConsumeOtp } from "@/lib/otp";
import type { UserRole } from "@/types";

const COMPANY_DOMAIN = "eagleeyedigital.io";

// @auth/prisma-adapter types against @prisma/client; runtime shape is identical.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = PrismaAdapter(db as any);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "One-time code", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
        const otp = (credentials?.otp as string | undefined)?.trim();

        if (!email || !otp) return null;

        // Domain restriction — server-side, not bypassable from the client.
        if (!email.endsWith(`@${COMPANY_DOMAIN}`)) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await (db as any).user.findUnique({ where: { email } });

        // Provisioned-user gate: email must exist in the database.
        if (!user) return null;

        // OTP validation: verify code, check expiry, mark consumed (single-use).
        const valid = await verifyAndConsumeOtp(email, otp);
        if (!valid) return null;

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.name as string | null,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // DefaultUser.id is optional; authorize always sets it so the assertion is safe.
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
  },
});
