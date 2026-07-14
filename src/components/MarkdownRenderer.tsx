import ReactMarkdown from 'react-markdown';
import Mermaid from './Mermaid';
import { useState } from 'react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  remarkPlugins?: any[];
  rehypePlugins?: any[];
}

const MarkdownImage = ({ src, alt, ...props }: any) => {
  const [loaded, setLoaded] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  
  return (
    <>
      <span 
        className="block relative min-h-[150px] w-full max-w-full bg-[var(--noto-surface-alt)] rounded-lg overflow-hidden my-4 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setIsEnlarged(true)}
      >
        <img
          src={src}
          alt={alt}
          {...props}
          className={`absolute inset-0 w-full h-auto max-h-[500px] object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={(e) => {
            setLoaded(true);
            e.currentTarget.parentElement?.classList.remove('animate-pulse');
            e.currentTarget.parentElement?.style.setProperty('min-height', 'auto');
            e.currentTarget.style.setProperty('position', 'relative');
          }}
        />
        {!loaded && (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-[var(--noto-text-secondary)] animate-pulse">
            Loading image...
          </span>
        )}
      </span>

      {isEnlarged && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10 cursor-zoom-out"
          onClick={() => setIsEnlarged(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full cursor-pointer z-50"
            onClick={(e) => {
              e.stopPropagation();
              setIsEnlarged(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-xl cursor-auto"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

const MarkdownCode = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  if (!inline && match && match[1] === 'mermaid') {
    return <Mermaid chart={String(children).replace(/\n$/, '')} />;
  }
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default function MarkdownRenderer({ content, className = '', remarkPlugins = [], rehypePlugins = [] }: MarkdownRendererProps) {
  // Pre-process AI output to normalize Mermaid blocks
  // AI models sometimes output raw HTML tags like <pre class="mermaid"> instead of markdown code blocks
  const normalizedContent = (content || '').replace(
    /<(?:pre|div)\s+class(?:Name)?="mermaid">([\s\S]*?)<\/(?:pre|div)>/gi,
    "```mermaid\n$1\n```"
  );

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, ...remarkPlugins]}
        rehypePlugins={[rehypeKatex, ...rehypePlugins]}
        components={{
          img: MarkdownImage,
          code: MarkdownCode
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
