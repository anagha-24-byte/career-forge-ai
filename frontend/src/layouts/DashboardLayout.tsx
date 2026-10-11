import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { LoadingSpinner } from '../components/LoadingSpinner';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Placement Dashboard',
  '/resume-analyzer': 'AI Resume Analyzer',
  '/job-match': 'Job Description Matcher',
  '/roadmap': 'Skill Gap & Roadmap',
  '/mock-interview': 'AI Mock Interview',
  '/applications': 'Job Application Tracker',
  '/history': 'Placement History & Reports',
  '/profile': 'Profile & Settings',
};

export const DashboardLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner message="Checking authentication session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentTitle = pageTitles[location.pathname] || 'CareerForge AI';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar onMenuClick={() => setMobileOpen(true)} title={currentTitle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
