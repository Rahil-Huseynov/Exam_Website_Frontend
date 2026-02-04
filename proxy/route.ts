import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${API_URL}/feature/maintenance`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ key: "maintenance", enabled: false });
    }

    const data: { key: string; enabled: boolean } = await res.json();

    const isDocument = req.headers.get("sec-fetch-dest") === "document";
    if (isDocument && data.enabled && !req.nextUrl.pathname.startsWith("/maintenance")) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy fetch failed", err);
    return NextResponse.json({ key: "maintenance", enabled: false });
  }
}
