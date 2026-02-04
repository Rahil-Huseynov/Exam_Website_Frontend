"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function MaintenanceWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth(); 

  const allowedPaths = ["/login", "/admin", "/maintenance"];

  useEffect(() => {
    function checkMaintenance() {
      const raw = localStorage.getItem("maintenance");
      if (!raw) return;

      try {
        const data = JSON.parse(raw);

        if (data?.enabled === true) {
          if (user?.role === "superadmin" || user?.role === "admin") {
            return;
          }

          const isAllowed = allowedPaths.some((p) =>
            pathname.startsWith(p)
          );

          if (!isAllowed) {
            router.replace("/maintenance");
          }
        }
      } catch (e) {
        console.error("maintenance parse error", e);
      }
    }

    checkMaintenance();

    const interval = setInterval(checkMaintenance, 1000);
    window.addEventListener("storage", checkMaintenance);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkMaintenance);
    };
  }, [pathname, router, user]);

  return null;
}
