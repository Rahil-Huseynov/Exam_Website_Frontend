"use client";

import { useState } from "react";
import { readPdfText } from "@/lib/pdf-read";
import { parseQuestionsFromText, type DraftQuestion } from "@/lib/pdf-parser";
import { api } from "@/lib/api";

export default function PdfImportClient({ bankId }: { bankId: string }) {
  const [draft, setDraft] = useState<DraftQuestion[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");

  async function onPickPdf(file: File) {
    setError("");
    setLoading(true);
    try {
      const text = await readPdfText(file);
      const parsed = parseQuestionsFromText(text);
      setDraft(parsed);
      setSelectedCorrect({});
    } catch (e: any) {
      setError(e?.message || "PDF oxuma xətası");
    } finally {
      setLoading(false);
    }
  }

  async function onCommit() {
    setError("");
    setCommitting(true);
    try {
      const questions = draft.map((q) => ({
        ...q,
        correctTempOptionId: selectedCorrect[q.tempId],
      }));

      const missing = questions.find((q) => !q.correctTempOptionId);
      if (missing) throw new Error("Bütün suallarda correct cavabı seç!");

      await api.commitQuestionsDirect(bankId, { questions });

      setDraft([]);
      setSelectedCorrect({});
      alert("Uğurla DB-yə yazıldı ✅");
    } catch (e: any) {
      setError(e?.message || "Commit xətası");
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>PDF Import (Front Read)</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPickPdf(f);
          }}
        />
      </div>

      {loading && <p>PDF oxunur...</p>}
      {error && <p style={{ color: "red", fontWeight: 600 }}>{error}</p>}

      <div style={{ marginTop: 12 }}>
        {draft.map((q, idx) => (
          <div
            key={q.tempId}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 14,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>
              {idx + 1}. {q.text}
            </div>

            <div>
              {q.options.map((opt) => (
                <label
                  key={opt.tempOptionId}
                  style={{
                    display: "block",
                    padding: "6px 8px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name={q.tempId}
                    checked={selectedCorrect[q.tempId] === opt.tempOptionId}
                    onChange={() =>
                      setSelectedCorrect((p) => ({ ...p, [q.tempId]: opt.tempOptionId }))
                    }
                    style={{ marginRight: 10 }}
                  />
                  {opt.text}
                </label>
              ))}
            </div>

            {!selectedCorrect[q.tempId] && (
              <div style={{ marginTop: 8, color: "#b45309", fontWeight: 600 }}>
                ⚠️ Correct cavabı seçilməyib
              </div>
            )}
          </div>
        ))}
      </div>

      {draft.length > 0 && (
        <button
          onClick={onCommit}
          disabled={committing}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {committing ? "DB-yə yazılır..." : "Commit (DB-yə yaz)"}
        </button>
      )}
    </div>
  );
}
