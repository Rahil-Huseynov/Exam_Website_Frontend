"use client";

import { Navbar } from "@/components/navbar";
import { PublicNavbar } from "@/components/public-navbar";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useTranslation } from "@/lib/i18n";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const { locale } = useLocale();
  const { t } = useTranslation(locale);
  const { user } = useAuth();

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        {user ? <Navbar /> : <PublicNavbar />}

        <div className="containerspecific">
          <div className="card">
            <div className="icon-wrapper">
              <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1>{t("error.title")}</h1>

            <p>{t("error.description")}</p>

            <span className="badge">{t("error.badge")}</span>

            <p style={{ marginTop: 16, color: '#9CA3AF', fontSize: 13 }}>{error?.message}</p>

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => reset()} className="primary-btn">
                {t("error.retry")}
              </button>

              <a href="/" className="secondary-link">
                {t("error.home")}
              </a>
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
            transition: transform 0.3s ease, box-shadow 0.3s ease;
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
            background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03));
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
            letter-spacing: -0.5px;
          }

          p {
            font-size: 16px;
            line-height: 1.6;
            color: #6b7280;
            margin-bottom: 8px;
          }

          .badge {
            display: inline-block;
            margin-top: 8px;
            padding: 8px 16px;
            border-radius: 9999px;
            background: #fee2e2;
            color: #991b1b;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(239,68,68,0.14);
          }

          .primary-btn {
            padding: 10px 18px;
            border-radius: 12px;
            background: linear-gradient(90deg, rgba(239,68,68,0.08), rgba(255,115,115,0.04));
            border: 1px solid rgba(239,68,68,0.12);
            font-weight: 600;
            cursor: pointer;
          }

          .secondary-link {
            display: inline-block;
            padding: 10px 18px;
            border-radius: 12px;
            font-weight: 600;
            text-decoration: none;
            color: #374151;
            border: 1px solid rgba(55,65,81,0.06);
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
