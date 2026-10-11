import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Building,
  Key,
  BookOpen,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { jobMatchApi, resumeApi, getErrorMessage } from '../services/api';
import { JobMatch, Resume, JobMatchAnalysisResult } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const JobMatchPage: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<JobMatch | null>(null);

  const [loadingMatches, setLoadingMatches] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingMatches(true);
    try {
      const [resumesData, matchesData] = await Promise.all([
        resumeApi.listResumes(),
        jobMatchApi.listJobMatches(),
      ]);
      setResumes(resumesData);
      if (resumesData.length > 0) {
        setSelectedResumeId(resumesData[0].id);
      }
      setMatches(matchesData);
      if (matchesData.length > 0) {
        setCurrentMatch(matchesData[0]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError('Please provide both Job Title and Job Description.');
      return;
    }

    setIsMatching(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const match = await jobMatchApi.createJobMatch({
        job_title: jobTitle.trim(),
        company_name: companyName.trim() || undefined,
        job_description: jobDescription.trim(),
        resume_id: selectedResumeId || undefined,
      });

      setMatches((prev) => [match, ...prev]);
      setCurrentMatch(match);
      setSuccessMsg(`Match analysis completed for "${match.job_title}"!`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsMatching(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this job match result?')) return;
    try {
      await jobMatchApi.deleteJobMatch(matchId);
      const remaining = matches.filter((m) => m.id !== matchId);
      setMatches(remaining);
      if (currentMatch?.id === matchId) {
        setCurrentMatch(remaining[0] || null);
      }
      setSuccessMsg('Match record removed.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const matchData: JobMatchAnalysisResult | null = currentMatch?.result_json ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 mb-1">
          <Target className="w-3.5 h-3.5" />
          <span>JD Alignment Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Job Description Matcher</h1>
        <p className="text-xs text-slate-400 mt-1">
          Cross-examine your resume qualifications against any internship or full-time job posting to pinpoint keywords and interview preparation topics.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form & Prior Matches (Left 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleRunMatch} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Compare Against Job Posting</h3>

            {/* Resume Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Resume to Compare</label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
              >
                {resumes.length === 0 ? (
                  <option value="">No resumes uploaded yet</option>
                ) : (
                  resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.filename} ({new Date(r.created_at).toLocaleDateString()})
                    </option>
                  ))
                )}
              </select>
              {resumes.length === 0 && (
                <p className="text-[11px] text-amber-400 mt-1">
                  Upload a resume in Resume Analyzer first for realistic profile comparison.
                </p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Job Title *</label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. SDE Intern - Backend / Cloud"
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Microsoft, Google, Razorpay"
                  className="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Job Description Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Job Description Text *</label>
              <textarea
                required
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the requirements, qualifications, and responsibilities from LinkedIn, campus portal, or careers page..."
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isMatching || !jobTitle.trim() || !jobDescription.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all cursor-pointer"
            >
              {isMatching ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Comparing against JD...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Job Alignment Match</span>
                </>
              )}
            </button>
          </form>

          {/* Past Matches List */}
          {matches.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-3">Saved Job Comparisons ({matches.length})</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {matches.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setCurrentMatch(m)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      currentMatch?.id === m.id
                        ? 'bg-violet-600/15 border-violet-500/30'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-white truncate">{m.job_title}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {m.company_name ? `${m.company_name} • ` : ''}
                        {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-violet-400">{m.match_score}%</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMatch(m.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Match Breakdown Output (Right 7 cols) */}
        <div className="lg:col-span-7">
          {isMatching ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center">
              <LoadingSpinner
                message="Evaluating Job Alignment with Claude AI..."
                subMessage="Analyzing semantic overlap, technology keywords, missing proficiencies, and targeted interview prep topics."
              />
            </div>
          ) : matchData ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              {/* Header Score Gauge */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-6">
                  <ScoreGauge score={matchData.match_score} size={110} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{currentMatch?.job_title}</h2>
                      {matchData.is_demo_mode && (
                        <Badge variant="amber" size="sm">
                          Demo Mode
                        </Badge>
                      )}
                    </div>
                    {currentMatch?.company_name && (
                      <p className="text-xs font-medium text-violet-400">{currentMatch.company_name}</p>
                    )}
                    <p className="text-xs text-slate-300 max-w-md mt-1 leading-relaxed">
                      {matchData.score_explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills Found vs Missing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matching Skills */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-3 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Matching Skills Verified</span>
                  </div>
                  {matchData.matching_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {matchData.matching_skills.map((skill, idx) => (
                        <Badge key={idx} variant="green" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No direct matching skills detected in resume.</p>
                  )}
                </div>

                {/* Missing or Weak Skills */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-3 uppercase tracking-wider">
                    <XCircle className="w-4 h-4" />
                    <span>Missing or Weak Skills</span>
                  </div>
                  {matchData.missing_or_weak_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {matchData.missing_or_weak_skills.map((skill, idx) => (
                        <Badge key={idx} variant="red" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">All key required skills were identified!</p>
                  )}
                </div>
              </div>

              {/* Keywords Section */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <Key className="w-4 h-4" />
                  <span>ATS Keyword Match Diagnosis</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Keywords Present in Resume:</span>
                    <div className="flex flex-wrap gap-1">
                      {matchData.important_keywords_found.map((kw, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono text-[11px]">
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Keywords Absent from Resume:</span>
                    <div className="flex flex-wrap gap-1">
                      {matchData.important_keywords_missing.map((kw, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-mono text-[11px]">
                          ✗ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
                  Actionable Steps to Bridge Gap
                </h3>
                <div className="space-y-2">
                  {matchData.concrete_recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interview Prep Topics */}
              {matchData.interview_prep_topics.length > 0 && (
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>Suggested Interview Prep Questions for this Role</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {matchData.interview_prep_topics.map((topic, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-violet-400 font-bold">•</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8">
              <EmptyState
                icon={Briefcase}
                title="No Job Match Run Yet"
                description="Enter a target job title and paste the job description on the left to calculate your match score and keyword gap analysis."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
