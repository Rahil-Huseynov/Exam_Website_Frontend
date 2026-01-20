"use client"

import React, { useEffect, useRef } from 'react';

interface LatexPreviewProps {
  latex: string;
  className?: string;
}

export const latexToHtml = (latex: string): string => {
  if (!latex) return '';

  let html = latex;
  
  html = html.trim();
  
  html = html.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, (match, degree, content) => {
    return `<span class="math-sqrt"><sup class="sqrt-degree">${degree}</sup><span class="sqrt-symbol">√</span><span class="sqrt-content">${content}</span></span>`;
  });
  
  html = html.replace(/\\sqrt\{([^}]+)\}/g, (match, content) => {
    return `<span class="math-sqrt"><span class="sqrt-symbol">√</span><span class="sqrt-content">${content}</span></span>`;
  });
  
  html = html.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, numerator, denominator) => {
    return `<span class="math-frac"><span class="frac-num">${numerator}</span><span class="frac-line">/</span><span class="frac-den">${denominator}</span></span>`;
  });
  
  html = html.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
  html = html.replace(/\^([a-zA-Z0-9α-ωΑ-Ω+\-±])/g, '<sup>$1</sup>');
  
  html = html.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
  html = html.replace(/_([a-zA-Z0-9α-ωΑ-Ω+\-±])/g, '<sub>$1</sub>');
  
  const symbolReplacements: [RegExp, string][] = [
    [/\\pi/g, 'π'],
    [/\\infty/g, '∞'],
    [/\\sum/g, '∑'],
    [/\\int/g, '∫'],
    [/\\pm/g, '±'],
    [/\\neq/g, '≠'],
    [/\\approx/g, '≈'],
    [/\\leq/g, '≤'],
    [/\\geq/g, '≥'],
    [/\\angle/g, '∠'],
    [/\\times/g, '×'],
    [/\\div/g, '÷'],
    [/\\cdot/g, '·'],
    [/\\ast/g, '∗'],
    [/\\bullet/g, '∙'],
    [/\\circ/g, '∘'],
    [/\\star/g, '⋆'],
    
    [/\\ll/g, '≪'],
    [/\\gg/g, '≫'],
    [/\\prec/g, '≺'],
    [/\\succ/g, '≻'],
    [/\\sim/g, '∼'],
    [/\\simeq/g, '≃'],
    [/\\cong/g, '≅'],
    [/\\equiv/g, '≡'],
    [/\\propto/g, '∝'],
    
    [/\\rightarrow/g, '→'],
    [/\\leftarrow/g, '←'],
    [/\\uparrow/g, '↑'],
    [/\\downarrow/g, '↓'],
    [/\\leftrightarrow/g, '↔'],
    [/\\Rightarrow/g, '⇒'],
    [/\\Leftarrow/g, '⇐'],
    [/\\Leftrightarrow/g, '⇔'],
    [/\\mapsto/g, '↦'],
    [/\\wedge/g, '∧'],
    [/\\vee/g, '∨'],
    [/\\neg/g, '¬'],
    [/\\forall/g, '∀'],
    [/\\exists/g, '∃'],
    [/\\nexists/g, '∄'],
    [/\\therefore/g, '∴'],
    [/\\because/g, '∵'],
    
    [/\\in/g, '∈'],
    [/\\notin/g, '∉'],
    [/\\subset/g, '⊂'],
    [/\\subseteq/g, '⊆'],
    [/\\supset/g, '⊃'],
    [/\\supseteq/g, '⊇'],
    [/\\cup/g, '∪'],
    [/\\cap/g, '∩'],
    [/\\emptyset/g, '∅'],
    [/\\mathbb\{N\}/g, 'ℕ'],
    [/\\mathbb\{Z\}/g, 'ℤ'],
    [/\\mathbb\{Q\}/g, 'ℚ'],
    [/\\mathbb\{R\}/g, 'ℝ'],
    [/\\mathbb\{C\}/g, 'ℂ'],
    
    [/\\AA/g, 'Å'],
    [/\\permil/g, '‰'],
    [/\\basispoint/g, '‱'],
    [/\\euler/g, 'ℇ'],
    [/\\gravconst/g, 'ℊ'],
    
    [/\\alpha/g, 'α'],
    [/\\beta/g, 'β'],
    [/\\gamma/g, 'γ'],
    [/\\delta/g, 'δ'],
    [/\\epsilon/g, 'ε'],
    [/\\zeta/g, 'ζ'],
    [/\\eta/g, 'η'],
    [/\\theta/g, 'θ'],
    [/\\iota/g, 'ι'],
    [/\\kappa/g, 'κ'],
    [/\\lambda/g, 'λ'],
    [/\\mu/g, 'μ'],
    [/\\nu/g, 'ν'],
    [/\\xi/g, 'ξ'],
    [/\\omicron/g, 'ο'],
    [/\\rho/g, 'ρ'],
    [/\\sigma/g, 'σ'],
    [/\\tau/g, 'τ'],
    [/\\upsilon/g, 'υ'],
    [/\\phi/g, 'φ'],
    [/\\chi/g, 'χ'],
    [/\\psi/g, 'ψ'],
    [/\\omega/g, 'ω'],
    
    [/\\Alpha/g, 'Α'],
    [/\\Beta/g, 'Β'],
    [/\\Gamma/g, 'Γ'],
    [/\\Delta/g, 'Δ'],
    [/\\Epsilon/g, 'Ε'],
    [/\\Zeta/g, 'Ζ'],
    [/\\Eta/g, 'Η'],
    [/\\Theta/g, 'Θ'],
    [/\\Iota/g, 'Ι'],
    [/\\Kappa/g, 'Κ'],
    [/\\Lambda/g, 'Λ'],
    [/\\Mu/g, 'Μ'],
    [/\\Nu/g, 'Ν'],
    [/\\Xi/g, 'Ξ'],
    [/\\Omicron/g, 'Ο'],
    [/\\Pi/g, 'Π'],
    [/\\Rho/g, 'Ρ'],
    [/\\Sigma/g, 'Σ'],
    [/\\Tau/g, 'Τ'],
    [/\\Upsilon/g, 'Υ'],
    [/\\Phi/g, 'Φ'],
    [/\\Chi/g, 'Χ'],
    [/\\Psi/g, 'Ψ'],
    [/\\Omega/g, 'Ω'],
    
    [/\\langle/g, '⟨'],
    [/\\rangle/g, '⟩'],
    [/\\lceil/g, '⌈'],
    [/\\rceil/g, '⌉'],
    [/\\lfloor/g, '⌊'],
    [/\\rfloor/g, '⌋'],
    
    [/\\^\\circ/g, '°'],
    [/\\hbar/g, 'ℏ'],
    [/\\nabla/g, '∇'],
    [/\\partial/g, '∂'],
  ];
  
  symbolReplacements.forEach(([regex, replacement]) => {
    html = html.replace(regex, replacement);
  });
  
  html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  html = html.replace(/\s+/g, ' ');
  
  return html;
};

