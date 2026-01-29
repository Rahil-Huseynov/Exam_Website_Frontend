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
} from 'lucide-react';
import HTMLEncodedReader from '@/lib/HTML-encodedReader';

interface SimpleMathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  preview?: boolean;
}

const ALL_MATH_SYMBOLS = [
  // Əsas Simvollar
  { symbol: '√', label: 'Kvadrat Kök', command: '\\sqrt{}', category: 'basic' },
  { symbol: '∛', label: 'Kub kök', command: '\\sqrt[3]{}', category: 'roots' },
  { symbol: '∜', label: '4-cü dərəcəli kök', command: '\\sqrt[4]{}', category: 'roots' },
  { symbol: '²', label: 'Kvadrat', command: '^{2}', category: 'basic' },
  { symbol: '³', label: 'Kub', command: '^{3}', category: 'basic' },
  { symbol: 'π', label: 'Pi', command: '\\pi', category: 'basic' },
  { symbol: '∞', label: 'Sonsuzluq', command: '\\infty', category: 'basic' },
  { symbol: '∑', label: 'Cəmi', command: '\\sum', category: 'basic' },
  { symbol: '∫', label: 'İnteqral', command: '\\int', category: 'basic' },
  { symbol: '∏', label: 'Hasil', command: '\\prod', category: 'basic' },
  { symbol: '∂', label: 'Qismən törəmə', command: '\\partial', category: 'basic' },
  { symbol: '∇', label: 'Nabla', command: '\\nabla', category: 'basic' },
  { symbol: '±', label: 'Üstəgəl/Minus', command: '\\pm', category: 'basic' },
  { symbol: '≠', label: 'Bərabər deyil', command: '\\neq', category: 'basic' },
  { symbol: '≈', label: 'Təqribən', command: '\\approx', category: 'basic' },
  { symbol: '≤', label: 'Kiçik və ya bərabər', command: '\\leq', category: 'basic' },
  { symbol: '≥', label: 'Böyük və ya bərabər', command: '\\geq', category: 'basic' },
  { symbol: '°', label: 'Dərəcə', command: '^{\\circ}', category: 'basic' },
  { symbol: '!', label: 'Faktorial', command: '!', category: 'basic' },
  { symbol: '%', label: 'Faiz', command: '\\%', category: 'basic' },
  { symbol: '|', label: 'Modul', command: '|', category: 'basic' },
  { symbol: '‖', label: 'Norma', command: '\\|', category: 'basic' },
  { symbol: '⌈', label: 'Üst tam hissə', command: '\\lceil', category: 'basic' },
  { symbol: '⌉', label: 'Üst tam hissə bağla', command: '\\rceil', category: 'basic' },
  { symbol: '⌊', label: 'Alt tam hissə', command: '\\lfloor', category: 'basic' },
  { symbol: '⌋', label: 'Alt tam hissə bağla', command: '\\rfloor', category: 'basic' },
  { symbol: 'ℓ', label: 'Ell', command: '\\ell', category: 'basic' },
  { symbol: 'ℏ', label: 'Planck sabiti', command: '\\hbar', category: 'basic' },
  { symbol: 'ℑ', label: 'İmaqinar hissə', command: '\\Im', category: 'basic' },
  { symbol: 'ℜ', label: 'Real hissə', command: '\\Re', category: 'basic' },
  { symbol: '℘', label: 'Veierstrass', command: '\\wp', category: 'basic' },
  { symbol: 'ℵ', label: 'Aleph', command: '\\aleph', category: 'basic' },

  // Əməliyyatlar
  { symbol: '+', label: 'Toplama', category: 'operators' },
  { symbol: '-', label: 'Çıxma', category: 'operators' },
  { symbol: '×', label: 'Vurma', command: '\\times', category: 'operators' },
  { symbol: '÷', label: 'Bölmə', command: '\\div', category: 'operators' },
  { symbol: '=', label: 'Bərabərdir', category: 'operators' },
  { symbol: '⋅', label: 'Nöqtə vurma', command: '\\cdot', category: 'operators' },
  { symbol: '⊕', label: 'Birbaşa cəm', command: '\\oplus', category: 'operators' },
  { symbol: '⊗', label: 'Tensor hasil', command: '\\otimes', category: 'operators' },
  { symbol: '∗', label: 'Konvolyusiya', command: '\\ast', category: 'operators' },
  { symbol: '≀', label: 'Vreath', command: '\\wr', category: 'operators' },

  // Kəsrlər
  { symbol: '½', label: '1/2', command: '\\frac{1}{2}', category: 'fractions' },
  { symbol: '⅓', label: '1/3', command: '\\frac{1}{3}', category: 'fractions' },
  { symbol: '¼', label: '1/4', command: '\\frac{1}{4}', category: 'fractions' },
  { symbol: '¾', label: '3/4', command: '\\frac{3}{4}', category: 'fractions' },
  { symbol: '⅔', label: '2/3', command: '\\frac{2}{3}', category: 'fractions' },
  { symbol: '⅕', label: '1/5', command: '\\frac{1}{5}', category: 'fractions' },
  { symbol: '⅖', label: '2/5', command: '\\frac{2}{5}', category: 'fractions' },
  { symbol: '⅗', label: '3/5', command: '\\frac{3}{5}', category: 'fractions' },
  { symbol: '⅘', label: '4/5', command: '\\frac{4}{5}', category: 'fractions' },
  { symbol: '⅙', label: '1/6', command: '\\frac{1}{6}', category: 'fractions' },
  { symbol: '⅚', label: '5/6', command: '\\frac{5}{6}', category: 'fractions' },
  { symbol: '⅛', label: '1/8', command: '\\frac{1}{8}', category: 'fractions' },
  { symbol: '⅜', label: '3/8', command: '\\frac{3}{8}', category: 'fractions' },
  { symbol: '⅝', label: '5/8', command: '\\frac{5}{8}', category: 'fractions' },
  { symbol: '⅞', label: '7/8', command: '\\frac{7}{8}', category: 'fractions' },

  // Yunan Hərfləri
  { symbol: 'α', label: 'Alfa', command: '\\alpha', category: 'greek' },
  { symbol: 'β', label: 'Beta', command: '\\beta', category: 'greek' },
  { symbol: 'γ', label: 'Qamma', command: '\\gamma', category: 'greek' },
  { symbol: 'δ', label: 'Delta', command: '\\delta', category: 'greek' },
  { symbol: 'ε', label: 'Epsilon', command: '\\epsilon', category: 'greek' },
  { symbol: 'ζ', label: 'Zeta', command: '\\zeta', category: 'greek' },
  { symbol: 'η', label: 'Eta', command: '\\eta', category: 'greek' },
  { symbol: 'θ', label: 'Teta', command: '\\theta', category: 'greek' },
  { symbol: 'ι', label: 'İota', command: '\\iota', category: 'greek' },
  { symbol: 'κ', label: 'Kappa', command: '\\kappa', category: 'greek' },
  { symbol: 'λ', label: 'Lambda', command: '\\lambda', category: 'greek' },
  { symbol: 'μ', label: 'Mu', command: '\\mu', category: 'greek' },
  { symbol: 'ν', label: 'Nu', command: '\\nu', category: 'greek' },
  { symbol: 'ξ', label: 'Ksi', command: '\\xi', category: 'greek' },
  { symbol: 'ο', label: 'Omikron', command: '\\omicron', category: 'greek' },
  { symbol: 'π', label: 'Pi', command: '\\pi', category: 'greek' },
  { symbol: 'ρ', label: 'Ro', command: '\\rho', category: 'greek' },
  { symbol: 'σ', label: 'Siqma', command: '\\sigma', category: 'greek' },
  { symbol: 'τ', label: 'Tau', command: '\\tau', category: 'greek' },
  { symbol: 'υ', label: 'Upsilon', command: '\\upsilon', category: 'greek' },
  { symbol: 'φ', label: 'Fi', command: '\\phi', category: 'greek' },
  { symbol: 'χ', label: 'Xi', command: '\\chi', category: 'greek' },
  { symbol: 'ψ', label: 'Psi', command: '\\psi', category: 'greek' },
  { symbol: 'ω', label: 'Omega', command: '\\omega', category: 'greek' },

  // Böyük Yunan Hərfləri
  { symbol: 'Γ', label: 'Böyük Qamma', command: '\\Gamma', category: 'greek_upper' },
  { symbol: 'Δ', label: 'Böyük Delta', command: '\\Delta', category: 'greek_upper' },
  { symbol: 'Θ', label: 'Böyük Teta', command: '\\Theta', category: 'greek_upper' },
  { symbol: 'Λ', label: 'Böyük Lambda', command: '\\Lambda', category: 'greek_upper' },
  { symbol: 'Ξ', label: 'Böyük Ksi', command: '\\Xi', category: 'greek_upper' },
  { symbol: 'Π', label: 'Böyük Pi', command: '\\Pi', category: 'greek_upper' },
  { symbol: 'Σ', label: 'Böyük Siqma', command: '\\Sigma', category: 'greek_upper' },
  { symbol: 'Υ', label: 'Böyük Upsilon', command: '\\Upsilon', category: 'greek_upper' },
  { symbol: 'Φ', label: 'Böyük Fi', command: '\\Phi', category: 'greek_upper' },
  { symbol: 'Ψ', label: 'Böyük Psi', command: '\\Psi', category: 'greek_upper' },
  { symbol: 'Ω', label: 'Böyük Omega', command: '\\Omega', category: 'greek_upper' },

  // Oxlar
  { symbol: '→', label: 'Sağa ox', command: '\\rightarrow', category: 'arrows' },
  { symbol: '←', label: 'Sola ox', command: '\\leftarrow', category: 'arrows' },
  { symbol: '↑', label: 'Yuxarı ox', command: '\\uparrow', category: 'arrows' },
  { symbol: '↓', label: 'Aşağı ox', command: '\\downarrow', category: 'arrows' },
  { symbol: '↔', label: 'Sağa-sola ox', command: '\\leftrightarrow', category: 'arrows' },
  { symbol: '⇌', label: 'Tərsinə ox', command: '\\rightleftharpoons', category: 'arrows' },
  { symbol: '⇑', label: 'Yuxarı cüt ox', command: '\\Uparrow', category: 'arrows' },
  { symbol: '⇓', label: 'Aşağı cüt ox', command: '\\Downarrow', category: 'arrows' },
  { symbol: '↦', label: 'Xəritələmə', command: '\\mapsto', category: 'arrows' },
  { symbol: '⇢', label: 'Sağa qısa ox', command: '\\to', category: 'arrows' },
  { symbol: '⟶', label: 'Uzun sağa ox', command: '\\longrightarrow', category: 'arrows' },
  { symbol: '⟵', label: 'Uzun sola ox', command: '\\longleftarrow', category: 'arrows' },
  { symbol: '⟷', label: 'Uzun sağa-sola ox', command: '\\longleftrightarrow', category: 'arrows' },

  // Çoxluq Simvolları
  { symbol: '∈', label: 'Element', command: '\\in', category: 'set' },
  { symbol: '∉', label: 'Element deyil', command: '\\notin', category: 'set' },
  { symbol: '⊂', label: 'Alt çoxluq', command: '\\subset', category: 'set' },
  { symbol: '⊆', label: 'Alt çoxluq və ya bərabər', command: '\\subseteq', category: 'set' },
  { symbol: '⊃', label: 'Üst çoxluq', command: '\\supset', category: 'set' },
  { symbol: '⊇', label: 'Üst çoxluq və ya bərabər', command: '\\supseteq', category: 'set' },
  { symbol: '∪', label: 'Birləşmə', command: '\\cup', category: 'set' },
  { symbol: '∩', label: 'Kəsişmə', command: '\\cap', category: 'set' },
  { symbol: '∖', label: 'Fərq', command: '\\setminus', category: 'set' },
  { symbol: '∅', label: 'Boş çoxluq', command: '\\emptyset', category: 'set' },
  { symbol: '⋂', label: 'Ümumi kəsişmə', command: '\\bigcap', category: 'set' },
  { symbol: '⋃', label: 'Ümumi birləşmə', command: '\\bigcup', category: 'set' },
  { symbol: 'ℕ', label: 'Natural ədədlər', command: '\\mathbb{N}', category: 'set' },
  { symbol: 'ℤ', label: 'Tam ədədlər', command: '\\mathbb{Z}', category: 'set' },
  { symbol: 'ℚ', label: 'Rasional ədədlər', command: '\\mathbb{Q}', category: 'set' },
  { symbol: 'ℝ', label: 'Reel ədədlər', command: '\\mathbb{R}', category: 'set' },
  { symbol: 'ℂ', label: 'Kompleks ədədlər', command: '\\mathbb{C}', category: 'set' },

  // Məntiq Simvolları
  { symbol: '∀', label: 'Hamısı üçün', command: '\\forall', category: 'logic' },
  { symbol: '∃', label: 'Mövcuddur', command: '\\exists', category: 'logic' },
  { symbol: '∄', label: 'Mövcud deyil', command: '\\nexists', category: 'logic' },
  { symbol: '¬', label: 'İnkar', command: '\\neg', category: 'logic' },
  { symbol: '∧', label: 'Və', command: '\\wedge', category: 'logic' },
  { symbol: '∨', label: 'Və ya', command: '\\vee', category: 'logic' },
  { symbol: '⇒', label: 'Nəticə', command: '\\Rightarrow', category: 'logic' },
  { symbol: '⇔', label: 'Bərabər nəticə', command: '\\Leftrightarrow', category: 'logic' },
  { symbol: '∴', label: 'Ona görə', command: '\\therefore', category: 'logic' },
  { symbol: '∵', label: 'Çünki', command: '\\because', category: 'logic' },

  // Əlaqə Simvolları
  { symbol: '<', label: 'Kiçikdir', command: '<', category: 'relations' },
  { symbol: '>', label: 'Böyükdür', command: '>', category: 'relations' },
  { symbol: '≡', label: 'Ekvivalenti', command: '\\equiv', category: 'relations' },
  { symbol: '∼', label: 'Oxşar', command: '\\sim', category: 'relations' },
  { symbol: '≅', label: 'Konqruent', command: '\\cong', category: 'relations' },
  { symbol: '∝', label: 'Proporsional', command: '\\propto', category: 'relations' },
  { symbol: '≪', label: 'Çox kiçik', command: '\\ll', category: 'relations' },
  { symbol: '≫', label: 'Çox böyük', command: '\\gg', category: 'relations' },
  { symbol: '⊥', label: 'Perpendikulyar', command: '\\perp', category: 'relations' },
  { symbol: '∥', label: 'Paralel', command: '\\parallel', category: 'relations' },
  { symbol: '∤', label: 'Bölmür', command: '\\nmid', category: 'relations' },
  { symbol: '∣', label: 'Bölür', command: '\\mid', category: 'relations' },

  // Həndəsə Simvolları
  { symbol: '∠', label: 'Bucaq', command: '\\angle', category: 'geometry' },
  { symbol: '△', label: 'Üçbucaq', command: '\\triangle', category: 'geometry' },
  { symbol: '□', label: 'Kvadrat', command: '\\square', category: 'geometry' },
  { symbol: '▱', label: 'Paraleloqram', command: '\\parallelogram', category: 'geometry' },
  { symbol: '○', label: 'Dairə', command: '\\circ', category: 'geometry' },
  { symbol: '⊙', label: 'Dairə içində nöqtə', command: '\\odot', category: 'geometry' },
  { symbol: '∘', label: 'Dairəvi əməliyyat', command: '\\circ', category: 'geometry' },
  { symbol: '′', label: 'Dərəcə işarəsi', command: "'", category: 'geometry' },
  { symbol: '″', label: 'İkiqat dərəcə işarəsi', command: '"', category: 'geometry' },

  // Riyazi Funksiyalar
  { symbol: 'lim', label: 'Limit', command: '\\lim', category: 'functions' },
  { symbol: 'sin', label: 'Sinus', command: '\\sin', category: 'functions' },
  { symbol: 'cos', label: 'Kosinus', command: '\\cos', category: 'functions' },
  { symbol: 'tan', label: 'Tangens', command: '\\tan', category: 'functions' },
  { symbol: 'cot', label: 'Kotangens', command: '\\cot', category: 'functions' },
  { symbol: 'sec', label: 'Sekans', command: '\\sec', category: 'functions' },
  { symbol: 'csc', label: 'Kosekans', command: '\\csc', category: 'functions' },
  { symbol: 'arcsin', label: 'Arksinus', command: '\\arcsin', category: 'functions' },
  { symbol: 'arccos', label: 'Arkkosinus', command: '\\arccos', category: 'functions' },
  { symbol: 'arctan', label: 'Arktangens', command: '\\arctan', category: 'functions' },
  { symbol: 'sinh', label: 'Hiperbolik sinus', command: '\\sinh', category: 'functions' },
  { symbol: 'cosh', label: 'Hiperbolik kosinus', command: '\\cosh', category: 'functions' },
  { symbol: 'tanh', label: 'Hiperbolik tangens', command: '\\tanh', category: 'functions' },
  { symbol: 'log', label: 'Loqarifm', command: '\\log', category: 'functions' },
  { symbol: 'ln', label: 'Natural loqarifm', command: '\\ln', category: 'functions' },
  { symbol: 'lg', label: '10-luq loqarifm', command: '\\lg', category: 'functions' },
  { symbol: 'exp', label: 'Eksponensial', command: '\\exp', category: 'functions' },
  { symbol: 'det', label: 'Determinant', command: '\\det', category: 'functions' },
  { symbol: 'max', label: 'Maksimum', command: '\\max', category: 'functions' },
  { symbol: 'min', label: 'Minimum', command: '\\min', category: 'functions' },
  { symbol: 'sup', label: 'Supremum', command: '\\sup', category: 'functions' },
  { symbol: 'inf', label: 'İnfimum', command: '\\inf', category: 'functions' },
  { symbol: 'arg', label: 'Arqument', command: '\\arg', category: 'functions' },
  { symbol: 'dim', label: 'Ölçü', command: '\\dim', category: 'functions' },
  { symbol: 'ker', label: 'Nüvə', command: '\\ker', category: 'functions' },
  { symbol: 'hom', label: 'Homomorfizm', command: '\\hom', category: 'functions' },

  // Ədəd növləri
  { symbol: 'ℍ', label: 'Kvaternion', command: '\\mathbb{H}', category: 'numbers' },
  { symbol: '𝔸', label: 'Cəbri ədəd', command: '\\mathbb{A}', category: 'numbers' },
  { symbol: 'ℙ', label: 'Sadə ədəd', command: '\\mathbb{P}', category: 'numbers' },
  { symbol: '𝔹', label: 'Boolean', command: '\\mathbb{B}', category: 'numbers' },

  // Digər xüsusi simvollar
  { symbol: '♭', label: 'Bemol', command: '\\flat', category: 'special' },
  { symbol: '♯', label: 'Diyez', command: '\\sharp', category: 'special' },
  { symbol: '♮', label: 'Natural', command: '\\natural', category: 'special' },
  { symbol: '†', label: 'Dəqiq', command: '\\dagger', category: 'special' },
  { symbol: '‡', label: 'İkiqat dəqiq', command: '\\ddagger', category: 'special' },
  { symbol: '⋆', label: 'Ulduz', command: '\\star', category: 'special' },
  { symbol: '⋄', label: 'Almaz', command: '\\diamond', category: 'special' },
  { symbol: '∙', label: 'Kiçik nöqtə', command: '\\bullet', category: 'special' },
  { symbol: '✓', label: 'Çek işarəsi', command: '\\checkmark', category: 'special' },
  { symbol: '✗', label: 'X işarəsi', command: '\\times', category: 'special' },
];

