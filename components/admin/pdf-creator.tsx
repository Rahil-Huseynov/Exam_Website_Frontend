"use client";

import { useState } from "react";
import pdfMake from "pdfmake/build/pdfmake.js";
import { useLocale } from "@/contexts/locale-context";
import { useTranslation } from "@/lib/i18n";

type Option = {
    letter: string;
    text: string;
};

type Question = {
    qNo: number;
    stem: string;
    options: Option[];
};

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
    const { locale } = useLocale()
    const { t } = useTranslation(locale)

    const initialTextAz = ``;

    const [inputText, setInputText] = useState<string>(initialTextAz);
    const [questions, setQuestions] = useState<Question[]>([]);

    const handleParse = () => {
        const parsed = parseQuestionsFromText(inputText);
        setQuestions(parsed);
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
        </div>
    );
}