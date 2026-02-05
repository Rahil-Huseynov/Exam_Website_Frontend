"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function useMaintenance() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let timer: NodeJS.Timeout;

    async function checkMaintenance() {
      try {
        const data: { key: string; enabled: boolean } =
          await api.getFeature("maintenance");

        if (cancelled) return;

        const pathname = window.location.pathname;

        if (pathname.startsWith("/login")) return;

        if (data.enabled) {
          if (!pathname.startsWith("/maintenance")) {
            router.replace("/maintenance");
          }
        }
        else {
          if (pathname.startsWith("/maintenance")) {
            router.replace("/");
          }
        }
      } catch (err) {
        console.error("Maintenance check failed", err);
      }
    }

    checkMaintenance();

    timer = setInterval(checkMaintenance, 10_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [router]); 
}
