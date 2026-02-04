"use client";
import { useEffect } from "react";
import { api } from "@/lib/api";

export function useMaintenance() {
  useEffect(() => {
    async function fetchMaintenance() {
      try {
        const data: { key: string; enabled: boolean } = await api.getFeature("maintenance");

        // enabled true/false kimi localStorage-da saxla
        localStorage.setItem("maintenance", data.enabled ? "true" : "false");

        // redirect flag-ı resetlə yalnız enabled true olduqda
        if (data.enabled) {
          localStorage.setItem("maintenance_redirected", "false");
        }

      } catch (err) {
        console.error("Maintenance check failed", err);
        localStorage.setItem("maintenance", "false");
      }
    }

    fetchMaintenance();
  }, []);
}
