"use server"

import { setAuthCookie, removeAuthCookie } from "@/lib/cookies"
import { redirect } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function loginAction(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Login failed" }))
      return { success: false, error: error.message || "Login failed" }
    }

    const data = await response.json()
    await setAuthCookie(data.accessToken || data.accessToken)
    return { success: true, user: data.user || data.admin }
  } catch (error) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function registerAction(email: string, password: string, firstName: string, lastName?: string) {
  try {
    const response = await fetch(`${API_URL}/auth/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Registration failed" }))
      return { success: false, error: error.message || "Registration failed" }
    }

    const data = await response.json()
    return { success: true, email: data.email, message: data.message }
  } catch (error) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function verifyEmailAction(email: string, code: string) {
  try {
    const response = await fetch(`${API_URL}/auth/user/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Verification failed" }))
      return { success: false, error: error.message || "Verification failed" }
    }

    const data = await response.json()
    await setAuthCookie(data.accessToken)
    return { success: true, user: data.user }
  } catch (error) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function resendVerificationAction(email: string) {
  try {
    const response = await fetch(`${API_URL}/auth/user/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Resend failed" }))
      return { success: false, error: error.message || "Resend failed" }
    }

    const data = await response.json()
    return { success: true, message: data.message }
  } catch (error) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function logoutAction() {
  await removeAuthCookie()
  redirect("/")
}

export async function verifyTokenAction(token: string) {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      await removeAuthCookie()
      return null
    }

    return await response.json()
  } catch (error) {
    await removeAuthCookie()
    return null
  }
}
