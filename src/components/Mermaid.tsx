import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    fontFamily: 'Space Grotesk, sans-serif',
    primaryColor: '#0070f3',
    lineColor: '#666',
  }
});

interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const id = `mermaid-${crypto.randomUUID()}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) setSvgContent(svg);
      } catch (error) {
        console.error('Mermaid rendering failed', error);
      }
    };
    renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  const [isEnlarged, setIsEnlarged] = useState(false);

  return (
    <>
      {svgContent ? (
        <div
          ref={containerRef}
          onClick={() => setIsEnlarged(true)}
          className="my-4 flex justify-center w-full overflow-x-auto cursor-pointer hover:opacity-80 transition-opacity"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div
          ref={containerRef}
          className="my-4 flex justify-center w-full overflow-x-auto min-h-[150px] items-center bg-[var(--noto-surface-alt)] rounded-lg animate-pulse"
        >
          <div className="text-[var(--noto-text-secondary)] text-sm font-medium">Generating Diagram...</div>
        </div>
      )}

      {isEnlarged && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10 cursor-zoom-out"
          onClick={() => setIsEnlarged(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsEnlarged(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div 
            className="bg-white p-6 rounded-xl max-w-full max-h-full overflow-auto cursor-auto"
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      )}
    </>
  );
}
