'use client';

import { useLocale } from "@/contexts/locale-context";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Feature = {
  key: string;
  enabled: boolean;
};

export default function SettingsPage() {
  const { locale } = useLocale();
  const { t } = useTranslation(locale);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getFeature("maintenance")
      .then((data: Feature) => {
        setEnabled(!!data.enabled);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleFeature(value: boolean) {
    setSaving(true);
    setEnabled(value);

    await api.setFeature("maintenance", value);

    setSaving(false);
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚙️</span>
            <h1 className="text-4xl font-bold text-foreground">
              {t("settings.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("settings.description")}
          </p>
        </div>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {t("settings.maintenanceTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.maintenanceDesc")}
                </p>
              </div>
              <Badge variant={enabled ? "default" : "secondary"}>
                {enabled ? t("settings.active") : t("settings.inactive")}
              </Badge>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => toggleFeature(e.target.checked)}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors peer-disabled:opacity-50"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform peer-disabled:opacity-50"></div>
                </div>
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {enabled
                    ? t("settings.active")
                    : t("settings.inactive")}
                </span>
              </label>

              {saving && (
                <div className="flex items-center gap-2 ml-auto text-sm text-primary">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span>{t("settings.saving")}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
