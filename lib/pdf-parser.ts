// /src/lib/pdf-parser.ts
"use client"

import type { PdfPageData } from "@/lib/pdf-read"

/** ----------------- TYPES ----------------- */
export type DraftOption = {
  tempOptionId: string
  text: string
  clipUrls?: string[]
}

export type DraftQuestion = {
  tempId: string
  text: string
  options: DraftOption[]
  page?: number
  qNo?: number
  clipUrls?: string[]
}

/** ----------------- UTILS ----------------- */
function cleanLine(s: string): string {
  return (s || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

function normalizeBase(raw: string): string {
  let t = (raw || "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()

  // "12 ." -> "12."
  t = t.replace(/(\d)\s+\./g, "$1.")
  t = t.replace(/(\d)\s+\)/g, "$1)")

  // A . / A ) / A: / A- -> A)
  t = t.replace(/\b([A-Ea-e])\s*[\)\.\:\-]\s*/g, (_m, l) => `${String(l).toUpperCase()}) `)

  // çox boşluqları yığ
  t = t.replace(/\n{3,}/g, "\n\n")
  return t.trim()
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of urls) {
    const key = u.slice(0, 140)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(u)
  }
  return out
}

/** ----------------- REGEX ----------------- */
// sual start: 12. 12) 12- 12:
const Q_START = /^\s*(\d{1,4})\s*[.)\-:]\s+/

// option label yalnız start
const OPT_START = /^\s*([A-Ea-e])\s*[\)\.\:\-]\s+/

// inline label: “ ... A) ... B) ...”
const OPT_INLINE = /(^|[\s•;,:])([A-Ea-e])\s*[\)\.\:\-]\s+/g

// Şəkil/cədvəl hint
const FIGURE_HINT =
  /(cədvəl|qrafik|diaqram|sxem|şəkil)\s*(?:\-|:)?\s*(?:\d+)?|aşağıda\s+(cədvəl|qrafik|şəkil|diaqram)|yuxarıda\s+(cədvəl|qrafik|şəkil|diaqram)|cədvələ\s+əsasən|qrafikə\s+əsasən|şəkilə\s+əsasən/i

const CAPTION_HINT = /(cədvəl|qrafik|diaqram|sxem|şəkil)\s*([0-9]{1,3})/i

function wantsFigure(text: string): boolean {
  return FIGURE_HINT.test(text || "")
}

function hasCaptionNear(lines: Array<{ text: string; yPx: number }>, y1: number, y2: number): boolean {
  for (const ln of lines) {
    if (ln.yPx < y1 - 24 || ln.yPx > y2 + 24) continue
    if (CAPTION_HINT.test(ln.text)) return true
  }
  return false
}

/** overlap util (pages parser üçün) */
function overlapLen(fTop: number, fBottom: number, y1: number, y2: number, pad = 12): number {
  const b1 = Math.min(y1, y2) - pad
  const b2 = Math.max(y1, y2) + pad
  const left = Math.max(fTop, b1)
  const right = Math.min(fBottom, b2)
  return Math.max(0, right - left)
}

type ParsedOpt = { letter: string; text: string; yStart: number; yEnd: number }

/**
 * ✅ Variant parsing SUPER STRONG:
 * 1) Start-line based (yPx varsa)
 * 2) Inline based
 * 3) OCR-text fallback (joined text)
 */
