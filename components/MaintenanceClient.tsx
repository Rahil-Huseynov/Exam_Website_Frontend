"use client";

import { useMaintenance } from "@/hooks/useMaintenance";

export default function MaintenanceClient() {
  useMaintenance({ skipPaths: ["/login", "/admin"], pollIntervalMs: null });
  return null;
}
