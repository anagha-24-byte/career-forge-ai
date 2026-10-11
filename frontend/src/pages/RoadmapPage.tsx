import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  AlertCircle,
  Code2,
} from 'lucide-react';
import { roadmapApi, resumeApi, getErrorMessage } from '../services/api';
import { LearningRoadmap, RoadmapTask, SkillGapItem, Resume } from '../types';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const RoadmapPage: React.FC = () => {
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [targetDomain, setTargetDomain] = useState('Cloud & Distributed Systems');

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New task modal/inline form
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskMilestone, setNewTaskMilestone] = useState('Custom Milestones');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskLevel, setNewTaskLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [newTaskHours, setNewTaskHours] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [latestRoadmap, resumesData] = await Promise.all([
        roadmapApi.getLatestRoadmap(),
        resumeApi.listResumes(),
      ]);
      setRoadmap(latestRoadmap);
      setResumes(resumesData);
      if (resumesData.length > 0) {
        setSelectedResumeId(resumesData[0].id);
      }
      if (latestRoadmap?.target_role) {
        setTargetRole(latestRoadmap.target_role);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      setError('Target role is required.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const newRoadmap = await roadmapApi.generateRoadmap({
        target_role: targetRole.trim(),
        target_domain: targetDomain.trim() || undefined,
        resume_id: selectedResumeId || undefined,
      });
      setRoadmap(newRoadmap);
      setSuccessMsg('Personalized learning roadmap and skill gaps generated!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (task: RoadmapTask) => {
    const updatedStatus = !task.is_completed;
    try {
      const updatedTask = await roadmapApi.toggleTaskCompleted(task.id, updatedStatus);
      if (roadmap) {
        const updatedTasks = roadmap.tasks.map((t) => (t.id === task.id ? updatedTask : t));
        const completedCount = updatedTasks.filter((t) => t.is_completed).length;
        const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
        setRoadmap({
          ...roadmap,
          tasks: updatedTasks,
          progress_percentage: progress,
        });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadmap || !newTaskTitle.trim()) return;

    try {
      const created = await roadmapApi.addTask(roadmap.id, {
        milestone_title: newTaskMilestone.trim() || 'Custom Milestone',
        task_title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        difficulty_level: newTaskLevel,
        estimated_hours: newTaskHours,
      });

      const updatedTasks = [...roadmap.tasks, created];
      const completedCount = updatedTasks.filter((t) => t.is_completed).length;
      const progress = Math.round((completedCount / updatedTasks.length) * 100);

      setRoadmap({
        ...roadmap,
        tasks: updatedTasks,
        progress_percentage: progress,
      });

      setShowAddTask(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setSuccessMsg('New task added to roadmap!');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading your personalized learning roadmap..." />
      </div>
    );
  }

  // Group tasks by milestone
  const milestonesMap: Record<string, RoadmapTask[]> = {};
  roadmap?.tasks?.forEach((task) => {
    const m = task.milestone_title || 'General Milestones';
    if (!milestonesMap[m]) milestonesMap[m] = [];
    milestonesMap[m].push(task);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Placement Career Path</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Skill Gap & Learning Roadmap</h1>
          <p className="text-xs text-slate-400 mt-1">
            Bridge targeted technical gaps with structured milestones, practical projects, and interactive task tracking.
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

      {/* Generation Bar / Settings */}
      <form
        onSubmit={handleGenerateRoadmap}
        className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-4 items-end"
      >
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Target Role *</label>
          <input
            type="text"
            required
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. SDE - Backend Engineer"
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Specialization / Domain</label>
          <input
            type="text"
            value={targetDomain}
            onChange={(e) => setTargetDomain(e.target.value)}
            placeholder="e.g. Distributed Systems & Microservices"
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="w-full md:w-56">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Base Resume</label>
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {resumes.length === 0 ? (
              <option value="">No resume uploaded</option>
            ) : (
              resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.filename}
                </option>
              ))
            )}
          </select>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
        >
          {isGenerating ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Generating with Claude...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{roadmap ? 'Regenerate Roadmap' : 'Generate Roadmap'}</span>
            </>
          )}
        </button>
      </form>

      {/* Main Roadmap & Skill Gaps Display */}
      {isGenerating ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center">
          <LoadingSpinner
            message="Synthesizing personalized learning milestones..."
            subMessage="Analyzing resume evidence, target role expectations, and sequencing beginner-to-advanced project milestones."
          />
        </div>
      ) : roadmap ? (
        <div className="space-y-8">
          {/* Progress Overview Header */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{roadmap.target_role}</h2>
                {roadmap.is_demo_mode && (
                  <Badge variant="amber" size="sm">
                    Demo Mode
                  </Badge>
                )}
              </div>
              {roadmap.target_domain && (
                <p className="text-xs text-emerald-400 font-medium mt-0.5">{roadmap.target_domain}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                {roadmap.tasks.filter((t) => t.is_completed).length} of {roadmap.tasks.length} tasks completed
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 mt-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${roadmap.progress_percentage}%` }}
                />
              </div>
            </div>

            <div className="text-center md:text-right px-6 py-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-3xl font-extrabold text-emerald-400">{roadmap.progress_percentage}%</span>
              <span className="text-xs text-slate-400 block font-medium">Roadmap Progress</span>
            </div>
          </div>

          {/* Skill Gap Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Diagnosed Skill Gaps & Evidence Breakdown
              </h3>
              <span className="text-xs text-slate-400">{roadmap.skill_gaps_json?.length || 0} Gaps Identified</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roadmap.skill_gaps_json?.map((gap, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-bold text-white">{gap.skill_name}</h4>
                      <Badge
                        variant={gap.priority === 'High' ? 'red' : gap.priority === 'Medium' ? 'amber' : 'blue'}
                        size="sm"
                      >
                        {gap.priority} Priority
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{gap.importance_reason}</p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] space-y-1.5 text-slate-400">
                      <div>
                        <strong className="text-slate-300">Resume Evidence:</strong> {gap.current_evidence}
                      </div>
                      <div>
                        <strong className="text-slate-300">Target Level:</strong> {gap.target_proficiency} (Est. {gap.estimated_hours}h)
                      </div>
                      <div>
                        <strong className="text-slate-300">Hands-on Project:</strong> {gap.practical_project}
                      </div>
                    </div>
                  </div>

                  {gap.recommended_resources?.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <span className="text-[10px] uppercase font-semibold text-emerald-400 block mb-1">
                        Curated Resources
                      </span>
                      <ul className="text-[11px] text-slate-300 space-y-1">
                        {gap.recommended_resources.map((res, rIdx) => (
                          <li key={rIdx} className="flex items-center justify-between">
                            <span className="truncate max-w-[200px]">{res.title}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{res.type}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Milestones & Tasks Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Structured Learning Milestones & Project Tasks
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check off tasks as you complete them to persist your progress in the database.
                </p>
              </div>

              <button
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Add Task Form modal */}
            {showAddTask && (
              <form
                onSubmit={handleAddTask}
                className="p-4 rounded-xl bg-slate-950 border border-slate-700/80 space-y-3"
              >
                <h4 className="text-xs font-bold text-white uppercase">Add Custom Task to Roadmap</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Milestone Header</label>
                    <input
                      type="text"
                      value={newTaskMilestone}
                      onChange={(e) => setNewTaskMilestone(e.target.value)}
                      placeholder="e.g. Distributed Systems Lab"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Task Title *</label>
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Implement Redis caching layer"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Task Description</label>
                  <input
                    type="text"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Short description or link to lab repo..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                  />
                </div>

                <div className="flex gap-4 items-center pt-1">
                  <div>
                    <label className="text-[11px] text-slate-400 mr-2">Level:</label>
                    <select
                      value={newTaskLevel}
                      onChange={(e) => setNewTaskLevel(e.target.value as typeof newTaskLevel)}
                      className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mr-2">Est. Hours:</label>
                    <input
                      type="number"
                      value={newTaskHours}
                      onChange={(e) => setNewTaskHours(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>

                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-semibold text-white cursor-pointer"
                    >
                      Save Task
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Milestones grouped list */}
            <div className="space-y-6">
              {Object.entries(milestonesMap).map(([milestone, tasks]) => (
                <div key={milestone} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{milestone}</h4>
                    <span className="text-[11px] text-slate-400 ml-auto">
                      {tasks.filter((t) => t.is_completed).length}/{tasks.length} done
                    </span>
                  </div>

                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          task.is_completed
                            ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 text-slate-500 hover:text-emerald-400 cursor-pointer"
                          aria-label={task.is_completed ? 'Mark incomplete' : 'Mark completed'}
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-semibold ${
                                task.is_completed ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              {task.task_title}
                            </span>
                            <Badge
                              variant={
                                task.difficulty_level === 'Beginner'
                                  ? 'blue'
                                  : task.difficulty_level === 'Intermediate'
                                  ? 'violet'
                                  : 'amber'
                              }
                              size="sm"
                            >
                              {task.difficulty_level}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{task.estimated_hours}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8">
          <EmptyState
            icon={Compass}
            title="No Learning Roadmap Active"
            description="Enter your target engineering role above and click 'Generate Roadmap' to diagnose your skill gaps and create ordered learning milestones."
          />
        </div>
      )}
    </div>
  );
};
