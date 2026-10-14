import type {
  User,
  PublicProfile,
  SearchUserResult,
  UsernameAvailability,
  UpdateProfileData,
  Habit,
  CustomCategory,
  Achievement,
  DailyQuest,
  LeaderboardEntry,
  HabitCategory,
  HabitDifficulty,
  Notification,
  NotificationPage,
  Conversation,
  ConversationPage,
  Message,
  MessagePage,
  CircleListResult,
  CircleMemberListResult,
  CircleMembershipResult,
  CircleMessage,
  CircleMessagePage,
  CircleReadStateResponse,
  CircleRole,
  CreateCircleInput,
  GrowthCircle,
  UpdateCircleInput,
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
  CreatePaymentResult,
  PaymentStatusResult,
  PaymentRecord,
  GrowthOverview,
  AdminPaymentDashboard,
  AdminSubscriptionRow,
  FollowStatusResult,
  FollowCountsResult,
  FollowListResult,
  FollowActionResult,
  GrowthFeedResult,
  GrowthActivityDetail,
  ActivityComment,
  CommentListResult,
  ReactionType,
  ReactionMapResult,
  ReactionRemoveResult,
  BlockResponse,
  BlockedUsersListResult,
  MyReport,
  MyReportsListResult,
  CreateReportInput,
  AiChatTurn,
  AiChatSession,
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

export function getUserFacingError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.message) {
      case "USERNAME_TAKEN":
        return "That username is already taken. Try another one.";
      case "INVALID_USERNAME":
        return "That username isn\u2019t valid. Use 3\u201330 lowercase letters, numbers, underscores or dots.";
      case "INVALID_PROFILE_DATA":
        return "Some profile details couldn\u2019t be saved. Please check the fields and try again.";
      case "PROFILE_NOT_FOUND":
        return "This profile could not be found. It may have been removed.";
      case "SELF_FOLLOW_NOT_ALLOWED":
        return "You can\u2019t follow yourself.";
      case "USER_NOT_FOUND":
        return "This person could not be found. They may have been removed.";
      case "ALREADY_FOLLOWING":
        return "You\u2019re already following this person.";
      case "NOT_FOLLOWING":
        return "You\u2019re not following this person.";
      case "ACTIVITY_NOT_FOUND":
        return "This activity could not be found. It may have been removed.";
      case "INVALID_REACTION_TYPE":
        return "That reaction isn\u2019t valid.";
      case "NO_REACTION":
        return "You haven\u2019t reacted to this activity.";
      case "COMMENT_EMPTY":
        return "Write something before posting your comment.";
      case "COMMENT_TOO_LONG":
        return "Comments can be at most 500 characters.";
      case "COMMENT_NOT_FOUND":
        return "This comment could not be found. It may have been deleted.";
      case "NOTIFICATION_NOT_FOUND":
        return "This notification could not be found. It may have been deleted.";
      // ── Phase 32 direct messaging ──
      case "CONVERSATION_NOT_FOUND":
        return "This conversation could not be found.";
      case "CANNOT_MESSAGE_SELF":
        return "You can't start a conversation with yourself.";
      case "INVALID_MESSAGE":
        return "Please write a message before sending.";
      case "MESSAGE_TOO_LONG":
        return "That message is too long. Please shorten it a little.";
      // ── AI assistant ──
      case "EMPTY_MESSAGE":
        return "Write something before sending.";
      case "AI_RATE_LIMITED":
        return "You\u2019ve reached this hour\u2019s message limit. Come back in a bit.";
      case "AI_NOT_CONFIGURED":
        return "The assistant isn\u2019t set up yet.";
      case "AI_UNAVAILABLE":
      case "AI_UPSTREAM_ERROR":
      case "AI_EMPTY_RESPONSE":
        return "The assistant couldn\u2019t respond right now. Please try again.";
      // ── Phase 35 social safety ──
      //
      // USER_BLOCKED deliberately has no wording that distinguishes the two
      // sides. The backend returns the same code whether the viewer blocked the
      // target or was blocked by them, and the copy must not reintroduce the
      // distinction the status code was designed to remove.
      case "USER_BLOCKED":
        return "You can’t do that while a block is in place.";
      case "INVALID_BLOCK_TARGET":
        return "That person couldn’t be identified. Please try again.";
      case "BLOCK_SELF_NOT_ALLOWED":
        return "You can’t block yourself.";
      case "USER_BLOCK_NOT_FOUND":
        return "That block couldn’t be found. It may already be lifted.";
      case "INVALID_REPORT_TARGET":
        return "That person couldn’t be identified. Please try again.";
      case "REPORT_SELF_NOT_ALLOWED":
        return "You can’t report yourself.";
      case "REPORT_DESCRIPTION_REQUIRED":
        return "Please describe what happened before submitting.";
      case "REPORT_ALREADY_EXISTS":
        return "You’ve already reported this person for that reason.";
      case "CIRCLE_NOT_JOINABLE":
        return "This circle can’t be joined.";
      // ── Phase 37 circle discussion ──
      //
      // CIRCLE_NOT_FOUND keeps the same privacy-neutral tone as CONVERSATION_NOT_FOUND:
      // one code for "does not exist" and "you are not a member", so the copy must not
      // reintroduce the distinction the backend deliberately removed.
      case "CIRCLE_NOT_FOUND":
        return "This discussion could not be found.";
      case "CIRCLE_PERMISSION_DENIED":
        return "You’d need to be a circle moderator to do that.";
      case "CIRCLE_MESSAGE_NOT_FOUND":
        return "This message could not be found.";
      case "INVALID_CIRCLE_MESSAGE":
        return "Please write a message before sending.";
      case "CIRCLE_MESSAGE_TOO_LONG":
        return "That message is too long. Please shorten it a little.";
      default:
        break;
    }
    if (error.status === 401 || error.status === 403) {
      return "Your session has expired. Please sign in again.";
    }
    if (error.status === 404) {
      return "This profile could not be found. It may have been removed.";
    }
  }
  if (error instanceof Error && error.message === "Not authenticated") {
    return "Your session has expired. Please sign in again.";
  }
  if (
    error instanceof TypeError ||
    (error instanceof Error && /failed to fetch|network/i.test(error.message))
  ) {
    return "Network error. Please check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
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

/**
 * Variant for endpoints that answer with an empty body (204 / bodyless 200), so
 * we never try to parse JSON and blow up on a successful request.
 */
async function apiRequestNoContent(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));
    throw new ApiError(
      error.message || `HTTP error ${response.status}`,
      response.status
    );
  }
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

  updateProfile: (token: string, data: UpdateProfileData) =>
    apiRequest<User>(
      "/users/profile",
      { method: "PATCH", body: JSON.stringify(data) },
      token
    ),

  checkUsernameAvailability: (username: string, token: string) =>
    apiRequest<UsernameAvailability>(
      `/users/me/username-available?username=${encodeURIComponent(username)}`,
      {},
      token
    ),

  searchUsers: (query: string, token: string) =>
    apiRequest<SearchUserResult[]>(
      `/users/search?q=${encodeURIComponent(query)}`,
      {},
      token
    ),

  getPublicProfileByUsername: (username: string, token: string) =>
    apiRequest<PublicProfile>(
      `/users/username/${encodeURIComponent(username)}`,
      {},
      token
    ),

  getPublicProfileByUid: (uid: string, token: string) =>
    apiRequest<PublicProfile>(`/users/${encodeURIComponent(uid)}`, {}, token),
};

