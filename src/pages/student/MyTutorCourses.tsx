// src/pages/student/MyTutorCourses.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Video, FileText, Loader2, ExternalLink, Lock, CheckCircle, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMyCourses, fetchAvailableCourses, fetchCourseVideos, fetchCourseReadings, studentEnroll } from '../../api';
import MarkdownRenderer from '../../components/MarkdownRenderer';

function getYoutubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function timeAgo(iso: string) {
  if (!iso) return 'Just now';
  const d = new Date(iso), now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function MyTutorCourses() {
  const [activeTab, setActiveTab] = useState<'enrolled' | 'available'>('enrolled');
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Detail view state
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'videos' | 'readings'>('videos');
  const [videos, setVideos] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [dLoading, setDLoading] = useState(false);
  
  // Lightbox
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const [e, a] = await Promise.all([fetchMyCourses(), fetchAvailableCourses()]);
      setEnrolledCourses(e);
      setAvailableCourses(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, []);

  const selectCourse = async (course: any) => {
    setSelectedCourse(course);
    setDetailTab('videos');
    setDLoading(true);
    try {
      const [v, r] = await Promise.all([fetchCourseVideos(course.id), fetchCourseReadings(course.id)]);
      setVideos(v);
      setReadings(r);
    } finally {
      setDLoading(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    try {
      await studentEnroll(courseId);
      await loadCourses(); // refresh
      setActiveTab('enrolled');
      toast.success('Successfully enrolled!');
    } catch (e: any) {
      toast.error(e.message || 'Error enrolling');
    }
  };

  if (selectedCourse) {
    const isPaid = selectedCourse.fee_paid;
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: 'var(--noto-text-secondary)' }}>
          ← Back to My Courses
        </button>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>{selectedCourse.title}</h1>
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: isPaid ? '#10b98115' : '#ef444415', color: isPaid ? '#10b981' : '#ef4444' }}>
              {isPaid ? <><CheckCircle size={11} /> Paid</> : <><Lock size={11} /> Unpaid</>}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>Instructor: {selectedCourse.tutor_name}</p>
        </div>

        {/* Content Tabs */}
        <div className="flex gap-2 border-b" style={{ borderColor: 'var(--noto-border)' }}>
          {[
            { id: 'videos', label: 'Videos', icon: Video },
            { id: 'readings', label: 'Readings', icon: FileText },
          ].map(tab => (
            <button key={tab.id} onClick={() => setDetailTab(tab.id as any)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all relative"
              style={{ color: detailTab === tab.id ? 'var(--noto-primary)' : 'var(--noto-text-secondary)' }}>
              <tab.icon size={16} /> {tab.label}
              {detailTab === tab.id && (
                <motion.div layoutId="detail-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: 'var(--noto-primary)' }} />
              )}
            </button>
          ))}
        </div>

        {dLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div> : (
          <div className="py-4">
            {!isPaid ? (
              <div className="text-center py-16 px-4 border rounded-2xl" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                <Lock size={48} className="mx-auto mb-4" style={{ color: '#ef4444' }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--noto-text-primary)' }}>Content Locked</h3>
                <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--noto-text-secondary)' }}>
                  You need to pay the course fee to access the {detailTab}. Please submit your payment reference and wait for the tutor to confirm it.
                </p>
              </div>
            ) : detailTab === 'videos' ? (
              videos.length === 0 ? (
                <div className="text-center py-16 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
                  <Video size={40} className="mx-auto mb-3 opacity-30" /> No videos available for this course.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {videos.map((v, i) => {
                    const ytId = getYoutubeId(v.youtube_url);
                    return (
                      <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="rounded-2xl border overflow-hidden cursor-pointer group"
                        style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
                        onClick={() => setSelectedVideo(v)}>
                        {ytId ? (
                          <div className="relative aspect-video bg-black">
                            <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={v.title} className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video bg-black/20 flex items-center justify-center">
                            <Video size={30} className="opacity-30" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm line-clamp-1" style={{ color: 'var(--noto-text-primary)' }}>{v.title}</h4>
                            <span className="text-[10px] shrink-0 font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}>
                              {timeAgo(v.created_at)}
                            </span>
                          </div>
                          {v.description && <p className="text-xs line-clamp-2" style={{ color: 'var(--noto-text-secondary)' }}>{v.description}</p>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )
            ) : (
              readings.length === 0 ? (
                <div className="text-center py-16 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
                  <FileText size={40} className="mx-auto mb-3 opacity-30" /> No readings available.
                </div>
              ) : (
                <div className="space-y-4">
                  {readings.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="p-5 rounded-2xl border relative" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-lg" style={{ color: 'var(--noto-text-primary)' }}>{r.title}</h4>
                        <span className="text-[10px] font-medium px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}>
                          {timeAgo(r.created_at)}
                        </span>
                      </div>
                      {r.content && (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none" style={{ color: 'var(--noto-text-secondary)' }}>
                          <MarkdownRenderer content={r.content} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Video Lightbox */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setSelectedVideo(null)}>
            <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-white text-lg">{selectedVideo.title}</p>
                <button onClick={() => setSelectedVideo(null)} className="text-white/60 hover:text-white px-3 py-1 rounded-lg text-sm bg-white/10 hover:bg-white/20 transition-colors">✕ Close</button>
              </div>
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
                {getYoutubeId(selectedVideo.youtube_url) ? (
                  <iframe width="100%" height="100%"
                    src={`https://www.youtube.com/embed/${getYoutubeId(selectedVideo.youtube_url)}?autoplay=1`}
                    allow="autoplay; fullscreen" allowFullScreen className="border-0" title={selectedVideo.title} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 gap-3">
                    <p className="text-white/60 text-sm">Couldn't embed this video.</p>
                    <a href={selectedVideo.youtube_url} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#ef4444' }}>
                      Open on YouTube
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>Courses</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--noto-text-secondary)' }}>Manage your enrolled courses or find new ones.</p>
        </div>
        
        <div className="flex p-1 rounded-xl" style={{ backgroundColor: 'var(--noto-surface-alt)' }}>
          <button onClick={() => setActiveTab('enrolled')}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              backgroundColor: activeTab === 'enrolled' ? 'var(--noto-surface)' : 'transparent',
              color: activeTab === 'enrolled' ? 'var(--noto-text-primary)' : 'var(--noto-text-secondary)',
              boxShadow: activeTab === 'enrolled' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}>
            My Courses
          </button>
          <button onClick={() => setActiveTab('available')}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              backgroundColor: activeTab === 'available' ? 'var(--noto-surface)' : 'transparent',
              color: activeTab === 'available' ? 'var(--noto-text-primary)' : 'var(--noto-text-secondary)',
              boxShadow: activeTab === 'available' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}>
            Browse Available
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div> : (
        activeTab === 'enrolled' ? (
          enrolledCourses.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--noto-text-secondary)' }}>
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-4">You are not enrolled in any courses yet.</p>
              <button onClick={() => setActiveTab('available')} className="px-4 py-2 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Find a Course
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {enrolledCourses.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => selectCourse(c)}
                  className="p-6 rounded-3xl border cursor-pointer group transition-all"
                  style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--noto-border)'}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      <BookOpen size={24} color="white" />
                    </div>
                    {c.fee_paid ? <CheckCircle size={18} color="#10b981" /> : <Lock size={18} color="#ef4444" />}
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>{c.title}</h3>
                    <span className="text-[10px] shrink-0 font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}>
                      Enrolled {timeAgo(c.enrolled_at)}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--noto-primary)' }}>{c.tutor_name}</p>
                  <div className="flex gap-3 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                    <span className="flex items-center gap-1"><Video size={14}/> {c.video_count}</span>
                    <span className="flex items-center gap-1"><FileText size={14}/> {c.reading_count}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          availableCourses.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--noto-text-secondary)' }}>
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No new courses available to enroll right now.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {availableCourses.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-6 rounded-3xl border flex flex-col transition-all"
                  style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shrink-0"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <BookOpen size={24} color="white" />
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>{c.title}</h3>
                    <span className="text-[10px] shrink-0 font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}>
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--noto-primary)' }}>by {c.tutor_name}</p>
                  <p className="text-xs line-clamp-3 mb-4 flex-1" style={{ color: 'var(--noto-text-secondary)' }}>{c.description || 'No description provided.'}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t" style={{ borderColor: 'var(--noto-border)' }}>
                    <div className="flex gap-3 text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                      <span className="flex items-center gap-1"><Video size={14}/> {c.video_count}</span>
                    </div>
                    <button onClick={() => handleEnroll(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 active:scale-95" style={{ background: '#10b981' }}>
                      <PlusCircle size={14} /> Enroll
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )
      )}
    </div>
  );
}
