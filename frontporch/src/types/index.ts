export type UserRole =
  | "root"
  | "school_admin"
  | "school_user"
  | "volunteer"
  | "needy"
  | "needy_proxy";

export type VerificationStatus =
  | "not_required"
  | "unverified"
  | "pending_verification"
  | "verified"
  | "verification_failed";

export interface User {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  verification_status: VerificationStatus;
  school_id?: string;
  school_issued_id?: string;
  school_email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  contact_email: string;
  contact_phone?: string;
  admin_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RequestCategory =
  | "companionship"
  | "errands"
  | "tech_help"
  | "yard_work"
  | "transportation"
  | "other";

export type RequestStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface VolunteerRequest {
  id: string;
  elder_id: string;
  title: string;
  description: string;
  category: RequestCategory;
  status: RequestStatus;
  location?: string;
  preferred_date?: string;
  preferred_time_slot?: string;
  assigned_student_id?: string;
  created_at: string;
  updated_at: string;
}

export type SessionStatus =
  | "pending_elder_confirmation"
  | "pending_approval"
  | "approved"
  | "rejected";

export interface VolunteerSession {
  id: string;
  request_id: string;
  student_id: string;
  elder_id: string;
  school_id: string;
  hours_logged: number;
  date: string;
  notes?: string;
  status: SessionStatus;
  elder_confirmed: boolean;
  elder_confirmed_at?: string;
  elder_confirmed_by?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface SchoolHours {
  school_id: string;
  school_name: string;
  total_hours: number;
  approved_sessions: number;
}
