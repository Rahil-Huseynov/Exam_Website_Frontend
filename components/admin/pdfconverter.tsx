'use client';

import React from "react"

import { api } from "@/lib/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useLocale } from "@/contexts/locale-context";

export default function PdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const { locale } = useLocale()
  const { t } = useTranslation(locale)


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setProgress(0);
    setResultUrl(null);
    setError(null);
    setUploading(true);

    try {
      await api.pdfConverter(
        file,
        (p: number) => setProgress(p),
        (url: string) => {
          setResultUrl(url);
          setUploading(false);
        },
        (errMsg: string) => {
          setError(errMsg);
          setUploading(false);
        }
      );
    } catch (err: any) {
      setError(String(err));
      setUploading(false);
    }
  }

  return (

    <div>
      <div className="bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="space-y-8">

            <div className="space-y-3 text-center">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                  {t("pdf.title")}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("pdf.subtitle")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setError(null);
                  }}
                  disabled={uploading}
                  className="hidden"
                  id="pdf-input"
                />

                <label
                  htmlFor="pdf-input"
                  className={`flex flex-col items-center justify-center border border-border rounded-xl p-8 cursor-pointer transition-all duration-200 ${file
                    ? "bg-primary/5 border-primary"
                    : "hover:border-primary/50 hover:bg-muted/40"
                    } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className={`mb-3 transition-transform ${file ? "scale-110" : ""}`}>
                    <Upload className={`w-6 h-6 ${file ? "text-primary" : "text-muted-foreground"}`} />
                  </div>

                  <p className="text-sm font-medium text-foreground">
                    {file ? file.name : t("pdf.choose")}
                  </p>

                  <p className="text-xs text-muted-foreground mt-2">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : t("pdf.supported")}
                  </p>
                </label>
              </div>

              <Button
                type="submit"
                disabled={uploading || !file}
                size="lg"
                className="w-full h-11 font-medium transition-all"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>{t("pdf.converting")}</span>
                  </div>
                ) : (
                  t("pdf.convert")
                )}
              </Button>
            </form>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("pdf.processing")}
                  </p>
                  <p className="text-xs font-semibold text-primary">{progress}%</p>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            {error && (
              <Alert className="border-destructive bg-destructive/5">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive text-sm">
                  {t("pdf.error")}
                </AlertDescription>
              </Alert>
            )}

            {resultUrl && !uploading && (
              <div className="space-y-3 bg-muted/40 border border-border rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("pdf.done")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("pdf.ready")}
                    </p>
                  </div>
                </div>

                <a
                  href={resultUrl}
                  download
                  className="flex items-center justify-center gap-2 mt-4 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t("pdf.download")}
                </a>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>

  );
}
