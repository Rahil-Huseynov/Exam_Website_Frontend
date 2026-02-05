"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function useMaintenance() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname.startsWith("/login")) {
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
          if (!pathname.startsWith("/maintenance")) {
            const alreadyRedirected = sessionStorage.getItem(
              "maintenance_redirected"
            );

            if (!alreadyRedirected) {
              sessionStorage.setItem("maintenance_redirected", "true");
              router.replace("/maintenance");
            }
          }
        }

        else {
          sessionStorage.removeItem("maintenance_redirected");

          if (pathname.startsWith("/maintenance")) {
            router.replace("/");
          }
        }
      } catch (err) {
        console.error("Maintenance check failed", err);
        if (!cancelled) {
          localStorage.setItem("maintenance", "false");
        }
      }
    }

    fetchMaintenance();

    timer = setInterval(fetchMaintenance, 10_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname, router]);
}
