import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import About from './pages/About';
import HelpCenter from './pages/HelpCenter';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import StudyChat from './pages/StudyChat';
import PastPapers from './pages/PastPapers';
import Roadmap from './pages/Roadmap';
import Flashcards from './pages/Flashcards';
import MockExam from './pages/MockExam';
import ReadinessDashboard from './pages/ReadinessDashboard';
import StudyGroups from './pages/StudyGroups';
import TutoringLanding from './pages/TutoringLanding';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import AdminShell from './pages/admin/AdminShell';
import AdminDashboard from './pages/admin/AdminDashboard';
import ResourceManager from './pages/admin/ResourceManager';
import PastPaperManager from './pages/admin/PastPaperManager';
import InternManager from './pages/admin/InternManager';
import InternDetail from './pages/admin/InternDetail';
import ActivityFeed from './pages/admin/ActivityFeed';
import InternShell from './pages/intern/InternShell';
import InternDashboard from './pages/intern/InternDashboard';

// Tutor
import TutorRegister from './pages/TutorRegister';
import TutorShell from './pages/tutor/TutorShell';
import TutorDashboard from './pages/tutor/TutorDashboard';
import TutorStudents from './pages/tutor/TutorStudents';
import TutorCourses from './pages/tutor/TutorCourses';
import TutorVideos from './pages/tutor/TutorVideos';
import TutorClasses from './pages/tutor/TutorClasses';
import TutorPayments from './pages/tutor/TutorPayments';
import TutorAnnouncements from './pages/tutor/TutorAnnouncements';

// Student My-Tutor
import MyTutor from './pages/student/MyTutor';
import MyTutorCourses from './pages/student/MyTutorCourses';
import MyTutorClasses from './pages/student/MyTutorClasses';
import MyTutorPayment from './pages/student/MyTutorPayment';
import MyTutorAnnouncements from './pages/student/MyTutorAnnouncements';
import StudentPayment from './pages/student/StudentPayment';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ── Public (with Layout) ────────────────────────────────────────── */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/resources" element={<Layout><Resources /></Layout>} />
        <Route path="/resources/:id" element={<Layout><ResourceDetail /></Layout>} />

        {/* Info */}
        <Route path="/about"   element={<Layout><About /></Layout>} />
        <Route path="/help"    element={<Layout><HelpCenter /></Layout>} />
        <Route path="/terms"   element={<Layout><Terms /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />

        {/* v2 Features */}
        <Route path="/chat"      element={<Layout><StudyChat /></Layout>} />
        <Route path="/past-papers" element={<Layout><PastPapers /></Layout>} />
        <Route path="/roadmap"   element={<Layout><Roadmap /></Layout>} />
        <Route path="/flashcards" element={<Layout><Flashcards /></Layout>} />
        <Route path="/mock-exam" element={<Layout><MockExam /></Layout>} />
        <Route path="/readiness" element={<Layout><ReadinessDashboard /></Layout>} />
        <Route path="/groups"    element={<Layout><StudyGroups /></Layout>} />
        <Route path="/tutoring"  element={<Layout><TutoringLanding /></Layout>} />
        {/* ── Auth ──────────────────────────────────────────────────────── */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/tutor-register" element={<TutorRegister />} />
        
        {/* ── Profile (Universal) ───────────────────────────────────────── */}
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        
        {/* ── Student Payment ────────────────────────────────────────────── */}
        <Route path="/student/payment/:courseId" element={<ProtectedRoute><Layout><StudentPayment /></Layout></ProtectedRoute>} />

        {/* ── Intern Portal ── */}
        <Route
          path="/intern"
          element={
            <ProtectedRoute>
              <InternShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<InternDashboard />} />
          <Route path="resources" element={<ResourceManager />} />
          <Route path="past-papers" element={<PastPaperManager />} />
        </Route>

        {/* ── Admin Panel ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="resources" element={<ResourceManager />} />
          <Route path="past-papers" element={<PastPaperManager />} />
          <Route path="interns" element={<InternManager />} />
          <Route path="interns/:id" element={<InternDetail />} />
          <Route path="activity" element={<ActivityFeed />} />
        </Route>

        {/* ── Tutor Panel ── */}
        <Route
          path="/tutor"
          element={
            <ProtectedRoute requireTutor>
              <TutorShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<TutorDashboard />} />
          <Route path="students" element={<TutorStudents />} />
          <Route path="courses" element={<TutorCourses />} />
          <Route path="videos" element={<TutorVideos />} />
          <Route path="classes" element={<TutorClasses />} />
          <Route path="payments" element={<TutorPayments />} />
          <Route path="announcements" element={<TutorAnnouncements />} />
        </Route>

        {/* ── Student: My Tutor ── */}
        <Route path="/my-tutor" element={<Layout><MyTutor /></Layout>} />
        <Route path="/my-tutor/courses" element={<Layout><MyTutorCourses /></Layout>} />
        <Route path="/my-tutor/classes" element={<Layout><MyTutorClasses /></Layout>} />
        <Route path="/my-tutor/payment" element={<Layout><MyTutorPayment /></Layout>} />
        <Route path="/my-tutor/announcements" element={<Layout><MyTutorAnnouncements /></Layout>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}


export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AnimatedRoutes />
    </Router>
  );
}
