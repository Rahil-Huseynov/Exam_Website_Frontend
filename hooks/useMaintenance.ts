"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { User } from "@/lib/api";

export function useMaintenance() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (pathname.startsWith("/login") || pathname.startsWith("/admin")) {
      localStorage.setItem("maintenance", "false");
      localStorage.removeItem("maintenance_redirected");
      return;
    }

    const role = (user as User | null)?.role;
    const isPrivileged = role === "admin" || role === "superadmin";

    if (isPrivileged) {
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
          signal: controller.signal,
        });

        if (cancelled) return;

        if (!res.ok) {
          localStorage.setItem("maintenance", "false");
          localStorage.removeItem("maintenance_redirected");
          return;
        }

        const data: { key: string; enabled: boolean } = await res.json();

        localStorage.setItem("maintenance", data.enabled ? "true" : "false");

        if (data.enabled) {
          localStorage.setItem("maintenance_redirected", "false");

          if (!pathname.startsWith("/maintenance")) {
            router.replace("/maintenance");
          }
        } else {
          localStorage.removeItem("maintenance_redirected");
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;

        if (!cancelled) {
          localStorage.setItem("maintenance", "false");
          localStorage.removeItem("maintenance_redirected");
        }
      }
    }

    fetchMaintenance();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pathname, router, user]);
}
