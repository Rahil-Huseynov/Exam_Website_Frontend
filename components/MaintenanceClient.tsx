"use client";

import { useMaintenance } from "@/hooks/useMaintenance";

export default function MaintenanceClient() {
  useMaintenance();
  return null;
}
