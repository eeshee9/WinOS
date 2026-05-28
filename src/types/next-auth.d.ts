import type { UserRole } from "@/types";

// JWT is defined in @auth/core/jwt — augmenting "next-auth/jwt" (re-exporter) has no effect.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

// User and Session are defined in @auth/core/types — augmenting "next-auth" (re-exporter) has no effect.
declare module "@auth/core/types" {
  interface User {
    role: UserRole;
  }
}
