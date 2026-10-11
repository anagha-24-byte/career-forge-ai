import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  FileCheck,
  RotateCcw,
  Trash2,
  Eye,
  Info,
} from 'lucide-react';
import { resumeApi, getErrorMessage } from '../services/api';
import { Resume, ResumeAnalysis, ResumeAnalysisResult } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const ResumeAnalyzerPage: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [targetRole, setTargetRole] = useState('Software Engineering Intern');
  const [currentAnalysis, setCurrentAnalysis] = useState<ResumeAnalysis | null>(null);
  const [pastAnalyses, setPastAnalyses] = useState<ResumeAnalysis[]>([]);

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'rubric' | 'ats' | 'bullets' | 'history'>('overview');

  const fetchResumes = async () => {
    try {
      const data = await resumeApi.listResumes();
      setResumes(data);
      if (data.length > 0 && !selectedResume) {
        setSelectedResume(data[0]);
        loadAnalysesForResume(data[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const loadAnalysesForResume = async (resumeId: string) => {
    try {
      const analyses = await resumeApi.getResumeAnalyses(resumeId);
      setPastAnalyses(analyses);
      if (analyses.length > 0) {
        setCurrentAnalysis(analyses[0]);
      } else {
        setCurrentAnalysis(null);
      }
    } catch {
      // Ignore initial analysis fetch error
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setSuccessMsg(null);

    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Invalid file type. Only PDF and DOCX documents are accepted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await resumeApi.uploadResume(file);
      setResumes((prev) => [uploaded, ...prev]);
      setSelectedResume(uploaded);
      setSuccessMsg(`"${file.name}" uploaded and parsed successfully!`);
      loadAnalysesForResume(uploaded.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedResume) return;
    setIsAnalyzing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const analysis = await resumeApi.analyzeResume(selectedResume.id, targetRole.trim());
      setCurrentAnalysis(analysis);
      setPastAnalyses((prev) => [analysis, ...prev]);
      setSuccessMsg('Resume analysis completed successfully!');
      setActiveTab('overview');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume and its analysis history?')) return;
    try {
      await resumeApi.deleteResume(resumeId);
      const remaining = resumes.filter((r) => r.id !== resumeId);
      setResumes(remaining);
      if (selectedResume?.id === resumeId) {
        const next = remaining[0] || null;
        setSelectedResume(next);
        if (next) loadAnalysesForResume(next.id);
        else {
          setCurrentAnalysis(null);
          setPastAnalyses([]);
        }
      }
      setSuccessMsg('Resume deleted successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const analysisData: ResumeAnalysisResult | null = currentAnalysis?.analysis_json ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <FileCheck className="w-3.5 h-3.5" />
            <span>AI Placement Evaluator</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Resume Analyzer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload your resume for ATS screening, rubric scoring, and quantifiable bullet enhancements.
          </p>
        </div>
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

      {/* Main Grid: Upload & Document Selector (Left) vs Analysis & Findings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Upload & Management) */}
        <div className="lg:col-span-4 space-y-6">
          {/* File Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-slate-900/60 ${
              dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Upload Resume Document</h3>
            <p className="text-xs text-slate-400 mb-4">Drag and drop PDF or DOCX file (up to 5MB)</p>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm">
              <span>{isUploading ? 'Extracting Text...' : 'Choose File'}</span>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Selected Resume & Configuration */}
          {selectedResume ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">{selectedResume.filename}</h4>
                    <p className="text-[11px] text-slate-400">
                      {(selectedResume.file_size / 1024).toFixed(1)} KB • {selectedResume.char_count} chars
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowExtractedText(!showExtractedText)}
                    title="View extracted text preview"
                    className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteResume(selectedResume.id)}
                    title="Delete resume"
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Extracted text drawer */}
              {showExtractedText && (
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg max-h-48 overflow-y-auto text-xs text-slate-300 font-mono">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                    <span>Extracted Resume Text Preview</span>
                    <span>{selectedResume.extracted_text.split(/\s+/).length} words</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300">
                    {selectedResume.extracted_text.slice(0, 1000)}...
                  </pre>
                </div>
              )}

              {/* Target Role input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Role for Alignment
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Backend Software Engineer"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Analyzing with Claude AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{currentAnalysis ? 'Re-Analyze Resume' : 'Start Full AI Analysis'}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
              Upload a resume above to preview extracted text and run the evaluation rubric.
            </div>
          )}

          {/* Available Uploaded Resumes */}
          {resumes.length > 1 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-2.5">Your Uploaded Documents</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {resumes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedResume(r);
                      loadAnalysesForResume(r.id);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      selectedResume?.id === r.id
                        ? 'bg-blue-600/15 border border-blue-500/30 text-white font-medium'
                        : 'bg-slate-950/50 hover:bg-slate-800 text-slate-400 border border-transparent'
                    }`}
                  >
                    <span className="truncate max-w-[180px]">{r.filename}</span>
                    <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Analysis Report & Insights) */}
        <div className="lg:col-span-8">
          {isAnalyzing ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center">
              <LoadingSpinner
                message="Evaluating Resume with Claude AI..."
                subMessage="Checking ATS compatibility, quantifiable bullet structures, project impact, and alignment to target role."
              />
            </div>
          ) : analysisData ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              {/* Header with Score and Demo Tag */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-6">
                  <ScoreGauge score={analysisData.overall_score} size={110} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-white">Overall Resume Score</h2>
                      {analysisData.is_demo_mode && (
                        <Badge variant="amber" size="sm">
                          Demo Mode
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 max-w-md leading-relaxed">{analysisData.summary}</p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Target Role Evaluated: <span className="text-blue-400 font-medium">{currentAnalysis?.target_role}</span>
                    </p>
                  </div>
                </div>

                {/* Score Category Breakdown summary */}
                <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                  <div className="text-xs text-slate-400">
                    ATS Readability:{' '}
                    <span className="font-semibold text-emerald-400">
                      {analysisData.ats_readability.filter((c) => c.passed).length} /{' '}
                      {analysisData.ats_readability.length} Passed
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Bullet Improvements:{' '}
                    <span className="font-semibold text-blue-400">
                      {analysisData.weak_bullet_points.length} Recommended
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'overview', label: 'Priority Action Items' },
                  { id: 'rubric', label: 'Rubric Breakdown' },
                  { id: 'ats', label: 'ATS Readability Checklist' },
                  { id: 'bullets', label: 'Bullet Point Enhancer' },
                  { id: 'history', label: `Previous Versions (${pastAnalyses.length})` },
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

              {/* Tab: Overview / Action items */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      Priority Recommendations to Increase Score
                    </h3>
                    <div className="space-y-2">
                      {analysisData.priority_recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300"
                        >
                          <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {analysisData.missing_information.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        Missing or Weak Resume Sections
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {analysisData.missing_information.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2"
                          >
                            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisData.target_roles_fit?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 mb-2">Estimated Strong Fit Roles:</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.target_roles_fit.map((role, idx) => (
                          <Badge key={idx} variant="violet" size="md">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Rubric Breakdown */}
              {activeTab === 'rubric' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 mb-2">
                    Scoring rubric evaluating student readiness for industry placement benchmarks:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisData.rubric_breakdown.map((item, idx) => (
                      <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{item.category}</h4>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              item.score >= 80
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : item.score >= 60
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {item.score}/100
                          </span>
                        </div>

                        {item.strengths.length > 0 && (
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-emerald-400 block mb-1">
                              Strengths
                            </span>
                            <ul className="text-xs text-slate-300 space-y-1">
                              {item.strengths.map((str, sIdx) => (
                                <li key={sIdx} className="flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.improvements.length > 0 && (
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-amber-400 block mb-1">
                              Areas to Improve
                            </span>
                            <ul className="text-xs text-slate-300 space-y-1">
                              {item.improvements.map((imp, iIdx) => (
                                <li key={iIdx} className="flex items-start gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: ATS Readability */}
              {activeTab === 'ats' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                    ATS Audit tests against typical applicant tracking systems (e.g. Workday, Greenhouse, Lever). Note:
                    No automated score guarantees employment; ATS guidelines ensure parsing fidelity.
                  </div>
                  <div className="space-y-2.5">
                    {analysisData.ats_readability.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800"
                      >
                        <div className="flex items-start gap-3">
                          {item.passed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <h4 className="text-xs font-semibold text-white">{item.check}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{item.recommendation}</p>
                          </div>
                        </div>
                        <Badge variant={item.passed ? 'green' : 'red'} size="sm">
                          {item.passed ? 'PASSED' : 'ACTION REQUIRED'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Bullet Point Enhancer */}
              {activeTab === 'bullets' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Identified weak or vague descriptions alongside improved versions with quantifiable impact metrics:
                  </p>
                  <div className="space-y-4">
                    {analysisData.weak_bullet_points.map((bullet, idx) => (
                      <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-rose-400 tracking-wider">
                            Original Vague Bullet
                          </span>
                          <p className="text-xs text-slate-400 italic mt-0.5 line-through">"{bullet.original}"</p>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold uppercase text-emerald-400 tracking-wider">
                            Suggested High-Impact Rewrite
                          </span>
                          <p className="text-xs font-medium text-emerald-300 mt-0.5">"{bullet.improved}"</p>
                        </div>

                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                          <span>
                            <strong>Measurable Impact Added:</strong> {bullet.measurable_impact}
                          </span>
                          <span className="text-slate-400">Reason: {bullet.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Past Analyses */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-white">Previous Analysis Iterations for this Document</h3>
                  <div className="space-y-2">
                    {pastAnalyses.map((hist) => (
                      <div
                        key={hist.id}
                        onClick={() => setCurrentAnalysis(hist)}
                        className={`p-3 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                          currentAnalysis?.id === hist.id
                            ? 'bg-blue-600/15 border-blue-500/30'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">
                            Target: {hist.target_role || 'General Placement'}
                          </p>
                          <p className="text-[10px] text-slate-400">{new Date(hist.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-blue-400">{hist.overall_score}/100</span>
                          {currentAnalysis?.id === hist.id && (
                            <Badge variant="blue" size="sm">
                              Viewing
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8">
              <EmptyState
                icon={FileText}
                title="No Analysis Selected"
                description={
                  selectedResume
                    ? `Click "Start Full AI Analysis" on the left to evaluate "${selectedResume.filename}" using Claude AI.`
                    : 'Upload your PDF or DOCX resume to get started.'
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
