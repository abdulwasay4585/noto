import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentPayment() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '' });

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem('noto_token');
      const res = await fetch(`/api/tutor/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
      } else {
        throw new Error('Course not found');
      }
    } catch (err) {
      setError('Failed to load course details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const token = localStorage.getItem('noto_token');
      const res = await fetch(`/api/tutor/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          payment_ref: `txn_${Date.now()}`
        })
      });

      if (!res.ok) throw new Error('Payment failed');

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-tutor');
      }, 2000);
    } catch (err) {
      setError('An error occurred during payment processing.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[var(--noto-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
        <p className="text-gray-500 mb-6">The course you are trying to pay for does not exist.</p>
        <button onClick={() => navigate('/tutoring')} className="text-[var(--noto-primary)] font-medium hover:underline">
          Go back to Tutoring
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
      >
        <div className="p-8 border-b" style={{ borderColor: 'var(--noto-border)', backgroundColor: 'var(--noto-surface-alt)' }}>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
            Complete Your Enrollment
          </h1>
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            Review your order and complete your payment to enroll in this course.
          </p>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div>
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
              Order Summary
            </h2>
            <div className="p-5 rounded-xl border mb-6" style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--noto-text-primary)' }}>{course.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>Taught by {course.tutor_name || 'Instructor'}</p>
                </div>
                <div className="text-lg font-bold" style={{ color: 'var(--noto-text-primary)' }}>
                  ${Number(course.fee).toFixed(2)}
                </div>
              </div>
              <div className="pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--noto-border)' }}>
                <span className="font-medium" style={{ color: 'var(--noto-text-primary)' }}>Total Due</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--noto-primary)' }}>${Number(course.fee).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-medium">By completing this payment, you will receive lifetime access to all course materials and updates.</p>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
              Payment Details
            </h2>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <AlertCircle size={18} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {success ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)' }}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-green-600 dark:text-green-400">Payment Successful!</h3>
                <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>You are now enrolled in the course. Redirecting to your dashboard...</p>
              </motion.div>
            ) : (
              <form onSubmit={handlePayment} className="space-y-5">
                {/* Method selector */}
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'ring-2 ring-[var(--noto-primary)]' : ''}`}
                    style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: paymentMethod === 'card' ? 'var(--noto-primary)' : 'var(--noto-border)' }}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={24} style={{ color: paymentMethod === 'card' ? 'var(--noto-primary)' : 'var(--noto-text-secondary)' }} />
                    <span className="text-sm font-medium" style={{ color: paymentMethod === 'card' ? 'var(--noto-primary)' : 'var(--noto-text-secondary)' }}>Credit Card</span>
                  </label>
                  <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'bank_transfer' ? 'ring-2 ring-[var(--noto-primary)]' : ''}`}
                    style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: paymentMethod === 'bank_transfer' ? 'var(--noto-primary)' : 'var(--noto-border)' }}
                    onClick={() => setPaymentMethod('bank_transfer')}
                  >
                    <svg className="w-6 h-6" style={{ color: paymentMethod === 'bank_transfer' ? 'var(--noto-primary)' : 'var(--noto-text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-sm font-medium" style={{ color: paymentMethod === 'bank_transfer' ? 'var(--noto-primary)' : 'var(--noto-text-secondary)' }}>Bank Transfer</span>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Card Number</label>
                      <input type="text" required placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors focus:ring-2 focus:ring-[var(--noto-primary)]"
                        style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                        value={cardDetails.number} onChange={e => setCardDetails(p => ({ ...p, number: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Expiry Date</label>
                        <input type="text" required placeholder="MM/YY" className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors focus:ring-2 focus:ring-[var(--noto-primary)]"
                          style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                          value={cardDetails.expiry} onChange={e => setCardDetails(p => ({ ...p, expiry: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>CVC</label>
                        <input type="text" required placeholder="123" className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors focus:ring-2 focus:ring-[var(--noto-primary)]"
                          style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                          value={cardDetails.cvc} onChange={e => setCardDetails(p => ({ ...p, cvc: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-500/25"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      Pay ${Number(course.fee).toFixed(2)}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
