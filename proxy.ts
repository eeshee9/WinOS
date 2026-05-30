import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ROUTES, PUBLIC_ROUTES } from "@/constants/routes";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL(ROUTES.login, req.nextUrl));
  }

  if (isLoggedIn && pathname === ROUTES.login) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon\\.ico).*)"],
};
