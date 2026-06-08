import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import type {
  PaginatedResponse,
  ProxyLink,
  SchoolHours,
  School,
  User,
  VolunteerRequest,
  VolunteerSession,
} from "../types";
import { logout, setToken } from "../store/authSlice";
import { showSnackbar } from "../store/uiSlice";
import { clearTokens, refreshAccessToken } from "./auth";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.rentgrandkids.org/api/v1";

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
  tagTypes: ["User", "School", "Request", "Session"],
  endpoints: (builder) => ({
    // Auth
    register: builder.mutation<User, Partial<User>>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
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
} = api;
