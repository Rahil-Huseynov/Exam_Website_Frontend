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

    let timerId: number | undefined;
    const controller = new AbortController();

    async function fetchMaintenance() {
      try {
        const data: { key: string; enabled: boolean } =
          await api.getFeature("maintenance");

        localStorage.setItem("maintenance", data.enabled ? "true" : "false");

        if (data.enabled) {
          localStorage.setItem("maintenance_redirected", "false");
        } else {
          localStorage.removeItem("maintenance_redirected");
        }
      } catch (err) {
        if ((err as any)?.name === "AbortError") {
          return;
        }
        localStorage.setItem("maintenance", "false");
        localStorage.removeItem("maintenance_redirected");
      }
    }

    fetchMaintenance();
    timerId = window.setInterval(fetchMaintenance, 10_000);

    return () => {
      controller.abort();
      if (timerId !== undefined) window.clearInterval(timerId);
    };
  }, [pathname]);
}
