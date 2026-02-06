// app/payment-error/page.tsx  (or pages/payment-error.tsx) — client component
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Navbar } from "@/components/navbar";
import { PublicNavbar } from "@/components/public-navbar";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useTranslation } from "@/lib/i18n";

export default function PaymentErrorPage() {
  const { locale } = useLocale();
  const { t } = useTranslation(locale);
  const { user } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [seconds, setSeconds] = useState(5);

  const orderId = searchParams?.get("order_id") ?? searchParams?.get("orderId") ?? searchParams?.get("order");
  const transaction = searchParams?.get("transaction") ?? searchParams?.get("tx");

  const VERIFY_URL =
    (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/payments/verify-redirect` : "/api/payments/verify-redirect");

  useEffect(() => {
    const verify = async () => {
      if (!orderId) {
        router.replace("/dashboard");
        return;
      }

      try {
        setChecking(true);
        const url = new URL(VERIFY_URL, typeof window !== 'undefined' ? window.location.origin : undefined);
        url.searchParams.set("orderId", orderId);
        url.searchParams.set("expect", "failed");

        if (transaction) url.searchParams.set("transaction", transaction);

        const resp = await fetch(url.toString(), { credentials: "include" });
        const json = await resp.json();

        if (json && json.allowed) {
          setAllowed(true);
          setChecking(false);
        } else {
          setAllowed(false);
          setChecking(false);
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("verify error", err);
        setChecking(false);
        router.replace("/dashboard");
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

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
        <div>Yoxlanılır…</div>
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        {user ? <Navbar /> : <PublicNavbar />}

        <div className="containerspecific">
          <div className="card">
            <div className="icon-wrapper error">
              <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h1>{t("payment.error.title")}</h1>

            <p>{t("payment.error.description")}</p>

            <span className="badge error">{t("payment.error.badge")}</span>

            <p className="redirect-text">{t("payment.redirect", { seconds })}</p>
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
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
            animation: fadeIn 0.6s ease-out;
          }

          .redirect-text {
            margin-top: 18px;
            font-size: 14px;
            color: #6b7280;
          }

          .icon-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
            position: relative;
          }

          .icon-wrapper.error::before {
            content: '';
            position: absolute;
            inset: -8px;
            background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05));
            border-radius: 50%;
            filter: blur(24px);
          }

          .icon {
            width: 56px;
            height: 56px;
            color: #ef4444;
            position: relative;
            z-index: 1;
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

          .badge.error {
            background: #fee2e2;
            color: #7f1d1d;
            border: 1px solid #fecaca;
            padding: 8px 16px;
            border-radius: 9999px;
            font-size: 13px;
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
