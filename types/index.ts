export type ProfileVisibility = "PUBLIC" | "PRIVATE";

export interface User {
  uid: string;
  username: string;
  email: string;
  photoUrl: string | null;
  /** Human-friendly display name. Falls back to `username` when unset. */
  displayName?: string;
  /** Optional short, plain-text biography shown on the public profile. */
  bio?: string | null;
  /** Profile visibility. Private profiles mask growth data for other viewers. */
  profileVisibility?: ProfileVisibility;
  role?: "user" | "admin";
  isPremium?: boolean;
  premiumExpiresAt?: string | Date;
  xp: number;
  level: number;
  totalHabits: number;
  currentStreak: number;
  longestStreak: number;
  lastHabitCompletedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UsernameAvailability {
  available: boolean;
  username: string;
}

/**
 * Public-facing growth profile returned by the backend's public profile
 * endpoints. Growth fields are omitted server-side when the profile is
 * private and the viewer is not the owner (isPrivate === true).
 */
export interface PublicProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  isPremium: boolean;
  isPrivate: boolean;
  level?: number;
  xp?: number;
  currentStreak?: number;
  totalHabits?: number;
  totalCompletions?: number;
  achievementsUnlocked?: number;
  achievements?: Achievement[];
  joinedAt?: string | Date | null;
}

/**
 * Privacy-safe search result row (GET /users/search). Growth fields are only
 * present for public profiles.
 */
export interface SearchUserResult {
  uid: string;
  username: string;
  displayName: string;
  photoUrl: string | null;
  isPrivate: boolean;
  level?: number;
  xp?: number;
  currentStreak?: number;
}

/** Payload accepted by PATCH /users/profile. */
export interface UpdateProfileData {
  username?: string;
  displayName?: string;
  bio?: string;
  photoUrl?: string;
  profileVisibility?: ProfileVisibility;
}

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export type PaymentPlan = "PREMIUM";

export interface PaymentRecord {
  orderId: string;
  amount: number;
  status: PaymentStatus;
  paymentType: string | null;
  transactionStatus: string | null;
  processedAt: string | Date | null;
  createdAt: string | Date;
}

export interface CreatePaymentResult {
  orderId: string;
  token: string;
  redirectUrl: string;
  clientKey: string;
  amount: number;
}

export interface PaymentStatusResult {
  orderId: string;
  status: PaymentStatus;
  transactionStatus: string | null;
  amount: number;
  processedAt: string | Date | null;
}

export interface GrowthOverview {
  consistency: number;
  habitsCompleted: number;
  totalHabits: number;
  currentStreak: number;
  trend: "improving" | "declining" | "steady" | null;
  insight: string;
}

export interface AdminPaymentSummary {
  totalRevenue: number;
  premiumUsers: number;
  activeSubscriptions: number;
  totalPayments: number;
  pendingPayments: number;
  failedPayments: number;
  paidPayments: number;
}

export interface AdminPaymentRow {
  orderId: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  paymentType: string | null;
  transactionStatus: string | null;
  createdAt: string | Date | null;
  processedAt: string | Date | null;
}

export interface AdminPaymentDashboard {
  summary: AdminPaymentSummary;
  payments: AdminPaymentRow[];
}

export interface AdminSubscriptionRow {
  id: string;
  userId: string;
  plan: string;
  status: SubscriptionStatus;
  startedAt: string | Date | null;
  expiredAt: string | Date | null;
  createdAt: string | Date | null;
}

export type HabitCategory =
  | "Learning"
  | "Fitness"
  | "Reading"
  | "Meditation"
  | "Coding"
  | "Health"
  | "Productivity"
  | "Finance"
  | "Language"
  | "Custom"
  | "Uncategorized";

export type HabitDifficulty = "Easy" | "Medium" | "Hard";

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  createdAt: string | Date;
}

