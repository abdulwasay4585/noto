import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function Privacy() {
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
      <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Privacy Policy</h1>
      <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--noto-text-secondary)' }}>
        <p className="text-sm italic">Last Updated: April 13, 2026</p>
        
        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us when you use our services, such as when you search for resources or interact with our AI summarization tool.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, to develop new features, and to protect NOTOO and our users.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>3. Information Sharing and Disclosure</h2>
          <p>
            We do not share your personal information with companies, organizations, or individuals outside of NOTOO except in the following cases:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>With your consent;</li>
            <li>For external processing (e.g., AI analysis);</li>
            <li>For legal reasons.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>4. Data Security</h2>
          <p>
            We work hard to protect NOTOO and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>5. Your Rights</h2>
          <p>
            You have the right to access, update, or delete the information we have on you. Whenever made possible, you can update your personal information directly within your account settings section.
          </p>
        </section>
      </div>
    </div>
  );
}
