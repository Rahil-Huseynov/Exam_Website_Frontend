"use client";

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import DOMPurify from 'dompurify';

interface PreviewReaderProps {
  data: string; 
  className?: string;
}

export default function PreviewReader({ data, className = "" }: PreviewReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    try {
      const rendered = katex.renderToString(data, {
        throwOnError: false,       
        displayMode: false,        
        strict: "ignore",
        macros: {},                
      });

      const clean = DOMPurify.sanitize(rendered, { USE_PROFILES: { html: true } });

      containerRef.current.innerHTML = clean || 
        '<span class="text-gray-400 italic">Preview görünəcək...</span>';
    } catch (err) {
      console.error("KaTeX render error:", err);
      containerRef.current.innerHTML = '<span class="text-red-500">Render xətası</span>';
    }
  }, [data]);

  return (
    <div 
      ref={containerRef}
      className={`latex-preview min-h-[40px] ${className}`}
    />
  );
}