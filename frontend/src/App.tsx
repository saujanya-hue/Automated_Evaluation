import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import FacultyLayout from './layouts/FacultyLayout';
import StudentLayout from './layouts/StudentLayout';

// Pages
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminFaculty from './pages/AdminFaculty';
import AdminStudents from './pages/AdminStudents';
import AdminCurriculum from './pages/AdminCurriculum';

// Faculty Pages
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyExams from './pages/FacultyExams';
import FacultyEvaluation from './pages/FacultyEvaluation';
import FacultyAnalytics from './pages/FacultyAnalytics';
import FacultyComplaints from './pages/FacultyComplaints';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentResults from './pages/StudentResults';
import StudentComplaints from './pages/StudentComplaints';
import StudentDownloads from './pages/StudentDownloads';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin Portal Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="faculty" element={<AdminFaculty />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="subjects" element={<AdminCurriculum />} />
            <Route path="departments" element={<AdminCurriculum />} />
            <Route path="classes" element={<AdminCurriculum />} />
            <Route path="assign-faculty" element={<AdminCurriculum />} />
            <Route path="exams" element={<AdminCurriculum />} />
            <Route path="settings" element={<AdminCurriculum />} />
          </Route>

          {/* Faculty Portal Protected Routes */}
          <Route path="/faculty" element={<FacultyLayout />}>
            <Route index element={<Navigate to="/faculty/dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="subjects" element={<FacultyDashboard />} />
            <Route path="create-exam" element={<FacultyExams />} />
            <Route path="upload" element={<FacultyExams />} />
            <Route path="progress" element={<FacultyEvaluation />} />
            <Route path="results" element={<FacultyEvaluation />} />
            <Route path="analytics" element={<FacultyAnalytics />} />
            <Route path="complaints" element={<FacultyComplaints />} />
          </Route>

          {/* Student Portal Protected Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="exams" element={<StudentDashboard />} />
            <Route path="results" element={<StudentResults />} />
            <Route path="downloads" element={<StudentDownloads />} />
            <Route path="complaints" element={<StudentComplaints />} />
          </Route>

          {/* Redirects */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
