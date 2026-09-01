import type {
  User,
  Habit,
  Achievement,
  DailyQuest,
  LeaderboardEntry,
  HabitCategory,
  HabitDifficulty,
  Notification,
  AdminStats,
  AdminUserRow,
  AdminHabitRow,
  AdminAchievementRow,
  AdminQuestRow,
  AdminNotificationRow,
  AdminReflectionRow,
  ReflectionAnalytics,
  AdminCharts,
  XpHistoryEntry,
  HabitHistoryEntry,
  UserStatistics,
  Reflection,
  ReflectionSummary,
  WeeklyReview,
  MonthlyReview,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));
    throw new ApiError(
      error.message || `HTTP error ${response.status}`,
      response.status
    );
  }

  return response.json();
}

export const authApi = {
  verify: (token: string) =>
    apiRequest<User>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};

export const usersApi = {
  getMe: (token: string) => apiRequest<User>("/users/me", {}, token),

  updateProfile: (
    token: string,
    data: { username?: string; photoUrl?: string }
  ) =>
    apiRequest<User>(
      "/users/profile",
      { method: "PATCH", body: JSON.stringify(data) },
      token
    ),

  getByUid: (uid: string) => apiRequest<User>(`/users/${uid}`),
};

export const habitsApi = {
  getAll: (token: string) => apiRequest<Habit[]>("/habits", {}, token),

  getToday: (token: string) => apiRequest<Habit[]>("/habits/today", {}, token),

  getById: (id: string, token: string) =>
    apiRequest<Habit>(`/habits/${id}`, {}, token),

  create: (
    token: string,
    data: {
      title: string;
      description?: string;
      category: HabitCategory;
      activity?: string;
      goalLabel?: string;
      goalValue?: number;
      goalUnit?: string;
      difficulty: HabitDifficulty;
      reminderTime?: string;
    }
  ) =>
    apiRequest<Habit>(
      "/habits",
      { method: "POST", body: JSON.stringify(data) },
      token
    ),

  update: (
    id: string,
    token: string,
    data: {
      title?: string;
      description?: string;
      category?: HabitCategory;
      activity?: string;
      goalLabel?: string;
      goalValue?: number;
      goalUnit?: string;
      difficulty?: HabitDifficulty;
      reminderTime?: string;
    }
  ) =>
    apiRequest<Habit>(
      `/habits/${id}`,
      { method: "PATCH", body: JSON.stringify(data) },
      token
    ),

  delete: (id: string, token: string) =>
    apiRequest<void>(`/habits/${id}`, { method: "DELETE" }, token),

  complete: (id: string, token: string) =>
    apiRequest<Habit>(
      `/habits/${id}/complete`,
      { method: "PATCH" },
      token
    ),
};

export const achievementsApi = {
  getAll: (token: string) =>
    apiRequest<Achievement[]>("/achievements", {}, token),

  getUnlocked: (token: string) =>
    apiRequest<Achievement[]>("/achievements/unlocked", {}, token),

  getProgress: (token: string) =>
    apiRequest<Achievement[]>("/achievements/progress", {}, token),

  getById: (id: string, token: string) =>
    apiRequest<Achievement>(`/achievements/${id}`, {}, token),
};

export const dailyQuestsApi = {
  getToday: (token: string) =>
    apiRequest<DailyQuest[]>("/daily-quests", {}, token),

  getCompleted: (token: string) =>
    apiRequest<DailyQuest[]>("/daily-quests/completed", {}, token),

  getProgress: (token: string) =>
    apiRequest<DailyQuest[]>("/daily-quests/progress", {}, token),

  regenerate: (token: string) =>
    apiRequest<DailyQuest[]>(
      "/daily-quests/regenerate",
      { method: "POST" },
      token
    ),
};