export interface Habit {
  id: string;
  title: string;
  description: string | null;
  category: HabitCategory;
  activity: string | null;
  goalLabel: string | null;
  goalValue: number | null;
  goalUnit: string | null;
  difficulty: HabitDifficulty;
  xpReward: number;
  reminderTime: string | null;
  isCompleted: boolean;
  streak: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  completedAt: string | Date | null;
}

export type AchievementCategory = "Habit" | "Level" | "XP" | "Streak" | "Special";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt: string | Date | null;
  progress: number;
  target: number;
}

export type DailyQuestCategory = "Habit" | "XP" | "Streak";

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  category: DailyQuestCategory;
  target: number;
  progress: number;
  rewardXP: number;
  completed: boolean;
  completedAt: string | Date | null;
  createdAt: string | Date;
  expiresAt: string | Date;
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  photoURL: string | null;
  level: number;
  xp: number;
  streak: number;
}

export type NotificationType =
  | "FOLLOW"
  | "REACTION"
  | "COMMENT"
  | "MESSAGE"
  | "HABIT_REMINDER"
  | "HABIT_COMPLETED"
  | "DAILY_QUEST_COMPLETED"
  | "ACHIEVEMENT_UNLOCKED"
  | "LEVEL_UP"
  | "STREAK_MILESTONE"
  | "REFLECTION_SAVED"
  | "JOURNEY_SAVED"
  | "WEEKLY_REVIEW"
  | "MONTHLY_REVIEW"
  | "SYSTEM";

/**
 * What a social notification points at. Used by the client to build the
 * "where does this go?" link. Personal-growth notifications have no target.
 */
export type NotificationEntityType =
  | "USER"
  | "GROWTH_ACTIVITY"
  | "COMMENT"
  | "ACHIEVEMENT"
  | "DAILY_QUEST"
  | "CONVERSATION";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  /**
   * Public-safe actor for social notifications. Absent for personal-growth
   * notifications and for actors whose account has been deleted, so the UI
   * falls back to a neutral "Someone" rather than a stale identity.
   */
  actor?: GrowthFeedUser;
  /** Document id of the thing this notification is about, if any. */
  entityId?: string | null;
  entityType?: NotificationEntityType | null;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
  readAt?: string | Date | null;
}

