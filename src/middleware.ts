import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
export { default } from "next-auth/middleware";

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const url = request.nextUrl;

    // Redirect authenticated users away from auth pages
    if (token && 
        (
            url.pathname.startsWith("/sign-in") ||
            url.pathname.startsWith("/sign-up") ||
            url.pathname.startsWith('/verify-code') ||
            url.pathname === '/' // Changed from startsWith to exact match
        ) 
    ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Redirect unauthenticated users away from protected pages
    if (!token && url.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Allow the request to continue
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/sign-in",
        "/sign-up",
        "/",
        "/dashboard/:path*",
        "/verify/:path*"
    ]
}