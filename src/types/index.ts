export type UserRole = "TEAM_MEMBER" | "MANAGER";

export interface AppUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
}
