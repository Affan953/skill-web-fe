export interface User {
  uid: string;
  username: string;
  email: string;
  photoUrl: string | null;
  role?: "user" | "admin";
  xp: number;
  level: number;
  totalHabits: number;
  currentStreak: number;
  longestStreak: number;
  lastHabitCompletedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
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
  | "Custom";

export type HabitDifficulty = "Easy" | "Medium" | "Hard";

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

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
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