/** One page of the newest-first notification list. */
export interface NotificationPage {
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 32 — direct messaging
//
// The conversation shape is the VIEWER's: `unreadCount` is always the signed-in
// user's own counter, and `otherUser` is the public-safe identity the backend
// resolves. The client never computes either.
// ─────────────────────────────────────────────────────────────────────────────

/** Server-truncated preview of the newest message, for the inbox row. */
export interface MessagePreview {
  text: string;
  senderId: string;
  createdAt: string | Date;
}

export interface Conversation {
  /** Deterministic id: the two uids sorted and joined with `_`. */
  id: string;
  otherUser: GrowthFeedUser;
  /** Null for a conversation where nothing has been sent yet. */
  lastMessage: MessagePreview | null;
  /** The viewer's own unread count. */
  unreadCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/** One page of the newest-first conversation list. */
export interface ConversationPage {
  items: Conversation[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/** One page of a conversation's messages, newest first (as the API returns them). */
export interface MessagePage {
  items: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * A message as the thread renders it.
 *
 * Identical to a server `Message`, plus the one thing a server message cannot
 * express: that the client has drawn it and is waiting for confirmation. The
 * optimistic copy carries a `pending:`-namespaced id, which no server id can
 * ever match, so a pending bubble can be replaced in place and rolled back by
 * id without ever shadowing or duplicating a real message.
 */
export interface ThreadMessage extends Message {
  pending?: boolean;
  /** Correlates the optimistic bubble with the send that created it. */
  clientMessageId?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalHabits: number;
  totalCompletions: number;
  totalXpEarned: number;
  totalAchievementsUnlocked: number;
  totalNotifications: number;
  totalQuestsCompleted: number;
}

export interface AdminCharts {
  weeklyActiveUsers: { day: string; users: number }[];
  userGrowth: { month: string; users: number }[];
  habitCompletionTimeline: { date: string; completions: number }[];
  xpTimeline: { date: string; xp: number }[];
  completionRate: { date: string; rate: number }[];
  categoryDistribution: { name: string; value: number }[];
  xpByLevel: { name: string; value: number }[];
}

export interface AdminUserRow {
  uid: string;
  username: string;
  email: string;
  photoUrl: string | null;
  role: string;
  level: number;
  xp: number;
  currentStreak: number;
  totalHabits: number;
  createdAt: string | Date;
}

export interface AdminHabitRow {
  id: string;
  uid: string;
  ownerName: string;
  title: string;
  category: string;
  difficulty: string;
  xpReward: number;
  streak: number;
  isCompleted: boolean;
  createdAt: string | Date;
}

export interface AdminAchievementRow {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  target: number;
  unlockedCount: number;
}

export interface AdminQuestRow {
  id: string;
  title: string;
  description: string;
  category: string;
  target: number;
  rewardXP: number;
  totalAssigned: number;
  totalCompleted: number;
}

export interface AdminNotificationRow {
  id: string;
  uid: string;
  ownerName: string;
  type: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string | Date;
}

export interface XpHistoryEntry {
  id: string;
  xpGained: number;
  source: string;
  createdAt: string | Date;
  totalXpAfterGain: number;
}

export interface HabitHistoryEntry {
  id: string;
  habitId: string;
  title: string;
  category: string;
  xpEarned: number;
  completedAt: string | Date;
  streakAfterCompletion: number;
}

export interface CategoryStats {
  category: string;
  completionCount: number;
  completionRate: number;
  totalXP: number;
  averagePerWeek: number;
}

export interface UserStatistics {
  xpChartData: { day: string; xp: number }[];
  weeklyActivity: { day: string; completions: number }[];
  categoryStats: CategoryStats[];
  completionTimeline: { date: string; completions: number; xp: number }[];
  dailyXp: { date: string; xp: number }[];
  monthlyXp: { month: string; xp: number }[];
}

export interface Reflection {
  id: string;
  habitId: string;
  title: string;
  category: string;
  reflection: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proofOfProgress?: Record<string, any>;
  sessionMetadata?: {
    durationMinutes?: number;
    startedAt?: string;
    completedAt?: string;
  };
  proudOf?: string;
  challenged?: string;
  improve?: string;
  xpEarned: number;
  streakAfter: number;
  levelAfter: number;
  createdAt: string | Date;
}

export interface ReflectionSummary {
  totalReflections: number;
  weeklyReflections: number;
  categoriesExplored: string[];
  weeklyXpFromReflections: number;
  streakDays: number;
  averageReflectionLength: number;
}

export interface AdminReflectionRow {
  id: string;
  uid: string;
  ownerName: string;
  habitId: string;
  title: string;
  category: string;
  reflection: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proofOfProgress?: Record<string, any>;
  metrics?: Record<string, string>;
  xpEarned: number;
  streakAfter: number;
  levelAfter: number;
  createdAt: string | Date;
}

export interface ReflectionAnalytics {
  totalReflections: number;
  totalProofOfProgress: number;
  mostActiveCategories: { category: string; count: number }[];
  averageReflectionLength: number;
  averageSessionDuration: number;
  completionRate: number;
}

export interface WeeklyReview {
  weekStart: string;
  weekEnd: string;
  habitsCompleted: number;
  xpEarned: number;
  reflectionCount: number;
  bestCategory: string;
  longestStreak: number;
  mostActiveDay: string;
  mostProductiveHour: string;
  personalInsight: string;
  dailyBreakdown: { day: string; completions: number; xp: number }[];
}

export interface MonthlyReview {
  month: string;
  year: number;
  totalHabitsCompleted: number;
  totalXpEarned: number;
  totalReflections: number;
  bestCategory: string;
  longestStreak: number;
  categoryBreakdown: { category: string; count: number; xp: number }[];
  xpByWeek: { week: string; xp: number }[];
  consistencyScore: number;
  growthSummary: string;
}

export interface SessionData {
  habitId: string;
  title: string;
  category: HabitCategory;
  difficulty: HabitDifficulty;
  xpReward: number;
  startedAt: Date;
  completedAt?: Date;
  durationMinutes?: number;
}

/** Whether the current user follows a target user (GET /follows/:userId/status). */
export interface FollowStatusResult {
  isFollowing: boolean;
}

/** Real follower/following counts (GET /follows/:userId/counts). */
export interface FollowCountsResult {
  followersCount: number;
  followingCount: number;
}

/**
 * Public-safe row inside a follower/following list. Identity fields only —
 * growth fields never leak, and `isFollowingByViewer` is computed server-side.
 */
export interface FollowUserResult {
  uid: string;
  username: string;
  displayName: string;
  photoUrl: string | null;
  bio: string | null;
  isPrivate: boolean;
  isFollowingByViewer: boolean;
}

/** Paginated follower/following page (cursor-based). */
export interface FollowListResult {
  items: FollowUserResult[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Result of POST/DELETE /follows/:userId. */

export interface FollowActionResult {
  following: boolean;
  targetUserId: string;
  followersCount: number;
  followingCount: number;
}

/**
 * Type of growth activity surfaced in the feed (GET /feed). These mirror the
 * backend enum — the feed is generated by SkillUp itself, never user-authored.
 */
export type GrowthActivityType =
  | "HABIT_COMPLETED"
  | "STREAK_MILESTONE"
  | "ACHIEVEMENT_UNLOCKED"
  | "DAILY_QUEST_COMPLETED";

/** Public-safe actor inside a feed item — identity fields only. */
export interface GrowthFeedUser {
  uid: string;
  username: string;
  displayName: string;
  photoUrl: string | null;
}

/**
 * Cheer types. Mirrors the backend enum — reactions are a closed set, never
 * free-form. One reaction per (activity, user); sending a new one replaces it.
 */
export type ReactionType = "CELEBRATE" | "ENCOURAGE" | "SUPPORT";

/** Server-aggregated tally per reaction type (always all three keys present). */
export interface GrowthReactionCounts {
  CELEBRATE: number;
  ENCOURAGE: number;
  SUPPORT: number;
}

/**
 * Compact interaction summary attached by the server to every growth feed item
 * and to the shareable activity page. Computed in one batched pass per feed
 * page, so the UI never needs a follow-up request just to render the bar.
 */
export interface GrowthInteraction {
  reactionCounts: GrowthReactionCounts;
  currentUserReaction: ReactionType | null;
  commentCount: number;
}

/** One growth activity row. `metadata` is a render-only snapshot. */
export interface GrowthFeedItem {
  id: string;
  type: GrowthActivityType;
  createdAt: string;
  user: GrowthFeedUser;
  metadata: Record<string, string | number | boolean | null>;
  interaction: GrowthInteraction;
}

/** Shareable single-activity view (GET /growth-activities/:activityId). */
export interface GrowthActivityDetail {
  id: string;
  type: GrowthActivityType;
  entityType: string;
  createdAt: string;
  user: GrowthFeedUser;
  metadata: Record<string, string | number | boolean | null>;
  interaction: GrowthInteraction;
}

/** One support comment (GET/POST /growth-activities/:activityId/comments). */
export interface ActivityComment {
  id: string;
  content: string;
  createdAt: string;
  author: GrowthFeedUser;
  /** True when the authenticated viewer wrote this comment. */
  isOwn: boolean;
}

/** Cursor-paginated comment page (newest-first; cursor is a comment doc ID). */
export interface CommentListResult {
  items: ActivityComment[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Result of GET/POST /growth-activities/:activityId/reactions. */
export interface ReactionMapResult {
  counts: GrowthReactionCounts;
  currentUserReaction: ReactionType | null;
}

/** Result of DELETE /growth-activities/:activityId/reactions. */
export interface ReactionRemoveResult {
  counts: GrowthReactionCounts;
  removed: ReactionType | null;
}

/** Cursor-paginated feed page (mirrors FollowListResult). */
export interface GrowthFeedResult {
  items: GrowthFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── Growth Circles (Phase 34) ──────────────────────────────────────────────

/**
 * Circle access level. PUBLIC circles are discoverable and open to anyone;
 * PRIVATE circles are visible only to their members.
 */
export type CircleVisibility = "PUBLIC" | "PRIVATE";

/** OWNER is assigned once at creation and is never assignable afterwards. */
export type CircleRole = "OWNER" | "ADMIN" | "MEMBER";

/**
 * Public-safe projection of a user attached to a circle. Identical in shape to
 * GrowthFeedUser: no email, role, xp, level or streak ever crosses the wire.
 */
export interface CircleUser {
  uid: string;
  username: string;
  displayName: string;
  photoUrl: string | null;
  bio: string | null;
}

/** Card-level circle projection, used by "My Circles" and Discover. */
export interface GrowthCircle {
  id: string;
  name: string;
  description: string;
  topic: string;
  visibility: CircleVisibility;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  owner: CircleUser;
  /** Resolved server-side; null when the viewer is not a member. */
  viewerRole: CircleRole | null;
}

/** Cursor-paginated circle page. */
export interface CircleListResult {
  items: GrowthCircle[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** A single member row of a circle. */
export interface CircleMember {
  userId: string;
  role: CircleRole;
  joinedAt: string;
  user: CircleUser;
}

/** Cursor-paginated member page (oldest membership first). */
export interface CircleMemberListResult {
  items: CircleMember[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Result of join / leave / add / remove / role change. `memberCount` is the
 * post-action truth read inside the transaction, so the UI never guesses.
 */
export interface CircleMembershipResult {
  circleId: string;
  userId: string;
  role: CircleRole | null;
  isMember: boolean;
  memberCount: number;
}

/** Body of POST /circles. No ownerId: the backend derives it from the token. */
export interface CreateCircleInput {
  name: string;
  description?: string;
  topic: string;
  visibility: CircleVisibility;
}

/** Body of PATCH /circles/:circleId. Only supplied fields are written. */
export interface UpdateCircleInput {
  name?: string;
  description?: string;
  topic?: string;
  visibility?: CircleVisibility;
}

// ─────────────────────────────────────────────────────────────────────────────
// Circle discussion — Phase 37
//
// Mirrors the backend DTOs in `src/growth-circles/dto/circle-message-response.dto.ts`.
// The message only carries a `senderId`; identity is resolved from the circle
// membership the viewer has already loaded, never from the message itself.
// ─────────────────────────────────────────────────────────────────────────────

/** One stored Circle discussion message. */
export interface CircleMessage {
  id: string;
  circleId: string;
  /** UID of the sender (server-derived). Internal identity — never shown as text. */
  senderId: string;
  /** Empty when the message has been moderated away (`isDeleted` true). */
  text: string;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  /** The idempotency key this message was stored under, or null. */
  clientMessageId: string | null;
}

/**
 * One page of `GET /circles/:circleId/messages`, newest first, plus the viewer's
 * unread state so the discussion and its badge are answered in one round trip.
 */
export interface CircleMessagePage {
  items: CircleMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  /** How many messages arrived since this member last opened the discussion. */
  unreadCount: number;
  /** Oldest unread message in this page; null when the boundary is behind it. */
  unreadFromId: string | null;
}

/** Answer to `POST /circles/:circleId/messages/read`. */
export interface CircleReadStateResponse {
  circleId: string;
  userId: string;
  readAt: string;
  unreadCount: number;
}

/**
 * A Circle message as the discussion renders it.
 *
 * Identical to a server `CircleMessage`, plus the one thing a server message
 * cannot express: that the client has drawn it and is waiting for confirmation.
 * The optimistic copy carries a `pending:`-namespaced id, which no server id can
 * ever match, so a pending bubble can be replaced in place and rolled back by id
 * without ever shadowing or duplicating a real message.
 */
export interface ThreadCircleMessage extends CircleMessage {
  pending?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Social safety — Phase 35
//
// These mirror the backend DTOs in `src/social-safety/dto/safety-response.dto.ts`.
//
// Two deliberate asymmetries to keep in mind when wiring UI:
//
// 1. `BlockedUser` carries NO uid. The backend resolves usernames and display
//    names only, so the Unblock action is addressed by username against
//    `DELETE /blocks/by-username/:username`. Do not expect to call the
//    uid-addressed route from a list row — there is nothing to send.
//
// 2. `MyReport.id` is an opaque hash, NOT the Firestore document id. It is safe
//    to use as a React key; the raw document id never leaves the server.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Why a user is being reported. Mirrors `REPORT_REASONS` on the backend.
 *
 * `OTHER` is a first-class choice rather than a fallback, and it is the one
 * reason that must be explained in depth (the backend requires >= 10
 * characters for it, while every other reason only requires a non-empty note).
 */
export type ReportReason =
  | "HARASSMENT"
  | "SPAM"
  | "INAPPROPRIATE_CONTENT"
  | "FAKE_ACCOUNT"
  | "OTHER";

export const REPORT_REASONS: readonly ReportReason[] = [
  "HARASSMENT",
  "SPAM",
  "INAPPROPRIATE_CONTENT",
  "FAKE_ACCOUNT",
  "OTHER",
] as const;

/** Moderation lifecycle. Only `OPEN` is reachable through the public API. */
export type ReportStatus = "OPEN" | "REVIEWED" | "RESOLVED";

/** Human-facing label + one-line explanation for each report reason. */
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  HARASSMENT: "Harassment or bullying",
  SPAM: "Spam or scams",
  INAPPROPRIATE_CONTENT: "Inappropriate content",
  FAKE_ACCOUNT: "Fake account",
  OTHER: "Something else",
};

/** Minimum description length the backend enforces for `OTHER` specifically. */
export const REPORT_OTHER_MIN_DESCRIPTION = 10;

/** Absolute maximum the backend enforces for any report description. */
export const REPORT_DESCRIPTION_MAX_LENGTH = 1000;

/**
 * One row of `GET /blocks`. Identity fields only — growth data never appears,
 * and there is deliberately no `uid`.
 */
export interface BlockedUser {
  username: string;
  displayName: string;
  photoUrl: string | null;
  /** ISO timestamp of when the block was created. */
  blockedAt: string;
}

/** Paginated blocked-users page (cursor-based). */
export interface BlockedUsersListResult {
  items: BlockedUser[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Result of POST /blocks/:userId and DELETE /blocks/by-username/:username.
 *
 * `created` is false when the relationship already existed (block) or did not
 * (unblock); both operations are idempotent, so a retry is not an error.
 */
export interface BlockResponse {
  created: boolean;
  blockedCount: number;
}

/** One row of `GET /reports/mine` — the caller's own reports only. */
export interface MyReport {
  /** Opaque, stable handle. Safe as a list key; not the document id. */
  id: string;
  reportedUsername: string;
  reason: ReportReason;
  created: boolean;
  status: ReportStatus;
  createdAt: string;
}

/** Paginated "reports you filed" page (cursor-based). */
export interface MyReportsListResult {
  items: MyReport[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Body of POST /reports. `reporterId` and `status` are server-owned. */
export interface CreateReportInput {
  reportedUserId: string;
  reason: ReportReason;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI assistant
//
// `AiChatTurn` mirrors the backend `src/ai/ai.service.ts` type. The history is
// server-persisted per user (`aiSessions/{uid}`), so the client only ever sends
// the single new user turn plus an optional page context; the backend appends
// it to the stored session and returns the full capped history.
export interface AiChatTurn {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/**
 * One conversation, as ChatGPT-style history. Sessions live per user in
 * `aiSessions/{uid}/chats/{id}`; the client only ever sends the single new
 * user turn plus an optional page context and a `sessionId` when continuing
 * an existing conversation.
 */
export interface AiChatSession {
  id: string;
  title: string;
  messages: AiChatTurn[];
  createdAt: string;
  updatedAt: string;
}
