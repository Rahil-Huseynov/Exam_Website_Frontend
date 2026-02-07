"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Navbar } from "@/components/navbar";
import { PublicNavbar } from "@/components/public-navbar";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useTranslation } from "@/lib/i18n";


export default function PaymentResultPage() {
  const { locale } = useLocale();
  const { t } = useTranslation(locale);
  const { user } = useAuth();

  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [outcome, setOutcome] = useState<"success" | "error" | null>(null);
  const [seconds, setSeconds] = useState(5);

  const VERIFY_URL =
    (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/payment/verify-redirect` : "/api/payment/verify-redirect");

  useEffect(() => {
    const run = async () => {
      const qs = typeof window !== "undefined" ? window.location.search : "";
      const params = new URLSearchParams(qs);
      const orderId = params.get("order_id") ?? params.get("orderId") ?? params.get("order");
      const transaction = params.get("transaction") ?? params.get("tx");
      const statusParam = params.get("status") ?? params.get("result") ?? params.get("state"); 

      if (!orderId && !transaction) {
        router.replace("/dashboard");
        return;
      }

      const statusLower = statusParam ? statusParam.toLowerCase() : null;
      const expectFromParam = statusLower === "success" || statusLower === "ok" || statusLower === "completed"
        ? "success"
        : statusLower ? "failed" : undefined;

      try {
        setChecking(true);

        const buildVerifyUrl = (expect?: string) => {
          const url = new URL(VERIFY_URL, typeof window !== "undefined" ? window.location.origin : undefined);
          if (orderId) url.searchParams.set("orderId", orderId);
          if (transaction) url.searchParams.set("transaction", transaction);
          if (expect) url.searchParams.set("expect", expect);
          return url.toString();
        };

        if (expectFromParam) {
          const resp = await fetch(buildVerifyUrl(expectFromParam), { credentials: "include" });
          if (!resp.ok) {
            router.replace("/dashboard");
            return;
          }
          const json = await resp.json();
          if (json && json.allowed) {
            setAllowed(true);
            setOutcome(expectFromParam === "success" ? "success" : "error");
            return;
          } else {
            router.replace("/dashboard");
            return;
          }
        }

        const respSuccess = await fetch(buildVerifyUrl("success"), { credentials: "include" });
        if (respSuccess.ok) {
          const j1 = await respSuccess.json();
          if (j1 && j1.allowed) {
            setAllowed(true);
            setOutcome("success");
            return;
          }
        }

        const respFailed = await fetch(buildVerifyUrl("failed"), { credentials: "include" });
        if (respFailed.ok) {
          const j2 = await respFailed.json();
          if (j2 && j2.allowed) {
            setAllowed(true);
            setOutcome("error");
            return;
          }
        }

        router.replace("/dashboard");
      } catch (err) {
        console.error("verify redirect error", err);
        router.replace("/dashboard");
      } finally {
        setChecking(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!allowed) return;
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    const timeout = setTimeout(() => router.push("/dashboard"), 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [allowed, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>{t("common.loading") ?? "Yoxlanılır…"}</div>
      </div>
    );
  }

  if (!allowed || outcome === null) return null; 

  const isSuccess = outcome === "success";

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        {user ? <Navbar /> : <PublicNavbar />}

        <div className="containerspecific">
          <div className={`card ${isSuccess ? "card-success" : "card-error"}`}>
            <div className={`icon-wrapper ${isSuccess ? "success" : "error"}`}>
              <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isSuccess ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </div>

            <h1>{isSuccess ? t("payment.success.title") : t("payment.error.title")}</h1>

            <p>{isSuccess ? t("payment.success.description") : t("payment.error.description")}</p>

            <span className={`badge ${isSuccess ? "success" : "error"}`}>
              {isSuccess ? t("payment.success.badge") : t("payment.error.badge")}
            </span>

            <p className="redirect-text">
              {isSuccess ? t("payment.redirect", { seconds }) : t("payment.redirect", { seconds })}
            </p>

            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-inline"
                aria-label="Go to dashboard now"
              >
                {t("payment.goToDashboard") ?? (isSuccess ? "İdarəetmə panelinə keç" : "İdarəetmə panelinə keç")}
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .containerspecific {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 40px 20px;
          }

          .card {
            background: #ffffff;
            border-radius: 20px;
            padding: 56px 48px;
            max-width: 520px;
            text-align: center;
            color: #1f2937;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.8);
            animation: fadeIn 0.6s ease-out;
          }

          .card-error {
            box-shadow: 0 20px 60px rgba(239, 68, 68, 0.06);
          }

          .icon-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
            position: relative;
          }

          .icon-wrapper.success::before {
            content: "";
            position: absolute;
            inset: -8px;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
            border-radius: 50%;
            filter: blur(24px);
          }
          .icon-wrapper.error::before {
            content: "";
            position: absolute;
            inset: -8px;
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
            border-radius: 50%;
            filter: blur(24px);
          }

          .icon {
            width: 56px;
            height: 56px;
            position: relative;
            z-index: 1;
            color: currentColor;
          }

          h1 {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #111827;
          }

          p {
            font-size: 16px;
            line-height: 1.6;
            color: #6b7280;
            margin-bottom: 28px;
          }

          .badge {
            display: inline-block;
            margin-top: 8px;
            padding: 8px 16px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
          }

          .badge.success {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
          }

          .badge.error {
            background: #fee2e2;
            color: #7f1d1d;
            border: 1px solid #fecaca;
          }

          .redirect-text {
            margin-top: 18px;
            font-size: 14px;
            color: #6b7280;
          }

          .btn-inline {
            background: transparent;
            border: 1px solid rgba(0,0,0,0.06);
            padding: 8px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
}