function followsListPath(
  userId: string,
  kind: "followers" | "following",
  cursor?: string,
  limit?: number
): string {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return `/follows/${encodeURIComponent(userId)}/${kind}${
    qs ? `?${qs}` : ""
  }`;
}

export const followsApi = {
  followUser: (userId: string, token: string) =>
    apiRequest<FollowActionResult>(
      `/follows/${encodeURIComponent(userId)}`,
      { method: "POST" },
      token
    ),

  unfollowUser: (userId: string, token: string) =>
    apiRequest<FollowActionResult>(
      `/follows/${encodeURIComponent(userId)}`,
      { method: "DELETE" },
      token
    ),

  getFollowStatus: (userId: string, token: string) =>
    apiRequest<FollowStatusResult>(
      `/follows/${encodeURIComponent(userId)}/status`,
      {},
      token
    ),

  getCounts: (userId: string, token: string) =>
    apiRequest<FollowCountsResult>(
      `/follows/${encodeURIComponent(userId)}/counts`,
      {},
      token
    ),

  getFollowers: (
    userId: string,
    token: string,
    cursor?: string,
    limit?: number
  ) =>
    apiRequest<FollowListResult>(
      followsListPath(userId, "followers", cursor, limit),
      {},
      token
    ),

  getFollowing: (
    userId: string,
    token: string,
    cursor?: string,
    limit?: number
  ) =>
    apiRequest<FollowListResult>(
      followsListPath(userId, "following", cursor, limit),
      {},
      token
    ),
};

