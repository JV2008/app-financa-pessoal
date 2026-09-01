export const runtime = "nodejs";

import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  console.log("MIDDLEWARE:", {
    pathname,
    isLoggedIn,
  });

  const isOnAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  if (pathname === "/") {
    return;
  }

  if (isOnAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", req.url));
    }

    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/auth|api/register|api/accounts|api/transactions|api/investments).*)",
  ],
};