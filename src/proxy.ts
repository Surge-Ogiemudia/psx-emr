import { auth } from "@/auth";

export default auth((req) => {
  // req.auth only reflects NextAuth's own session-token cookie (set when someone
  // completes the Credentials sign-in flow here directly). It knows nothing about
  // the separate SSO session_token cookie that pages verify via getSsoSession() in
  // lib/tenant.ts — so relying on req.auth alone redirected every SSO-authenticated
  // visitor to /login before their page ever got a chance to run that check.
  // The proxy runs on the Edge runtime, where verifying the JWT signature isn't
  // worth doing twice — presence is enough here; getSsoSession() still does the
  // real cryptographic verification (and its own redirect) once the request reaches
  // the page, so a forged/expired cookie doesn't actually get anyone in.
  const hasSsoCookie = !!req.cookies.get('session_token')?.value;
  const isLoggedIn = !!req.auth || hasSsoCookie;
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login');

  // Protect all routes except login and API
  if (!isLoggedIn && !isAuthRoute) {
    return Response.redirect(new URL('/login', req.nextUrl));
  }

  // Removed redirect from login page to prevent infinite loops when cookies are expired
  if (isLoggedIn && isAuthRoute) {
    // Just let them render the login page, they can re-authenticate
  }
});

export const config = {
  // Matches every route except API, embed, static assets, and images
  matcher: ['/((?!api|embed|_next/static|_next/image|favicon.ico).*)'],
};
