// src/pages/tutor/TutorPayments.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle, Clock, Loader2, Search, XCircle } from 'lucide-react';
import { fetchTutorPayments, updateEnrollmentFee } from '../../api';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: '#10b98115', color: '#10b981' },
  submitted:  { bg: '#f59e0b15', color: '#f59e0b' },
  pending:    { bg: '#6b728015', color: '#6b7280' },
};

export default function TutorPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => fetchTutorPayments().then(setPayments).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const confirm = async (eid: number) => { await updateEnrollmentFee(eid, true); load(); };
  const reject = async (eid: number) => { await updateEnrollmentFee(eid, false); load(); };

  const filtered = payments.filter(p =>
    (p.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.course_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.payment_ref || '').toLowerCase().includes(search.toLowerCase())
  );

  const METHOD_ICONS: Record<string, string> = { jazzcash: '🟠', easypaisa: '🟢', bank: '🏦', other: '💳' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Payments</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Review student payment submissions and confirm fee status.</p>
      </div>

      {/* Payment Instructions Card */}
      <div className="p-4 rounded-2xl border mb-6" style={{ backgroundColor: '#6366f108', borderColor: '#6366f130' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#6366f1' }}>Payment Setup</p>
        <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Students will submit their JazzCash or EasyPaisa transaction ID after paying. Review them here and confirm payment once verified.
          Share your JazzCash number <strong style={{ color: 'var(--noto-text-primary)' }}>03XX-XXXXXXX</strong> with enrolled students.
        </p>
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or transaction ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div>
        : filtered.length === 0 ? (
          <div className="text-center py-20 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
            {payments.length === 0 ? 'No payment submissions yet.' : 'No results found.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => {
              const sc = STATUS_COLORS[p.payment_status] || STATUS_COLORS.pending;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-white"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                      {(p.username || p.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{p.username || 'Student'}</span>
                        <span className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>{p.email}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: sc.bg, color: sc.color }}>
                          {p.payment_status}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--noto-text-secondary)' }}>Course: <strong style={{ color: 'var(--noto-text-primary)' }}>{p.course_title}</strong></p>
                      {p.payment_ref && (
                        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--noto-surface-alt)' }}>
                          <span className="text-base">{METHOD_ICONS[p.payment_method] || '💳'}</span>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--noto-text-secondary)' }}>{p.payment_method} Transaction</p>
                            <p className="text-sm font-mono font-bold" style={{ color: 'var(--noto-text-primary)' }}>{p.payment_ref}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {p.payment_status !== 'confirmed' && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => confirm(p.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
                          <CheckCircle size={12} /> Confirm
                        </button>
                        <button onClick={() => reject(p.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ backgroundColor: '#ef444415', color: '#ef4444' }}>
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}
                    {p.payment_status === 'confirmed' && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
                        <CheckCircle size={12} /> Confirmed
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}
