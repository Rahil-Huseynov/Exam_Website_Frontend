"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Superscript,
  Subscript,
  Divide,
  Square,
  Parentheses,
  Search,
  FunctionSquare,
  X,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import PreviewReader from '@/lib/PreviewReader';
import Question from '@/lib/HTML-encodedReader';
import HTMLEncodedReader from '@/lib/HTML-encodedReader';

interface SimpleMathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  preview?: boolean;
}

const ALL_MATH_SYMBOLS = [
  { symbol: '√', label: 'Kvadrat Kök', command: '\\sqrt{}', category: 'basic' },
  { symbol: '∛', label: 'Kub kök', command: '\\sqrt[3]{}', category: 'roots' },
  { symbol: '∜', label: '4-cü dərəcəli kök', command: '\\sqrt[4]{}', category: 'roots' },
  { symbol: '²', label: 'Kvadrat', command: '^{2}', category: 'basic' },
  { symbol: '³', label: 'Kub', command: '^{3}', category: 'basic' },
  { symbol: 'π', label: 'Pi', command: '\\pi', category: 'basic' },
  { symbol: '∞', label: 'Sonsuzluq', command: '\\infty', category: 'basic' },
  { symbol: '∑', label: 'Cəmi', command: '\\sum', category: 'basic' },
  { symbol: '∫', label: 'İnteqral', command: '\\int', category: 'basic' },
  { symbol: '±', label: 'Üstəgəl/Minus', command: '\\pm', category: 'basic' },
  { symbol: '≠', label: 'Bərabər deyil', command: '\\neq', category: 'basic' },
  { symbol: '≈', label: 'Təqribən', command: '\\approx', category: 'basic' },
  { symbol: '≤', label: 'Kiçik və ya bərabər', command: '\\leq', category: 'basic' },
  { symbol: '≥', label: 'Böyük və ya bərabər', command: '\\geq', category: 'basic' },
  { symbol: '°', label: 'Dərəcə', command: '^{\\circ}', category: 'basic' },

  { symbol: '+', label: 'Toplama', category: 'operators' },
  { symbol: '-', label: 'Çıxma', category: 'operators' },
  { symbol: '×', label: 'Vurma', command: '\\times', category: 'operators' },
  { symbol: '÷', label: 'Bölmə', command: '\\div', category: 'operators' },
  { symbol: '=', label: 'Bərabərdir', category: 'operators' },

  { symbol: '½', label: '1/2', command: '\\frac{1}{2}', category: 'fractions' },
  { symbol: '⅓', label: '1/3', command: '\\frac{1}{3}', category: 'fractions' },
  { symbol: '¼', label: '1/4', command: '\\frac{1}{4}', category: 'fractions' },
  { symbol: '¾', label: '3/4', command: '\\frac{3}{4}', category: 'fractions' },

  { symbol: 'α', label: 'Alfa', command: '\\alpha', category: 'greek' },
  { symbol: 'β', label: 'Beta', command: '\\beta', category: 'greek' },
  { symbol: 'γ', label: 'Qamma', command: '\\gamma', category: 'greek' },
  { symbol: 'δ', label: 'Delta', command: '\\delta', category: 'greek' },
  { symbol: 'θ', label: 'Teta', command: '\\theta', category: 'greek' },
  { symbol: 'π', label: 'Pi', command: '\\pi', category: 'greek' },
  { symbol: 'σ', label: 'Siqma', command: '\\sigma', category: 'greek' },
  { symbol: 'ω', label: 'Omega', command: '\\omega', category: 'greek' },

  { symbol: '→', label: 'Sağa ox', command: '\\rightarrow', category: 'arrows' },
  { symbol: '←', label: 'Sola ox', command: '\\leftarrow', category: 'arrows' },
  { symbol: '↑', label: 'Yuxarı ox', command: '\\uparrow', category: 'arrows' },
  { symbol: '↓', label: 'Aşağı ox', command: '\\downarrow', category: 'arrows' },

  { symbol: '∈', label: 'Element', command: '\\in', category: 'set' },
  { symbol: '∉', label: 'Element deyil', command: '\\notin', category: 'set' },
  { symbol: '⊂', label: 'Alt çoxluq', command: '\\subset', category: 'set' },
  { symbol: '∪', label: 'Birləşmə', command: '\\cup', category: 'set' },
  { symbol: '∩', label: 'Kəsişmə', command: '\\cap', category: 'set' },
  { symbol: '∅', label: 'Boş çoxluq', command: '\\emptyset', category: 'set' },
  { symbol: 'ℕ', label: 'Natural ədədlər', command: '\\mathbb{N}', category: 'set' },
  { symbol: 'ℝ', label: 'Reel ədədlər', command: '\\mathbb{R}', category: 'set' },
  { symbol: 'ℂ', label: 'Kompleks ədədlər', command: '\\mathbb{C}', category: 'set' },
];

