import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@/types";

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
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await (db as any).user.findUnique({ where: { email } });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password as string);
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
      // Spread to avoid direct assignment onto the optional session.user property.
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
