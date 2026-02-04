"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function MaintenanceGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const maintenance = localStorage.getItem("maintenance"); 
    const redirected = localStorage.getItem("maintenance_redirected"); 

    if (user?.role === "superadmin" || user?.role === "admin") return;

    if (maintenance === "false" && pathname.startsWith("/maintenance")) {
      router.replace("/");
      return;
    }

    if (maintenance === "false" && redirected !== "true") {
      localStorage.setItem("maintenance_redirected", "true");
      router.replace("/");
      return;
    }

    if (maintenance === "true" && !pathname.startsWith("/maintenance")) {
      router.replace("/maintenance");
      return;
    }
  }, [pathname, user]);

  return null;
}
