'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

export default function MathText({ text, className = '' }: MathTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    let processedText = text;

    // Substitui $$ ... $$ por blocos
    processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      try {
        return `<div class="katex-block my-2">${katex.renderToString(formula.trim(), { 
          displayMode: true,
          throwOnError: false 
        })}</div>`;
      } catch {
        return match;
      }
    });

    // Substitui $ ... $ por inline
    processedText = processedText.replace(/\$([^\$]+?)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), { 
          displayMode: false,
          throwOnError: false 
        });
      } catch {
        return match;
      }
    });

    // Substitui \[ ... \] por blocos
    processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
      try {
        return `<div class="katex-block my-2">${katex.renderToString(formula.trim(), { 
          displayMode: true,
          throwOnError: false 
        })}</div>`;
      } catch {
        return match;
      }
    });

    // Substitui \( ... \) por inline
    processedText = processedText.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), { 
          displayMode: false,
          throwOnError: false 
        });
      } catch {
        return match;
      }
    });

    containerRef.current.innerHTML = processedText;
  }, [text]);

  return (
    <div 
      ref={containerRef} 
      className={`math-text ${className}`}
    />
  );
}
