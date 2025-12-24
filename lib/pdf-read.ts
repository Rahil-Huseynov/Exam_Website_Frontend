"use client"

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist"
import "pdfjs-dist/build/pdf.worker.min.mjs"

GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs"

export async function readPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer()

  const loadingTask = getDocument({ data: buf })
  const pdf = await loadingTask.promise

  let fullText = ""
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const pageText = (content.items as any[])
      .map((it) => (it && "str" in it ? String((it as any).str) : ""))
      .join(" ")

    fullText += pageText + "\n"
  }

  return fullText.trim()
}
