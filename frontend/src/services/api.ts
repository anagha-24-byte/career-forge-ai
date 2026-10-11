import axios, { AxiosError } from 'axios';
import {
  AuthResponse,
  OtpChallengeResponse,
  User,
  Resume,
  ResumeAnalysis,
  JobMatch,
  LearningRoadmap,
  RoadmapTask,
  MockInterviewSession,
  JobApplication,
  DashboardSummary,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // allow sufficient time for AI operations
});

// Helper to extract a friendly error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.message === 'string') return data.message;
    if (error.response?.status === 401) return 'Session expired or unauthenticated. Please log in.';
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 404) return 'The requested resource was not found.';
    if (error.response?.status === 429) return 'Rate limit exceeded. Please wait a moment and try again.';
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    return error.message || 'An unexpected network error occurred.';
  }
  return error instanceof Error ? error.message : 'An unknown error occurred.';
};

export const authApi = {
  sendOtp: async (name: string, phone_country_code: string, phone_number: string): Promise<OtpChallengeResponse> => {
    const res = await api.post<OtpChallengeResponse>('/auth/send-otp', {
      name,
      phone_country_code,
      phone_number,
    });
    return res.data;
  },

  verifyOtp: async (phone_country_code: string, phone_number: string, otp_code: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/verify-otp', {
      phone_country_code,
      phone_number,
      otp_code,
    });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/auth/logout');
    return res.data;
  },
};

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.get<User>('/profile');
    return res.data;
  },

  updateProfile: async (data: Partial<Pick<User, 'name' | 'email' | 'target_role' | 'experience_level'>>): Promise<User> => {
    const res = await api.patch<User>('/profile', data);
    return res.data;
  },
};

export const resumeApi = {
  uploadResume: async (file: File): Promise<Resume> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<Resume>('/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  listResumes: async (): Promise<Resume[]> => {
    const res = await api.get<Resume[]>('/resumes');
    return res.data;
  },

  getResume: async (resumeId: string): Promise<Resume> => {
    const res = await api.get<Resume>(`/resumes/${resumeId}`);
    return res.data;
  },

  deleteResume: async (resumeId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/resumes/${resumeId}`);
    return res.data;
  },

  analyzeResume: async (resumeId: string, target_role?: string): Promise<ResumeAnalysis> => {
    const res = await api.post<ResumeAnalysis>(`/resumes/${resumeId}/analyze`, { target_role });
    return res.data;
  },

  getResumeAnalyses: async (resumeId: string): Promise<ResumeAnalysis[]> => {
    const res = await api.get<ResumeAnalysis[]>(`/resumes/${resumeId}/analyses`);
    return res.data;
  },

  getAllAnalyses: async (): Promise<ResumeAnalysis[]> => {
    const res = await api.get<ResumeAnalysis[]>('/resumes/analyses/all');
    return res.data;
  },
};

export const jobMatchApi = {
  createJobMatch: async (data: {
    job_title: string;
    company_name?: string;
    job_description: string;
    resume_id?: string;
  }): Promise<JobMatch> => {
    const res = await api.post<JobMatch>('/job-matches', data);
    return res.data;
  },

  listJobMatches: async (): Promise<JobMatch[]> => {
    const res = await api.get<JobMatch[]>('/job-matches');
    return res.data;
  },

  getJobMatch: async (matchId: string): Promise<JobMatch> => {
    const res = await api.get<JobMatch>(`/job-matches/${matchId}`);
    return res.data;
  },

  deleteJobMatch: async (matchId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/job-matches/${matchId}`);
    return res.data;
  },
};

