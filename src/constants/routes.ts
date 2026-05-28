export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  dsm: "/dsm",
  notes: "/notes",
} as const;

export const PUBLIC_ROUTES: string[] = [ROUTES.login];
