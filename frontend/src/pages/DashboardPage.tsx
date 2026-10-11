import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Briefcase,
  Compass,
  MessageSquareCode,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  AlertCircle,
  PlusCircle,
  TrendingUp,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, getErrorMessage } from '../services/api';
import { DashboardSummary } from '../types';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Badge } from '../components/Badge';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading your placement metrics..." />
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Analyze Resume',
      desc: 'Audit your resume bullets & ATS score',
      icon: FileText,
      link: '/resume-analyzer',
      color: 'blue',
    },
    {
      title: 'Match Job Description',
      desc: 'Compare skills against target internship',
      icon: Briefcase,
      link: '/job-match',
      color: 'violet',
    },
    {
      title: 'Skill Roadmap',
      desc: 'Track milestones & project tasks',
      icon: Compass,
      link: '/roadmap',
      color: 'emerald',
    },
    {
      title: 'Mock Interview',
      desc: 'AI questions & instant feedback',
      icon: MessageSquareCode,
      link: '/mock-interview',
      color: 'amber',
    },
  ];

  // Chart data comparing existing scores
  const scoreComparisonData = [
    { name: 'Resume', score: summary?.latest_resume_score ?? 0 },
    { name: 'Job Match', score: summary?.latest_job_match_score ?? 0 },
    { name: 'Interview Avg', score: summary?.mock_interview_average_score ?? 0 },
    { name: 'Roadmap %', score: summary?.roadmap_progress_percentage ?? 0 },
  ];

  const hasAnyData =
    summary &&
    (summary.latest_resume_score !== null ||
      summary.latest_job_match_score !== null ||
      summary.roadmap_progress_percentage !== null ||
      summary.mock_interview_average_score !== null ||
      summary.active_applications_count > 0);

  return (
    <div className="space-y-8">
      {/* Welcome Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-violet-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Placement Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {summary?.greeting_name || user?.name || 'Engineer'}! 👋
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              Track your preparation readiness, target job alignments, and interview skills in one unified workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/resume-analyzer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Analyze New Resume</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSummary}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Latest Resume Score"
          value={summary?.latest_resume_score !== null ? `${summary?.latest_resume_score}/100` : 'Not Scored'}
          subtitle={summary?.latest_resume_score !== null ? 'ATS & rubric evaluation' : 'Upload resume to calculate'}
          icon={FileText}
          color="blue"
          trend={summary?.latest_resume_score ? (summary.latest_resume_score >= 75 ? 'Ready' : 'Improve') : undefined}
          trendUp={summary?.latest_resume_score ? summary.latest_resume_score >= 75 : false}
        />

        <StatCard
          title="Latest Job Match"
          value={summary?.latest_job_match_score !== null ? `${summary?.latest_job_match_score}%` : 'No Match'}
          subtitle={summary?.latest_job_match_score !== null ? 'Alignment to target role' : 'Compare against JD'}
          icon={Briefcase}
          color="violet"
        />

        <StatCard
          title="Roadmap Completion"
          value={summary?.roadmap_progress_percentage !== null ? `${summary?.roadmap_progress_percentage}%` : '0%'}
          subtitle={summary?.roadmap_target_role ? `Target: ${summary.roadmap_target_role}` : 'Create a skill roadmap'}
          icon={Compass}
          color="emerald"
        />

        <StatCard
          title="Active Applications"
          value={summary?.active_applications_count ?? 0}
          subtitle={`${summary?.upcoming_deadlines?.length || 0} upcoming deadlines`}
          icon={ClipboardList}
          color="amber"
        />
      </div>

      {/* Main Content Split: Score Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Overview Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Placement Readiness Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time metrics calculated from your saved activities</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live DB Metrics</span>
            </div>
          </div>

          {hasAnyData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-lg">
              <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Placement Activity Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Upload your resume, match a job description, or start a mock interview to populate your readiness analytics.
              </p>
              <Link
                to="/resume-analyzer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                <span>Upload your first resume</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Launch Cards */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-400 mb-4">Jump directly into placement modules</p>

            <div className="space-y-3">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={idx}
                    to={action.link}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all group cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <Link
              to="/history"
              className="text-xs text-center block text-slate-400 hover:text-slate-200 transition-colors"
            >
              View Full Placement History & Saved Reports →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Upcoming Application Deadlines</h2>
            </div>
            <Link to="/applications" className="text-xs text-blue-400 hover:text-blue-300">
              Manage All
            </Link>
          </div>

          {summary?.upcoming_deadlines && summary.upcoming_deadlines.length > 0 ? (
            <div className="space-y-3">
              {summary.upcoming_deadlines.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{app.role}</h4>
                    <p className="text-[11px] text-slate-400">{app.company}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="amber" size="sm">
                      {new Date(app.deadline).toLocaleDateString()}
                    </Badge>
                    <Badge variant="blue" size="sm">
                      {app.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
              No upcoming deadlines tracked.
              <div className="mt-2">
                <Link to="/applications" className="text-blue-400 hover:underline">
                  + Add a job application
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            </div>
            <Link to="/history" className="text-xs text-blue-400 hover:text-blue-300">
              View History
            </Link>
          </div>

          {summary?.recent_activity && summary.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {summary.recent_activity.map((act) => (
                <Link
                  key={act.id}
                  to={act.link}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{act.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{act.description}</p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    {act.score !== undefined && (
                      <span className="text-xs font-bold text-blue-400 mr-2">{act.score} pts</span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
              No recent placement activities recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
