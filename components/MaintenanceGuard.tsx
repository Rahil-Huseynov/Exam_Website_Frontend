"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";

export function MaintenanceGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { locale } = useLocale()

  useEffect(() => {
    const maintenance = localStorage.getItem("maintenance");
    const redirected = localStorage.getItem("maintenance_redirected");

    if (user?.role === "superadmin" || user?.role === "admin") return;

    if (maintenance === "true" && !pathname.startsWith(`/${locale}/maintenance`)) {
      if (redirected !== "true") {
        localStorage.setItem("maintenance_redirected", "true");
        router.replace(`/${locale}/maintenance`);
      }
      return;
    }

    if ((maintenance === "false" || maintenance === null) && pathname.startsWith(`/${locale}/maintenance`)) {
      localStorage.removeItem("maintenance_redirected");
      router.replace(`/${locale}/`);
      return;
    }
  }, [pathname, user, router, locale]);

  return null;
}
