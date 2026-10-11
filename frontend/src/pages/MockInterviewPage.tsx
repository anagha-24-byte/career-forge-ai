import React, { useState, useEffect } from 'react';
import {
  MessageSquareCode,
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronRight,
  TrendingUp,
  History,
  Trash2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { interviewApi, resumeApi, getErrorMessage } from '../services/api';
import { MockInterviewSession, InterviewQuestionItem, Resume } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const MockInterviewPage: React.FC = () => {
  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [currentSession, setCurrentSession] = useState<MockInterviewSession | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);

  // Setup form states
  const [targetRole, setTargetRole] = useState('Software Engineer - Backend');
  const [interviewType, setInterviewType] = useState<'technical' | 'hr' | 'behavioral' | 'mixed'>('technical');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // Active question & answer states
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSessionsAndResumes();
  }, []);

  const loadSessionsAndResumes = async () => {
    try {
      const [sessionsData, resumesData] = await Promise.all([
        interviewApi.listInterviews(),
        resumeApi.listResumes(),
      ]);
      setSessions(sessionsData);
      setResumes(resumesData);
      if (resumesData.length > 0) setSelectedResumeId(resumesData[0].id);
      if (sessionsData.length > 0) {
        setCurrentSession(sessionsData[0]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      setError('Target role is required.');
      return;
    }

    setIsStarting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const newSession = await interviewApi.startInterview({
        target_role: targetRole.trim(),
        interview_type: interviewType,
        difficulty,
        question_count: questionCount,
        resume_id: selectedResumeId || undefined,
      });

      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setCurrentAnswerText('');
      setSuccessMsg('Interview session initiated! Ready for Question 1.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession || !currentAnswerText.trim()) return;

    const currentQIndex = currentSession.current_question_index;
    const qNum = currentQIndex + 1;

    setIsSubmitting(true);
    setError(null);
    try {
      const updatedSession = await interviewApi.submitAnswer(currentSession.id, {
        question_number: qNum,
        answer_text: currentAnswerText.trim(),
      });
      setCurrentSession(updatedSession);
      setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
      setCurrentAnswerText('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!currentSession) return;
    setIsCompleting(true);
    setError(null);
    try {
      const completed = await interviewApi.completeInterview(currentSession.id);
      setCurrentSession(completed);
      setSessions((prev) => prev.map((s) => (s.id === completed.id ? completed : s)));
      setSuccessMsg('Mock interview session finalized and scored!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this interview session?')) return;
    try {
      await interviewApi.deleteInterview(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (currentSession?.id === sessionId) {
        setCurrentSession(remaining[0] || null);
      }
      setSuccessMsg('Session deleted.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const currentQuestions: InterviewQuestionItem[] = currentSession?.questions_json || [];
  const currentQIndex = currentSession?.current_question_index ?? 0;
  const currentQuestion = currentQuestions[currentQIndex] || null;
  const isFinished = currentSession?.status === 'completed' || currentQIndex >= currentQuestions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
          <MessageSquareCode className="w-3.5 h-3.5" />
          <span>Claude AI Interviewer</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Mock Interviews</h1>
        <p className="text-xs text-slate-400 mt-1">
          Simulate realistic technical and behavioral campus placement rounds with question-by-question feedback,
          evaluation rubrics, and high-scoring sample answers.
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
        {/* Setup Form & History Sidebar (Left 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleStartInterview}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold text-white">Start New Interview Session</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Engineering Role *</label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. SDE - Full Stack Developer"
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Interview Round</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as typeof interviewType)}
                  className="w-full px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral / STAR</option>
                  <option value="hr">HR Round</option>
                  <option value="mixed">Mixed Comprehensive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                  className="w-full px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="beginner">Beginner (1st/2nd yr)</option>
                  <option value="intermediate">Intermediate (Placement)</option>
                  <option value="advanced">Advanced (Product Co)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={3}>3 Questions (Quick)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={7}>7 Questions (Deep)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Base Resume</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">General Profile</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.filename}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isStarting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              {isStarting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Interview Session</span>
                </>
              )}
            </button>
          </form>

          {/* Past Sessions List */}
          {sessions.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                <span>Saved Interview History</span>
                <span className="text-[10px] text-slate-500">{sessions.length} sessions</span>
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setCurrentSession(s);
                      setCurrentAnswerText('');
                    }}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      currentSession?.id === s.id
                        ? 'bg-purple-600/15 border-purple-500/30'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-white truncate">{s.target_role}</p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {s.interview_type} • {s.status === 'completed' ? 'Completed' : 'In Progress'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.overall_score !== undefined && s.overall_score !== null && (
                        <span className="font-bold text-purple-400">{s.overall_score} pts</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(s.id);
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

        {/* Active Session & Interactive Question Interface (Right 8 cols) */}
        <div className="lg:col-span-8">
          {isStarting ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center">
              <LoadingSpinner
                message="Generating role-specific interview questions with Claude AI..."
                subMessage="Tailoring technical depth to campus placement expectations and configuring answer evaluation rubric."
              />
            </div>
          ) : currentSession ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              {/* Session Header Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{currentSession.target_role}</h2>
                    <Badge variant="violet" size="sm">
                      {currentSession.interview_type.toUpperCase()}
                    </Badge>
                    <Badge variant="blue" size="sm">
                      {currentSession.difficulty}
                    </Badge>
                    {currentSession.is_demo_mode && (
                      <Badge variant="amber" size="sm">
                        Demo Mode
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Question {Math.min(currentQIndex + 1, currentSession.total_questions)} of{' '}
                    {currentSession.total_questions}
                  </p>
                </div>

                {currentSession.status === 'completed' ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Overall Score</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {currentSession.overall_score ?? 0}/100
                      </span>
                    </div>
                    <Badge variant="green" size="md">
                      Completed
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="amber" size="md">
                    In Progress
                  </Badge>
                )}
              </div>

              {/* Completed Session Summary (if completed) */}
              {currentSession.status === 'completed' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Award className="w-4 h-4" />
                    <span>Interview Evaluation Feedback</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {currentSession.overall_feedback ||
                      'Great job completing this session! Review each individual response below for clarity, technical depth, and strong sample answers.'}
                  </p>
                </div>
              )}

              {/* Active Question Box (if still in progress) */}
              {!isFinished && currentQuestion && (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-purple-400 font-semibold">
                      <span>Question #{currentQuestion.question_number}</span>
                      <span>Target: {currentSession.difficulty}</span>
                    </div>

                    <p className="text-sm font-semibold text-white leading-relaxed">
                      "{currentQuestion.question_text}"
                    </p>

                    {currentQuestion.expected_topics?.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400">Key Themes:</span>
                        {currentQuestion.expected_topics.map((theme, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Answer Input */}
                  <form onSubmit={handleSubmitAnswer} className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">
                      Your Response (Type your complete answer as you would speak it in an interview):
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={currentAnswerText}
                      onChange={(e) => setCurrentAnswerText(e.target.value)}
                      placeholder="Explain your approach, principles, experience, or structured STAR answer here..."
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none font-sans"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {currentAnswerText.split(/\s+/).filter(Boolean).length} words
                      </span>

                      <button
                        type="submit"
                        disabled={isSubmitting || !currentAnswerText.trim()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <RotateCcw className="w-4 h-4 animate-spin" />
                            <span>Evaluating Answer with AI...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Answer & Get Feedback</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Ready to Finalize Button (if all questions answered but not yet marked complete) */}
              {currentQIndex >= currentQuestions.length && currentSession.status !== 'completed' && (
                <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-xl text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">All Questions Answered!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click below to generate your final session score and comprehensive assessment summary.
                  </p>
                  <button
                    onClick={handleCompleteInterview}
                    disabled={isCompleting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    {isCompleting ? 'Finalizing Evaluation...' : 'Complete & Score Interview Session'}
                  </button>
                </div>
              )}

              {/* Answer History & Question-by-Question Feedback */}
              {currentSession.answers && currentSession.answers.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Submitted Answers & Rubric Feedback ({currentSession.answers.length})
                  </h3>

                  <div className="space-y-4">
                    {currentSession.answers.map((ans, idx) => {
                      const feedback = ans.feedback_json;
                      return (
                        <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                            <span className="text-xs font-bold text-purple-300">Question #{ans.question_number}</span>
                            {ans.score !== undefined && (
                              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {ans.score}/100
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-300 italic">"{ans.question_text}"</p>
                          </div>

                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Your Answer:
                            </span>
                            <p className="whitespace-pre-wrap">{ans.user_answer_text}</p>
                          </div>

                          {feedback && (
                            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                              <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
                                <span>
                                  Clarity: <strong className="text-white">{feedback.clarity_score}/100</strong>
                                </span>
                                <span>
                                  Technical Depth:{' '}
                                  <strong className="text-white">{feedback.technical_depth_score}/100</strong>
                                </span>
                                <span>
                                  Communication:{' '}
                                  <strong className="text-white">{feedback.communication_score}/100</strong>
                                </span>
                              </div>

                              <div className="text-slate-300 leading-relaxed bg-purple-950/20 p-2.5 rounded-lg border border-purple-900/30">
                                <span className="font-semibold text-purple-300 block mb-1">AI Evaluator Feedback:</span>
                                {feedback.overall_feedback}
                              </div>

                              {feedback.strengths?.length > 0 && (
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                                    Strengths
                                  </span>
                                  <ul className="text-[11px] text-slate-300 space-y-0.5">
                                    {feedback.strengths.map((str, sIdx) => (
                                      <li key={sIdx} className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                        <span>{str}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {feedback.areas_for_improvement?.length > 0 && (
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                                    Areas for Improvement
                                  </span>
                                  <ul className="text-[11px] text-slate-300 space-y-0.5">
                                    {feedback.areas_for_improvement.map((area, aIdx) => (
                                      <li key={aIdx} className="flex items-center gap-1.5">
                                        <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                                        <span>{area}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {feedback.sample_strong_answer && (
                                <div className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                                  <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">
                                    High-Scoring Sample Response (for reference):
                                  </span>
                                  <p className="text-xs italic leading-relaxed text-slate-300">
                                    "{feedback.sample_strong_answer}"
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8">
              <EmptyState
                icon={MessageSquareCode}
                title="No Active Interview Session"
                description="Configure your target role and difficulty on the left to start a real-time mock interview session with question-by-question scoring."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
