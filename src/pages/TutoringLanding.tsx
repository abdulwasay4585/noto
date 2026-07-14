import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { GraduationCap, Users, BookOpen, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TutoringLanding() {
  const { user } = useAuth();

  const getStudentPath = () => {
    if (!user) return '/login';
    if (user.role === 'student' || user.role === 'admin') return '/my-tutor';
    return '/'; // fallback
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: 'var(--noto-background)', color: 'var(--noto-text-primary)' }}>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold border"
              style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}>
              <Star size={16} style={{ color: '#f59e0b' }} fill="#f59e0b" /> NOTO Tutoring
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Connect. Learn. <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>Succeed.</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed mb-10" style={{ color: 'var(--noto-text-secondary)' }}>
              Whether you want to share your expertise and earn as a tutor, or master new subjects with personalized guidance as a student, NOTO connects you seamlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/tutor-register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <GraduationCap size={20} />
                Become a Tutor
              </Link>
              <Link to={getStudentPath()}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 border transition-all"
                style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--noto-surface-alt)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--noto-surface)')}>
                <Users size={20} />
                Become a Student
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mt-20">
          {/* For Tutors */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl border relative overflow-hidden"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <GraduationCap size={120} />
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <GraduationCap size={28} color="white" />
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>For Tutors</h3>
            <ul className="space-y-4 mb-8" style={{ color: 'var(--noto-text-secondary)' }}>
              <li className="flex items-start gap-3">
                <div className="mt-1"><CheckIcon /></div>
                <span>Create courses, upload videos, and organize readings easily.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><CheckIcon /></div>
                <span>Schedule and conduct live classes via Zoom, Teams, or Meet.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><CheckIcon /></div>
                <span>Manage student enrollments and verify payments seamlessly.</span>
              </li>
            </ul>
            <Link to="/tutor-register" className="inline-flex items-center gap-2 font-semibold transition-colors" style={{ color: '#6366f1' }}>
              Start Teaching <ArrowRight size={18} />
            </Link>
          </motion.div>

          {/* For Students */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="p-8 rounded-3xl border relative overflow-hidden"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BookOpen size={120} />
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <Users size={28} color="white" />
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>For Students</h3>
            <ul className="space-y-4 mb-8" style={{ color: 'var(--noto-text-secondary)' }}>
              <li className="flex items-start gap-3">
                <div className="mt-1"><CheckIcon /></div>
                <span>Browse expert tutors and enroll in comprehensive courses.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><CheckIcon /></div>
                <span>Access a unified dashboard for video lessons and materials.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><CheckIcon /></div>
                <span>Stay on track with live class reminders and announcements.</span>
              </li>
            </ul>
            <Link to={getStudentPath()} className="inline-flex items-center gap-2 font-semibold transition-colors" style={{ color: '#10b981' }}>
              Start Learning <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 shrink-0">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--noto-text-primary)' }}>
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  );
}
