"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import pdfMake from "pdfmake/build/pdfmake.js";
import { useLocale } from "@/contexts/locale-context";
import { useTranslation } from "@/lib/i18n";
import { api, type Exam, type DraftQuestion } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { latexToHtml } from "../latex-preview";
import { OptionContent, QuestionContent } from "@/types/editor-types";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleMathEditor } from '@/components/simple-math-editor';
import { CheckCircle2, Trash2, Pencil, Plus, Save, X } from "lucide-react";
import { Virtuoso } from 'react-virtuoso';

type Option = {
    letter: string;
    text: string;
};

type Question = {
    qNo: number;
    stem: string;
    options: Option[];
};

type DraftSelectionMap = Record<string, string>;

function parseQuestionsFromText(input: string): Question[] {
    const lines = input.split("\n").map((line) => line.trim()).filter(Boolean);
    const questions: Question[] = [];
    let currentQuestion: Question | null = null;
    let currentQNo = 1;

    for (const line of lines) {
        const qMatch = line.match(/^(\d+)\.\s*(.*)/);
        if (qMatch) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            currentQNo = parseInt(qMatch[1], 10);
            currentQuestion = {
                qNo: currentQNo,
                stem: qMatch[2].trim(),
                options: [],
            };
            continue;
        }

        if (currentQuestion) {
            const optMatch = line.match(/^([A-E])\)\s*(.*)/i);
            if (optMatch) {
                currentQuestion.options.push({
                    letter: optMatch[1].toUpperCase(),
                    text: optMatch[2].trim(),
                });
            } else {
                currentQuestion.stem += " " + line.trim();
                currentQuestion.stem = currentQuestion.stem.trim();
            }
        }
    }

    if (currentQuestion) {
        questions.push(currentQuestion);
    }

    return questions.filter((q) => q.options.length >= 2);
}

async function generatePDF(questions: Question[], fileName: string): Promise<void> {
    const pdfFonts = await import("pdfmake/build/vfs_fonts.js");

    const vfs =
        (pdfFonts as any).default?.pdfMake?.vfs ||
        (pdfFonts as any).pdfMake?.vfs ||
        (pdfFonts as any).default ||
        pdfFonts;

    (pdfMake as any).vfs = vfs;

    const content: any[] = [];

    questions.forEach((q) => {
        content.push({
            text: `${q.qNo}. ${q.stem}`,
            style: "question",
            margin: [0, 15, 0, 8],
        });

        q.options.forEach((opt) => {
            content.push({
                text: `${opt.letter}) ${opt.text}`,
                style: "option",
                margin: [20, 0, 0, 4],
            });
        });

        content.push({ text: "", margin: [0, 20, 0, 0] });
    });

    const docDefinition = {
        content,
        styles: {
            question: {
                fontSize: 13,
                bold: true,
            },
            option: {
                fontSize: 12,
            },
        },
        defaultStyle: {
            fontSize: 12,
            lineHeight: 1.3,
        },
        pageMargins: [40, 40, 40, 40],
    };

    (pdfMake as any).createPdf(docDefinition).download(fileName);
}