export const roadmapApi = {
  generateRoadmap: async (data: {
    target_role: string;
    target_domain?: string;
    resume_id?: string;
    job_description?: string;
  }): Promise<LearningRoadmap> => {
    const res = await api.post<LearningRoadmap>('/roadmaps', data);
    return res.data;
  },

  getLatestRoadmap: async (): Promise<LearningRoadmap | null> => {
    const res = await api.get<LearningRoadmap | null>('/roadmaps/latest');
    return res.data;
  },

  listRoadmaps: async (): Promise<LearningRoadmap[]> => {
    const res = await api.get<LearningRoadmap[]>('/roadmaps');
    return res.data;
  },

  getRoadmap: async (roadmapId: string): Promise<LearningRoadmap> => {
    const res = await api.get<LearningRoadmap>(`/roadmaps/${roadmapId}`);
    return res.data;
  },

  toggleTaskCompleted: async (taskId: string, is_completed: boolean): Promise<RoadmapTask> => {
    const res = await api.patch<RoadmapTask>(`/roadmap-tasks/${taskId}`, { is_completed });
    return res.data;
  },

  updateRoadmapTask: async (
    taskId: string,
    updates: Partial<Pick<RoadmapTask, 'task_title' | 'description' | 'difficulty_level' | 'is_completed'>>
  ): Promise<RoadmapTask> => {
    const res = await api.patch<RoadmapTask>(`/roadmap-tasks/${taskId}`, updates);
    return res.data;
  },

  addTask: async (
    roadmapId: string,
    task: {
      milestone_title: string;
      task_title: string;
      description: string;
      difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
      estimated_hours?: number;
    }
  ): Promise<RoadmapTask> => {
    const res = await api.post<RoadmapTask>(`/roadmaps/${roadmapId}/tasks`, task);
    return res.data;
  },

  deleteRoadmap: async (roadmapId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/roadmaps/${roadmapId}`);
    return res.data;
  },
};

export const interviewApi = {
  startInterview: async (data: {
    target_role: string;
    interview_type: 'technical' | 'hr' | 'behavioral' | 'mixed';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    question_count: number;
    resume_id?: string;
  }): Promise<MockInterviewSession> => {
    const res = await api.post<MockInterviewSession>('/interviews', data);
    return res.data;
  },

  listInterviews: async (): Promise<MockInterviewSession[]> => {
    const res = await api.get<MockInterviewSession[]>('/interviews');
    return res.data;
  },

  getInterview: async (interviewId: string): Promise<MockInterviewSession> => {
    const res = await api.get<MockInterviewSession>(`/interviews/${interviewId}`);
    return res.data;
  },

  submitAnswer: async (
    interviewId: string,
    data: { question_number: number; answer_text: string }
  ): Promise<MockInterviewSession> => {
    const res = await api.post<MockInterviewSession>(`/interviews/${interviewId}/answers`, data);
    return res.data;
  },

  completeInterview: async (interviewId: string): Promise<MockInterviewSession> => {
    const res = await api.post<MockInterviewSession>(`/interviews/${interviewId}/complete`);
    return res.data;
  },

  deleteInterview: async (interviewId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/interviews/${interviewId}`);
    return res.data;
  },
};

export const applicationApi = {
  listApplications: async (): Promise<JobApplication[]> => {
    const res = await api.get<JobApplication[]>('/applications');
    return res.data;
  },

  createApplication: async (data: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<JobApplication> => {
    const res = await api.post<JobApplication>('/applications', data);
    return res.data;
  },

  updateApplication: async (
    applicationId: string,
    data: Partial<Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<JobApplication> => {
    const res = await api.patch<JobApplication>(`/applications/${applicationId}`, data);
    return res.data;
  },

  deleteApplication: async (applicationId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/applications/${applicationId}`);
    return res.data;
  },
};

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },
};

export const historyApi = {
  getHistory: async (): Promise<{
    resumes: Resume[];
    analyses: ResumeAnalysis[];
    matches: JobMatch[];
    roadmaps: LearningRoadmap[];
    interviews: MockInterviewSession[];
    applications: JobApplication[];
  }> => {
    const res = await api.get('/history');
    return res.data;
  },
};

export default api;