function parseQuestionBlock(blockLines: Array<{ text: string; yPx: number }>) {
  const joined = normalizeBase(blockLines.map((x) => x.text).join("\n"))
  const qm = joined.match(Q_START)
  if (!qm) return null

  const qNo = Number(qm[1])
  const afterQ = joined.replace(Q_START, "").trim()
  if (!afterQ) return null

  // -------- 1) START-LINE OPTIONS --------
  const optStarts: Array<{ idx: number; y: number; letter: string }> = []
  for (let i = 0; i < blockLines.length; i++) {
    const m = blockLines[i].text.match(OPT_START)
    if (m) optStarts.push({ idx: i, y: blockLines[i].yPx, letter: m[1].toUpperCase() })
  }

  if (optStarts.length >= 2) {
    const firstOptIdx = optStarts[0].idx
    const stemLines = blockLines.slice(0, firstOptIdx).map((x) => x.text)
    const stemText = normalizeBase(stemLines.join("\n")).replace(Q_START, "").trim() || afterQ

    const options: ParsedOpt[] = []
    for (let i = 0; i < optStarts.length; i++) {
      const s = optStarts[i]
      const endIdx = i + 1 < optStarts.length ? optStarts[i + 1].idx : blockLines.length
      const chunk = blockLines.slice(s.idx, endIdx)

      const first = chunk[0]?.text || ""
      const firstClean = cleanLine(first.replace(OPT_START, ""))
      const rest = cleanLine(chunk.slice(1).map((x) => x.text).join(" "))
      const optText = cleanLine([firstClean, rest].filter(Boolean).join(" "))

      const yStart = s.y
      const yEnd =
        i + 1 < optStarts.length ? optStarts[i + 1].y : (chunk[chunk.length - 1]?.yPx ?? yStart) + 2

      options.push({ letter: s.letter, text: optText, yStart, yEnd })
    }

    return { qNo, stem: stemText, options }
  }

  // -------- 2) INLINE OPTIONS --------
  const m2: Array<{ letter: string; index: number }> = []
  {
    let m: RegExpExecArray | null
    const re = new RegExp(OPT_INLINE)
    while ((m = re.exec(afterQ))) {
      const letter = String(m[2]).toUpperCase()
      const idx = m.index + (m[1] ? m[1].length : 0)
      m2.push({ letter, index: idx })
    }
  }

  if (m2.length >= 2) {
    const uniq: Array<{ letter: string; index: number }> = []
    const seen = new Set<string>()
    m2.sort((a, b) => a.index - b.index)
    for (const it of m2) {
      if (seen.has(it.letter)) continue
      seen.add(it.letter)
      uniq.push(it)
      if (uniq.length >= 5) break
    }

    const stem = cleanLine(afterQ.slice(0, uniq[0].index).trim()) || afterQ

    // yStart tapmaq üçün line scan
    const letterToY = new Map<string, number>()
    for (const ln of blockLines) {
      const t = ln.text
      for (const it of uniq) {
        if (letterToY.has(it.letter)) continue
        const r = new RegExp(`(^|\\s)${it.letter}\\s*[\\)\\.:\\-]\\s+`, "i")
        if (r.test(t)) letterToY.set(it.letter, ln.yPx)
      }
    }

    const options: ParsedOpt[] = []
    for (let i = 0; i < uniq.length; i++) {
      const cur = uniq[i]
      const next = i + 1 < uniq.length ? uniq[i + 1] : null
      const start = cur.index
      const end = next ? next.index : afterQ.length
      const seg = afterQ.slice(start, end)

      const segText = cleanLine(seg.replace(new RegExp(`(^|\\s)${cur.letter}\\s*[\\)\\.:\\-]\\s+`, "i"), ""))

      const yStart = letterToY.get(cur.letter) ?? 0
      const yEnd = next ? (letterToY.get(next.letter) ?? yStart + 2) : yStart + 2

      options.push({ letter: cur.letter, text: segText, yStart, yEnd })
    }

    return { qNo, stem, options }
  }

  // -------- 3) OCR-TEXT FALLBACK (joined2) --------
  const joined2 = normalizeBase(afterQ)
  const m3: Array<{ letter: string; index: number }> = []
  {
    let m: RegExpExecArray | null
    const re = new RegExp(OPT_INLINE)
    while ((m = re.exec(joined2))) {
      const letter = String(m[2]).toUpperCase()
      const idx = m.index + (m[1] ? m[1].length : 0)
      m3.push({ letter, index: idx })
    }
  }

  if (m3.length >= 2) {
    const uniq: Array<{ letter: string; index: number }> = []
    const seen = new Set<string>()
    m3.sort((a, b) => a.index - b.index)
    for (const it of m3) {
      if (seen.has(it.letter)) continue
      seen.add(it.letter)
      uniq.push(it)
      if (uniq.length >= 5) break
    }

    const stem = cleanLine(joined2.slice(0, uniq[0].index).trim()) || joined2
    const options: ParsedOpt[] = []

    for (let i = 0; i < uniq.length; i++) {
      const cur = uniq[i]
      const next = i + 1 < uniq.length ? uniq[i + 1] : null
      const start = cur.index
      const end = next ? next.index : joined2.length
      const seg = joined2.slice(start, end)
      const segText = cleanLine(seg.replace(new RegExp(`(^|\\s)${cur.letter}\\s*[\\)\\.:\\-]\\s+`, "i"), ""))
      options.push({ letter: cur.letter, text: segText, yStart: 0, yEnd: 0 })
    }

    return { qNo, stem, options }
  }

  return { qNo, stem: afterQ, options: [] as ParsedOpt[] }
}

