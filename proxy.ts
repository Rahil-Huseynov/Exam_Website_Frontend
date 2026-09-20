import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const LOCALES = ["az", "en", "ru"] as const
const DEFAULT_LOCALE = "az"

type Locale = (typeof LOCALES)[number]

function getLocaleFromPathname(
  pathname: string
): Locale | null {
  const firstSegment = pathname
    .split("/")
    .filter(Boolean)[0]

  if (
    firstSegment === "az" ||
    firstSegment === "en" ||
    firstSegment === "ru"
  ) {
    return firstSegment
  }

  return null
}

function isStaticOrSystemPath(
  pathname: string
): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/maintenance") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    /\.[^/]+$/.test(pathname)
  )
}

export async function proxy(
  req: NextRequest
) {
  const pathname = req.nextUrl.pathname

  /*
   * ----------------------------------------
   * 1. STATIC / SYSTEM ROUTES
   * ----------------------------------------
   */

  if (isStaticOrSystemPath(pathname)) {
    return NextResponse.next()
  }

  /*
   * ----------------------------------------
   * 2. MAINTENANCE CHECK
   * ----------------------------------------
   */

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL

  if (API_URL) {
    try {
      const res = await fetch(
        `${API_URL}/feature/maintenance`,
        {
          cache: "no-store",
        }
      )

      if (res.ok) {
        const data: {
          key: string
          enabled: boolean
        } = await res.json()

        if (
          data.enabled &&
          !pathname.startsWith("/maintenance")
        ) {
          return NextResponse.redirect(
            new URL("/maintenance", req.url)
          )
        }
      }
    } catch (error) {
      console.error(
        "Maintenance check failed:",
        error
      )
    }
  }

  /*
   * ----------------------------------------
   * 3. GET LOCALE
   * ----------------------------------------
   */

  const locale =
    getLocaleFromPathname(pathname)

  /*
   * ----------------------------------------
   * 4. NO LOCALE
   * ----------------------------------------
   *
   * /
   *   -> /az
   *
   * /exams
   *   -> /az/exams
   *
   * /news
   *   -> /az/news
   *
   * Bu redirect yalnız URL-də locale
   * olmadıqda işləyir.
   */

  if (!locale) {
    const url = req.nextUrl.clone()

    url.pathname =
      pathname === "/"
        ? `/${DEFAULT_LOCALE}`
        : `/${DEFAULT_LOCALE}${pathname}`

    return NextResponse.redirect(url)
  }

  /*
   * ----------------------------------------
   * 5. REQUEST HEADERS
   * ----------------------------------------
   */

  const requestHeaders = new Headers(
    req.headers
  )

  requestHeaders.set(
    "x-locale",
    locale
  )

  requestHeaders.set(
    "x-original-pathname",
    pathname
  )

  /*
   * ----------------------------------------
   * 6. REMOVE LOCALE FOR INTERNAL ROUTE
   * ----------------------------------------
   *
   * /az
   *    -> /
   *
   * /az/exams
   *    -> /exams
   *
   * /en/exams
   *    -> /exams
   *
   * /ru/news/123
   *    -> /news/123
   */

  const pathnameWithoutLocale =
    pathname.replace(
      new RegExp(
        `^/(${LOCALES.join("|")})(?=/|$)`
      ),
      ""
    ) || "/"

  const rewriteUrl =
    req.nextUrl.clone()

  rewriteUrl.pathname =
    pathnameWithoutLocale

  return NextResponse.rewrite(
    rewriteUrl,
    {
      request: {
        headers: requestHeaders,
      },
    }
  )
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico).*)",
  ],
}