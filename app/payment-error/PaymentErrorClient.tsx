"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Navbar } from "@/components/navbar";
import { PublicNavbar } from "@/components/public-navbar";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useTranslation } from "@/lib/i18n";

export default function PaymentErrorClient() {
  const { locale } = useLocale();
  const { t } = useTranslation(locale);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [seconds, setSeconds] = useState(5);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const orderId =
      searchParams.get("order_id") ??
      searchParams.get("orderId") ??
      searchParams.get("order");

    let foundKey: string | null = null;

    try {
      if (orderId) {
        const orderKey = `payment_token:${orderId}`;
        if (sessionStorage.getItem(orderKey)) {
          foundKey = orderKey;
        }
      }

      if (!foundKey && sessionStorage.getItem("payment_token")) {
        foundKey = "payment_token";
      }
    } catch (e) {
      foundKey = null;
    }

    if (!foundKey) {
      router.replace(user ? "/dashboard" : "/");
      return;
    }

    setAllowed(true);
  }, [searchParams, router, user]);

  useEffect(() => {
    if (!allowed) return;

    const orderId =
      searchParams.get("order_id") ??
      searchParams.get("orderId") ??
      searchParams.get("order");

    try {
      if (orderId) {
        sessionStorage.removeItem(`payment_token:${orderId}`);
      }
      sessionStorage.removeItem("payment_token");
    } catch (e) {
    }

    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [allowed, searchParams, router]);

  if (!allowed) return null;

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        {user ? <Navbar /> : <PublicNavbar />}

        <div className="containerspecific">
          <div className="card">
            <div className="icon-wrapper error">
              <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
