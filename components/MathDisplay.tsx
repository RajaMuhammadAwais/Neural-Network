import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathDisplayProps {
  formula: string;
  className?: string;
  block?: boolean;
}

export const MathDisplay: React.FC<MathDisplayProps> = ({ formula, className = '', block = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Check for quirks mode before attempting render to avoid "KaTeX doesn't work in quirks mode" error
      if (document.compatMode === 'BackCompat') {
        console.warn("KaTeX rendering skipped: Document is in Quirks Mode.");
        containerRef.current.innerText = formula;
        return;
      }

      try {
        katex.render(formula, containerRef.current, {
          throwOnError: false,
          displayMode: block
        });
      } catch (error) {
        console.error("KaTeX render error:", error);
        // Fallback to plain text if rendering fails (e.g. quirks mode or invalid TeX)
        containerRef.current.innerText = formula;
      }
    }
  }, [formula, block]);

  return <div ref={containerRef} className={`font-mono text-slate-200 ${className}`} />;
};