/**
 * Phase 35 social safety.
 *
 * Addressing notes that are easy to get wrong:
 *
 *  - `blockUser` takes a uid because the caller legitimately holds one (the
 *    viewer is looking at a profile).
 *  - `unblockUser` takes a USERNAME, not a uid. `GET /blocks` returns usernames
 *    and display names with no uid, so a list row has nothing else to send. The
 *    backend resolves the username through the `usernames` claim collection and
 *    still deletes the same deterministic block document, so this is an
 *    addressing choice rather than a second write path.
 *
 * Both block endpoints are idempotent; `created` in the response reports
 * whether anything actually changed.
 */
export const safetyApi = {
  blockUser: (userId: string, token: string) =>
    apiRequest<BlockResponse>(
      `/blocks/${encodeURIComponent(userId)}`,
      { method: "POST" },
      token
    ),

  /** Unblock by the blocked user's public username. */
  unblockUser: (username: string, token: string) =>
    apiRequest<BlockResponse>(
      `/blocks/by-username/${encodeURIComponent(username)}`,
      { method: "DELETE" },
      token
    ),

  getBlockedUsers: (token: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (typeof limit === "number") params.set("limit", String(limit));
    const qs = params.toString();
    return apiRequest<BlockedUsersListResult>(
      `/blocks${qs ? `?${qs}` : ""}`,
      {},
      token
    );
  },

  /**
   * File a report. The backend rejects any extra field (`reporterId`,
   * `status`, …) via the global `forbidNonWhitelisted` pipe, so this sends
   * exactly the three writable keys.
   */
  createReport: (input: CreateReportInput, token: string) =>
    apiRequest<MyReport>(
      "/reports",
      { method: "POST", body: JSON.stringify(input) },
      token
    ),

  getMyReports: (token: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (typeof limit === "number") params.set("limit", String(limit));
    const qs = params.toString();
    return apiRequest<MyReportsListResult>(
      `/reports/mine${qs ? `?${qs}` : ""}`,
      {},
      token
    );
  },
};

export const feedApi = {
  /**
   * Growth feed for the authenticated user: real activities generated by
   * SkillUp (habit completions, streak milestones, achievement unlocks,
   * daily quest completions) from the viewer plus their followed users.
   */
  getFeed: (token: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (typeof limit === "number") params.set("limit", String(limit));
    const qs = params.toString();
    return apiRequest<GrowthFeedResult>(`/feed${qs ? `?${qs}` : ""}`, {}, token);
  },
};

// ─── Growth Circles (Phase 34) ─────────────────────────────────────────────

function circlePath(circleId: string, suffix = ""): string {
  return `/circles/${encodeURIComponent(circleId)}${suffix}`;
}

function circleMemberPath(circleId: string, userId: string, suffix = ""): string {
  return `${circlePath(
    circleId,
    `/members/${encodeURIComponent(userId)}`
  )}${suffix}`;
}

