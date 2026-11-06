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

export type ProxyLinkStatus = "pending" | "active" | "rejected" | "revoked";

export interface ProxyLink {
  id: string;
  proxy_user_id: string;
  needy_user_id: string;
  status: ProxyLinkStatus;
  rejection_reason?: string;
  requested_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
  revoked_at?: string;
  revoked_by?: string;
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

export interface PublicStats {
  hours_served: number;
  sessions_completed: number;
  volunteers: number;
  elders_helped: number;
  schools: number;
}

// --- Platform admin (root) ---

export interface PlatformAnalytics {
  total_users: number;
  total_schools: number;
  total_volunteers: number;
  total_needy: number;
  total_hours: number;
  total_sessions: number;
  pending_verifications: number;
  pending_associations: number;
}

export type VerificationRequestStatus = "pending" | "resolved";

export interface VerificationRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string | null;
  phone?: string | null;
  message?: string | null;
  status: VerificationRequestStatus;
  admin_notes?: string | null;
  created_at: string;
  resolved_by?: string | null;
  resolved_at?: string | null;
}

/** Body of PUT /admin/users/{id}. Every field is optional. */
export interface AdminUserUpdate {
  name?: string;
  phone?: string;
  bio?: string;
  address?: string;
  role?: UserRole;
  school_id?: string | null;
  school_issued_id?: string;
  verification_status?: VerificationStatus;
  is_active?: boolean;
}

/** Body of POST /admin/schools. */
export interface SchoolCreate {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  contact_email: string;
  contact_phone?: string;
}

/** Body of PUT /admin/schools/{id}. */
export type SchoolUpdate = Partial<SchoolCreate> & { is_active?: boolean };

/** Query params of GET /admin/users. */
export interface AdminUsersQuery {
  q?: string;
  role?: UserRole;
  verification_status?: VerificationStatus;
  is_active?: boolean;
  school_id?: string;
  skip?: number;
  limit?: number;
}

/** Query params of GET /admin/schools. */
export interface AdminSchoolsQuery {
  include_inactive?: boolean;
  q?: string;
  skip?: number;
  limit?: number;
}