const CATEGORIES = [
  { id: 'all', label: 'Hamısı' },
  { id: 'basic', label: 'Əsas Simvollar' },
  { id: 'operators', label: 'Əməliyyatlar' },
  { id: 'fractions', label: 'Kəsrlər' },
  { id: 'greek', label: 'Yunan Hərfləri' },
  { id: 'arrows', label: 'Oxlar' },
  { id: 'set', label: 'Çoxluq' },
  { id: 'roots', label: 'Köklər' },
];

export function SimpleMathEditor({
  value,
  onChange,
  placeholder = "Mətni daxil edin...",
  className = "",
  preview = true
}: SimpleMathEditorProps) {
  const [text, setText] = useState(value);
  const [showSymbols, setShowSymbols] = useState(false);
  const [showCustomRoot, setShowCustomRoot] = useState(false);
  const [showCustomPower, setShowCustomPower] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customRootDegree, setCustomRootDegree] = useState('');
  const [customPower, setCustomPower] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  const filteredSymbols = useMemo(() => {
    let filtered = ALL_MATH_SYMBOLS;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(symbol => symbol.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(symbol =>
        symbol.label.toLowerCase().includes(query) ||
        symbol.symbol.toLowerCase().includes(query) ||
        (symbol.command && symbol.command.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setText(newValue);
    onChange(newValue);
  };

  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + textToInsert + text.substring(end);

    setText(newText);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + textToInsert.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertCommand = (command: string, cursorOffset = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selectedText = text.substring(start, end);
      const newCommand = command.replace('{}', `{${selectedText}}`);
      const newText = text.substring(0, start) + newCommand + text.substring(end);
      setText(newText);
      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + newCommand.length + cursorOffset;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      const newText = text.substring(0, start) + command + text.substring(end);
      setText(newText);
      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + command.length + cursorOffset;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'm') {
      e.preventDefault();
      setShowSymbols(true);
    }
  };

  const handleSymbolClick = (symbol: string, command?: string) => {
    if (command) {
      insertCommand(command);
    } else {
      insertAtCursor(symbol);
    }
  };

  const insertCustomRoot = () => {
    if (customRootDegree.trim()) {
      const degree = customRootDegree.trim();
      const command = `\\sqrt[${degree}]{}`;
      insertCommand(command, -1);
      setCustomRootDegree('');
      setShowCustomRoot(false);
    }
  };

  const insertCustomPower = () => {
    if (customPower.trim()) {
      const power = customPower.trim();
      const command = `^{${power}}`;
      insertCommand(command);
      setCustomPower('');
      setShowCustomPower(false);
    }
  };

  const latexToHtml = (latex: string): string => {
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
      [/\\times/g, '×'],
      [/\\div/g, '÷'],
      [/\\cdot/g, '·'],
      [/\\alpha/g, 'α'],
      [/\\beta/g, 'β'],
      [/\\gamma/g, 'γ'],
      [/\\delta/g, 'δ'],
      [/\\theta/g, 'θ'],
      [/\\sigma/g, 'σ'],
      [/\\omega/g, 'ω'],
      [/\\rightarrow/g, '→'],
      [/\\leftarrow/g, '←'],
      [/\\uparrow/g, '↑'],
      [/\\downarrow/g, '↓'],
      [/\\in/g, '∈'],
      [/\\notin/g, '∉'],
      [/\\subset/g, '⊂'],
      [/\\cup/g, '∪'],
      [/\\cap/g, '∩'],
      [/\\emptyset/g, '∅'],
      [/\\mathbb\{N\}/g, 'ℕ'],
      [/\\mathbb\{R\}/g, 'ℝ'],
      [/\\mathbb\{C\}/g, 'ℂ'],
      [/\\^\\circ/g, '°'],
    ];

    symbolReplacements.forEach(([regex, replacement]) => {
      html = html.replace(regex, replacement);
    });

    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    html = html.replace(/\s+/g, ' ');

    return html;
  };
  const contentHtml = text
    ? `<div class="math-html">${latexToHtml(text)}</div>`
    : `<span class="text-gray-400 italic">Preview görünəcək...</span>`;



  return (
    <div className={`space-y-2 ${className}`}>
      <style jsx global>{`
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
    display: inline-flex;
    align-items: center;
    position: relative;
    vertical-align: middle;
    margin: 0 1px;
  }
  
  .latex-preview .math-sqrt .sqrt-symbol {
    font-size: 1.1em;
    line-height: 1;
    position: relative;
  }
  
  .latex-preview .math-sqrt .sqrt-degree {
    position: absolute;
    font-size: 0.65em;
    top: -0.4em;
    left: 0.3em;
    line-height: 1;
    z-index: 2;
    background-color: #fff;
    padding: 0 1px;
  }
  
  .latex-preview .math-sqrt .sqrt-content {
    display: inline-block;
    padding-left: 4px;
    padding-right: 2px;
    margin-left: 2px;
    border-top: 1px solid #333;
    min-height: 0.8em;
    position: relative;
    z-index: 1;
  }
  
  .latex-preview .math-sqrt:not(:has(.sqrt-degree)) .sqrt-content {
    margin-left: 0;
    padding-left: 2px;
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
`}</style>

      <div className="flex flex-wrap gap-1 mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSymbols(true)}
          className="text-xs"
        >
          <Square className="h-3 w-3 mr-1" />
          Düstur əlavə et (Ctrl+M)
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustomRoot(true)}
          className="text-xs"
        >
          <FunctionSquare className="h-3 w-3 mr-1" />
          Özəl Kök
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustomPower(true)}
          className="text-xs"
        >
          <Superscript className="h-3 w-3 mr-1" />
          Özəl Qüvvət
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertCommand('^{}')}
          className="text-xs"
        >
          <Superscript className="h-3 w-3 mr-1" />
          Üst
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertCommand('_{}')}
          className="text-xs"
        >
          <Subscript className="h-3 w-3 mr-1" />
          Alt
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertCommand('\\frac{}{}')}
          className="text-xs"
        >
          <Divide className="h-3 w-3 mr-1" />
          Kəsr
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertCommand('()')}
          className="text-xs"
        >
          <Parentheses className="h-3 w-3 mr-1" />
          Mötərizə
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertCommand('\\sqrt{}')}
          className="text-xs"
        >
          <FunctionSquare className="h-3 w-3 mr-1" />
          √x
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertCommand('\\sqrt[3]{}')}
          className="text-xs"
        >
          <FunctionSquare className="h-3 w-3 mr-1" />
          ³√x
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertCommand('\\sqrt[4]{}')}
          className="text-xs"
        >
          <FunctionSquare className="h-3 w-3 mr-1" />
          ⁴√x
        </Button>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {preview && (
        <div className="mt-2 p-3 border rounded bg-gray-50">
          <div className="text-xs text-gray-500 mb-1">Preview:</div>
          <HTMLEncodedReader content={contentHtml} />
        </div>
      )}

      <Dialog open={showCustomRoot} onOpenChange={setShowCustomRoot}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Özəl Kök Dərəcəsi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="root-degree">Kök Dərəcəsini daxil edin:</Label>
              <Input
                id="root-degree"
                type="text"
                value={customRootDegree}
                onChange={(e) => setCustomRootDegree(e.target.value)}
                placeholder="Məsələn: 5, 10, 100, n"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-2">
                İstənilən ədəd, hərf və ya ifadə daxil edə bilərsiniz (1000, 2n+1, k, vb.)
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomRoot(false)}>
                <X className="h-4 w-4 mr-2" />
                Ləğv et
              </Button>
              <Button onClick={insertCustomRoot} disabled={!customRootDegree.trim()}>
                <FunctionSquare className="h-4 w-4 mr-2" />
                Əlavə et
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomPower} onOpenChange={setShowCustomPower}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Özəl Qüvvət</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="power">Qüvvəti daxil edin:</Label>
              <Input
                id="power"
                type="text"
                value={customPower}
                onChange={(e) => setCustomPower(e.target.value)}
                placeholder="Məsələn: 5, n, 2k+1, ∞"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-2">
                İstənilən ədəd, hərf və ya ifadə daxil edə bilərsiniz
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomPower(false)}>
                <X className="h-4 w-4 mr-2" />
                Ləğv et
              </Button>
              <Button onClick={insertCustomPower} disabled={!customPower.trim()}>
                <Superscript className="h-4 w-4 mr-2" />
                Əlavə et
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSymbols} onOpenChange={setShowSymbols}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Riyazi Simvollar və Düsturlar</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Simvol axtar (adına, simvoluna və ya LaTeX komutuna görə)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                {filteredSymbols.length} simvol tapıldı
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="flex gap-1 pb-2">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-8 gap-2 max-h-[400px] overflow-y-auto p-2 border rounded">
              {filteredSymbols.length > 0 ? (
                filteredSymbols.map((item, index) => (
                  <Button
                    key={`${item.symbol}-${index}`}
                    type="button"
                    variant="outline"
                    onClick={() => handleSymbolClick(item.command || item.symbol, item.command)}
                    className="flex flex-col items-center justify-center h-16 p-1 hover:bg-primary/10 transition-colors"
                    title={`${item.label}${item.command ? ` (${item.command})` : ''}`}
                  >
                    <span className="text-lg font-medium mb-1">{item.symbol}</span>
                    <span className="text-[10px] text-center leading-tight line-clamp-2">{item.label}</span>
                  </Button>
                ))
              ) : (
                <div className="col-span-8 text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Heç bir simvol tapılmadı</p>
                  <p className="text-xs mt-1">Başqa açar sözlə cəhd edin</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Tez-tez istifadə edilənlər:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { symbol: '√', command: '\\sqrt{}', label: 'Kök' },
                  { symbol: '∛', command: '\\sqrt[3]{}', label: 'Kub kök' },
                  { symbol: '∜', command: '\\sqrt[4]{}', label: '4-cü kök' },
                  { symbol: '²', command: '^{2}', label: 'Kvadrat' },
                  { symbol: '³', command: '^{3}', label: 'Kub' },
                  { symbol: 'π', command: '\\pi', label: 'Pi' },
                  { symbol: '∑', command: '\\sum', label: 'Cəmi' },
                  { symbol: '∫', command: '\\int', label: 'İnteqral' },
                  { symbol: 'α', command: '\\alpha', label: 'Alfa' },
                  { symbol: 'β', command: '\\beta', label: 'Beta' },
                  { symbol: 'γ', command: '\\gamma', label: 'Qamma' },
                  { symbol: '≠', command: '\\neq', label: 'Bərabər deyil' },
                  { symbol: '≈', command: '\\approx', label: 'Təqribən' },
                  { symbol: '≤', command: '\\leq', label: 'Kiçik/bərabər' },
                  { symbol: '≥', command: '\\geq', label: 'Böyük/bərabər' },
                  { symbol: '½', command: '\\frac{1}{2}', label: '1/2' },
                  { symbol: '¼', command: '\\frac{1}{4}', label: '1/4' },
                  { symbol: '°', command: '^{\\circ}', label: 'Dərəcə' },
                ].map((item, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSymbolClick(item.command || item.symbol, item.command)}
                    className="flex items-center gap-1"
                    title={item.label}
                  >
                    <span className="text-sm">{item.symbol}</span>
                    <span className="text-xs">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-muted-foreground">
                Simvolu seçin, avtomatik olaraq mətnə əlavə olunacaq
              </div>
              <Button onClick={() => setShowSymbols(false)}>
                Bağla
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}