/** Shared query-string builder for the cursor-paginated circle endpoints. */
function circleListQuery(options: {
  cursor?: string;
  limit?: number;
  topic?: string;
  search?: string;
}): string {
  const params = new URLSearchParams();
  if (options.cursor) params.set("cursor", options.cursor);
  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }
  if (options.topic) params.set("topic", options.topic);
  if (options.search) params.set("search", options.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Growth Circles.
 *
 * Every call carries the bearer token, and the acting user is always derived
 * from it server-side — there is no parameter here that says who is acting.
 * `topic` and `search` are sent as query params so filtering happens in
 * Firestore, not in the browser.
 */
export const circlesApi = {
  /** Circles the viewer belongs to, newest membership first. */
  getMyCircles: (token: string, cursor?: string, limit?: number) =>
    apiRequest<CircleListResult>(
      `/circles${circleListQuery({ cursor, limit })}`,
      {},
      token
    ),

  /** Discoverable PUBLIC circles, optionally filtered by topic / name prefix. */
  discoverCircles: (
    token: string,
    options: { topic?: string; search?: string; cursor?: string; limit?: number } = {}
  ) =>
    apiRequest<CircleListResult>(
      `/circles/discover${circleListQuery(options)}`,
      {},
      token
    ),

  /** A circle's detail. A private circle 404s for non-members, server-side. */
  getCircle: (circleId: string, token: string) =>
    apiRequest<GrowthCircle>(circlePath(circleId), {}, token),

  /** Circle members. Open for public circles, members-only for private ones. */
  getCircleMembers: (
    circleId: string,
    token: string,
    cursor?: string,
    limit?: number
  ) =>
    apiRequest<CircleMemberListResult>(
      `${circlePath(circleId, "/members")}${circleListQuery({ cursor, limit })}`,
      {},
      token
    ),

  /** Creates a circle; the creator becomes OWNER server-side. */
  createCircle: (input: CreateCircleInput, token: string) =>
    apiRequest<GrowthCircle>("/circles", { method: "POST", body: JSON.stringify(input) }, token),

  /** Partial edit of the caller's own circle fields (owner/admin only). */
  updateCircle: (
    circleId: string,
    input: UpdateCircleInput,
    token: string
  ) =>
    apiRequest<GrowthCircle>(
      circlePath(circleId),
      { method: "PATCH", body: JSON.stringify(input) },
      token
    ),

  /** Joins a public circle. Idempotent server-side. */
  joinCircle: (circleId: string, token: string) =>
    apiRequest<CircleMembershipResult>(
      circlePath(circleId, "/join"),
      { method: "POST" },
      token
    ),

  /** Leaves a circle. The owner cannot leave. */
  leaveCircle: (circleId: string, token: string) =>
    apiRequest<CircleMembershipResult>(
      circlePath(circleId, "/leave"),
      { method: "POST" },
      token
    ),

  /** Adds a known user directly — how private circles gain members. */
  addCircleMember: (circleId: string, userId: string, token: string) =>
    apiRequest<CircleMembershipResult>(
      circlePath(circleId, "/members"),
      { method: "POST", body: JSON.stringify({ userId }) },
      token
    ),

  /** Removes a member. Owner may remove admin/member; admin only member. */
  removeCircleMember: (
    circleId: string,
    userId: string,
    token: string
  ) =>
    apiRequest<CircleMembershipResult>(
      circleMemberPath(circleId, userId),
      { method: "DELETE" },
      token
    ),

  /** Sets a member's role to ADMIN or MEMBER. OWNER is not assignable. */
  setCircleMemberRole: (
    circleId: string,
    userId: string,
    role: CircleRole,
    token: string
  ) =>
    apiRequest<CircleMembershipResult>(
      circleMemberPath(circleId, userId, "/role"),
      { method: "PATCH", body: JSON.stringify({ role }) },
      token
    ),

  // ─── Circle discussion (Phase 37) ─────────────────────────────────────────
  //
  // The actor is the token's owner, never a body field: no `senderId`, user id or
  // role crosses the wire. `clientMessageId` is the only client-supplied value on
  // a send, and it carries no authority — it only selects which document id is
  // written, so a retry collapses onto the message that already exists.

  /** Newest-first cursor page of a circle's discussion, plus the viewer's unread state. */
  getCircleMessages: (
    circleId: string,
    token: string,
    cursor?: string,
    limit?: number
  ) =>
    apiRequest<CircleMessagePage>(
      `${circlePath(circleId, "/messages")}${circleListQuery({ cursor, limit })}`,
      {},
      token
    ),

  /** Posts a message. `clientMessageId` makes the send idempotent. */
  sendCircleMessage: (
    circleId: string,
    token: string,
    text: string,
    clientMessageId?: string
  ) =>
    apiRequest<CircleMessage>(
      circlePath(circleId, "/messages"),
      {
        method: "POST",
        body: JSON.stringify(
          clientMessageId ? { text, clientMessageId } : { text }
        ),
      },
      token
    ),

  /** Marks the CALLER's own discussion read. Never affects anyone else. */
  markCircleRead: (circleId: string, token: string) =>
    apiRequest<CircleReadStateResponse>(
      circlePath(circleId, "/messages/read"),
      { method: "POST" },
      token
    ),

  /** Moderates a message out of the discussion (OWNER/ADMIN only). Soft delete. */
  deleteCircleMessage: (circleId: string, messageId: string, token: string) =>
    apiRequestNoContent(
      circlePath(circleId, `/messages/${encodeURIComponent(messageId)}`),
      { method: "DELETE" },
      token
    ),
};

function activityPath(activityId: string, suffix = ""): string {
  return `/growth-activities/${encodeURIComponent(activityId)}${suffix}`;
}

function commentsPath(
  activityId: string,
  cursor?: string,
  limit?: number
): string {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (typeof limit === "number") params.set("limit", String(limit));
  const qs = params.toString();
  return `${activityPath(activityId, "/comments")}${qs ? `?${qs}` : ""}`;
}

/**
 * Social interaction layer for growth activities: cheer reactions, short support
 * comments and the shareable activity view. The acting user is always derived
 * from the bearer token server-side, so no user id is ever sent from the client.
 */
export const activityApi = {
  /** Shareable single-activity view (privacy-gated server-side). */
  getActivity: (activityId: string, token: string) =>
    apiRequest<GrowthActivityDetail>(activityPath(activityId), {}, token),

  getReactions: (activityId: string, token: string) =>
    apiRequest<ReactionMapResult>(
      activityPath(activityId, "/reactions"),
      {},
      token
    ),

  /** Adds or changes the viewer's reaction (idempotent upsert). */
  setReaction: (activityId: string, token: string, type: ReactionType) =>
    apiRequest<ReactionMapResult>(
      activityPath(activityId, "/reactions"),
      { method: "POST", body: JSON.stringify({ type }) },
      token
    ),

  removeReaction: (activityId: string, token: string) =>
    apiRequest<ReactionRemoveResult>(
      activityPath(activityId, "/reactions"),
      { method: "DELETE" },
      token
    ),

  getComments: (
    activityId: string,
    token: string,
    cursor?: string,
    limit?: number
  ) => apiRequest<CommentListResult>(commentsPath(activityId, cursor, limit), {}, token),

  createComment: (activityId: string, token: string, content: string) =>
    apiRequest<ActivityComment>(
      activityPath(activityId, "/comments"),
      { method: "POST", body: JSON.stringify({ content }) },
      token
    ),

  deleteComment: (activityId: string, commentId: string, token: string) =>
    apiRequestNoContent(
      `${activityPath(activityId, "/comments")}/${encodeURIComponent(commentId)}`,
      { method: "DELETE" },
      token
    ),
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

export const customCategoriesApi = {
  getAll: (token: string) =>
    apiRequest<CustomCategory[]>("/custom-categories", {}, token),

  create: (token: string, data: { name: string; icon: string }) =>
    apiRequest<CustomCategory>(
      "/custom-categories",
      { method: "POST", body: JSON.stringify(data) },
      token
    ),

  remove: (id: string, token: string) =>
    apiRequest<{ message: string }>(
      `/custom-categories/${id}`,
      { method: "DELETE" },
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
  /**
   * Newest-first cursor page. `cursor` is the opaque `nextCursor` from the
   * previous page; omit it for the first page.
   */
  getAll: (token: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit != null) params.set("limit", String(limit));
    const qs = params.toString();
    return apiRequest<NotificationPage>(
      `/notifications${qs ? `?${qs}` : ""}`,
      {},
      token
    );
  },

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

/**
 * Phase 32 direct messaging.
 *
 * Note what is never sent from the browser: the acting user, the sender, the
 * recipient, and timestamps. `GET /conversations` takes no userId because the
 * inbox is the token's own; `createConversation` sends only the TARGET uid; and
 * `sendMessage` sends only the text plus an optional idempotency key. The
 * backend derives everything else, so there is no request shape that could
 * impersonate another participant.
 */
export const conversationsApi = {
  /** Newest-first cursor page of the viewer's own conversations. */
  list: (token: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit != null) params.set("limit", String(limit));
    const qs = params.toString();
    return apiRequest<ConversationPage>(
      `/conversations${qs ? `?${qs}` : ""}`,
      {},
      token
    );
  },

  /** Get-or-create: the backend returns the existing conversation if there is one. */
  create: (token: string, targetUserId: string) =>
    apiRequest<Conversation>(
      "/conversations",
      { method: "POST", body: JSON.stringify({ userId: targetUserId }) },
      token
    ),

  get: (conversationId: string, token: string) =>
    apiRequest<Conversation>(
      `/conversations/${encodeURIComponent(conversationId)}`,
      {},
      token
    ),

  /** Newest-first cursor page. Later pages are OLDER messages. */
  listMessages: (
    conversationId: string,
    token: string,
    cursor?: string,
    limit?: number
  ) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit != null) params.set("limit", String(limit));
    const qs = params.toString();
    return apiRequest<MessagePage>(
      `/conversations/${encodeURIComponent(conversationId)}/messages${
        qs ? `?${qs}` : ""
      }`,
      {},
      token
    );
  },

  /**
   * `clientMessageId` makes the send idempotent, which is what protects against
   * a network-level retry (the disabled send button only covers double-clicks).
   * It is a plain client-generated key and grants no authority.
   */
  sendMessage: (
    conversationId: string,
    token: string,
    text: string,
    clientMessageId?: string
  ) =>
    apiRequest<Message>(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify(
          clientMessageId ? { text, clientMessageId } : { text }
        ),
      },
      token
    ),

  markRead: (conversationId: string, token: string) =>
    apiRequest<Conversation>(
      `/conversations/${encodeURIComponent(conversationId)}/read`,
      { method: "PATCH" },
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

  getPayments: (token: string, search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest<AdminPaymentDashboard>(
      `/admin/payments${params}`,
      {},
      token
    );
  },

  getSubscriptions: (
    token: string,
    status?: string,
    search?: string
  ) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    if (search) params.set("search", search);
    const qs = params.toString();
    return apiRequest<AdminSubscriptionRow[]>(
      `/admin/subscriptions${qs ? `?${qs}` : ""}`,
      {},
      token
    );
  },
};

