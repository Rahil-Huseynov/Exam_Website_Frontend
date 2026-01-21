import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function matchPath(pathname: string, basePath: string) {
  // /exam → match
  // /exam/123 → match
  // /exams → ❌ match YOX
  return pathname === basePath || pathname.startsWith(basePath + "/")
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value
  const pathname = request.nextUrl.pathname

  // 🔒 Protected routes (istədiyini buraya əlavə et)
  const protectedPaths = [
    "/dashboard",
    "/exam",
    "/exam-token",
    "/balance",
    "/profile",
    "/results",
    "/admin",
    "/packages",
    "/payments",
  ]

  // 🔓 Auth-only routes
  const authPaths = ["/login", "/register"]

  const isProtectedPath = protectedPaths.some((path) =>
    matchPath(pathname, path)
  )

  const isAuthPath = authPaths.some((path) =>
    matchPath(pathname, path)
  )

  // 🔐 Login tələb olunan səhifələr
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 🔁 Login olmuş user auth səhifələrinə girə bilməz
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.*|apple-icon.png).*)",
  ],
}
