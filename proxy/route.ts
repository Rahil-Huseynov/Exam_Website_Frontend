import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API_URL}/feature/maintenance`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.redirect(new URL(req.nextUrl.pathname, req.url));
  }

  const data: { key: string; enabled: boolean } = await res.json();

  if (data.enabled && !req.nextUrl.pathname.startsWith("/maintenance")) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  return NextResponse.redirect(new URL(req.nextUrl.pathname, req.url));
}