export const paymentsApi = {
  create: (token: string, plan: string) =>
    apiRequest<CreatePaymentResult>(
      "/payments/midtrans/create",
      { method: "POST", body: JSON.stringify({ plan }) },
      token
    ),

  getStatus: (token: string, orderId: string) =>
    apiRequest<PaymentStatusResult>(`/payments/status/${orderId}`, {}, token),

  getHistory: (token: string) =>
    apiRequest<PaymentRecord[]>("/payments/history", {}, token),
};

export const premiumApi = {
  getGrowthOverview: (token: string) =>
    apiRequest<GrowthOverview>("/premium/growth-overview", {}, token),
};

/**
 * The floating AI assistant.
 *
 * History lives on the server as per-user conversations (`aiSessions/{uid}`),
 * so `chat` posts only the new turn, the optional page context and a
 * `sessionId` when continuing — the client never posts a transcript it could
 * tamper with.
 */
export const aiApi = {
  getSessions: (token: string) =>
    apiRequest<{ items: AiChatSession[] }>("/ai/sessions", {}, token),

  getSession: (token: string, sessionId: string) =>
    apiRequest<AiChatSession>(`/ai/sessions/${sessionId}`, {}, token),

  chat: (token: string, content: string, context?: string, sessionId?: string) =>
    apiRequest<{ sessionId: string; title: string; reply: string; messages: AiChatTurn[] }>(
      "/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({ content, context, sessionId }),
      },
      token
    ),

  /**
   * Streaming variant of `chat`. POSTs and reads the Server-Sent Events body,
   * calling `onDelta` for each fragment and resolving with the final transcript
   * once the server emits its `{ done }` frame. The server is only a transport:
   * it persists the full reply itself, so an aborted stream simply means the
   * partial text was never stored.
   */
  chatStream: async (
    token: string,
    content: string,
    options: {
      context?: string;
      sessionId?: string;
      signal?: AbortSignal;
      onDelta: (delta: string) => void;
    }
  ): Promise<{ sessionId: string; title: string; reply: string; messages: AiChatTurn[] }> => {
    const response = await fetch(`${API_URL}/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content,
        context: options.context,
        sessionId: options.sessionId,
      }),
      signal: options.signal,
    });

    if (!response.ok || !response.body) {
      const error = await response
        .json()
        .catch(() => ({ message: `HTTP error ${response.status}` }));
      throw new ApiError(
        error.message || `HTTP error ${response.status}`,
        response.status
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let final: {
      sessionId: string;
      title: string;
      reply: string;
      messages: AiChatTurn[];
    } | null = null;

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");

          const line = frame.split("\n").find((part) => part.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;

          let event: {
            delta?: string;
            done?: boolean;
            error?: string;
            sessionId?: string;
            title?: string;
            reply?: string;
            messages?: AiChatTurn[];
          };
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }

          if (event.error) throw new ApiError(event.error, 502);
          if (event.delta) options.onDelta(event.delta);
          if (event.done && event.sessionId && event.messages) {
            final = {
              sessionId: event.sessionId,
              title: event.title ?? "",
              reply:
                event.reply ??
                event.messages[event.messages.length - 1]?.content ??
                "",
              messages: event.messages,
            };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!final) throw new ApiError("AI_EMPTY_RESPONSE", 502);
    return final;
  },

  deleteSession: (token: string, sessionId: string) =>
    apiRequestNoContent(`/ai/sessions/${sessionId}`, { method: "DELETE" }, token),

  deleteAllSessions: (token: string) =>
    apiRequestNoContent("/ai/sessions", { method: "DELETE" }, token),
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
