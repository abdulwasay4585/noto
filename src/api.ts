// src/api.ts — Centralized fetch client for all NOTOO API endpoints

const getAuthHeaders = (extra: Record<string, string> = {}) => {
  const token = localStorage.getItem('noto_token');
  const headers: Record<string, string> = { ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const text = await res.text();
    console.error(`API Error (${res.status}): ${text}`);
    // Only clear token on 401 (Unauthorized/Expired). 403 (Forbidden) means the user is logged in but lacks permission.
    if (res.status === 401) {
      localStorage.removeItem('noto_token');
      localStorage.removeItem('noto_user');
      window.dispatchEvent(new Event('noto_auth_change')); // ensure UI updates
    }
    throw new Error(`API Error: ${res.status}`);
  }
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error(`Expected JSON, got: ${text.substring(0, 100)}...`);
    throw new Error('Server returned non-JSON response');
  }
  return res.json();
};

// ─── Core Resources ────────────────────────────────────────────────────────

export const fetchCategories = async () => {
  const res = await fetch('/api/categories');
  return handleResponse(res);
};

export const fetchSubjects = async (categoryId?: number) => {
  const url = categoryId ? `/api/subjects?categoryId=${categoryId}` : '/api/subjects';
  const res = await fetch(url);
  return handleResponse(res);
};

export const fetchResources = async (params: Record<string, string | number | null | undefined>) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
  const query = new URLSearchParams(filtered as Record<string, string>).toString();
  const res = await fetch(`/api/resources?${query}`);
  return handleResponse(res);
};

export const fetchResourceDetail = async (id: string) => {
  const res = await fetch(`/api/resources/${id}`);
  return handleResponse(res);
};

