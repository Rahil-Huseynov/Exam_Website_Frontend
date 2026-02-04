"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

export function useMaintenance(pollInterval = 60_000) {
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function check() {
      try {
        const data = await api.getFeature("maintenance");
        if (data && (typeof data === "object")) {
          localStorage.setItem("maintenance", JSON.stringify(data));
        } else {
          localStorage.removeItem("maintenance");
        }
      } catch (err) {
        console.error("Maintenance check failed:", err);
      }
    }

    check();
    const id = setInterval(() => {
      if (!cancelledRef.current) check();
    }, pollInterval);

    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [pollInterval]);
}
