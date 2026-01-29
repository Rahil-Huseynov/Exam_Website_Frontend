"use client"

import { decodeHtmlEntities } from "@/helper/HTML-encodedReadHelper"
import DOMPurify from "dompurify"

export default function HTMLEncodedReader({ content, className }: { content: string; className?: string }) {
  const cleanHtml = DOMPurify.sanitize(decodeHtmlEntities(content))

  return (
    <div
className={`math-html w-full break-all [word-break:break-all] [overflow-wrap:anywhere] ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}
