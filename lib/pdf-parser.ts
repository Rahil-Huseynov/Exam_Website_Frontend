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

  // OCR-bənzər: "... cümlə 12. sual ..." -> yeni sətirə sal (ehtiyatla)
  t = t.replace(/([^\n]{25,})\s+(\d{1,4})\.\s+(?=\S)/g, "$1\n$2. ")

  const lines = t.split("\n").map((x) => x.trim()).filter(Boolean)

  const out: Array<{ page?: number; rawLines: string[] }> = []

  let currentPage: number | undefined
  let curBlockLines: string[] = []
  let curBlockPage: number | undefined

  const flush = () => {
    if (curBlockLines.length) out.push({ page: curBlockPage, rawLines: curBlockLines })
    curBlockLines = []
    curBlockPage = undefined
  }

  for (const line of lines) {
    const pm = line.match(/^\[PAGE:(\d+)\]$/i) || line.match(/^\[PAGE:(\d+)\]\s*/i)
    if (pm) {
      currentPage = Number(pm[1])
      continue
    }

    // yeni sual başlayırsa, əvvəlkini bağla
    if (Q_START.test(line)) {
      flush()
      curBlockPage = currentPage
      curBlockLines.push(line)
      continue
    }

    // sual blokunun davamı (variant növbəti səhifədə olsa belə bura düşəcək)
    if (curBlockLines.length) {
      curBlockLines.push(line)
    }
  }

  flush()
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
export async function parseQuestionsFromPages(
  pages: PdfPageData[],
): Promise<DraftQuestion[]> {
  const drafts: DraftQuestion[] = []
  const base = Date.now()
  let globalIndex = 0

  // 🔴 SƏHİFƏLƏR ARASI DAVAM EDƏN SUAL
  let pending:
    | {
      draft: DraftQuestion
      optionCount: number
    }
    | null = null

  for (const pg of pages) {
    const lines = (pg.lines || [])
      .map((l) => ({ yPx: l.yPx, text: cleanLine(l.text) }))
      .filter((l) => l.text.length > 0)

    // 🔍 SƏHİFƏ BAŞINDA VARİANT VAR?
    const leadingOptions: string[] = []
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      if (OPT_START.test(lines[i].text)) {
        leadingOptions.push(lines[i].text)
      } else {
        break
      }
    }

    // ✅ ƏVVƏLKİ SUALIN DAVAMI
    if (pending && leadingOptions.length) {
      for (const raw of leadingOptions) {
        if (pending.optionCount >= 5) break

        pending.draft.options.push({
          tempOptionId: `o_${base}_${globalIndex}_${pending.optionCount}`,
          text: cleanLine(raw.replace(OPT_START, "")),
        })

        pending.optionCount++
      }

      // bu səhifədə yeni sual axtarma
      continue
    }

    // 🔎 BU SƏHİFƏDƏ SUAL START-LARI
    const starts: { idx: number; y: number }[] = []
    for (let i = 0; i < lines.length; i++) {
      if (Q_START.test(lines[i].text)) {
        starts.push({ idx: i, y: lines[i].yPx })
      }
    }
    if (!starts.length) continue

    // 🧠 BU SƏHİFƏDƏKİ SUALLAR
    for (let si = 0; si < starts.length; si++) {
      const startIdx = starts[si].idx
      const endIdx =
        si + 1 < starts.length ? starts[si + 1].idx : lines.length

      const blockLines = lines.slice(startIdx, endIdx)
      const parsed = parseQuestionBlock(blockLines)

      if (!parsed || !parsed.options || parsed.options.length < 2) continue

      const optionDrafts: DraftOption[] = parsed.options
        .slice(0, 5)
        .map((o, oi) => ({
          tempOptionId: `o_${base}_${globalIndex}_${oi}`,
          text: cleanLine(o.text),
        }))

      const draft: DraftQuestion = {
        tempId: `q_${base}_${globalIndex}`,
        qNo: parsed.qNo,
        text: cleanLine(parsed.stem),
        page: pg.page,
        options: optionDrafts,
      }

      drafts.push(draft)

      // 🟡 ƏGƏR 5-DƏN AZ VARİANT VARSA → DAVAM GÖZLƏ
      if (optionDrafts.length < 5) {
        pending = {
          draft,
          optionCount: optionDrafts.length,
        }
      } else {
        pending = null
      }

      globalIndex++
    }
  }

  return drafts.sort(
    (a, b) =>
      (a.page ?? 0) - (b.page ?? 0) ||
      (a.qNo ?? 0) - (b.qNo ?? 0),
  )
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
