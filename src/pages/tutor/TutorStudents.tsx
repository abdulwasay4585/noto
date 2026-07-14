// src/pages/tutor/TutorStudents.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Clock, CheckCircle, XCircle, UserPlus, Loader2, AlertCircle, Search, ChevronDown } from 'lucide-react';
import { fetchTutorStudents, fetchStudentEnrollments, updateEnrollmentFee, enrollStudent, fetchTutorCourses } from '../../api';

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TutorStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollData, setEnrollData] = useState({ student_id: '', course_id: '' });
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<Record<number, any[]>>({});
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchTutorStudents(), fetchTutorCourses()])
      .then(([s, c]) => { setStudents(s); setCourses(c); })
      .finally(() => setLoading(false));
  }, []);

  const loadEnrollments = async (sid: number) => {
    if (studentEnrollments[sid]) { setExpandedStudent(expandedStudent === sid ? null : sid); return; }
    const data = await fetchStudentEnrollments(sid);
    setStudentEnrollments(prev => ({ ...prev, [sid]: data }));
    setExpandedStudent(expandedStudent === sid ? null : sid);
  };

  const toggleFee = async (eid: number, current: boolean, sid: number) => {
    await updateEnrollmentFee(eid, !current);
    const updated = await fetchStudentEnrollments(sid);
    setStudentEnrollments(prev => ({ ...prev, [sid]: updated }));
    const updatedStudents = await fetchTutorStudents();
    setStudents(updatedStudents);
  };

  const handleEnroll = async () => {
    if (!enrollData.student_id || !enrollData.course_id) { setError('Fill all fields'); return; }
    setEnrolling(true); setError('');
    try {
      await enrollStudent({ student_id: Number(enrollData.student_id), course_id: Number(enrollData.course_id) });
      const updated = await fetchTutorStudents();
      setStudents(updated);
      setEnrollModalOpen(false);
      setEnrollData({ student_id: '', course_id: '' });
    } catch { setError('Failed to enroll. Make sure the student ID is valid.'); }
    finally { setEnrolling(false); }
  };

  const filtered = students.filter(s =>
    (s.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Students</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--noto-text-secondary)' }}>Monitor your enrolled students and fee status.</p>
        </div>
        <button onClick={() => setEnrollModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <UserPlus size={15} /> Enroll Student
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--noto-text-secondary)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search students..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          <Users size={40} className="mx-auto mb-3 opacity-30" /> No students yet. Enroll your first student!
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => loadEnrollments(s.id)}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {(s.username || s.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'var(--noto-text-primary)' }}>{s.username || 'Student'}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--noto-text-secondary)' }}>{s.email}</div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}>
                  <Clock size={11} /> {timeAgo(s.last_seen)}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: Number(s.paid_courses) === Number(s.total_courses) && Number(s.total_courses) > 0 ? '#10b98115' : '#ef444415',
                    color: Number(s.paid_courses) === Number(s.total_courses) && Number(s.total_courses) > 0 ? '#10b981' : '#ef4444' }}>
                  {Number(s.paid_courses) === Number(s.total_courses) && Number(s.total_courses) > 0 ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {s.paid_courses}/{s.total_courses} paid
                </div>
                <ChevronDown size={16} className={`transition-transform ${expandedStudent === s.id ? 'rotate-180' : ''}`} style={{ color: 'var(--noto-text-secondary)' }} />
              </div>

              {expandedStudent === s.id && (
                <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--noto-border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--noto-text-secondary)' }}>Enrollments</p>
                  {(studentEnrollments[s.id] || []).length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>No course enrollments yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(studentEnrollments[s.id] || []).map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--noto-surface-alt)' }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--noto-text-primary)' }}>{e.course_title}</p>
                            <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>PKR {e.price} • {e.payment_status}</p>
                          </div>
                          <button onClick={() => toggleFee(e.id, e.fee_paid, s.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              backgroundColor: e.fee_paid ? '#10b98115' : '#ef444415',
                              color: e.fee_paid ? '#10b981' : '#ef4444',
                            }}>
                            {e.fee_paid ? <><CheckCircle size={11} /> Paid</> : <><XCircle size={11} /> Unpaid</>}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Enroll Modal */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 rounded-2xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Enroll Student</h2>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Student User ID</label>
                <input type="number" value={enrollData.student_id} onChange={e => setEnrollData(d => ({ ...d, student_id: e.target.value }))}
                  placeholder="Enter student user ID"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--noto-text-secondary)' }}>Course</label>
                <select value={enrollData.course_id} onChange={e => setEnrollData(d => ({ ...d, course_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}>
                  <option value="">Select a course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEnrollModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}>Cancel</button>
              <button onClick={handleEnroll} disabled={enrolling}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {enrolling ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Enroll
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
