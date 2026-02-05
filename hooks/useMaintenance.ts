"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

export function useMaintenance() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/login") || pathname.startsWith("/admin")) {
      localStorage.setItem("maintenance", "false");
      localStorage.removeItem("maintenance_redirected");
      return;
    }

    let cancelled = false;
    let timer: NodeJS.Timeout;

    async function fetchMaintenance() {
      try {
        const data: { key: string; enabled: boolean } =
          await api.getFeature("maintenance");

        if (cancelled) return;

        localStorage.setItem("maintenance", data.enabled ? "true" : "false");

        if (data.enabled) {
          localStorage.setItem("maintenance_redirected", "false");

          if (!pathname.startsWith("/maintenance")) {
            window.location.reload();
          }
        } else {
          localStorage.removeItem("maintenance_redirected");
        }
      } catch (err) {
        console.error("Maintenance check failed", err);
        if (!cancelled) {
          localStorage.setItem("maintenance", "false");
          localStorage.removeItem("maintenance_redirected");
        }
      }
    }

    fetchMaintenance();

    timer = setInterval(fetchMaintenance, 10_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);
}
