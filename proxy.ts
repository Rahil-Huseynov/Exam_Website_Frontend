import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!API_URL) {
    return NextResponse.next();
  }

  const res = await fetch(`${API_URL}/feature/maintenance`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.next();
  }

  const data: { key: string; enabled: boolean } = await res.json();

  if (data.enabled && !req.nextUrl.pathname.startsWith("/maintenance")) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|maintenance|favicon.ico).*)"],
};