export const leaderboardApi = {
  getAll: (token: string) =>
    apiRequest<LeaderboardEntry[]>("/leaderboard", {}, token),

  getMe: (token: string) =>
    apiRequest<LeaderboardEntry>("/leaderboard/me", {}, token),

  getTop: (limit: number, token: string) =>
    apiRequest<LeaderboardEntry[]>(`/leaderboard/top/${limit}`, {}, token),
};

export const notificationsApi = {
  getAll: (token: string) =>
    apiRequest<Notification[]>("/notifications", {}, token),

  getUnreadCount: (token: string) =>
    apiRequest<{ unreadCount: number }>("/notifications/unread-count", {}, token),

  getById: (id: string, token: string) =>
    apiRequest<Notification>(`/notifications/${id}`, {}, token),

  markAsRead: (id: string, token: string) =>
    apiRequest<Notification>(
      `/notifications/${id}/read`,
      { method: "PATCH" },
      token
    ),

  markAllAsRead: (token: string) =>
    apiRequest<{ message: string }>(
      "/notifications/read-all",
      { method: "PATCH" },
      token
    ),

  delete: (id: string, token: string) =>
    apiRequest<{ message: string }>(
      `/notifications/${id}`,
      { method: "DELETE" },
      token
    ),
};

export const adminApi = {
  getStats: (token: string) =>
    apiRequest<AdminStats>("/admin/stats", {}, token),

  getCharts: (token: string) =>
    apiRequest<AdminCharts>("/admin/charts", {}, token),

  getUsers: (token: string, search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest<AdminUserRow[]>(`/admin/users${params}`, {}, token);
  },

  getHabits: (token: string, search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest<AdminHabitRow[]>(`/admin/habits${params}`, {}, token);
  },

  getAchievements: (token: string) =>
    apiRequest<AdminAchievementRow[]>("/admin/achievements", {}, token),

  getDailyQuests: (token: string) =>
    apiRequest<AdminQuestRow[]>("/admin/daily-quests", {}, token),

  getNotifications: (token: string, search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest<AdminNotificationRow[]>(
      `/admin/notifications${params}`,
      {},
      token
    );
  },

  getReflectionAnalytics: (token: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiRequest<Record<string, any>>("/admin/reflection-analytics", {}, token),
};

export const progressApi = {
  getXpHistory: (token: string) =>
    apiRequest<XpHistoryEntry[]>("/progress/xp-history", {}, token),

  getHabitHistory: (token: string) =>
    apiRequest<HabitHistoryEntry[]>("/progress/habit-history", {}, token),

  getStatistics: (token: string) =>
    apiRequest<UserStatistics>("/progress/statistics", {}, token),

  getReflections: (token: string) =>
    apiRequest<Reflection[]>("/progress/reflections", {}, token),

  getReflectionById: (id: string, token: string) =>
    apiRequest<Reflection>(`/progress/reflections/${id}`, {}, token),

  getReflectionSummary: (token: string) =>
    apiRequest<ReflectionSummary>("/progress/reflections/summary", {}, token),

  getWeeklyReview: (token: string) =>
    apiRequest<WeeklyReview>("/progress/reflections/weekly-review", {}, token),

  getMonthlyReview: (token: string) =>
    apiRequest<MonthlyReview>("/progress/reflections/monthly-review", {}, token),

  saveReflection: (
    token: string,
    data: {
      habitId: string;
      title: string;
      category: string;
      reflection: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proofOfProgress?: Record<string, any>;
      sessionMetadata?: { durationMinutes?: number; startedAt?: string; completedAt?: string };
      proudOf?: string;
      challenged?: string;
      improve?: string;
    }
  ) =>
    apiRequest<Reflection>(
      "/progress/reflections",
      { method: "POST", body: JSON.stringify(data) },
      token
    ),
};

export const adminReflectionsApi = {
  getAll: (token: string, search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest<AdminReflectionRow[]>(`/admin/reflections${params}`, {}, token);
  },
  getAnalytics: (token: string) =>
    apiRequest<ReflectionAnalytics>("/admin/reflection-analytics", {}, token),
};
