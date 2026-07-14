import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20" style={{ color: 'var(--noto-text-primary)' }}>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-8 transition-colors"
        style={{ color: 'var(--noto-text-secondary)' }}
      >
        <ChevronLeft size={14} />
        Home
      </Link>
      <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Terms of Service</h1>
      <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--noto-text-secondary)' }}>
        <p className="text-sm italic">Last Updated: April 13, 2026</p>
        
        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>1. Acceptance of Terms</h2>
          <p>
            By accessing and using NOTO, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on NOTO's website for personal, non-commercial transitory viewing only.
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Modify or copy the materials;</li>
            <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>Attempt to decompile or reverse engineer any software contained on NOTO's website;</li>
            <li>Remove any copyright or other proprietary notations from the materials.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>3. Disclaimer</h2>
          <p>
            The materials on NOTO's website are provided on an 'as is' basis. NOTO makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>4. Limitations</h2>
          <p>
            In no event shall NOTO or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on NOTO's website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>5. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </section>
      </div>
    </div>
  );
}
