// src/pages/student/MyTutorPayment.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle, Clock, Loader2, AlertCircle, Send, X } from 'lucide-react';
import { fetchMyCourses, submitPaymentRef } from '../../api';

const METHODS = [
  { id: 'jazzcash', label: 'JazzCash', color: '#EF4444', emoji: '🟠', number: '03XX-XXXXXXX' },
  { id: 'easypaisa', label: 'EasyPaisa', color: '#10b981', emoji: '🟢', number: '03XX-XXXXXXX' },
  { id: 'bank', label: 'Bank Transfer', color: '#6366f1', emoji: '🏦', number: 'IBAN / Account' },
];

const STATUS_UI: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pending', color: '#f59e0b', bg: '#f59e0b15', icon: Clock },
  submitted: { label: 'Under Review', color: '#6366f1', bg: '#6366f115', icon: Clock },
  confirmed: { label: 'Confirmed', color: '#10b981', bg: '#10b98115', icon: CheckCircle },
};

export default function MyTutorPayment() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCourse, setModalCourse] = useState<any>(null);
  const [method, setMethod] = useState('jazzcash');
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchMyCourses().then(setCourses).finally(() => setLoading(false)); }, []);

  const handleSubmit = async () => {
    if (!ref.trim()) { setError('Enter your transaction ID'); return; }
    setSubmitting(true); setError('');
    try {
      await submitPaymentRef({ enrollment_id: modalCourse.enrollment_id, payment_ref: ref.trim(), payment_method: method });
      setSuccess('Payment submitted! Your tutor will confirm it shortly.');
      setModalCourse(null);
      const updated = await fetchMyCourses();
      setCourses(updated);
    } catch { setError('Failed to submit. Try again.'); }
    finally { setSubmitting(false); }
  };

  const unpaid = courses.filter(c => !c.fee_paid);
  const paid = courses.filter(c => c.fee_paid);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Payments</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Manage your course fee payments via JazzCash or EasyPaisa.</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-2xl mb-5 text-sm" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div> : (
        <>
          {unpaid.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#ef4444' }}>Outstanding Payments</h2>
              <div className="space-y-3">
                {unpaid.map((c, i) => {
                  const status = STATUS_UI[c.payment_status] || STATUS_UI.pending;
                  return (
                    <motion.div key={c.enrollment_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: '#ef444430' }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        <CreditCard size={18} color="white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{c.title}</p>
                        <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>by {c.tutor_name} · PKR {c.price}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <status.icon size={11} style={{ color: status.color }} />
                          <span className="text-xs font-semibold" style={{ color: status.color }}>{status.label}</span>
                        </div>
                      </div>
                      {c.payment_status !== 'submitted' && (
                        <button onClick={() => { setModalCourse(c); setRef(''); setError(''); setMethod('jazzcash'); }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}>
                          <Send size={12} /> Pay Now
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#10b981' }}>Paid Courses</h2>
              <div className="space-y-2">
                {paid.map(c => (
                  <div key={c.enrollment_id} className="flex items-center gap-3 p-3 rounded-xl border opacity-75" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                    <CheckCircle size={16} style={{ color: '#10b981' }} />
                    <span className="text-sm flex-1" style={{ color: 'var(--noto-text-primary)' }}>{c.title}</span>
                    <span className="text-xs font-semibold" style={{ color: '#10b981' }}>PKR {c.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {courses.length === 0 && (
            <div className="text-center py-20" style={{ color: 'var(--noto-text-secondary)' }}>
              <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No enrolled courses found.</p>
            </div>
          )}
        </>
      )}

      {/* Payment Modal */}
      {modalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm p-6 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Submit Payment</h2>
              <button onClick={() => setModalCourse(null)} style={{ color: 'var(--noto-text-secondary)' }}><X size={18} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--noto-text-secondary)' }}>
              Pay <strong style={{ color: 'var(--noto-text-primary)' }}>PKR {modalCourse.price}</strong> for <strong style={{ color: 'var(--noto-text-primary)' }}>{modalCourse.title}</strong> and enter your transaction ID below.
            </p>

            {error && <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}><AlertCircle size={14} /> {error}</div>}

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--noto-text-secondary)' }}>Payment Method</label>
              <div className="space-y-2">
                {METHODS.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all"
                    style={{
                      backgroundColor: method === m.id ? m.color + '10' : 'var(--noto-surface-alt)',
                      borderColor: method === m.id ? m.color : 'var(--noto-border)',
                    }}>
                    <span className="text-xl">{m.emoji}</span>
                    <div className="text-left">
                      <p className="font-semibold text-sm" style={{ color: method === m.id ? m.color : 'var(--noto-text-primary)' }}>{m.label}</p>
                      <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>Send to: {m.number}</p>
                    </div>
                    {method === m.id && <CheckCircle size={16} className="ml-auto" style={{ color: m.color }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Transaction ID / Reference Number</label>
              <input value={ref} onChange={e => setRef(e.target.value)} placeholder="e.g. JC-1234567890"
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalCourse(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