const CATEGORIES = [
  { id: 'all', label: 'Hamısı' },
  { id: 'basic', label: 'Əsas Simvollar' },
  { id: 'operators', label: 'Əməliyyatlar' },
  { id: 'fractions', label: 'Kəsrlər' },
  { id: 'greek', label: 'Yunan Hərfləri' },
  { id: 'greek_upper', label: 'Böyük Yunan' },
  { id: 'arrows', label: 'Oxlar' },
  { id: 'set', label: 'Çoxluq' },
  { id: 'logic', label: 'Məntiq' },
  { id: 'relations', label: 'Əlaqələr' },
  { id: 'geometry', label: 'Həndəsə' },
  { id: 'functions', label: 'Funksiyalar' },
  { id: 'numbers', label: 'Ədəd Növləri' },
  { id: 'roots', label: 'Köklər' },
  { id: 'special', label: 'Xüsusi' },
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
    setShowSymbols(false);
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

    let html = latex.trim();

    // Köklər
    html = html.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, (match, degree, content) => {
      return `<span class="math-sqrt"><sup class="sqrt-degree">${degree}</sup><span class="sqrt-symbol">√</span><span class="sqrt-content">${content}</span></span>`;
    });

    html = html.replace(/\\sqrt\{([^}]+)\}/g, (match, content) => {
      return `<span class="math-sqrt"><span class="sqrt-symbol">√</span><span class="sqrt-content">${content}</span></span>`;
    });

    // Kəsrlər
    html = html.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, numerator, denominator) => {
      return `<span class="math-frac"><span class="frac-num">${numerator}</span><span class="frac-line">/</span><span class="frac-den">${denominator}</span></span>`;
    });

    // Üst və alt indekslər
    html = html.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
    html = html.replace(/\^([a-zA-Z0-9α-ωΑ-Ω+\-±])/g, '<sup>$1</sup>');
    html = html.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
    html = html.replace(/_([a-zA-Z0-9α-ωΑ-Ω+\-±])/g, '<sub>$1</sub>');

    // LaTeX komandalarını Unicode simvollarına çevir
    const replacements: [RegExp, string][] = [
      [/\\pi/g, 'π'],
      [/\\infty/g, '∞'],
      [/\\sum/g, '∑'],
      [/\\int/g, '∫'],
      [/\\prod/g, '∏'],
      [/\\partial/g, '∂'],
      [/\\nabla/g, '∇'],
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
      [/\\pi/g, 'π'],
      [/\\rho/g, 'ρ'],
      [/\\sigma/g, 'σ'],
      [/\\tau/g, 'τ'],
      [/\\upsilon/g, 'υ'],
      [/\\phi/g, 'φ'],
      [/\\chi/g, 'χ'],
      [/\\psi/g, 'ψ'],
      [/\\omega/g, 'ω'],
      [/\\Gamma/g, 'Γ'],
      [/\\Delta/g, 'Δ'],
      [/\\Theta/g, 'Θ'],
      [/\\Lambda/g, 'Λ'],
      [/\\Xi/g, 'Ξ'],
      [/\\Pi/g, 'Π'],
      [/\\Sigma/g, 'Σ'],
      [/\\Upsilon/g, 'Υ'],
      [/\\Phi/g, 'Φ'],
      [/\\Psi/g, 'Ψ'],
      [/\\Omega/g, 'Ω'],
      [/\\rightarrow/g, '→'],
      [/\\leftarrow/g, '←'],
      [/\\uparrow/g, '↑'],
      [/\\downarrow/g, '↓'],
      [/\\leftrightarrow/g, '↔'],
      [/\\Rightarrow/g, '⇒'],
      [/\\Leftarrow/g, '⇐'],
      [/\\Leftrightarrow/g, '⇔'],
      [/\\mapsto/g, '↦'],
      [/\\to/g, '→'],
      [/\\in/g, '∈'],
      [/\\notin/g, '∉'],
      [/\\subset/g, '⊂'],
      [/\\subseteq/g, '⊆'],
      [/\\supset/g, '⊃'],
      [/\\supseteq/g, '⊇'],
      [/\\cup/g, '∪'],
      [/\\cap/g, '∩'],
      [/\\setminus/g, '∖'],
      [/\\emptyset/g, '∅'],
      [/\\forall/g, '∀'],
      [/\\exists/g, '∃'],
      [/\\nexists/g, '∄'],
      [/\\neg/g, '¬'],
      [/\\wedge/g, '∧'],
      [/\\vee/g, '∨'],
      [/\\Rightarrow/g, '⇒'],
      [/\\Leftrightarrow/g, '⇔'],
      [/\\angle/g, '∠'],
      [/\\triangle/g, '△'],
      [/\\square/g, '□'],
      [/\\circ/g, '○'],
      [/\\odot/g, '⊙'],
      [/\\parallel/g, '∥'],
      [/\\perp/g, '⊥'],
      [/\\cong/g, '≅'],
      [/\\sim/g, '∼'],
      [/\\propto/g, '∝'],
      [/\\equiv/g, '≡'],
      [/\\ll/g, '≪'],
      [/\\gg/g, '≫'],
      [/\\mathbb\{N\}/g, 'ℕ'],
      [/\\mathbb\{Z\}/g, 'ℤ'],
      [/\\mathbb\{Q\}/g, 'ℚ'],
      [/\\mathbb\{R\}/g, 'ℝ'],
      [/\\mathbb\{C\}/g, 'ℂ'],
      [/\\mathbb\{H\}/g, 'ℍ'],
      [/\\mathbb\{A\}/g, '𝔸'],
      [/\\mathbb\{P\}/g, 'ℙ'],
      [/\\mathbb\{B\}/g, '𝔹'],
      [/\\^\\circ/g, '°'],
      [/\\lceil/g, '⌈'],
      [/\\rceil/g, '⌉'],
      [/\\lfloor/g, '⌊'],
      [/\\rfloor/g, '⌋'],
      [/\\ell/g, 'ℓ'],
      [/\\hbar/g, 'ℏ'],
      [/\\Im/g, 'ℑ'],
      [/\\Re/g, 'ℜ'],
      [/\\wp/g, '℘'],
      [/\\aleph/g, 'ℵ'],
      [/\\varnothing/g, '∅'],
      [/\\bigcap/g, '⋂'],
      [/\\bigcup/g, '⋃'],
      [/\\flat/g, '♭'],
      [/\\sharp/g, '♯'],
      [/\\natural/g, '♮'],
      [/\\dagger/g, '†'],
      [/\\ddagger/g, '‡'],
      [/\\star/g, '⋆'],
      [/\\diamond/g, '⋄'],
      [/\\bullet/g, '∙'],
      [/\\checkmark/g, '✓'],
    ];

    replacements.forEach(([regex, replacement]) => {
      html = html.replace(regex, replacement);
    });

    // Xüsusi işarələr
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\s+/g, ' ');

    return html;
  };

  const contentHtml = text
    ? `<div class="math-html">${latexToHtml(text)}</div>`
    : `<span class="text-gray-400 italic">Preview görünəcək...</span>`;

  return (
    <div className={`space-y-2 ${className}`}>
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
        <DialogContent className="sm:max-w-md h-50 overflow-hidden">
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
        <DialogContent className="sm:max-w-md h-50 overflow-hidden">
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
        <DialogContent className="max-w-8xl max-h-[90vh] overflow-auto">
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