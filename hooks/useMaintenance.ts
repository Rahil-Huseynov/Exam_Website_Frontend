"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type FeatureResp = { key: string; enabled: boolean };

export function useMaintenance({
  skipPaths = ["/login", "/admin"],
  pollIntervalMs = null as number | null, 
} = {}) {
  const pathname = usePathname();

  useEffect(() => {
    const shouldSkip = skipPaths.some((p) => pathname.startsWith(p));
    if (shouldSkip) {
      localStorage.setItem("maintenance", "false");
      localStorage.removeItem("maintenance_redirected");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function fetchMaintenance() {
      try {
        const res = await fetch("/api/feature/maintenance", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "x-origin-path": pathname,
          },
        });

        if (!res.ok) {
          if (!cancelled) {
            localStorage.setItem("maintenance", "false");
            localStorage.removeItem("maintenance_redirected");
          }
          return;
        }

        const data = (await res.json()) as FeatureResp;
        if (cancelled) return;

        if (data.enabled) {
          localStorage.setItem("maintenance", "true");
          localStorage.setItem("maintenance_redirected", "false");
        } else {
          localStorage.setItem("maintenance", "false");
          localStorage.removeItem("maintenance_redirected");
        }
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        console.error("useMaintenance fetch failed:", err);
        if (!cancelled) {
          localStorage.setItem("maintenance", "false");
          localStorage.removeItem("maintenance_redirected");
        }
      }
    }

    fetchMaintenance();

    let timerId: number | undefined;
    if (pollIntervalMs && pollIntervalMs > 0) {
      timerId = window.setInterval(fetchMaintenance, pollIntervalMs);
    }

    return () => {
      cancelled = true;
      controller.abort();
      if (timerId) clearInterval(timerId);
    };
  }, [pathname, skipPaths, pollIntervalMs]);
}
