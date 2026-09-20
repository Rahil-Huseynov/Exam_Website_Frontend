"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";

export function MaintenanceWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { locale } = useLocale();

  const allowedPaths = [`/${locale}/login`, `/${locale}/admin`, `/${locale}/maintenance`];

  useEffect(() => {
    function checkMaintenance() {
      const maintenance = localStorage.getItem("maintenance");
      if (!maintenance) return;

      if (user?.role === "superadmin" || user?.role === "admin") return;

      if (maintenance === "true") {
        const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));
        if (!isAllowed) {
          router.replace(`/${locale}/maintenance`);
        }
      } else {
        if (pathname.startsWith(`/${locale}/maintenance`)) {
          router.replace(`/${locale}/`);
        }
      }
    }

    checkMaintenance();
    window.addEventListener("storage", checkMaintenance);
    return () => window.removeEventListener("storage", checkMaintenance);
  }, [pathname, user, router]);

  return null;
}
