import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const response = NextResponse.next();

  // Professional Security Headers
  // 1. CSP: Protect against XSS by restricting where scripts/styles/images can come from
  // Note: Clerk and common fonts/images are allowed.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://clerk.rope.app https://*.clerk.accounts.dev;
    connect-src 'self' https://clerk.rope.app https://*.clerk.accounts.dev https://discord.com https://bible-api.com https://*.bible-api.com https://bolls.life https://*.bolls.life https://api.clerk.com;
    img-src 'self' blob: data: https://img.clerk.com https://images.unsplash.com https://*.googleusercontent.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self' https://clerk.rope.app https://*.clerk.accounts.dev;
    worker-src 'self' blob:;
    media-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);
  
  // 2. HSTS: Force HTTPS for 1 year
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  
  // 3. Prevent Clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  
  // 4. Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // 5. Control Referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // 6. XSS Protection (for older browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
