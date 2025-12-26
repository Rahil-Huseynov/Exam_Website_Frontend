"use client"

export type DraftOption = { tempOptionId: string; text: string }
export type DraftQuestion = {
  tempId: string
  text: string
  options: DraftOption[]
  page?: number
  imageUrl?: string
}

function normalizeBase(raw: string) {
  let t = (raw || "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()

  t = t.replace(/(\d)\s+\./g, "$1.")
  t = t.replace(/(\d)\s+\)/g, "$1)")

  t = t.replace(/\b([A-Ea-e])\s+\)/g, (_m, l) => `${String(l).toUpperCase()})`)

  t = t.replace(/\b([A-Ea-e])\s+\./g, (_m, l) => `${String(l).toUpperCase()})`)

  t = t.replace(/\n{3,}/g, "\n\n")

  return t.trim()
}

function cleanLine(s: string) {
  return (s || "").replace(/\s+/g, " ").trim()
}

export function mergePagesForParsing(pages: { page: number; text: string }[]) {
  return pages.map((p) => `\n[PAGE:${p.page}]\n${p.text}\n`).join("\n").trim()
}

function splitIntoQuestionBlocks(text: string): Array<{ page?: number; raw: string }> {
  let t = normalizeBase(text)

  t = t.replace(/([^\n])\s+(\d{1,4})\.\s+/g, "$1\n$2. ")

  const parts = t.split(/(?=\[PAGE:\d+\])/g)

  const out: Array<{ page?: number; raw: string }> = []
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

    const chunks = part
      .split(/(?=(?:^|\n)\s*\d{1,4}\.\s+)/g)
      .map((x) => x.trim())
      .filter(Boolean)

    for (const c of chunks) out.push({ page: currentPage, raw: c })
  }

  return out
}

function parseLetteredOptions(blockBody: string): { stem: string; options: string[] } | null {
  const re = /(^|[\n\r\t ]+)([A-Ea-e])\s*[).]\s*/g

  const idxs: Array<{ idx: number; len: number; letter: string }> = []
  let m: RegExpExecArray | null

  while ((m = re.exec(blockBody)) !== null) {
    const delimLen = m[1]?.length ?? 0
    const letterPos = m.index + delimLen
    const lenFromLetter = m[0].length - delimLen
    idxs.push({ idx: letterPos, len: lenFromLetter, letter: m[2].toUpperCase() })
  }

  if (idxs.length < 2) return null

  const stem = cleanLine(blockBody.slice(0, idxs[0].idx))
  const options: string[] = []

  for (let i = 0; i < idxs.length; i++) {
    const start = idxs[i].idx + idxs[i].len
    const end = i + 1 < idxs.length ? idxs[i + 1].idx : blockBody.length
    const opt = cleanLine(blockBody.slice(start, end))
    if (opt) options.push(opt)
  }

  if (options.length < 2) return null
  return { stem, options }
}

function parsePlainOptions(blockBody: string): { stem: string; options: string[] } | null {
  const lines = blockBody
    .split("\n")
    .map((x) => cleanLine(x))
    .filter((x) => x.length > 0)

  if (lines.length < 3) return null

  const maxOpt = 6
  const minOpt = 2

  for (let take = Math.min(maxOpt, lines.length - 1); take >= minOpt; take--) {
    const opts = lines.slice(-take)
    const stemLines = lines.slice(0, -take)
    const stem = cleanLine(stemLines.join(" "))
    if (!stem) continue

    const uniq = new Set(opts.map((o) => o.toLowerCase()))
    if (uniq.size < 2) continue

    const tooLong = opts.some((o) => o.length > 250)
    if (tooLong) continue

    const isNumbered = opts.every((o) => /^\d+[-.]\s*/.test(o))
    if (isNumbered) continue

    return { stem, options: opts }
  }

  return null
}

export function analyzePdfText(merged: string) {
  const t = normalizeBase(merged)
  const qStarts = t.match(/(?:^|\n)\s*\d{1,4}\.\s+/g) || []
  const inlineStarts = t.match(/[^\n]\s+\d{1,4}\.\s+/g) || []
  console.log("[PDF ANALYZE] newline question starts:", qStarts.length)
  console.log("[PDF ANALYZE] inline question starts:", inlineStarts.length)
  console.log("[PDF ANALYZE] total chars:", t.length)
}

export function parseQuestionsFromText(raw: string, pageImageMap?: Record<number, string>): DraftQuestion[] {
  const blocks = splitIntoQuestionBlocks(raw)
  const drafts: DraftQuestion[] = []
  const base = Date.now()
  let qIndex = 0

  for (const b of blocks) {
    const block = b.raw.trim()
    if (!block) continue

    if (!/^\s*\d{1,4}\s*[.)-]\s+/i.test(block)) continue

    const body = block.replace(/^\s*\d{1,4}\s*[.)-]\s+/, "").trim()
    if (!body) continue

    const lettered = parseLetteredOptions(body)
    if (lettered?.stem && lettered.options.length >= 2) {
      const opts = Array.from(new Set(lettered.options.map((x) => cleanLine(x))))
        .filter(Boolean)
        .slice(0, 5)

      drafts.push({
        tempId: `q_${base}_${qIndex}`,
        text: lettered.stem,
        page: b.page,
        imageUrl: b.page ? pageImageMap?.[b.page] : undefined,
        options: opts.map((ot, i) => ({ tempOptionId: `o_${base}_${qIndex}_${i}`, text: ot })),
      })
      qIndex++
      continue
    }

    const plain = parsePlainOptions(body)
    if (plain?.stem && plain.options.length >= 2) {
      const opts = Array.from(new Set(plain.options.map((x) => cleanLine(x))))
        .filter(Boolean)
        .slice(0, 5)

      drafts.push({
        tempId: `q_${base}_${qIndex}`,
        text: plain.stem,
        page: b.page,
        imageUrl: b.page ? pageImageMap?.[b.page] : undefined,
        options: opts.map((ot, i) => ({ tempOptionId: `o_${base}_${qIndex}_${i}`, text: ot })),
      })
      qIndex++
      continue
    }

  }

  return drafts.sort((a, b) => (a.page ?? 0) - (b.page ?? 0))
}
