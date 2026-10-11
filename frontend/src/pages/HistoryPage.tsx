import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  FileText,
  Briefcase,
  Compass,
  MessageSquareCode,
  ClipboardList,
  Search,
  ExternalLink,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { historyApi, resumeApi, jobMatchApi, interviewApi, applicationApi, getErrorMessage } from '../services/api';
import { Resume, ResumeAnalysis, JobMatch, LearningRoadmap, MockInterviewSession, JobApplication } from '../types';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const HistoryPage: React.FC = () => {
  const [data, setData] = useState<{
    resumes: Resume[];
    analyses: ResumeAnalysis[];
    matches: JobMatch[];
    roadmaps: LearningRoadmap[];
    interviews: MockInterviewSession[];
    applications: JobApplication[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'resumes' | 'matches' | 'roadmaps' | 'interviews' | 'applications'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await historyApi.getHistory();
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type} record?`)) return;
    try {
      if (type === 'resume') await resumeApi.deleteResume(id);
      if (type === 'match') await jobMatchApi.deleteJobMatch(id);
      if (type === 'interview') await interviewApi.deleteInterview(id);
      if (type === 'application') await applicationApi.deleteApplication(id);

      setSuccessMsg(`${type.charAt(0).toUpperCase() + type.slice(1)} record removed.`);
      fetchHistory();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Retrieving your complete placement records from PostgreSQL..." />
      </div>
    );
  }

  // Combine items for unified timeline if "all" selected
  interface TimelineItem {
    id: string;
    type: 'resume' | 'match' | 'roadmap' | 'interview' | 'application';
    title: string;
    subtitle: string;
    date: string;
    badgeText?: string;
    badgeVariant?: 'blue' | 'violet' | 'green' | 'amber' | 'red';
    link: string;
    rawId: string;
  }

  const items: TimelineItem[] = [];

  data?.analyses?.forEach((a) => {
    items.push({
      id: `analysis-${a.id}`,
      rawId: a.resume_id,
      type: 'resume',
      title: `Resume Scored: ${a.overall_score}/100`,
      subtitle: `Target: ${a.target_role || 'General Placement'}`,
      date: a.created_at,
      badgeText: `${a.overall_score} pts`,
      badgeVariant: a.overall_score >= 75 ? 'green' : 'blue',
      link: '/resume-analyzer',
    });
  });

  data?.matches?.forEach((m) => {
    items.push({
      id: `match-${m.id}`,
      rawId: m.id,
      type: 'match',
      title: `Job Match: ${m.job_title}`,
      subtitle: m.company_name ? `Company: ${m.company_name}` : 'Role Alignment Diagnosis',
      date: m.created_at,
      badgeText: `${m.match_score}% Match`,
      badgeVariant: 'violet',
      link: '/job-match',
    });
  });

  data?.roadmaps?.forEach((r) => {
    items.push({
      id: `roadmap-${r.id}`,
      rawId: r.id,
      type: 'roadmap',
      title: `Skill Roadmap: ${r.target_role}`,
      subtitle: `${r.tasks?.filter((t) => t.is_completed).length || 0}/${r.tasks?.length || 0} tasks finished`,
      date: r.created_at,
      badgeText: `${r.progress_percentage}% Done`,
      badgeVariant: 'green',
      link: '/roadmap',
    });
  });

  data?.interviews?.forEach((i) => {
    items.push({
      id: `interview-${i.id}`,
      rawId: i.id,
      type: 'interview',
      title: `Mock Interview: ${i.target_role}`,
      subtitle: `${i.interview_type.toUpperCase()} • ${i.difficulty} • ${i.answers?.length || 0} answered`,
      date: i.created_at,
      badgeText: i.overall_score !== undefined && i.overall_score !== null ? `${i.overall_score} pts` : i.status,
      badgeVariant: i.status === 'completed' ? 'green' : 'amber',
      link: '/mock-interview',
    });
  });

  data?.applications?.forEach((app) => {
    items.push({
      id: `app-${app.id}`,
      rawId: app.id,
      type: 'application',
      title: `Application: ${app.role} at ${app.company}`,
      subtitle: app.deadline ? `Deadline: ${new Date(app.deadline).toLocaleDateString()}` : 'Tracked Application',
      date: app.application_date,
      badgeText: app.status,
      badgeVariant: app.status === 'Offer' ? 'green' : 'blue',
      link: '/applications',
    });
  });

  const filteredItems = items
    .filter((it) => {
      const matchType =
        activeTab === 'all' ||
        (activeTab === 'resumes' && it.type === 'resume') ||
        (activeTab === 'matches' && it.type === 'match') ||
        (activeTab === 'roadmaps' && it.type === 'roadmap') ||
        (activeTab === 'interviews' && it.type === 'interview') ||
        (activeTab === 'applications' && it.type === 'application');
      const matchSearch =
        it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
          <History className="w-3.5 h-3.5" />
          <span>PostgreSQL Activity Ledger</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Placement History & Saved Reports</h1>
        <p className="text-xs text-slate-400 mt-1">
          Every evaluation, matched job description, interview session, and roadmap milestone is securely persisted
          to your account.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved reports, roles, companies..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'resumes', label: `Resumes (${data?.analyses?.length || 0})` },
            { id: 'matches', label: `Matches (${data?.matches?.length || 0})` },
            { id: 'roadmaps', label: `Roadmaps (${data?.roadmaps?.length || 0})` },
            { id: 'interviews', label: `Interviews (${data?.interviews?.length || 0})` },
            { id: 'applications', label: `Applications (${data?.applications?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-blue-400 shrink-0 mt-0.5 sm:mt-0">
                  {item.type === 'resume' && <FileText className="w-4 h-4 text-blue-400" />}
                  {item.type === 'match' && <Briefcase className="w-4 h-4 text-violet-400" />}
                  {item.type === 'roadmap' && <Compass className="w-4 h-4 text-emerald-400" />}
                  {item.type === 'interview' && <MessageSquareCode className="w-4 h-4 text-purple-400" />}
                  {item.type === 'application' && <ClipboardList className="w-4 h-4 text-amber-400" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-white">{item.title}</h3>
                    {item.badgeText && (
                      <Badge variant={item.badgeVariant || 'blue'} size="sm">
                        {item.badgeText}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.date).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  <span>Reopen</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>

                {item.type !== 'roadmap' && (
                  <button
                    onClick={() => handleDeleteItem(item.type, item.rawId)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8">
          <EmptyState
            icon={History}
            title="No Records Found"
            description={
              searchQuery
                ? `No history items matched "${searchQuery}". Try a different keyword.`
                : 'You have not generated any reports yet. Complete your first resume review or mock interview.'
            }
          />
        </div>
      )}
    </div>
  );
};
