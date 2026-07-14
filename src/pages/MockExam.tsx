import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, Timer, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { fetchSubjects, generateMockExam, submitMockExam, solveMockExam } from '../api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import Mermaid from '../components/Mermaid';
import html2pdf from 'html2pdf.js';

const SESSION_KEY = 'noto-session-id';
function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(SESSION_KEY, id); }
  return id;
}

const BOARDS = [
  { id: 'IGCSE', name: 'IGCSE' },
  { id: 'CAIE', name: 'CAIE' },
  { id: 'SAT', name: 'SAT' }
];

const LEVELS: Record<string, { id: string, name: string }[]> = {
  'IGCSE': [{ id: 'O Level', name: 'O Level' }],
  'CAIE': [{ id: 'O Level', name: 'O Level' }, { id: 'A Level', name: 'A Level' }],
  'SAT': []
};

const SYLLABUS_TOPICS: Record<string, string[]> = {
  // O Level
  '1-Mathematics': ['Number', 'Algebra', 'Geometry', 'Mensuration', 'Coordinate Geometry', 'Trigonometry', 'Vectors', 'Probability & Statistics'],
  '1-Physics': ['General Physics', 'Thermal Physics', 'Waves (Light & Sound)', 'Electricity and Magnetism', 'Atomic Physics'],
  '1-Chemistry': ['States of Matter', 'Atoms, Elements & Compounds', 'Stoichiometry', 'Electrochemistry', 'Chemical Energetics', 'Chemical Reactions', 'Acids, Bases & Salts', 'The Periodic Table', 'Metals', 'Chemistry of the Environment', 'Organic Chemistry', 'Experimental Techniques'],
  '1-Biology': ['Cell structure', 'Biological molecules', 'Enzymes', 'Plant nutrition', 'Animal nutrition', 'Transport in plants', 'Transport in animals', 'Respiration', 'Coordination and response', 'Reproduction', 'Inheritance'],
  '1-Computer Science': ['Data representation', 'Communication and Internet technologies', 'Hardware and software', 'Security', 'Ethics', 'Algorithm design and problem-solving', 'Programming', 'Databases'],
  '1-Economics': ['The basic economic problem', 'The allocation of resources', 'Microeconomic decision makers', 'Government and the macroeconomy', 'Economic development', 'International trade and globalisation'],
  '1-Business Studies': ['Understanding business activity', 'People in business', 'Marketing', 'Operations management', 'Financial information and decisions', 'External influences on business activity'],
  '1-English Language': ['Reading for ideas', 'Reading for meaning', 'Directed Writing', 'Composition'],
  
  // A Level
  '2-Further Mathematics': ['Polynomial equations and rational functions', 'Complex numbers', 'Matrices', 'Polar coordinates', 'Vectors', 'Hyperbolic functions', 'Calculus', 'Further Mechanics', 'Further Probability & Statistics'],
  '2-Biology': ['Cell structure', 'Biological molecules', 'Enzymes', 'Cell membranes and transport', 'The mitotic cell cycle', 'Nucleic acids and protein synthesis', 'Transport in plants', 'Transport in mammals', 'Gas exchange and smoking', 'Infectious disease', 'Immunity', 'Energy and respiration', 'Photosynthesis', 'Homeostasis', 'Control and co-ordination', 'Inherited change', 'Selection and evolution', 'Biodiversity, classification, and conservation', 'Genetic technology'],
  '2-Mathematics': ['Quadratics', 'Functions', 'Coordinate geometry', 'Circular measure', 'Trigonometry', 'Series', 'Differentiation', 'Integration', 'Algebra', 'Logarithmic and exponential functions', 'Vector geometry', 'Complex numbers', 'Differential equations', 'Mechanics', 'Probability & Statistics'],
  '2-Physics': ['Physical quantities and units', 'Kinematics', 'Dynamics', 'Forces, density and pressure', 'Work, energy and power', 'Deformation of solids', 'Waves', 'Superposition', 'Electricity', 'D.C. circuits', 'Particle physics', 'Motion in a circle', 'Gravitational fields', 'Ideal gases', 'Temperature', 'Thermal properties of materials', 'Oscillations', 'Communication', 'Capacitance', 'Electronics', 'Magnetic fields', 'Electromagnetic induction', 'Alternating currents', 'Quantum physics', 'Nuclear physics'],
  '2-Chemistry': ['Atoms, molecules and stoichiometry', 'Atomic structure', 'Chemical bonding', 'States of matter', 'Chemical energetics', 'Electrochemistry', 'Equilibria', 'Reaction kinetics', 'Periodicity', 'Group 2', 'Halogens', 'Nitrogen and sulfur', 'Introduction to organic chemistry', 'Hydrocarbons', 'Halogen derivatives', 'Hydroxy compounds', 'Carbonyl compounds', 'Carboxylic acids and derivatives', 'Nitrogen compounds', 'Polymerisation', 'Analytical chemistry', 'Organic synthesis'],
  '2-Computer Science': ['Information representation', 'Communication and Internet technologies', 'Hardware', 'Processor fundamentals', 'System software', 'Security, privacy and data integrity', 'Ethics and ownership', 'Databases', 'Algorithm design and problem-solving', 'Data representation', 'Programming', 'Software development'],
  '2-Economics': ['Basic economic ideas and resource allocation', 'The price system and the micro economy', 'Government microeconomic intervention', 'The macro economy', 'Government macroeconomic intervention', 'International economic issues'],
  '2-Business': ['Business and its environment', 'People in organisations', 'Marketing', 'Operations and project management', 'Finance and accounting', 'Strategic management'],

  // SAT
  '3-Math': ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'],
  '3-Reading & Writing': ['Information and Ideas', 'Craft and Structure', 'Expression of Ideas', 'Standard English Conventions']
};

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function MockExam() {
  const [step, setStep] = useState<'select' | 'loading' | 'exam' | 'submitted' | 'result'>('select');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [board, setBoard] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => { fetchSubjects().then(setSubjects).catch(() => {}); }, []);

  // Countdown timer
  useEffect(() => {
    if (step !== 'exam' || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(tl => (tl ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, step]);

  const handleGenerate = async () => {
    if (!selectedSubject || selectedTopics.length === 0) return;
    setStep('loading');
    setError(null);
    try {
      const res = await generateMockExam(selectedSubject, selectedTopics);
      setExam(res);
      setTimeLeft((res.duration_minutes ?? 60) * 60);
      setAnswers({});
      setStep('exam');
    } catch {
      setError('Could not generate exam. Ensure the backend is running and paper questions exist.');
      setStep('select');
    }
  };

  const handleSubmit = async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    try {
      await submitMockExam(exam.id, answers);
      setStep('submitted');
    } catch {
      setError('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReveal = async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    try {
      const res = await solveMockExam(exam.id, answers);
      setResult(res);
      setStep('result');
    } catch {
      setError('Failed to fetch AI answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('exam-container');
    if (element) {
      html2pdf().set({
        margin: 15,
        filename: `Mock_Exam_${exam?.subject_name || 'NOTO'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-3xl mx-auto px-6 lg:px-8 py-12 pb-24"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardCheck size={15} style={{ color: 'var(--noto-primary)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-primary)' }}>
            Practice
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Mock Exam
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Sit a timed practice exam assembled from real past-paper questions.
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* Subject selection */}
        {step === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {error && (
              <div className="flex items-start gap-3 p-3 rounded-[var(--noto-radius-md)] border mb-5 text-sm"
                style={{ backgroundColor: 'var(--noto-danger)' + '12', borderColor: 'var(--noto-danger)', color: 'var(--noto-danger)' }}>
                <AlertCircle size={15} className="mt-0.5" /> {error}
              </div>
            )}

            <div
              className="p-8 rounded-[var(--noto-radius-xl)] border space-y-8"
              style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
            >
              {/* Board Selection */}
              <div>
                <h2 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                  1. Choose a Board
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BOARDS.map(b => (
                    <button key={b.id} onClick={() => { setBoard(b.id); setLevel(null); setSelectedSubject(null); setSelectedTopics([]); }}
                      className="p-4 rounded-[var(--noto-radius-lg)] border text-sm font-medium text-left transition-all duration-150"
                      style={{
                        backgroundColor: board === b.id ? 'var(--noto-primary)' : 'var(--noto-surface-alt)',
                        borderColor: board === b.id ? 'var(--noto-primary)' : 'var(--noto-border)',
                        color: board === b.id ? '#ffffff' : 'var(--noto-text-primary)',
                      }}>
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level Selection */}
              {board && LEVELS[board].length > 0 && (
                <div>
                  <h2 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                    2. Choose a Level
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {LEVELS[board].map(l => (
                      <button key={l.id} onClick={() => { setLevel(l.id); setSelectedSubject(null); setSelectedTopics([]); }}
                        className="p-4 rounded-[var(--noto-radius-lg)] border text-sm font-medium text-left transition-all duration-150"
                        style={{
                          backgroundColor: level === l.id ? 'var(--noto-primary)' : 'var(--noto-surface-alt)',
                          borderColor: level === l.id ? 'var(--noto-primary)' : 'var(--noto-border)',
                          color: level === l.id ? '#ffffff' : 'var(--noto-text-primary)',
                        }}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject Selection */}
              {(level || board === 'SAT') && (
                <div>
                  <h2 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                    {LEVELS[board || '']?.length > 0 ? '3' : '2'}. Choose a Subject
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {subjects
                      .filter(s => board === 'SAT' ? s.category_id === 3 : (level === 'O Level' ? s.category_id === 1 : s.category_id === 2))
                      .map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => { setSelectedSubject(sub.id); setSelectedTopics([]); }}
                        className="p-4 rounded-[var(--noto-radius-lg)] border text-sm font-medium text-left transition-all duration-150"
                        style={{
                          backgroundColor: selectedSubject === sub.id ? 'var(--noto-primary)' : 'var(--noto-surface-alt)',
                          borderColor: selectedSubject === sub.id ? 'var(--noto-primary)' : 'var(--noto-border)',
                          color: selectedSubject === sub.id ? '#ffffff' : 'var(--noto-text-primary)',
                        }}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic Selection */}
              {selectedSubject && (
                <div>
                  <h2 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                    {LEVELS[board || '']?.length > 0 ? '4' : '3'}. Select Topics
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {(SYLLABUS_TOPICS[`${subjects.find(s => s.id === selectedSubject)?.category_id}-${subjects.find(s => s.id === selectedSubject)?.name}`] || ['General Topic']).map(topic => {
                      const isActive = selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          onClick={() => {
                            if (isActive) setSelectedTopics(prev => prev.filter(t => t !== topic));
                            else setSelectedTopics(prev => [...prev, topic]);
                          }}
                          className="px-4 py-3 rounded-[var(--noto-radius-md)] border text-sm text-left transition-all duration-150 flex items-center gap-3"
                          style={{
                            backgroundColor: isActive ? 'var(--noto-primary)' + '11' : 'var(--noto-surface-alt)',
                            borderColor: isActive ? 'var(--noto-primary)' : 'var(--noto-border)',
                            color: isActive ? 'var(--noto-primary)' : 'var(--noto-text-secondary)',
                          }}
                        >
                          <div className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0"
                            style={{
                              borderColor: isActive ? 'var(--noto-primary)' : 'var(--noto-border)',
                              backgroundColor: isActive ? 'var(--noto-primary)' : 'transparent'
                            }}>
                            {isActive && <CheckCircle size={12} color="#fff" />}
                          </div>
                          {topic}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={selectedTopics.length === 0}
                    className="btn-primary w-full py-3.5 rounded-[var(--noto-radius-md)] font-semibold text-sm disabled:opacity-40 flex justify-center items-center gap-2"
                  >
                    <ClipboardCheck size={16} /> Generate Exam
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center py-24 gap-4">
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--noto-primary)' }} />
            <p className="font-semibold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
              Assembling your exam…
            </p>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--noto-text-secondary)' }}>
              The AI is generating challenging questions tailored to your topics. This usually takes 20–40 seconds.
            </p>
          </motion.div>
        )}

        {/* Exam */}
        {step === 'exam' && exam && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Timer bar */}
            <div
              className="sticky top-16 z-10 flex items-center justify-between px-5 py-3 rounded-[var(--noto-radius-md)] border mb-6"
              style={{
                backgroundColor: 'var(--noto-surface)',
                borderColor: (timeLeft ?? 999) < 300 ? 'var(--noto-danger)' : 'var(--noto-border)',
              }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--noto-text-primary)' }}>
                {exam.subject_name ?? 'Mock Exam'} — {exam.total_marks} marks
              </span>
              <div className="flex items-center gap-2">
                <Timer size={15} style={{ color: (timeLeft ?? 999) < 300 ? 'var(--noto-danger)' : 'var(--noto-primary)' }} />
                <span
                  className="font-bold"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: (timeLeft ?? 999) < 300 ? 'var(--noto-danger)' : 'var(--noto-text-primary)',
                  }}
                >
                  {formatTime(timeLeft ?? 0)}
                </span>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6 mb-8">
              {(exam.questions || []).map((q: any, idx: number) => (
                <div
                  key={q.id}
                  className="p-6 rounded-[var(--noto-radius-lg)] border"
                  style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'var(--noto-primary)', color: '#ffffff' }}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm leading-relaxed mb-3 prose prose-sm dark:prose-invert max-w-none" style={{ color: 'var(--noto-text-primary)' }}>
                        <MarkdownRenderer content={q.text} />
                      </div>
                      {q.marks && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--noto-text-secondary)' }}>
                          [{q.marks} marks]
                        </span>
                      )}
                      <textarea
                        rows={3}
                        placeholder="Your answer…"
                        value={answers[q.id] ?? ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full mt-3 px-3 py-2.5 rounded-[var(--noto-radius-md)] border text-sm outline-none resize-none"
                        style={{
                          backgroundColor: 'var(--noto-surface-alt)',
                          borderColor: 'var(--noto-border)',
                          color: 'var(--noto-text-primary)',
                        }}
                        onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-primary)'}
                        onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-border)'}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full py-3.5 rounded-[var(--noto-radius-md)] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Submit Exam
            </button>
          </motion.div>
        )}

        {/* Submitted */}
        {step === 'submitted' && (
          <motion.div key="submitted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              className="p-8 rounded-[var(--noto-radius-xl)] border text-center mb-6"
              style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
            >
              <CheckCircle size={36} className="mx-auto mb-4" style={{ color: 'var(--noto-success)' }} />
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                Exam Submitted!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--noto-text-secondary)' }}>
                Your answers have been recorded. You can now reveal the AI-generated solutions.
              </p>
              <button
                onClick={handleReveal}
                disabled={submitting}
                className="btn-primary w-full py-3.5 rounded-[var(--noto-radius-md)] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Reveal AI Answers
              </button>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {step === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            
            <div className="flex justify-end mb-4">
              <button onClick={handleDownloadPDF} className="btn-secondary px-4 py-2 text-sm rounded-[var(--noto-radius-md)]">
                Download PDF
              </button>
            </div>

            <div id="exam-container">
              <div
                className="p-8 rounded-[var(--noto-radius-xl)] border text-center mb-6"
                style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
              >
                <CheckCircle size={36} className="mx-auto mb-4" style={{ color: 'var(--noto-success)' }} />
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--noto-text-secondary)' }}>
                  AI Assessed Score
                </p>
                <p
                  className="text-6xl font-bold mb-1"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: result.score_pct >= 70 ? 'var(--noto-success)' : result.score_pct >= 50 ? 'var(--noto-warning)' : 'var(--noto-danger)',
                  }}
                >
                  {Math.round(result.score_pct ?? 0)}%
                </p>
                <div className="mt-4 text-sm prose prose-sm dark:prose-invert mx-auto text-left" style={{ color: 'var(--noto-text-secondary)' }}>
                  <MarkdownRenderer content={result.overall_feedback ?? 'Keep practising — review weak areas.'} />
                </div>
              </div>

              {/* Detailed AI Solutions */}
              <div className="space-y-6">
                {(exam.questions || []).map((q: any, idx: number) => {
                  const aiData = result.solutions?.[q.id];
                  return (
                    <div
                      key={q.id}
                      className="p-6 rounded-[var(--noto-radius-lg)] border"
                      style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
                    >
                      <div className="flex items-start gap-4 mb-4 border-b pb-4" style={{ borderColor: 'var(--noto-border)' }}>
                        <span
                          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'var(--noto-primary)', color: '#ffffff' }}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none" style={{ color: 'var(--noto-text-primary)' }}>
                            <MarkdownRenderer content={q.text} />
                          </div>
                          <div className="mt-2 text-xs font-medium uppercase" style={{ color: 'var(--noto-text-secondary)' }}>
                            Your Answer:
                          </div>
                          <p className="mt-1 text-sm italic" style={{ color: 'var(--noto-text-secondary)' }}>
                            {answers[q.id] || "No answer provided"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-lg" style={{ color: 'var(--noto-primary)' }}>
                            {aiData?.score ?? 0} / {q.marks}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pl-11">
                        <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--noto-primary)' }}>
                          <Sparkles size={14} />
                          <span className="text-xs font-semibold uppercase tracking-widest">AI Solution & Feedback</span>
                        </div>
                        <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3" style={{ color: 'var(--noto-text-secondary)' }}>
                          <MarkdownRenderer content={aiData?.explanation ?? "No explanation available."} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={() => { setStep('select'); setExam(null); setResult(null); }}
              className="btn-primary w-full mt-8 px-8 py-3 rounded-[var(--noto-radius-md)] font-semibold text-sm">
              Try Another Exam
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
