"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function MaintenanceGuard() {
  const router = useRouter()

  useEffect(() => {
    const maintenance = localStorage.getItem("maintenance")
    const redirected = localStorage.getItem("maintenance_redirected")
    const path = window.location.pathname

    if (maintenance === "false" && path.startsWith("/maintenance")) {
      router.replace("/")
      return
    }

    if (maintenance === "false" && redirected !== "true") {
      localStorage.setItem("maintenance_redirected", "true")
      router.replace("/")
      return
    }

    if (maintenance === "true" && !path.startsWith("/maintenance")) {
      router.replace("/maintenance")
      return
    }
  }, [])

  return null
}
