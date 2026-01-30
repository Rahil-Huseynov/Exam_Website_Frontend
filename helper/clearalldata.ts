"use client";

export function clearAllCookies() {
  if (typeof window === "undefined") return;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
  }
}

export function clearAllData() {
  if (typeof window === "undefined") return;
  try {
    localStorage.clear();
    sessionStorage.clear();
    clearAllCookies();
  } catch {}
}

export function mark401Once() {
  if (typeof window === "undefined") return;
  localStorage.setItem("first_401_happened", "1");
}

export function has401Occurred() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("first_401_happened") === "1";
}

export function clear401Flag() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("first_401_happened");
}
