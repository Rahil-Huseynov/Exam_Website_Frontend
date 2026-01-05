"use client"

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist"
import "pdfjs-dist/build/pdf.worker.min.mjs"
GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs"
import { createWorker } from "tesseract.js"
export async function readPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const pdf = await getDocument({ data: buf }).promise
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

export type PdfPageData = {
  page: number
  text: string
  imageUrl: string
}
function buildLines(items: any[]) {
  const rows = new Map<number, string[]>()
  for (const it of items) {
    const str = it?.str ? String(it.str) : ""
    if (!str.trim()) continue
    const y = Math.round((it.transform?.[5] ?? 0) * 2) / 2
    if (!rows.has(y)) rows.set(y, [])
    rows.get(y)!.push(str)
  }

  return Array.from(rows.keys())
    .sort((a, b) => b - a)
    .map((y) => rows.get(y)!.join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
}

export async function readPdfPagesSmart(file: File): Promise<PdfPageData[]> {
  const buf = await file.arrayBuffer()
  const pdf = await getDocument({ data: buf }).promise
  const pages: PdfPageData[] = []

  let ocrWorker: any = null
  try {
    ocrWorker = await createWorker("aze")
  } catch {
    ocrWorker = await createWorker("eng")
  }

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)

    let content = await page.getTextContent()
    let pageText = buildLines(content.items as any[])

    const viewport = page.getViewport({ scale: 4 })
    const canvas = document.createElement("canvas")
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    await (page.render({ canvasContext: canvas.getContext("2d")!, viewport } as any).promise as Promise<any>)
    const imageUrl = canvas.toDataURL("image/png")
    if (pageText.trim().length < 50) {
      try {
        const res = await ocrWorker.recognize(imageUrl)
        const ocrText = res?.data?.text ? String(res.data.text) : ""
        if (ocrText.trim().length > pageText.trim().length) {
          pageText = ocrText.trim()
        }
      } catch {
      }
    }

    pages.push({ page: p, text: pageText, imageUrl })
  }

  try {
    await ocrWorker.terminate()
  } catch {}

  return pages
}
