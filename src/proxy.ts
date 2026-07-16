import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login');
  
  // Protect all routes except login and API
  if (!isLoggedIn && !isAuthRoute) {
    return Response.redirect(new URL('/login', req.nextUrl));
  }
  
  // Redirect logged-in users away from the login page
  if (isLoggedIn && isAuthRoute) {
    return Response.redirect(new URL('/', req.nextUrl));
  }
});

export const config = {
  // Matches every route except API, embed, static assets, and images
  matcher: ['/((?!api|embed|_next/static|_next/image|favicon.ico).*)'],
};
