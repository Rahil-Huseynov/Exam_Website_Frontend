"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useTranslation } from "@/lib/i18n";
import { Navbar } from "@/components/navbar";
import { PublicNavbar } from "@/components/public-navbar";

export default function NotFoundPage() {
  const { locale } = useLocale();
  const { t } = useTranslation(locale);
  const { user } = useAuth();

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        {user ? <Navbar /> : <PublicNavbar />}

        <div className="containerspecific">
          <div className="card">
            <div className="icon-wrapper">
              <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="9" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h1>{t("notFound.title")}</h1>

            <p>{t("notFound.description")}</p>

            <span className="badge">{t("notFound.badge")}</span>

            <div style={{ marginTop: 18 }}>
              <Link href="/" className="cta-link">
                {t("notFound.back")}
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          .containerspecific {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            background: bg-background;
            padding: 40px 20px;
          }

          .card {
            background: bg-background;
            border-radius: 20px;
            padding: 56px 48px;
            max-width: 520px;
            text-align: center;
            color: #1f2937;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.8);
            animation: fadeIn 0.6s ease-out;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 28px 80px rgba(0, 0, 0, 0.14), 0 0 1px rgba(0, 0, 0, 0.06);
          }

          .icon-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
            position: relative;
          }

          .icon-wrapper::before {
            content: '';
            position: absolute;
            inset: -8px;
            background: bg-background;
            border-radius: 50%;
            filter: blur(24px);
          }

          .icon {
            width: 56px;
            height: 56px;
            color: #2563eb;
            position: relative;
            z-index: 1;
          }

          h1 {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #111827;
            letter-spacing: -0.5px;
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
            background: bg-background;
            color: #1e3a8a;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(99,102,241,0.18);
          }

          .cta-link {
            display: inline-block;
            margin-top: 12px;
            padding: 10px 18px;
            border-radius: 12px;
            background: bg-background;
            color: #1f2937;
            font-weight: 600;
            text-decoration: none;
            border: 1px solid rgba(59,130,246,0.12);
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

          @media (max-width: 640px) {
            .card {
              padding: 40px 24px;
            }

            h1 {
              font-size: 24px;
            }

            p {
              font-size: 15px;
            }
          }
        `}</style>
      </div>
    </>
  );
}