/** ----------------- TEXT MERGE + SPLIT ----------------- */
export function mergePagesForParsing(pages: { page: number; text: string }[]) {
  return pages.map((p) => `\n[PAGE:${p.page}]\n${p.text}\n`).join("\n").trim()
}

/**
 * Daha diqqətli blok bölmə:
 * - [PAGE:x] marker ilə page saxlayır
 * - sual start-ları əsasında bölür
 * - OCR mətndə bəzən eyni sətirdə " ... 12. ..." olur: bunu yalnız lazımdırsa düzəldir
 */
function splitIntoQuestionBlocksSmart(merged: string): Array<{ page?: number; rawLines: string[] }> {
  let t = normalizeBase(merged)

  // OCR-bənzər mətnlərdə: "... cümlə 12. sual ..." -> yeni sətirə sal (daha ehtiyatla)
  // Yalnız o zaman ki, əvvəlki hissə çox uzundur (sadə "2023. ildə" kimi halları azaltsın)
  t = t.replace(/([^\n]{25,})\s+(\d{1,4})\.\s+(?=\S)/g, "$1\n$2. ")

  const parts = t.split(/(?=\[PAGE:\d+\])/g)

  const out: Array<{ page?: number; rawLines: string[] }> = []
  let currentPage: number | undefined

  for (let part of parts) {
    part = part.trim()
    if (!part) continue

    const pm = part.match(/^\[PAGE:(\d+)\]\s*/i)
    if (pm) {
      currentPage = Number(pm[1])
      part = part.replace(/^\[PAGE:\d+\]\s*/i, "").trim()
      if (!part) continue
    }

    // sual start-lara görə böl
    const chunks = part
      .split(/(?=(?:^|\n)\s*\d{1,4}\s*[.)\-:]\s+)/g)
      .map((x) => x.trim())
      .filter(Boolean)

    for (const c of chunks) {
      const rawLines = c
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
      if (rawLines.length) out.push({ page: currentPage, rawLines })
    }
  }

  return out
}

/** ----------------- PARSE FROM TEXT (inteqrasiya) ----------------- */
export function parseQuestionsFromText(rawMerged: string): DraftQuestion[] {
  const blocks = splitIntoQuestionBlocksSmart(rawMerged)
  const drafts: DraftQuestion[] = []
  const base = Date.now()
  let qIndex = 0

  for (const b of blocks) {
    // text blokunu "lines" kimi davran: yPx yoxdur -> i*10 ver
    const blockLines = b.rawLines.map((t, i) => ({ text: cleanLine(t), yPx: i * 10 }))
    const parsed = parseQuestionBlock(blockLines)
    if (!parsed) continue

    if (!parsed.options || parsed.options.length < 2) continue

    const optionDrafts: DraftOption[] = parsed.options.slice(0, 5).map((o, i) => ({
      tempOptionId: `o_${base}_${qIndex}_${i}`,
      text: cleanLine(o.text),
    }))

    drafts.push({
      tempId: `q_${base}_${qIndex}`,
      qNo: parsed.qNo,
      text: cleanLine(parsed.stem),
      page: b.page,
      options: optionDrafts,
    })

    qIndex++
  }

  return drafts.sort((a, b) => (a.page ?? 0) - (b.page ?? 0) || (a.qNo ?? 0) - (b.qNo ?? 0))
}

