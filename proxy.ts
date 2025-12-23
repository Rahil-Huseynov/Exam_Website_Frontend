import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value

  const protectedPaths = [
    "/dashboard",
    "/exams",
    "/exam",
    "/balance",
    "/profile",
    "/results",
    "/admin",
    "/packages",
    "/payments",
    "/news",
  ]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  const authPaths = ["/login", "/register"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.*|apple-icon.png).*)"],
}
