import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import type {
  AdminSchoolsQuery,
  AdminUsersQuery,
  AdminUserUpdate,
  PaginatedResponse,
  PlatformAnalytics,
  ProxyLink,
  PublicStats,
  SchoolCreate,
  SchoolHours,
  School,
  SchoolUpdate,
  User,
  VerificationRequest,
  VerificationStatus,
  VolunteerRequest,
  VolunteerSession,
} from "../types";
import { logout, setToken } from "../store/authSlice";
import { showSnackbar } from "../store/uiSlice";
import { clearTokens, refreshAccessToken } from "./auth";

const DEFAULT_API = "https://api.rentgrandkids.org/api/v1";

let API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API;

// Safety: if the bundle was built with a localhost API URL but is running in a
// non-local browser (deployed site), prefer the production API. This prevents
// clients from trying to connect to the developer's localhost and seeing
// "Unable to connect" errors in production builds.
// On iOS/Android React Native defines `window` (as the global object) but not
// `window.location`, so check for location itself.
if (typeof window !== "undefined" && window.location) {
  const hostname = window.location.hostname;
  const runningLocally = hostname === "localhost" || hostname === "127.0.0.1";
  if (!runningLocally && API_URL.includes("localhost")) {
    API_URL = DEFAULT_API;
  }
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

let refreshPromise: Promise<string | null> | null = null;

type QueryValue = string | number | boolean | null | undefined;

/** Appends the defined, non-empty params to `path` as a query string. */
function withQuery(path: string, params: Record<string, QueryValue>): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    );
  return parts.length ? `${path}?${parts.join("&")}` : path;
}

// Tags for the admin area. Lists provide `{ id: "LIST" }` plus one tag per
// item, so a mutation can refresh every list and the one detail it touched.
const ADMIN_USER_LIST = { type: "AdminUser", id: "LIST" } as const;
const ADMIN_SCHOOL_LIST = { type: "AdminSchool", id: "LIST" } as const;
const VERIFICATION_LIST = { type: "Verification", id: "LIST" } as const;

const baseQueryWithErrorHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Skip refresh for auth/register — a 401 there means the token is genuinely bad
    const url = typeof args === "string" ? args : args.url;
    if (url === "/auth/register") {
      await clearTokens();
      api.dispatch(logout());
      return result;
    }

    // Mutex: coalesce concurrent 401s into a single refresh attempt
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      api.dispatch(setToken(newToken));
      // Retry the original request with the new token
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      await clearTokens();
      api.dispatch(logout());
      api.dispatch(
        showSnackbar({
          message: "Session expired. Please log in again.",
          type: "error",
        })
      );
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: [
    "User",
    "School",
    "Request",
    "Session",
    "AdminUser",
    "AdminSchool",
    "Verification",
  ],
  endpoints: (builder) => ({
    // Auth
    register: builder.mutation<User, Partial<User>>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),

    // Public (no auth required)
    getPublicStats: builder.query<PublicStats, void>({
      query: () => "/public/stats",
    }),

    // Users
    getMe: builder.query<User, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
    updateMe: builder.mutation<User, Partial<User>>({
      query: (body) => ({ url: "/users/me", method: "PUT", body }),
      invalidatesTags: ["User"],
    }),
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
    }),

    // Schools
    createSchool: builder.mutation<School, Partial<School>>({
      query: (body) => ({ url: "/schools/", method: "POST", body }),
      invalidatesTags: ["School"],
    }),
    getSchools: builder.query<
      PaginatedResponse<School>,
      { skip?: number; limit?: number }
    >({
      query: ({ skip = 0, limit = 20 }) =>
        `/schools/?skip=${skip}&limit=${limit}`,
      providesTags: ["School"],
    }),
    getSchool: builder.query<School, string>({
      query: (id) => `/schools/${id}`,
      providesTags: ["School"],
    }),
    updateSchool: builder.mutation<School, { id: string; body: Partial<School> }>({
      query: ({ id, body }) => ({
        url: `/schools/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["School"],
    }),
    getSchoolStudents: builder.query<
      PaginatedResponse<User>,
      { id: string; skip?: number; limit?: number }
    >({
      query: ({ id, skip = 0, limit = 20 }) =>
        `/schools/${id}/students?skip=${skip}&limit=${limit}`,
    }),
    getSchoolHours: builder.query<SchoolHours, string>({
      query: (id) => `/schools/${id}/hours`,
    }),

    // Requests
    createRequest: builder.mutation<VolunteerRequest, Partial<VolunteerRequest>>(
      {
        query: (body) => ({ url: "/requests/", method: "POST", body }),
        invalidatesTags: ["Request"],
      }
    ),
    getRequests: builder.query<
      PaginatedResponse<VolunteerRequest>,
      { skip?: number; limit?: number; status?: string }
    >({
      query: ({ skip = 0, limit = 20, status }) => {
        let url = `/requests/?skip=${skip}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: ["Request"],
    }),
    getRequest: builder.query<VolunteerRequest, string>({
      query: (id) => `/requests/${id}`,
      providesTags: ["Request"],
    }),
    updateRequest: builder.mutation<
      VolunteerRequest,
      { id: string; body: Partial<VolunteerRequest> }
    >({
      query: ({ id, body }) => ({
        url: `/requests/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Request"],
    }),
    acceptRequest: builder.mutation<VolunteerRequest, string>({
      query: (id) => ({ url: `/requests/${id}/accept`, method: "POST" }),
      invalidatesTags: ["Request"],
    }),
    updateRequestStatus: builder.mutation<
      VolunteerRequest,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/requests/${id}/status?status=${status}`,
        method: "PUT",
      }),
      invalidatesTags: ["Request"],
    }),

    // Sessions
    createSession: builder.mutation<
      VolunteerSession,
      Partial<VolunteerSession>
    >({
      query: (body) => ({ url: "/sessions/", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    getSessions: builder.query<
      PaginatedResponse<VolunteerSession>,
      { skip?: number; limit?: number; status?: string }
    >({
      query: ({ skip = 0, limit = 20, status }) => {
        let url = `/sessions/?skip=${skip}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: ["Session"],
    }),
    getSession: builder.query<VolunteerSession, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: ["Session"],
    }),
    elderConfirmSession: builder.mutation<VolunteerSession, string>({
      query: (id) => ({
        url: `/sessions/${id}/elder-confirm`,
        method: "PUT",
      }),
      invalidatesTags: ["Session"],
    }),
    approveSession: builder.mutation<
      VolunteerSession,
      { id: string; approved: boolean; rejection_reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/sessions/${id}/approve`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Session"],
    }),

    // Proxy
    getMyProxyLinks: builder.query<ProxyLink[], void>({
      query: () => "/proxy/links",
    }),
    // Verification requests (for unverified users to ask admin for help)
    createVerificationRequest: builder.mutation<
      VerificationRequest,
      { message?: string }
    >({
      query: (body) => ({ url: "/verification-requests", method: "POST", body }),
      invalidatesTags: [VERIFICATION_LIST],
    }),

    // Admin (root only)
    getAdminAnalytics: builder.query<PlatformAnalytics, void>({
      query: () => "/admin/analytics",
      // Counts move whenever users, schools or verification requests change.
      providesTags: [ADMIN_USER_LIST, ADMIN_SCHOOL_LIST, VERIFICATION_LIST],
    }),
    getAdminVerificationRequests: builder.query<VerificationRequest[], void>({
      query: () => "/admin/verification-requests",
      providesTags: [VERIFICATION_LIST],
    }),
    verifyUser: builder.mutation<
      { id: string; verification_status: VerificationStatus },
      {
        userId: string;
        verification_status: Extract<
          VerificationStatus,
          "verified" | "verification_failed"
        >;
      }
    >({
      query: ({ userId, verification_status }) => ({
        url: `/admin/users/${userId}/verify`,
        method: "PUT",
        body: { verification_status },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "AdminUser", id: userId },
        ADMIN_USER_LIST,
      ],
    }),
    resolveVerificationRequest: builder.mutation<
      VerificationRequest,
      { id: string; notes?: string }
    >({
      query: ({ id, notes }) => ({
        url: `/admin/verification-requests/${id}/resolve`,
        method: "PUT",
        body: { notes },
      }),
      invalidatesTags: [VERIFICATION_LIST],
    }),

    getAdminUsers: builder.query<PaginatedResponse<User>, AdminUsersQuery>({
      query: ({ skip = 0, limit = 25, ...filters }) =>
        withQuery("/admin/users", { ...filters, skip, limit }),
      providesTags: (result) => [
        ...(result?.items ?? []).map((u) => ({
          type: "AdminUser" as const,
          id: u.id,
        })),
        ADMIN_USER_LIST,
      ],
    }),
    getAdminUser: builder.query<User, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),
    updateAdminUser: builder.mutation<
      User,
      { id: string; body: AdminUserUpdate }
    >({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: "PUT",
        body,
      }),
      // A role/school change also moves the user in and out of school
      // admin_ids, and editing yourself changes /users/me.
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminUser", id },
        ADMIN_USER_LIST,
        "AdminSchool",
        "User",
      ],
    }),
    deleteAdminUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/users/${id}`, method: "DELETE" }),
      // The user's own detail tag is left alone so the screen being left does
      // not refetch a user that no longer exists.
      invalidatesTags: [ADMIN_USER_LIST, "AdminSchool", VERIFICATION_LIST],
    }),

    getAdminSchools: builder.query<
      PaginatedResponse<School>,
      AdminSchoolsQuery
    >({
      query: ({ skip = 0, limit = 20, include_inactive, q }) =>
        withQuery("/admin/schools", {
          include_inactive: include_inactive || undefined,
          q,
          skip,
          limit,
        }),
      providesTags: (result) => [
        ...(result?.items ?? []).map((s) => ({
          type: "AdminSchool" as const,
          id: s.id,
        })),
        ADMIN_SCHOOL_LIST,
      ],
    }),
    // There is no GET /admin/schools/{id}; the public detail endpoint also
    // returns inactive schools, which is what the admin editor needs.
    getAdminSchool: builder.query<School, string>({
      query: (id) => `/schools/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminSchool", id }],
    }),
    createAdminSchool: builder.mutation<School, SchoolCreate>({
      query: (body) => ({ url: "/admin/schools", method: "POST", body }),
      invalidatesTags: [ADMIN_SCHOOL_LIST, "School"],
    }),
    updateAdminSchool: builder.mutation<
      School,
      { id: string; body: SchoolUpdate }
    >({
      query: ({ id, body }) => ({
        url: `/admin/schools/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminSchool", id },
        ADMIN_SCHOOL_LIST,
        "School",
      ],
    }),
    deleteAdminSchool: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/schools/${id}`, method: "DELETE" }),
      // Soft delete: the school still exists, so its detail refetches as
      // inactive.
      invalidatesTags: (_result, _error, id) => [
        { type: "AdminSchool", id },
        ADMIN_SCHOOL_LIST,
        "School",
      ],
    }),
  }),
});

export const {
  useRegisterMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useGetUserQuery,
  useCreateSchoolMutation,
  useGetSchoolsQuery,
  useGetSchoolQuery,
  useUpdateSchoolMutation,
  useGetSchoolStudentsQuery,
  useGetSchoolHoursQuery,
  useCreateRequestMutation,
  useCreateVerificationRequestMutation,
  useGetRequestsQuery,
  useGetRequestQuery,
  useUpdateRequestMutation,
  useAcceptRequestMutation,
  useUpdateRequestStatusMutation,
  useCreateSessionMutation,
  useGetSessionsQuery,
  useGetSessionQuery,
  useElderConfirmSessionMutation,
  useApproveSessionMutation,
  useGetMyProxyLinksQuery,
  useGetAdminVerificationRequestsQuery,
  useResolveVerificationRequestMutation,
  useGetPublicStatsQuery,
  useGetAdminAnalyticsQuery,
  useVerifyUserMutation,
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminSchoolsQuery,
  useGetAdminSchoolQuery,
  useCreateAdminSchoolMutation,
  useUpdateAdminSchoolMutation,
  useDeleteAdminSchoolMutation,
} = api;