/** ----------------- PARSE FROM PAGES (əsl güclü parse) ----------------- */
export async function parseQuestionsFromPages(pages: PdfPageData[]): Promise<DraftQuestion[]> {
  const drafts: DraftQuestion[] = []
  const base = Date.now()
  let globalIndex = 0

  for (const pg of pages) {
    const lines = (pg.lines || [])
      .map((l) => ({ yPx: l.yPx, text: cleanLine(l.text) }))
      .filter((l) => l.text.length > 0)

    const starts: { idx: number; y: number }[] = []
    for (let i = 0; i < lines.length; i++) {
      if (Q_START.test(lines[i].text)) starts.push({ idx: i, y: lines[i].yPx })
    }
    if (!starts.length) continue

    const figs = (pg.figures || []).slice()

    for (let si = 0; si < starts.length; si++) {
      const startIdx = starts[si].idx
      const endIdxExcl = si + 1 < starts.length ? starts[si + 1].idx : lines.length
      const blockLines = lines.slice(startIdx, endIdxExcl)

      const parsed = parseQuestionBlock(blockLines)
      if (!parsed) continue
      if (!parsed.options || parsed.options.length < 2) continue

      const qStartY = starts[si].y
      const qEndY = si + 1 < starts.length ? starts[si + 1].y : (pg.heightPx ?? 999999) + 1

      // sual aralığında olan figure-lar (overlap-a görə)
      const qFigures = figs
        .filter((f) => overlapLen(f.yTop, f.yBottom, qStartY, qEndY, 22) >= 18)
        .sort((a, b) => b.area - a.area)

      // ---- buckets: stem + options ----
      type Bucket = { kind: "stem" | "opt"; oi?: number; y1: number; y2: number }
      const buckets: Bucket[] = [{ kind: "stem", y1: qStartY, y2: qEndY }]

      if (parsed.options.length >= 2) {
        const knownYs = parsed.options.map((o) => o.yStart).filter((v) => v > 0)
        const firstY = knownYs.length ? Math.min(...knownYs) : null
        if (firstY !== null) buckets[0].y2 = firstY

        for (let oi = 0; oi < parsed.options.length; oi++) {
          const o = parsed.options[oi]
          let y1 = o.yStart
          let y2 = o.yEnd
          if (!(y1 > 0 && y2 > 0)) {
            // fallback: bərabər böl
            const span = qEndY - qStartY
            const step = Math.max(1, span / Math.max(2, parsed.options.length))
            y1 = qStartY + step * oi
            y2 = qStartY + step * (oi + 1)
          }
          buckets.push({ kind: "opt", oi, y1, y2 })
        }
      }

      // ---- şəkil bağlama (dəqiqlik prioritet) ----
      const captionWants = hasCaptionNear(blockLines, qStartY, qEndY)
      const stemWants = wantsFigure(parsed.stem) || captionWants
      const optWants = parsed.options.map((o) => wantsFigure(o.text))

      const usedFigureKeys = new Set<string>()
      function figKey(f: any) {
        // sadə, stabil dedupe
        return `${Math.round(f.yTop)}::${Math.round(f.yBottom)}::${Math.round(f.area)}`
      }

      function pickTopFiguresForBucket(
        bucket: { y1: number; y2: number },
        maxCount: number,
        minOv: number,
        minArea: number,
      ) {
        const candidates = qFigures
          .map((f) => ({ f, ov: overlapLen(f.yTop, f.yBottom, bucket.y1, bucket.y2, 14) }))
          .filter((x) => x.ov >= minOv && (x.f?.area ?? 0) >= minArea)
          .sort((a, b) => b.ov - a.ov || b.f.area - a.f.area)

        const out: string[] = []
        for (const c of candidates) {
          if (!c.f?.dataUrl) continue
          const k = figKey(c.f)
          if (usedFigureKeys.has(k)) continue
          usedFigureKeys.add(k)
          out.push(c.f.dataUrl)
          if (out.length >= maxCount) break
        }
        return out
      }

      // ✅ düzgün minArea: page area faizi ilə
      const pageArea = Math.max(1, (pg.widthPx ?? 2000) * (pg.heightPx ?? 2000))
      const stemMinArea = Math.floor(pageArea * 0.02) // ~2%
      const optMinArea = Math.floor(pageArea * 0.012) // ~1.2%
      const fallbackMinArea = Math.floor(pageArea * 0.03) // ~3%

      const stemUrls: string[] = []
      const optToUrls: Record<number, string[]> = {}

      if (qFigures.length) {
        const stemBucket = buckets[0]
        const stemPicked = pickTopFiguresForBucket(stemBucket, stemWants ? 4 : 0, 22, stemMinArea)
        if (stemPicked.length) stemUrls.push(...stemPicked)

        // option-level bağlama: yalnız mətndə hint varsa
        for (let oi = 0; oi < parsed.options.length; oi++) {
          if (!optWants[oi]) continue

          const b = buckets.find((x) => x.kind === "opt" && x.oi === oi)
          if (!b) continue

          const picked = pickTopFiguresForBucket({ y1: b.y1, y2: b.y2 }, 2, 24, optMinArea)
          if (picked.length) optToUrls[oi] = picked
        }

        // ✅ fallback: hint olmasa da, iri figure varsa bağla (dəqiqlik üçün)
        if (!stemUrls.length) {
          const qBucket = { y1: qStartY, y2: qEndY }
          const fallbackPicked = pickTopFiguresForBucket(qBucket, 2, 28, fallbackMinArea)
          if (fallbackPicked.length) stemUrls.push(...fallbackPicked)
        }
      }

      const finalStemUrls = stemUrls.length ? dedupeUrls(stemUrls) : undefined

      const optionDrafts: DraftOption[] = parsed.options.slice(0, 5).map((o, oi) => {
        const urls = optToUrls[oi] || []
        return {
          tempOptionId: `o_${base}_${globalIndex}_${oi}`,
          text: cleanLine(o.text),
          clipUrls: urls.length ? dedupeUrls(urls) : undefined,
        }
      })

      drafts.push({
        tempId: `q_${base}_${globalIndex}`,
        qNo: parsed.qNo,
        text: cleanLine(parsed.stem),
        page: pg.page,
        clipUrls: finalStemUrls,
        options: optionDrafts,
      })

      globalIndex++
    }
  }

  return drafts
}

/** ----------------- ONE ENTRY (SMART STRATEGY) ----------------- */
export async function parseQuestionsFromPdfPagesSmart(pages: PdfPageData[]) {
  // Dəqiqlik üçün: həmişə iki yolu da işlət (byPages + byText) və merge et
  const byPages = await parseQuestionsFromPages(pages)

  const merged = mergePagesForParsing(pages.map((p) => ({ page: p.page, text: p.text })))
  const byText = parseQuestionsFromText(merged)

  const key = (q: DraftQuestion) => `${q.page ?? 0}::${q.qNo ?? 0}::${q.text.slice(0, 80)}`
  const seen = new Set(byPages.map(key))
  const mergedOut = [...byPages]
  for (const q of byText) {
    const k = key(q)
    if (seen.has(k)) continue
    seen.add(k)
    mergedOut.push(q)
  }

  return mergedOut.sort((a, b) => (a.page ?? 0) - (b.page ?? 0) || (a.qNo ?? 0) - (b.qNo ?? 0))
}
