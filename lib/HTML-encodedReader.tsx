"use client"

import { decodeHtmlEntities } from "@/helper/HTML-encodedReadHelper"
import DOMPurify from "dompurify"

export default function HTMLEncodedReader({ content }: { content: string }) {
  const cleanHtml = DOMPurify.sanitize(decodeHtmlEntities(content))

  return (
    <div
      className="math-html w-full break-all"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}
