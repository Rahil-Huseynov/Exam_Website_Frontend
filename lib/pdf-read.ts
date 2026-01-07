// /src/lib/pdf-read.ts
"use client"

import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist"
import "pdfjs-dist/build/pdf.worker.min.mjs"
import { createWorker, type Worker as TesseractWorker } from "tesseract.js"

GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs"

export type PdfLine = { text: string; yPx: number; xPx: number }

export type PdfFigure = {
  yTop: number
  yBottom: number
  dataUrl: string
  area: number
}

export type PdfPageData = {
  page: number
  text: string
  imageUrl: string
  heightPx: number
  lines: PdfLine[]
  figures: PdfFigure[]
}

function clean(s: string): string {
  return (s || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v))
}

/** ---------- ✅ FALSE-POSITIVE FILTER (şəkil olmayanı kəssin) ---------- */
type FigureQuality = {
  darkRatio: number
  longH: number
  longV: number
}

function calcFigureQuality(c: HTMLCanvasElement): FigureQuality {
  const ctx = c.getContext("2d")
  if (!ctx) return { darkRatio: 0, longH: 0, longV: 0 }

  const w = c.width
  const h = c.height
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data

  const total = w * h
  const thr = 210

  const bin = new Uint8Array(total)
  let dark = 0

  let k = 0
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) | 0
    const isDark = lum < thr ? 1 : 0
    bin[k] = isDark
    if (isDark) dark++
    k++
  }

  const darkRatio = dark / Math.max(1, total)

  const minRunH = Math.floor(w * 0.65)
  const minRunV = Math.floor(h * 0.55)

  let longH = 0
  for (let y = 0; y < h; y++) {
    let run = 0
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      if (bin[p]) run++
      else {
        if (run >= minRunH) longH++
        run = 0
      }
    }
    if (run >= minRunH) longH++
  }

  let longV = 0
  for (let x = 0; x < w; x++) {
    let run = 0
    for (let y = 0; y < h; y++) {
      const p = y * w + x
      if (bin[p]) run++
      else {
        if (run >= minRunV) longV++
        run = 0
      }
    }
    if (run >= minRunV) longV++
  }

  return { darkRatio, longH, longV }
}

function isValidFigureCrop(c: HTMLCanvasElement): boolean {
  const w = c.width
  const h = c.height
  if (w < 40 || h < 20) return false

  const q = calcFigureQuality(c)

  // yumşaldıldı (2-ci/3-cü cədvəli kəsməsin)
  if (q.darkRatio > 0.28) return false
  if (q.longH + q.longV < 1) return false

  return true
}

/**
 * ✅ Figure detector + valid crop filter
 */
function extractFiguresFromCanvas(canvas: HTMLCanvasElement): PdfFigure[] {
  const ctx = canvas.getContext("2d")
  if (!ctx) return []

  const w = canvas.width
  const h = canvas.height
  const img = ctx.getImageData(0, 0, w, h)
  const data = img.data

  // 1) grayscale + mean
  const gray = new Uint8Array(w * h)
  let sum = 0
  let k = 0
  for (let i = 0; i < data.length; i += 4) {
    const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) | 0
    gray[k++] = lum
    sum += lum
  }
  const mean = sum / (w * h)
  const darkThr = Math.max(190, Math.min(235, mean - 10))

  // 2) Sobel edge
  const edge = new Uint8Array(w * h)
  const gxK = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const gyK = [1, 2, 1, 0, 0, 0, -1, -2, -1]

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0,
        gy = 0
      let ki = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const p = (y + dy) * w + (x + dx)
          const v = gray[p]
          gx += v * gxK[ki]
          gy += v * gyK[ki]
          ki++
        }
      }
      const mag = Math.abs(gx) + Math.abs(gy)
      edge[y * w + x] = mag > 140 ? 1 : 0
    }
  }

  // 3) binary = dark OR edge
  const bin = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const isDark = gray[i] < darkThr
    const isEdge = edge[i] === 1
    bin[i] = isDark || isEdge ? 1 : 0
  }

  // 4) dilate x3
  const dil1 = new Uint8Array(w * h)
  const dil2 = new Uint8Array(w * h)
  const dil3 = new Uint8Array(w * h)

  const dilateOnce = (src: Uint8Array, dst: Uint8Array) => {
    dst.fill(0)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x
        let v = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (src[p + dy * w + dx]) {
              v = 1
              break
            }
          }
          if (v) break
        }
        dst[p] = v
      }
    }
  }

  dilateOnce(bin, dil1)
  dilateOnce(dil1, dil2)
  dilateOnce(dil2, dil3)

  // 5) connected components
  const seen = new Uint8Array(w * h)
  const figs: PdfFigure[] = []

  const minArea = Math.floor(w * h * 0.0035)
  const minW = Math.floor(w * 0.12)
  const minH = Math.floor(h * 0.025)

  const qx = new Int32Array(w * h)
  const qy = new Int32Array(w * h)

  for (let y0 = 0; y0 < h; y0++) {
    for (let x0 = 0; x0 < w; x0++) {
      const p0 = y0 * w + x0
      if (seen[p0]) continue
      if (!dil3[p0]) continue

      let head = 0,
        tail = 0
      qx[tail] = x0
      qy[tail] = y0
      tail++
      seen[p0] = 1

      let minx = x0,
        maxx = x0,
        miny = y0,
        maxy = y0
      let area = 0

      while (head < tail) {
        const x = qx[head]
        const y = qy[head]
        head++
        area++

        if (x < minx) minx = x
        if (x > maxx) maxx = x
        if (y < miny) miny = y
        if (y > maxy) maxy = y

        const up = (y - 1) * w + x
        const dn = (y + 1) * w + x
        const lf = y * w + (x - 1)
        const rt = y * w + (x + 1)

        if (y > 0 && !seen[up] && dil3[up]) {
          seen[up] = 1
          qx[tail] = x
          qy[tail] = y - 1
          tail++
        }
        if (y < h - 1 && !seen[dn] && dil3[dn]) {
          seen[dn] = 1
          qx[tail] = x
          qy[tail] = y + 1
          tail++
        }
        if (x > 0 && !seen[lf] && dil3[lf]) {
          seen[lf] = 1
          qx[tail] = x - 1
          qy[tail] = y
          tail++
        }
        if (x < w - 1 && !seen[rt] && dil3[rt]) {
          seen[rt] = 1
          qx[tail] = x + 1
          qy[tail] = y
          tail++
        }
      }

      const bw = maxx - minx + 1
      const bh = maxy - miny + 1

      if (area < minArea) continue
      if (bw < minW || bh < minH) continue
      if (miny < h * 0.02) continue

      const pad = 16
      const cx = clamp(minx - pad, 0, w - 1)
      const cy = clamp(miny - pad, 0, h - 1)
      const cw = clamp(bw + pad * 2, 1, w - cx)
      const ch = clamp(bh + pad * 2, 1, h - cy)

      const c = document.createElement("canvas")
      c.width = cw
      c.height = ch

      const cctx = c.getContext("2d")
      if (!cctx) continue
      cctx.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch)

      if (!isValidFigureCrop(c)) continue

      figs.push({
        yTop: cy,
        yBottom: cy + ch,
        dataUrl: c.toDataURL("image/png"),
        area: cw * ch,
      })
    }
  }

  figs.sort((a, b) => b.area - a.area)

  // 16 az olurdu -> 28 etdik
  return figs.slice(0, 28)
}

