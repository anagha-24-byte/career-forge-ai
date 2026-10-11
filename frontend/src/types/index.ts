export interface User {
  id: string;
  name: string;
  phone_country_code: string;
  phone_number: string;
  email?: string;
  target_role?: string;
  experience_level?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token?: string;
  token_type?: string;
  is_new_user: boolean;
}

export interface OtpChallengeResponse {
  message: string;
  phone_number: string;
  expires_in_seconds: number;
  dev_mode: boolean;
  dev_otp?: string; // only present in dev/demo mode with explicit notice
}

export interface Resume {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  extracted_text: string;
  char_count: number;
  created_at: string;
  analyses_count?: number;
}

export interface ResumeRubricItem {
  category: string;
  score: number;
  weight: number;
  strengths: string[];
  improvements: string[];
}

export interface AtsCheckItem {
  check: string;
  passed: boolean;
  recommendation: string;
}

export interface BulletImprovement {
  original: string;
  improved: string;
  reason: string;
  measurable_impact: string;
}

export interface ResumeAnalysisResult {
  overall_score: number;
  summary: string;
  rubric_breakdown: ResumeRubricItem[];
  ats_readability: AtsCheckItem[];
  missing_information: string[];
  weak_bullet_points: BulletImprovement[];
  priority_recommendations: string[];
  target_roles_fit: string[];
  is_demo_mode?: boolean;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  user_id: string;
  target_role?: string;
  overall_score: number;
  analysis_json: ResumeAnalysisResult;
  created_at: string;
}

export interface JobMatchAnalysisResult {
  match_score: number;
  matching_skills: string[];
  missing_or_weak_skills: string[];
  matching_qualifications: string[];
  important_keywords_found: string[];
  important_keywords_missing: string[];
  concrete_recommendations: string[];
  interview_prep_topics: string[];
  score_explanation: string;
  is_demo_mode?: boolean;
}

export interface JobMatch {
  id: string;
  user_id: string;
  resume_id?: string;
  job_title: string;
  company_name?: string;
  job_description: string;
  match_score: number;
  result_json: JobMatchAnalysisResult;
  created_at: string;
}

export interface SkillGapItem {
  skill_name: string;
  current_evidence: string;
  target_proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  priority: 'High' | 'Medium' | 'Low';
  importance_reason: string;
  suggested_learning_sequence: string;
  practical_project: string;
  estimated_hours: number;
  recommended_resources: { title: string; url?: string; type: string }[];
}

export interface RoadmapTask {
  id: string;
  roadmap_id: string;
  milestone_title: string;
  task_title: string;
  description: string;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  order_index: number;
  is_completed: boolean;
  completed_at?: string;
  estimated_hours: number;
  resource_name?: string;
  resource_url?: string;
}

export interface LearningRoadmap {
  id: string;
  user_id: string;
  target_role: string;
  target_domain?: string;
  skill_gaps_json: SkillGapItem[];
  tasks: RoadmapTask[];
  progress_percentage: number;
  is_demo_mode?: boolean;
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestionItem {
  id?: string;
  question_number: number;
  question_text: string;
  expected_topics: string[];
  evaluation_criteria: string;
}

export interface InterviewAnswerFeedback {
  clarity_score: number;
  technical_depth_score: number;
  communication_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  sample_strong_answer: string;
  overall_feedback: string;
}

export interface InterviewAnswer {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  user_answer_text: string;
  feedback_json?: InterviewAnswerFeedback;
  score?: number;
  created_at: string;
}

export interface MockInterviewSession {
  id: string;
  user_id: string;
  target_role: string;
  interview_type: 'technical' | 'hr' | 'behavioral' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  total_questions: number;
  current_question_index: number;
  status: 'in_progress' | 'completed';
  overall_score?: number;
  overall_feedback?: string;
  questions_json: InterviewQuestionItem[];
  answers: InterviewAnswer[];
  is_demo_mode?: boolean;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | 'Interested'
  | 'Preparing'
  | 'Applied'
  | 'Assessment'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface JobApplication {
  id: string;
  user_id: string;
  company: string;
  role: string;
  application_date: string;
  deadline?: string;
  status: ApplicationStatus;
  job_description?: string;
  job_posting_url?: string;
  notes?: string;
  next_action?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  greeting_name: string;
  latest_resume_score: number | null;
  latest_job_match_score: number | null;
  roadmap_progress_percentage: number | null;
  roadmap_target_role: string | null;
  mock_interview_average_score: number | null;
  completed_interviews_count: number;
  active_applications_count: number;
  upcoming_deadlines: {
    id: string;
    company: string;
    role: string;
    deadline: string;
    status: ApplicationStatus;
  }[];
  recent_activity: {
    id: string;
    type: 'resume' | 'match' | 'roadmap' | 'interview' | 'application';
    title: string;
    description: string;
    timestamp: string;
    score?: number;
    link: string;
  }[];
}
