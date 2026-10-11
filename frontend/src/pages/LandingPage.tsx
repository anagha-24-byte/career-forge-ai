import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  FileCheck,
  Target,
  Compass,
  MessageSquareCode,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  BarChart3,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: FileCheck,
      title: 'AI Resume Scoring & ATS Audit',
      description:
        'Upload your PDF/DOCX resume for comprehensive rubric-based scoring, bullet-point rewriting, and ATS parsing checks.',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      icon: Target,
      title: 'Job Description Matching',
      description:
        'Paste any target internship or job description to identify matching skills, keyword gaps, and interview prep suggestions.',
      color: 'from-indigo-500 to-violet-500',
    },
    {
      icon: Compass,
      title: 'Personalized Learning Roadmaps',
      description:
        'Get custom beginner-to-advanced milestones, project recommendations, and track completion of skills directly.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: MessageSquareCode,
      title: 'AI Mock Interviews with Rubrics',
      description:
        'Practice technical, HR, and behavioral questions one-by-one with immediate scoring, strengths, and sample answers.',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              CareerForge<span className="text-blue-400">.AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-medium transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-blue-400 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Engineering Students & Placement Aspirants</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight md:leading-tight">
            Forge Your Engineering Career with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              AI-Powered Precision
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            From resume analysis and ATS keyword audits to Claude-powered mock interviews and actionable skill roadmaps
            — everything you need to crack internships and full-time campus placements.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-base shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5"
            >
              Start Placement Prep Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-base transition-colors"
            >
              Sign In with Mobile OTP
            </Link>
          </div>

          {/* Social Proof / Security Highlights */}
          <div className="mt-12 pt-8 border-t border-slate-900 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Passwordless Phone OTP Auth</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Anthropic Claude AI Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span>PostgreSQL Persisted Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Tailored for Engineering Placement Criteria</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-slate-950/60 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              An End-to-End Placement Toolkit
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Four specialized AI modules built specifically to bridge the gap between classroom theory and industry
              hiring benchmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="group relative bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 sm:p-8 transition-all duration-200 shadow-xl"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white mb-5 shadow-md`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow / Steps Section */}
      <section className="py-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">How CareerForge Works</h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              A structured 4-step workflow designed to take you from initial resume draft to job offer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Upload Resume',
                desc: 'Upload your existing PDF or DOCX file. Review text extraction before AI analysis.',
              },
              {
                step: '02',
                title: 'Match Target Jobs',
                desc: 'Paste internship or job descriptions to diagnose exact missing skills and keywords.',
              },
              {
                step: '03',
                title: 'Follow Custom Roadmap',
                desc: 'Complete targeted micro-projects and interactive milestones to close all critical skill gaps.',
              },
              {
                step: '04',
                title: 'Ace Mock Interviews',
                desc: 'Answer role-specific questions with instant feedback on clarity, depth, and strong sample answers.',
              },
            ].map((step, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800/70 rounded-xl p-5 relative">
                <span className="text-3xl font-black bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent opacity-60">
                  {step.step}
                </span>
                <h4 className="text-base font-semibold text-white mt-2 mb-1">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-normal">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-10 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>CareerForge AI — Student Placement Platform</span>
          </div>
          <p className="text-xs text-slate-400">
            Engineered with FastAPI, React, PostgreSQL & Claude AI. Built for portfolio & placement success.
          </p>
        </div>
      </footer>
    </div>
  );
};
