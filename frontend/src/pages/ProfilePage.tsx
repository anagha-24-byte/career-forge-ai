import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogOut,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileApi, getErrorMessage } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ProfilePage: React.FC = () => {
  const { user, setUser, logout } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Second Year Student');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setTargetRole(user.target_role || 'Software Engineering Intern');
      setExperienceLevel(user.experience_level || 'Second Year Student');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await profileApi.updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        target_role: targetRole.trim() || undefined,
        experience_level: experienceLevel,
      });
      setUser(updated);
      setSuccessMsg('Profile and preferences updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading user profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Student Account Profile</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Profile & Placement Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your verified account credentials, preferred target engineering roles, and academic placement stage.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card (Left col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-3xl font-extrabold mx-auto shadow-lg shadow-blue-500/20">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <h2 className="text-base font-bold text-white">{user.name}</h2>
            <p className="text-xs text-blue-400 font-medium">{user.target_role || 'Engineering Aspirant'}</p>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-left space-y-3 text-slate-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {user.phone_country_code} {user.phone_number}
              </span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 ml-auto">
                Verified
              </span>
            </div>

            {user.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of CareerForge</span>
            </button>
          </div>
        </div>

        {/* Edit Form (Right 2 cols) */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Edit Placement Profile</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@college.edu"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Target Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Frontend Engineer, SDE"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year / Stage</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="First Year Student">First Year Student (Foundational)</option>
                  <option value="Second Year Student">Second Year Student (Internship Prep)</option>
                  <option value="Third Year Student">Third Year Student (Pre-Placement)</option>
                  <option value="Final Year Student">Final Year Student (Campus Placements)</option>
                  <option value="Recent Graduate">Recent Graduate (Entry Level)</option>
                </select>
              </div>
            </div>

            {/* Read-Only Verified Phone */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Verified Login Phone Number</span>
              <div className="flex items-center justify-between text-xs text-slate-200">
                <span className="font-mono">
                  {user.phone_country_code} {user.phone_number}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>OTP Authenticated</span>
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
