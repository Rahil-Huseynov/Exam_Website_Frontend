export function tokenKey(bankId: string) {
  return `exam_token_${bankId}`;
}

export function getExamToken(bankId: string) {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(tokenKey(bankId)) || "";
}

export function setExamToken(bankId: string, token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(tokenKey(bankId), token);
}

export function clearExamToken(bankId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(tokenKey(bankId));
}

export function listAllExamTokenPairs(): Array<{ bankId: string; token: string }> {
  if (typeof window === "undefined") return [];
  const out: Array<{ bankId: string; token: string }> = [];

  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i);
    if (!k) continue;
    if (!k.startsWith("exam_token_")) continue;

    const token = window.sessionStorage.getItem(k) || "";
    const bankId = k.replace("exam_token_", "");
    if (token && bankId) out.push({ bankId, token });
  }

  return out;
}

export function getCachedToken(bId: string) {
  if (typeof window === "undefined") return ""
  return window.sessionStorage.getItem(tokenKey(bId)) || ""
}
export function setCachedToken(bId: string, token: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(tokenKey(bId), token)
}
export function clearCachedToken(bId: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(tokenKey(bId))
}