export function LatexPreview({ latex, className = "" }: LatexPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;
    previewRef.current.innerHTML = latex ? latexToHtml(latex) : '<span class="text-gray-400 italic">Preview görünəcək...</span>';
  }, [latex]);

  return (
    <div 
      ref={previewRef}
      className={`latex-preview ${className}`}
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '16px',
        lineHeight: '1.6',
        minHeight: '24px'
      }}
    />
  );
}

export const latexPreviewStyles = `
  .latex-preview {
    font-family: 'Times New Roman', Times, serif;
    font-size: 16px;
    line-height: 1.6;
    color: #333;
  }
  
  .latex-preview .math-frac {
    display: inline-block;
    text-align: center;
    vertical-align: middle;
    margin: 0 2px;
  }
  
  .latex-preview .math-frac .frac-num {
    display: block;
    font-size: 0.85em;
    line-height: 1;
    padding-bottom: 1px;
  }
  
  .latex-preview .math-frac .frac-line {
    display: block;
    border-top: 1px solid #333;
    margin: 0 1px;
  }
  
  .latex-preview .math-frac .frac-den {
    display: block;
    font-size: 0.85em;
    line-height: 1;
    padding-top: 1px;
  }
  
  .latex-preview .math-sqrt {
    display: inline-block;
    position: relative;
    vertical-align: middle;
    margin: 0 1px;
  }
  
  .latex-preview .math-sqrt .sqrt-symbol {
    font-size: 1.1em;
    line-height: 1;
  }
  
  .latex-preview .math-sqrt .sqrt-degree {
    position: absolute;
    font-size: 0.6em;
    top: -0.4em;
    left: 0.5em;
    line-height: 1;
  }
  
  .latex-preview .math-sqrt .sqrt-content {
    display: inline-block;
    padding-left: 2px;
    padding-right: 2px;
    text-decoration: overline;
    text-decoration-thickness: 1px;
  }
  
  .latex-preview sup {
    font-size: 0.7em;
    vertical-align: super;
    line-height: 0;
  }
  
  .latex-preview sub {
    font-size: 0.7em;
    vertical-align: sub;
    line-height: 0;
  }
  
  .latex-preview .text-gray-400 {
    color: #9ca3af;
  }
  
  .latex-preview .italic {
    font-style: italic;
  }
  
  /* Kök simvolu üçün xüsusi styling */
  .latex-preview .math-sqrt {
    border-top: 1px solid #333;
    padding-top: 1px;
    margin-top: -1px;
  }
  
  .latex-preview .math-sqrt .sqrt-content {
    border-top: none;
    text-decoration: none;
  }
`;