async function ensureOcrWorker(): Promise<TesseractWorker> {
  try {
    return await createWorker("aze")
  } catch {
    return await createWorker("eng")
  }
}

export async function readPdfPagesSmart(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<PdfPageData[]> {
  const buf = await file.arrayBuffer()
  const pdf: PDFDocumentProxy = await getDocument({ data: buf }).promise

  const pages: PdfPageData[] = []
  const ocrWorker = await ensureOcrWorker()

  for (let p = 1; p <= pdf.numPages; p++) {
    const page: PDFPageProxy = await pdf.getPage(p)
    const viewport = page.getViewport({ scale: 4 })

    const canvas = document.createElement("canvas")
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    const ctx = canvas.getContext("2d")
    if (!ctx) continue

    await (page.render({ canvasContext: ctx, viewport } as any).promise as Promise<unknown>)
    const imageUrl = canvas.toDataURL("image/png")

    const content = await page.getTextContent()
    const items = content.items as any[]

    // daha stabil: yKey=2px bucket, xKey=2px bucket
    const rows = new Map<number, Array<{ x: number; s: string }>>()

    for (const it of items) {
      const str = it?.str ? String(it.str) : ""
      if (!str.trim()) continue

      const tx = it.transform as number[] | undefined
      const pdfX = tx?.[4] ?? 0
      const pdfY = tx?.[5] ?? 0

      const [vx, vy] = viewport.convertToViewportPoint(pdfX, pdfY)

      const yKey = Math.round(vy / 2) * 2
      const xKey = Math.round(vx / 2) * 2

      if (!rows.has(yKey)) rows.set(yKey, [])
      rows.get(yKey)!.push({ x: xKey, s: str })
    }

    const lines: PdfLine[] = []
    const sortedYs = Array.from(rows.keys()).sort((a, b) => a - b)

    for (const y of sortedYs) {
      const xs = rows.get(y) || []
      xs.sort((a, b) => a.x - b.x)

      const merged = clean(xs.map((z) => z.s).join(" "))
      if (merged) {
        lines.push({
          text: merged,
          yPx: y,
          xPx: xs[0]?.x ?? 0,
        })
      }
    }

    const pageText = lines.map((l) => l.text).join("\n").trim()

    let finalText = pageText
    if (finalText.trim().length < 60) {
      try {
        const res = await ocrWorker.recognize(imageUrl)
        const ocrText = res?.data?.text ? String(res.data.text) : ""
        if (ocrText.trim().length > finalText.trim().length) finalText = ocrText.trim()
      } catch {}
    }

    const figures = extractFiguresFromCanvas(canvas)

    pages.push({
      page: p,
      text: finalText,
      imageUrl,
      heightPx: canvas.height,
      lines,
      figures,
    })

    onProgress?.(Math.round((p / pdf.numPages) * 100))
  }

  try {
    await ocrWorker.terminate()
  } catch {}

  return pages
}
