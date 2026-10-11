import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Calendar,
  Building,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { applicationApi, getErrorMessage } from '../services/api';
import { JobApplication, ApplicationStatus } from '../types';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

const ALL_STATUSES: ApplicationStatus[] = [
  'Interested',
  'Preparing',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
];

export const ApplicationTrackerPage: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'deadline' | 'applied_date'>('deadline');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [formData, setFormData] = useState<{
    company: string;
    role: string;
    application_date: string;
    deadline: string;
    status: ApplicationStatus;
    job_posting_url: string;
    notes: string;
    next_action: string;
  }>({
    company: '',
    role: '',
    application_date: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'Applied',
    job_posting_url: '',
    notes: '',
    next_action: '',
  });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await applicationApi.listApplications();
      setApplications(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openAddModal = () => {
    setEditingApp(null);
    setFormData({
      company: '',
      role: '',
      application_date: new Date().toISOString().split('T')[0],
      deadline: '',
      status: 'Applied',
      job_posting_url: '',
      notes: '',
      next_action: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setFormData({
      company: app.company,
      role: app.role,
      application_date: app.application_date.split('T')[0],
      deadline: app.deadline ? app.deadline.split('T')[0] : '',
      status: app.status,
      job_posting_url: app.job_posting_url || '',
      notes: app.notes || '',
      next_action: app.next_action || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) {
      setError('Company and Role are required.');
      return;
    }

    try {
      if (editingApp) {
        const updated = await applicationApi.updateApplication(editingApp.id, {
          company: formData.company.trim(),
          role: formData.role.trim(),
          application_date: formData.application_date,
          deadline: formData.deadline || undefined,
          status: formData.status,
          job_posting_url: formData.job_posting_url.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          next_action: formData.next_action.trim() || undefined,
        });
        setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setSuccessMsg(`Application for ${updated.company} updated.`);
      } else {
        const created = await applicationApi.createApplication({
          company: formData.company.trim(),
          role: formData.role.trim(),
          application_date: formData.application_date,
          deadline: formData.deadline || undefined,
          status: formData.status,
          job_posting_url: formData.job_posting_url.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          next_action: formData.next_action.trim() || undefined,
        });
        setApplications((prev) => [created, ...prev]);
        setSuccessMsg(`Application for ${created.company} added.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this job application?')) return;
    try {
      await applicationApi.deleteApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      setSuccessMsg('Application deleted.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Helper to determine deadline urgency
  const getDeadlineStatus = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const now = new Date();
    const d = new Date(deadlineStr);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Overdue', color: 'red' as const, urgent: true };
    if (diffDays <= 3) return { label: `${diffDays}d left`, color: 'amber' as const, urgent: true };
    return { label: `${diffDays}d left`, color: 'blue' as const, urgent: false };
  };

  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return new Date(b.application_date).getTime() - new Date(a.application_date).getTime();
    });

  const getStatusBadgeVariant = (status: ApplicationStatus) => {
    switch (status) {
      case 'Offer':
        return 'green';
      case 'Interview':
        return 'violet';
      case 'Assessment':
        return 'blue';
      case 'Applied':
        return 'blue';
      case 'Preparing':
      case 'Interested':
        return 'amber';
      case 'Rejected':
      case 'Withdrawn':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Placement Funnel</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Job Application Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track interview rounds, assessments, next actions, and approaching application deadlines.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Job Application</span>
        </button>
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

      {/* Controls Bar: Search, Status Filter, Sort */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, role, or keywords..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Statuses ({applications.length})</option>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="applied_date">Sort by Applied Date</option>
          </select>
        </div>
      </div>

      {/* Applications Grid / Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading your tracked applications..." />
        </div>
      ) : filteredApplications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.map((app) => {
            const deadlineInfo = getDeadlineStatus(app.deadline);
            return (
              <div
                key={app.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{app.role}</h3>
                      <p className="text-xs font-semibold text-amber-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5" />
                        <span>{app.company}</span>
                      </p>
                    </div>

                    <Badge variant={getStatusBadgeVariant(app.status)} size="sm">
                      {app.status}
                    </Badge>
                  </div>

                  {/* Dates & Deadlines */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Applied:
                      </span>
                      <span className="text-slate-300 font-medium">
                        {new Date(app.application_date).toLocaleDateString()}
                      </span>
                    </div>

                    {app.deadline && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Deadline:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-300">{new Date(app.deadline).toLocaleDateString()}</span>
                          {deadlineInfo && (
                            <Badge variant={deadlineInfo.color} size="sm">
                              {deadlineInfo.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Next Action & Notes */}
                  {app.next_action && (
                    <div className="mt-3 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">Next Action:</span>
                      <p className="text-slate-300">{app.next_action}</p>
                    </div>
                  )}

                  {app.notes && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">"{app.notes}"</p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  {app.job_posting_url ? (
                    <a
                      href={app.job_posting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Posting</span>
                    </a>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(app)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                      title="Edit application"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
                      title="Delete application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8">
          <EmptyState
            icon={ClipboardList}
            title="No Applications Tracked"
            description="Start organizing your campus placement pipeline. Add details for jobs and internships you're targeting or have applied to."
            actionText="Add First Application"
            onAction={openAddModal}
          />
        </div>
      )}

      {/* Modal Dialog for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingApp ? 'Edit Job Application' : 'Add New Job Application'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Google"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Software Engineer Intern"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Applied Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.application_date}
                    onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Posting URL (Optional)</label>
                <input
                  type="url"
                  value={formData.job_posting_url}
                  onChange={(e) => setFormData({ ...formData, job_posting_url: e.target.value })}
                  placeholder="https://jobs.lever.co/..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Next Action / Next Round</label>
                <input
                  type="text"
                  value={formData.next_action}
                  onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                  placeholder="e.g. Prepare System Design for Round 2 next Tuesday"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Referral contact, recruiter name, compensation range..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingApp ? 'Update Application' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
