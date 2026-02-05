import { NextRequest, NextResponse } from "next/server";

type FeatureResp = { key: string; enabled: boolean };

export async function GET(req: NextRequest) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const originPathHeader = req.headers.get("x-origin-path") || "";

  const referer = req.headers.get("referer") || "";
  let originPath = "";

  try {
    if (originPathHeader) {
      originPath = originPathHeader;
    } else if (referer) {
      originPath = new URL(referer).pathname;
    } else {
      originPath = "";
    }
  } catch (e) {
    originPath = "";
  }

  if (originPath.startsWith("/login") || originPath.startsWith("/admin")) {
    return NextResponse.json({ key: "maintenance", enabled: false } as FeatureResp);
  }

  try {
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL is not set");
      return NextResponse.json({ key: "maintenance", enabled: false } as FeatureResp);
    }

    const res = await fetch(`${API_URL}/feature/maintenance`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ key: "maintenance", enabled: false } as FeatureResp);
    }

    const data = (await res.json()) as FeatureResp;

    const isDocument = req.headers.get("sec-fetch-dest") === "document";
    if (isDocument && data.enabled && !originPath.startsWith("/maintenance")) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy fetch failed", err);
    return NextResponse.json({ key: "maintenance", enabled: false } as FeatureResp);
  }
}
