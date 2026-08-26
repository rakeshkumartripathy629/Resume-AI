import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../lib/api";

// ── Types ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  users: { total: number; newToday: number; newThisWeek: number };
  coins: { totalInCirculation: number; avgPerUser: number };
  revenue: { totalPaise: number; totalPayments: number };
  apiUsage: {
    scores: number;
    tailors: number;
    interviews: number;
    roadmaps: number;
  };
  revenueByDay: Array<{ date: string; revenue: number; count: number }>;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "user" | "admin";
  coins: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface AdminUserDetail extends AdminUser {
  recentTransactions: Array<{
    action: string;
    amount: number;
    balanceAfter: number;
    createdAt: string;
  }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminPayment {
  id: string;
  userEmail: string;
  userName: string;
  planId: string;
  amountInPaise: number;
  coinAmount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export interface AdminScore {
  id: string;
  userEmail: string;
  userName: string;
  jobTitle: string;
  company: string;
  overallScore: number;
  verdict: string;
  createdAt: string;
}

export interface AdminTailor {
  id: string;
  userEmail: string;
  userName: string;
  jobTitle: string;
  company: string;
  atsScore: number;
  keywordCount: number;
  createdAt: string;
}

export interface AdminInterview {
  id: string;
  userEmail: string;
  userName: string;
  role: string;
  difficulty: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
}

export interface AdminRoadmap {
  id: string;
  userEmail: string;
  userName: string;
  targetRole: string;
  experienceLevel: string;
  phaseCount: number;
  createdAt: string;
}

interface AdminState {
  stats: AdminStats | null;
  users: AdminUser[];
  userDetail: AdminUserDetail | null;
  usersPagination: Pagination | null;
  payments: AdminPayment[];
  paymentsPagination: Pagination | null;
  scores: AdminScore[];
  scoresPagination: Pagination | null;
  tailors: AdminTailor[];
  tailorsPagination: Pagination | null;
  interviews: AdminInterview[];
  interviewsPagination: Pagination | null;
  roadmaps: AdminRoadmap[];
  roadmapsPagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  stats: null,
  users: [],
  userDetail: null,
  usersPagination: null,
  payments: [],
  paymentsPagination: null,
  scores: [],
  scoresPagination: null,
  tailors: [],
  tailorsPagination: null,
  interviews: [],
  interviewsPagination: null,
  roadmaps: [],
  roadmapsPagination: null,
  loading: false,
  error: null,
};

// ── Thunks ──────────────────────────────────────────────────────────────────

export const fetchAdminStats = createAsyncThunk(
  "admin/fetchStats",
  async () => {
    const { data } = await api.get("/admin/stats");
    return data.data as AdminStats;
  },
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: string;
      order?: "asc" | "desc";
    } = {},
  ) => {
    const { data } = await api.get("/admin/users", { params });
    return data.data as { items: AdminUser[]; pagination: Pagination };
  },
);

export const fetchAdminUser = createAsyncThunk(
  "admin/fetchUser",
  async (id: string) => {
    const { data } = await api.get(`/admin/users/${id}`);
    return data.data as AdminUserDetail;
  },
);

export const adjustUserCoins = createAsyncThunk(
  "admin/adjustCoins",
  async ({
    id,
    amount,
    reason,
  }: {
    id: string;
    amount: number;
    reason?: string;
  }) => {
    const { data } = await api.post(`/admin/users/${id}/coins`, {
      amount,
      reason,
    });
    return data.data as { id: string; coins: number };
  },
);

export const fetchAdminPayments = createAsyncThunk(
  "admin/fetchPayments",
  async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    } = {},
  ) => {
    const { data } = await api.get("/admin/payments", { params });
    return data.data as { items: AdminPayment[]; pagination: Pagination };
  },
);

export const fetchAdminScores = createAsyncThunk(
  "admin/fetchScores",
  async (params: { page?: number; limit?: number } = {}) => {
    const { data } = await api.get("/admin/scores", { params });
    return data.data as { items: AdminScore[]; pagination: Pagination };
  },
);

export const fetchAdminTailors = createAsyncThunk(
  "admin/fetchTailors",
  async (params: { page?: number; limit?: number } = {}) => {
    const { data } = await api.get("/admin/tailors", { params });
    return data.data as { items: AdminTailor[]; pagination: Pagination };
  },
);