export const generateResourceSummary = async (id: string) => {
  const res = await fetch(`/api/resources/${id}/generate-summary`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const addResource = async (data: Record<string, unknown>) => {
  const res = await fetch('/api/resources', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateResource = async (id: number, data: Record<string, unknown>) => {
  const res = await fetch(`/api/resources/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteResource = async (id: number) => {
  const res = await fetch(`/api/resources/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const submitResource = async (data: Record<string, unknown>) => {
  const res = await fetch('/api/resources/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const reviewResource = async (id: number, status: 'approved' | 'rejected') => {
  const res = await fetch(`/api/resources/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

export const tagResource = async (id: number) => {
  const res = await fetch(`/api/resources/${id}/tag`, { method: 'POST', headers: getAuthHeaders() });
  return handleResponse(res);
};

// ─── RAG Chat (Section 1) ──────────────────────────────────────────────────

export const createChatSession = async () => {
  const res = await fetch('/api/chat/sessions', { method: 'POST' });
  return handleResponse(res);
};

export const uploadChatFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch('/api/chat/upload', {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
};

export const sendChatMessage = async (sessionId: string, content: string, attached_file_uri?: string, attached_file_mime?: string) => {
  const res = await fetch(`/api/chat/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, attached_file_uri, attached_file_mime }),
  });
  return handleResponse(res);
};

export const fetchChatHistory = async (sessionId: string) => {
  const res = await fetch(`/api/chat/${sessionId}/history`);
  return handleResponse(res);
};

// ─── Past Papers (Section 2) ───────────────────────────────────────────────

export const fetchPastPapers = async (params?: { subjectId?: number; yearFrom?: number; yearTo?: number }) => {
  const filteredParams = params
    ? Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    : {};
  const query = new URLSearchParams(filteredParams).toString();
  const res = await fetch(`/api/past-papers?${query}`);
  return handleResponse(res);
};

export const addPastPaper = async (data: Record<string, unknown>) => {
  const res = await fetch('/api/past-papers', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const compilePastPapers = async (subjectId: number, year: number) => {
  const res = await fetch('/api/past-papers/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjectId, year }),
  });
  return handleResponse(res);
};

// ─── Topic Frequency (Section 3) ──────────────────────────────────────────

export const fetchTopicFrequency = async (subjectId: number) => {
  const res = await fetch(`/api/topics/frequency/${subjectId}`);
  return handleResponse(res);
};

export const fetchTopicPredictions = async (subjectId: number) => {
  const res = await fetch(`/api/topics/predictions/${subjectId}`);
  return handleResponse(res);
};

// ─── Study Plans / Roadmap (Section 4) ────────────────────────────────────

export const createStudyPlan = async (data: {
  exam_date: string;
  subjects: number[];
  hours_per_week: number;
}) => {
  const res = await fetch('/api/study-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const fetchStudyPlan = async (id: number) => {
  const res = await fetch(`/api/study-plans/${id}`);
  return handleResponse(res);
};

export const updateStudyTask = async (planId: number, taskId: number, status: 'done' | 'skipped') => {
  const res = await fetch(`/api/study-plans/${planId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

// ─── Mock Exams (Section 5) ────────────────────────────────────────────────

export const generateMockExam = async (subjectId: number, topics?: string[]) => {
  const res = await fetch('/api/mock-exams/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjectId, topics }),
  });
  return handleResponse(res);
};

export const submitMockExam = async (id: number, answers: Record<number, string>) => {
  const res = await fetch(`/api/mock-exams/${id}/submit`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to submit exam');
  return res.json();
};

export const solveMockExam = async (id: number, answers: Record<number, string>) => {
  const res = await fetch(`/api/mock-exams/${id}/solve`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to solve exam');
  return res.json();
};

export const fetchReadiness = async (userSessionId: string) => {
  const res = await fetch(`/api/readiness/${userSessionId}`);
  return handleResponse(res);
};

// ─── Flashcards (Section 6) ────────────────────────────────────────────────

export const fetchDueFlashcards = async (userSessionId: string) => {
  const res = await fetch(`/api/flashcards/due/${userSessionId}`);
  return handleResponse(res);
};

export const reviewFlashcard = async (id: number, quality: number) => {
  const res = await fetch(`/api/flashcards/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quality }),
  });
  return handleResponse(res);
};

// ─── Study Groups (Section 9) ──────────────────────────────────────────────

export const createStudyGroup = async (name: string) => {
  const sessionId = localStorage.getItem('noto-session-id');
  const res = await fetch('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, session_id: sessionId }),
  });
  return handleResponse(res);
};

export const joinStudyGroup = async (code: string) => {
  const sessionId = localStorage.getItem('noto-session-id');
  const res = await fetch(`/api/groups/join/${code}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return handleResponse(res);
};

export const fetchGroupLeaderboard = async (id: number) => {
  const res = await fetch(`/api/groups/${id}/leaderboard`);
  return handleResponse(res);
};

// ─── Admin: Auth ──────────────────────────────────────────────────────────────

export const adminLogin = async (identifier: string, password: string) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: identifier, password }),
  });
  return handleResponse(res);
};

export const registerUser = async (email: string, password: string) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

export const adminLogout = async () => {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const fetchMe = async () => {
  const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  return handleResponse(res);
};

// ─── Admin: Users (Interns) ───────────────────────────────────────────────────

export const fetchAdminUsers = async () => {
  const res = await fetch('/api/admin/users', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const createAdminUser = async (data: Record<string, unknown>) => {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateAdminUser = async (id: number, data: Record<string, unknown>) => {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteAdminUser = async (id: number) => {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ─── Admin: Permissions ───────────────────────────────────────────────────────

export const fetchUserPermissions = async (userId: number) => {
  const res = await fetch(`/api/admin/users/${userId}/permissions`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const updateUserPermissions = async (userId: number, permissions: Record<string, unknown>) => {
  const res = await fetch(`/api/admin/users/${userId}/permissions`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(permissions),
  });
  return handleResponse(res);
};

// ─── Admin: Activity Logs ─────────────────────────────────────────────────────

export const fetchActivityLogs = async (params?: Record<string, string | number>) => {
  const query = params
    ? new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        )
      ).toString()
    : '';
  const res = await fetch(`/api/admin/activity-logs?${query}`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const fetchActivityStats = async () => {
  const res = await fetch('/api/admin/activity-logs/stats', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const fetchUserActivity = async (userId: number, params?: Record<string, string | number>) => {
  const query = params
    ? new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        )
      ).toString()
    : '';
  const res = await fetch(`/api/admin/users/${userId}/activity?${query}`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

// ─── Tutor API ────────────────────────────────────────────────────────────────

export const registerTutor = async (data: { email: string; password: string; username: string; bio?: string; subjects?: string }) => {
  const res = await fetch('/api/tutor/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const runTutorMigration = async () => {
  const res = await fetch('/api/tutor/migrate', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
  });
  return handleResponse(res);
};

export const fetchTutorDashboard = async () => {
  const res = await fetch('/api/tutor/dashboard', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const fetchTutorProfile = async () => {
  const res = await fetch('/api/tutor/profile', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const updateTutorProfile = async (data: any) => {
  const res = await fetch('/api/tutor/profile', {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// Courses
export const fetchTutorCourses = async () => {
  const res = await fetch('/api/tutor/courses', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const createTutorCourse = async (data: any) => {
  const res = await fetch('/api/tutor/courses', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateTutorCourse = async (id: number, data: any) => {
  const res = await fetch(`/api/tutor/courses/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteTutorCourse = async (id: number) => {
  const res = await fetch(`/api/tutor/courses/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(res);
};

// Videos
export const fetchCourseVideos = async (courseId: number) => {
  const res = await fetch(`/api/tutor/courses/${courseId}/videos`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const addCourseVideo = async (courseId: number, data: any) => {
  const res = await fetch(`/api/tutor/courses/${courseId}/videos`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteTutorVideo = async (videoId: number) => {
  const res = await fetch(`/api/tutor/videos/${videoId}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(res);
};

// Readings
export const fetchCourseReadings = async (courseId: number) => {
  const res = await fetch(`/api/tutor/courses/${courseId}/readings`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const addCourseReading = async (courseId: number, data: any) => {
  const res = await fetch(`/api/tutor/courses/${courseId}/readings`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// Students
export const fetchTutorStudents = async () => {
  const res = await fetch('/api/tutor/students', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const fetchStudentEnrollments = async (studentId: number) => {
  const res = await fetch(`/api/tutor/students/${studentId}/enrollments`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const enrollStudent = async (data: { student_id: number; course_id: number }) => {
  const res = await fetch('/api/tutor/enrollments', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateEnrollmentFee = async (enrollmentId: number, feePaid: boolean) => {
  const res = await fetch(`/api/tutor/enrollments/${enrollmentId}/fee`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fee_paid: feePaid }),
  });
  return handleResponse(res);
};

export const removeEnrollment = async (enrollmentId: number) => {
  const res = await fetch(`/api/tutor/enrollments/${enrollmentId}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(res);
};

// Payments
export const fetchTutorPayments = async () => {
  const res = await fetch('/api/tutor/payments', { headers: getAuthHeaders() });
  return handleResponse(res);
};

// Live Classes
export const fetchTutorClasses = async () => {
  const res = await fetch('/api/tutor/classes', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const createTutorClass = async (data: any) => {
  const res = await fetch('/api/tutor/classes', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateTutorClass = async (id: number, data: any) => {
  const res = await fetch(`/api/tutor/classes/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteTutorClass = async (id: number) => {
  const res = await fetch(`/api/tutor/classes/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(res);
};

// Announcements
export const fetchTutorAnnouncements = async () => {
  const res = await fetch('/api/tutor/announcements', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const createTutorAnnouncement = async (data: any) => {
  const res = await fetch('/api/tutor/announcements', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteTutorAnnouncement = async (id: number) => {
  const res = await fetch(`/api/tutor/announcements/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(res);
};

// ─── Student / My-Tutor API ──────────────────────────────────────────────────

export const pingStudentOnline = async () => {
  const res = await fetch('/api/student/ping', { method: 'POST', headers: getAuthHeaders() });
  return res.ok;
};

export const fetchMyTutors = async () => {
  const res = await fetch('/api/student/my-tutors', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const fetchMyCourses = async () => {
  const res = await fetch('/api/student/courses', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const fetchAvailableCourses = async () => {
  const res = await fetch('/api/student/available-courses', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const studentEnroll = async (courseId: number) => {
  const res = await fetch('/api/student/enroll', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: courseId }),
  });
  return handleResponse(res);
};

export const fetchMyClasses = async () => {
  const res = await fetch('/api/student/classes', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const fetchMyAnnouncements = async () => {
  const res = await fetch('/api/student/announcements', { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const submitPaymentRef = async (data: { enrollment_id: number; payment_ref: string; payment_method: string }) => {
  const res = await fetch('/api/student/payment', {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

