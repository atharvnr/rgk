import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import type {
  PaginatedResponse,
  SchoolHours,
  School,
  User,
  VolunteerRequest,
  VolunteerSession,
} from "../types";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.rentgrandkids.org";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
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
    approveSession: builder.mutation<
      VolunteerSession,
      { id: string; approved: boolean }
    >({
      query: ({ id, approved }) => ({
        url: `/sessions/${id}/approve`,
        method: "PUT",
        body: { approved },
      }),
      invalidatesTags: ["Session"],
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
  useApproveSessionMutation,
} = api;