export const fetchAdminInterviews = createAsyncThunk(
  "admin/fetchInterviews",
  async (params: { page?: number; limit?: number } = {}) => {
    const { data } = await api.get("/admin/interviews", { params });
    return data.data as { items: AdminInterview[]; pagination: Pagination };
  },
);

export const fetchAdminRoadmaps = createAsyncThunk(
  "admin/fetchRoadmaps",
  async (params: { page?: number; limit?: number } = {}) => {
    const { data } = await api.get("/admin/roadmaps", { params });
    return data.data as { items: AdminRoadmap[]; pagination: Pagination };
  },
);

export const toggleUserRole = createAsyncThunk(
  "admin/toggleRole",
  async (id: string) => {
    const { data } = await api.post(`/admin/users/${id}/toggle-role`);
    return data.data as { id: string; role: "user" | "admin" };
  },
);

export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async (id: string) => {
    await api.delete(`/admin/users/${id}`);
    return id;
  },
);

export const refundPayment = createAsyncThunk(
  "admin/refundPayment",
  async (id: string) => {
    const { data } = await api.post(`/admin/payments/${id}/refund`);
    return { id, ...(data.data as { refunded: boolean }) };
  },
);

// ── Slice ───────────────────────────────────────────────────────────────────

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
    clearUserDetail(state) {
      state.userDetail = null;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state: AdminState) => {
      state.loading = true;
      state.error = null;
    };

    builder
      // Stats
      .addCase(fetchAdminStats.pending, setLoading)
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      // Users
      .addCase(fetchAdminUsers.pending, setLoading)
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.items;
        state.usersPagination = action.payload.pagination;
      })
      .addCase(fetchAdminUser.pending, setLoading)
      .addCase(fetchAdminUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userDetail = action.payload;
      })
      .addCase(adjustUserCoins.fulfilled, (state, action) => {
        const u = state.users.find((u) => u.id === action.payload.id);
        if (u) u.coins = action.payload.coins;
        if (state.userDetail && state.userDetail.id === action.payload.id) {
          state.userDetail.coins = action.payload.coins;
        }
      })
      // Payments
      .addCase(fetchAdminPayments.pending, setLoading)
      .addCase(fetchAdminPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.items;
        state.paymentsPagination = action.payload.pagination;
      })
      // Scores
      .addCase(fetchAdminScores.pending, setLoading)
      .addCase(fetchAdminScores.fulfilled, (state, action) => {
        state.loading = false;
        state.scores = action.payload.items;
        state.scoresPagination = action.payload.pagination;
      })
      // Tailors
      .addCase(fetchAdminTailors.pending, setLoading)
      .addCase(fetchAdminTailors.fulfilled, (state, action) => {
        state.loading = false;
        state.tailors = action.payload.items;
        state.tailorsPagination = action.payload.pagination;
      })
      // Interviews
      .addCase(fetchAdminInterviews.pending, setLoading)
      .addCase(fetchAdminInterviews.fulfilled, (state, action) => {
        state.loading = false;
        state.interviews = action.payload.items;
        state.interviewsPagination = action.payload.pagination;
      })
      // Roadmaps
      .addCase(fetchAdminRoadmaps.pending, setLoading)
      .addCase(fetchAdminRoadmaps.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps = action.payload.items;
        state.roadmapsPagination = action.payload.pagination;
      })
      // Toggle role
      .addCase(toggleUserRole.fulfilled, (state, action) => {
        const u = state.users.find((u) => u.id === action.payload.id);
        if (u) u.role = action.payload.role;
        if (state.userDetail && state.userDetail.id === action.payload.id) {
          state.userDetail.role = action.payload.role;
        }
      })
      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
        if (state.userDetail && state.userDetail.id === action.payload) {
          state.userDetail = null;
        }
        if (state.usersPagination) {
          state.usersPagination.total = Math.max(0, state.usersPagination.total - 1);
        }
      })
      // Refund payment
      .addCase(refundPayment.fulfilled, (state, action) => {
        const p = state.payments.find((p) => p.id === action.payload.id);
        if (p) p.status = 'refunded';
      })
      // Error catch-all
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          state.error = action.error?.message || "Something went wrong";
        },
      );
  },
});

export const { clearAdminError, clearUserDetail } = adminSlice.actions;
export default adminSlice.reducer;
