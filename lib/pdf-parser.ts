export type DraftOption = { tempOptionId: string; text: string }
export type DraftQuestion = { tempId: string; text: string; options: DraftOption[] }

function normalizeBase(raw: string) {
  let t = (raw || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\u00a0/g, " ") 
    .trim()

  t = t.replace(
    /(^|\n|\s)((?:Sual|Question)\s*)?(\d{1,3})\s*([.)-])\s+/gi,
    (_m, p1, p2, num, p4) => `${p1}\nQ${num}${p4} `
  )

  t = t.replace(
    /(^|\n|\s)([A-Ea-e])\s*([)\].:\-}])\s+/g,
    (_m, p1, letter, _sep) => `${p1}\n${letter.toUpperCase()}) `
  )

  t = t.replace(/(^|\n|\s)([A-Ea-e])\s+\)\s+/g, (_m, p1, letter) => `${p1}\n${letter.toUpperCase()}) `)

  t = t.replace(/\n{3,}/g, "\n\n").trim()

  return t
}

function cleanLine(s: string) {
  return (s || "").replace(/\s+/g, " ").trim()
}

export function parseQuestionsFromText(raw: string): DraftQuestion[] {
  const text = normalizeBase(raw)

  const blocks = text.split(/\n(?=Q\d{1,3}[.)-]\s)/g)

  const drafts: DraftQuestion[] = []
  const base = Date.now()
  let qIndex = 0

  for (const blk of blocks) {
    const b = blk.trim()
    if (!b) continue
    if (!/^Q\d{1,3}[.)-]\s/i.test(b)) continue

    const body = b.replace(/^Q\d{1,3}[.)-]\s*/i, "").trim()
    if (!body) continue

    const optionRegex = /\n([A-E])\)\s+/g
    const matches: Array<{ letter: string; idx: number; len: number }> = []

    let m: RegExpExecArray | null
    while ((m = optionRegex.exec(body)) !== null) {
      matches.push({ letter: m[1], idx: m.index, len: m[0].length })
    }

    if (matches.length < 2) continue

    const qText = cleanLine(body.slice(0, matches[0].idx))
    if (!qText) continue

    const options: string[] = []
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].idx + matches[i].len
      const end = i + 1 < matches.length ? matches[i + 1].idx : body.length
      const optText = cleanLine(body.slice(start, end))
      if (optText) options.push(optText)
    }

    const seen = new Set<string>()
    const finalOptions: string[] = []
    for (const o of options) {
      const key = o.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      finalOptions.push(o)
      if (finalOptions.length >= 5) break
    }

    if (finalOptions.length < 2) continue

    drafts.push({
      tempId: `q_${base}_${qIndex}`,
      text: qText,
      options: finalOptions.map((ot, i) => ({
        tempOptionId: `o_${base}_${qIndex}_${i}`,
        text: ot,
      })),
    })

    qIndex++
  }

  return drafts
}
