import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';

export const StudentLayout: React.FC = () => {
  const { user } = useAuth();

  // Route security checks
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopNav />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default StudentLayout;