export default function PDFCreatorPage() {
    const { locale } = useLocale();
    const { t } = useTranslation(locale);
    const { user } = useAuth();
    const isSuperAdmin = user?.role === "superadmin";

    const initialTextAz = ``;

    const [inputText, setInputText] = useState<string>(initialTextAz);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [draft, setDraft] = useState<DraftQuestion[]>([]);
    const [selectedCorrect, setSelectedCorrect] = useState<DraftSelectionMap>({});
    const [bulkPickText, setBulkPickText] = useState("");
    const [draftModalOpen, setDraftModalOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const total = useMemo(() => (Array.isArray(draft) ? draft.length : 0), [draft]);
    const listRef = useRef<any>(null);
    const draftExamType = "TEST"; // Assuming TEST for multiple choice

    const totalHasAnswered = useMemo(() => {
        if (!draft.length) return 0;
        return (draft as any[]).filter((q: any) => !!selectedCorrect[q.tempId]).length;
    }, [draft, selectedCorrect]);

    const canCommit = useMemo(() => {
        if (!selectedExamId || draft.length === 0) return false;
        return (draft as any[]).some((q: any) => !!selectedCorrect[q.tempId]);
    }, [selectedExamId, draft, selectedCorrect]);

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        if (draftModalOpen && draft.length > 0) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const index = 0;
                    listRef.current?.scrollToIndex({ index, align: "start" });
                });
            });
        }
    }, [draftModalOpen, draft]);

    async function loadExams() {
        try {
            const examsData = await api.getExamsForAdmin({});
            setExams(examsData);
        } catch (err) {
            toastError(err instanceof Error ? err.message : t("exams.errors.load_data_failed"));
        }
    }

    const handleParse = () => {
        const parsed = parseQuestionsFromText(inputText);
        setQuestions(parsed);

        // Convert to draft format
        const newDraft: any[] = parsed.map((q: any, index: number) => ({
            tempId: `q_${Date.now()}_${index}`,
            content: { text: q.stem || "" } as QuestionContent,
            options: (q.options || []).map((opt: any, optIndex: number) => ({
                tempOptionId: `o_${Date.now()}_${index}_${optIndex}`,
                content: { text: opt.text || "" } as OptionContent,
                clipUrls: [],
            })),
            qNo: q.qNo || index + 1,
            clipUrls: [],
        }));
        setDraft(newDraft as any);
        setSelectedCorrect({});
        setBulkPickText("");
    };

    const handleGeneratePDF = async () => {
        if (questions.length > 0) {
            try {
                await generatePDF(questions, t("fileName"));
            } catch (err) {
                console.error("PDF yaratma xətası:", err);
                alert(t("errorAlert"));
            }
        } else {
            alert(t("noQuestionsAlert"));
        }
    };

    function removeDraftQuestionCascade(qTempId: string) {
        setDraft((prev: any) => {
            const list = Array.isArray(prev) ? prev : [];
            const next = list
                .filter((x: any) => x.tempId !== qTempId)
                .map((x: any, i: number) => ({ ...x, qNo: i + 1 }));
            return next;
        });
        setSelectedCorrect((prev) => {
            if (!prev || !(qTempId in prev)) return prev;
            const copy = { ...prev };
            delete copy[qTempId];
            return copy;
        });
    }

    async function handleCommit() {
        if (!canCommit) {
            toastError(t("exams.errors.select_at_least_one"));
            return;
        }
        try {
            setBusy(true);
            const questions: any[] = (draft as any[])
                .filter((q) => !!selectedCorrect[q.tempId])
                .map((q) => {
                    const correctTempId = selectedCorrect[q.tempId];
                    const correctOpt = q.options.find((o: any) => o.tempOptionId === correctTempId);
                    if (!correctOpt) throw new Error(t("exams.errors.correct_option_missing"));
                    return {
                        text: latexToHtml(q.content.text),
                        options: q.options.map((o: any) => ({
                            text: latexToHtml(o.content.text),
                            imageUrls: o.clipUrls || [],
                        })),
                        correctAnswerText: latexToHtml(correctOpt.content.text),
                        imageUrls: q.clipUrls || [],
                    };
                });
            const payload = { questions };
            await api.importQuestionsDirect(selectedExamId, payload);
            toastSuccess(t("exams.success.saved_to_db"));
            setDraftModalOpen(false);
            setDraft([]);
            setSelectedCorrect({});
            setSelectedExamId("");
            setBulkPickText("");
        } catch (err) {
            toastError(err instanceof Error ? err.message : t("exams.errors.commit_failed"));
        } finally {
            setBusy(false);
        }
    }

    function updateDraftQuestion(tempId: string, content: QuestionContent) {
        setDraft((prev: any) => prev.map((q: any) => (q.tempId === tempId ? { ...q, content } : q)));
    }

    function updateDraftOption(qTempId: string, optTempId: string, content: OptionContent) {
        setDraft((prev: any) =>
            prev.map((q: any) => {
                if (q.tempId !== qTempId) return q;
                return {
                    ...q,
                    options: q.options.map((o: any) =>
                        o.tempOptionId === optTempId ? { ...o, content } : o
                    ),
                };
            })
        );
    }

    function addDraftOption(qTempId: string) {
        setDraft((prev: any) =>
            prev.map((q: any) => {
                if (q.tempId !== qTempId) return q;
                const nextIndex = q.options.length;
                const idBase = Date.now();
                return {
                    ...q,
                    options: [...q.options, {
                        tempOptionId: `o_${idBase}_${qTempId}_${nextIndex}`,
                        content: { text: "" } as OptionContent,
                    }],
                };
            })
        );
    }

    function removeDraftOption(qTempId: string, optTempId: string) {
        setDraft((prev: any) =>
            prev.map((q: any) => {
                if (q.tempId !== qTempId) return q;
                const nextOpts = q.options.filter((o: any) => o.tempOptionId !== optTempId);
                return { ...q, options: nextOpts };
            })
        );
        setSelectedCorrect((prev) => {
            if (prev[qTempId] !== optTempId) return prev;
            const copy = { ...prev };
            delete copy[qTempId];
            return copy;
        });
    }

    function addDraftQuestion(atIndex?: number) {
        setDraft((prev: any[]) => {
            const list = Array.isArray(prev) ? [...prev] : [];
            const nextNo = (list[list.length - 1]?.qNo ?? list.length) + 1;
            const q = {
                tempId: `q_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                qNo: nextNo,
                content: { text: "" } as QuestionContent,
                clipUrls: [],
                options: Array.from({ length: 5 }, (_, i) => ({
                    tempOptionId: `o_${Date.now()}_${nextNo}_${i}`,
                    content: { text: "" } as OptionContent,
                    clipUrls: [],
                })),
            };
            if (typeof atIndex === "number" && atIndex >= 0 && atIndex <= list.length) {
                list.splice(atIndex, 0, q);
                return list.map((x: any, idx: number) => ({ ...x, qNo: idx + 1 }));
            }
            list.push(q);
            return list.map((x: any, idx: number) => ({ ...x, qNo: idx + 1 }));
        });
    }

    function parseBulkPicks(input: string) {
        const txt = (input || "").trim();
        if (!txt) return [];
        const parts = txt
            .replace(/\n/g, " ")
            .split(/[,;]+|\s{2,}/g)
            .map((x) => x.trim())
            .filter(Boolean);
        const out: Array<{ qIndex: number; letter: string }> = [];
        for (const p of parts) {
            const m = p.match(/^(\d{1,4})\s*[-=:. ]\s*([a-eA-E])$/);
            if (!m) continue;
            out.push({ qIndex: Number(m[1]), letter: String(m[2]).toUpperCase() });
        }
        return out;
    }

    function applyBulkPicks() {
        if (!draft.length) return toastError(t("exams.errors.no_draft"));
        const picks = parseBulkPicks(bulkPickText);
        if (!picks.length) return toastError(t("exams.errors.bulk_invalid"));
        const letterToIdx = (l: string) => l.charCodeAt(0) - 65;
        setSelectedCorrect((prev) => {
            const next = { ...prev };
            for (const { qIndex, letter } of picks) {
                const i = qIndex - 1;
                if (i < 0 || i >= draft.length) continue;
                const q = (draft as any[])[i] as any;
                const optIdx = letterToIdx(letter);
                if (optIdx < 0 || optIdx >= q.options.length) continue;
                next[q.tempId] = q.options[optIdx].tempOptionId;
            }
            return next;
        });
        toastSuccess(t("exams.success.bulk_applied"));
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <p
                className="mb-6 text-gray-700"
                dangerouslySetInnerHTML={{ __html: t("instructions") }}
            />

            <textarea
                className="w-full h-96 p-4 border border-gray-400 rounded-lg mb-6 font-mono text-sm"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t("placeholder")}
            />

            <div className="flex gap-4 mb-8">
                <button
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                    onClick={handleParse}
                >
                    {t("parseButton")}
                </button>
                <button
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                    onClick={handleGeneratePDF}
                >
                    {t("generateButton")}
                </button>
                {questions.length > 0 && (
                    <button
                        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
                        onClick={() => setDraftModalOpen(true)}
                    >
                        {t("exams.ui.save_selected")}
                    </button>
                )}
            </div>

            {questions.length > 0 && (
                <>
                    <h2 className="text-2xl font-semibold mb-4">
                        {t("parsedTitle", { count: questions.length })}
                    </h2>
                    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                        {questions.map((q) => (
                            <div key={q.qNo} className="bg-white p-5 rounded shadow-sm border">
                                <p className="font-bold text-lg mb-3">
                                    {q.qNo}. {q.stem}
                                </p>
                                <ol type="A" className="list-[upper-alpha] pl-8 space-y-2">
                                    {q.options.map((opt) => (
                                        <li key={opt.letter}>{opt.text}</li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
                <DialogContent
                    className="!w-[98vw] !h-[96vh] max-w-none max-h-none rounded-2xl flex flex-col"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>{t("exams.ui.draft_modal_title")}</DialogTitle>
                        <DialogDescription>{t("exams.ui.draft_modal_desc")}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 mb-4">
                        <Select
                            value={selectedExamId}
                            onValueChange={setSelectedExamId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("exams.ui.select_exam")} />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map((e) => (
                                    <SelectItem key={e.id} value={e.id}>
                                        {e.title} • {e.university.name} • {e.subject.name} • {e.year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {total === 0 ? (
                        <div className="text-sm text-muted-foreground">{t("exams.ui.no_draft_yet")}</div>
                    ) : (
                        <div className="flex-1 min-h-0">
                            <Virtuoso
                                ref={listRef}
                                data={draft as any[]}
                                itemContent={(idx: any, q: any) => {
                                    const no = q.qNo ?? idx + 1;
                                    return (
                                        <div className="mb-4">
                                            <div
                                                key={q.tempId}
                                                id={`draft-q-${no}`}
                                                className="scroll-mt-24"
                                            >
                                                <Card className="border-muted">
                                                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                                                        <CardTitle className="text-base">{no}.</CardTitle>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => addDraftQuestion(idx + 1)}
                                                                disabled={busy}
                                                                title={t("exams.ui.add_question_after_this")}
                                                            >
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                {t("exams.ui.add_after")}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const ok = window.confirm(t("exams.confirm.delete_draft_question"));
                                                                    if (ok) removeDraftQuestionCascade(q.tempId);
                                                                }}
                                                                disabled={busy}
                                                                title={t("exams.ui.delete_question")}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                {t("common.delete")}
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="space-y-2">
                                                            <SimpleMathEditor
                                                                value={q.content.text}
                                                                onChange={(text) => updateDraftQuestion(q.tempId, { text })}
                                                                placeholder={t("exams.ui.question_placeholder")}
                                                                className="min-h-[120px]"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(!Array.isArray(q.options) || q.options.length === 0) && (
                                                                <div className="text-sm text-muted-foreground">
                                                                    {t("exams.ui.no_options_found")}
                                                                </div>
                                                            )}
                                                            <div className="space-y-2">
                                                                {(q.options || []).map((opt: any, oi: number) => {
                                                                    const checked = selectedCorrect[q.tempId] === opt.tempOptionId;
                                                                    return (
                                                                        <div key={opt.tempOptionId} className="flex flex-col gap-2 rounded-lg border p-3">
                                                                            <div className="flex items-start gap-2">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={q.tempId}
                                                                                    checked={checked}
                                                                                    onChange={() => setSelectedCorrect((prev) => ({ ...prev, [q.tempId]: opt.tempOptionId }))}
                                                                                    className="mt-2"
                                                                                    title={t("exams.ui.correct_answer")}
                                                                                />
                                                                                <div className="flex-1 space-y-2">
                                                                                    <SimpleMathEditor
                                                                                        value={opt.content.text}
                                                                                        onChange={(text) => updateDraftOption(q.tempId, opt.tempOptionId, { text })}
                                                                                        placeholder={`${String.fromCharCode(65 + oi)}) ${t("exams.ui.option_n", { n: oi + 1 })}`}
                                                                                        className="min-h-[80px]"
                                                                                    />
                                                                                </div>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    onClick={() => removeDraftOption(q.tempId, opt.tempOptionId)}
                                                                                    disabled={(q.options || []).length <= 2}
                                                                                    title={t("exams.ui.remove_option")}
                                                                                >
                                                                                    <X className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="flex gap-2 pt-2 items-center">
                                                                <Button type="button" variant="outline" onClick={() => addDraftOption(q.tempId)}>
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    {t("exams.ui.add_option")}
                                                                </Button>
                                                                <div className="text-xs text-muted-foreground">{t("exams.ui.note_min_2_unique")}</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    )}
                    <div className="mt-4 border-t pt-4 space-y-2">
                        <Label>{t("exams.ui.bulk_pick_label")}</Label>
                        <div className="flex gap-2">
                            <Input value={bulkPickText} onChange={(e) => setBulkPickText(e.target.value)} placeholder={t("exams.ui.bulk_pick_placeholder")} />
                            <Button type="button" variant="outline" onClick={applyBulkPicks} disabled={busy || total === 0}>
                                {t("exams.ui.apply")}
                            </Button>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                        <div className="text-sm text-muted-foreground">
                            {total > 0 && <>{t("exams.ui.selected_count", { selected: totalHasAnswered, total: total })}</>}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setDraftModalOpen(false)} disabled={busy} type="button">
                                {t("common.close")}
                            </Button>
                            <Button onClick={handleCommit} disabled={busy || !canCommit} type="button">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {busy ? t("exams.ui.sending") : t("exams.ui.save_selected")}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}