"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Flame,
  Flag,
  Loader2,
  Lock,
  RotateCcw,
  ShieldOff,
  Trophy,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { usePublicProfileByUsername } from "@/hooks/useProfile";
import { useBlockUser, useReportUser } from "@/hooks/useSafety";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFacingError } from "@/lib/api";
import { levelSpan, xpIntoLevel, xpRemaining, levelPercent } from "@/lib/xp";
import { AchievementGlyph } from "@/lib/iconMapper";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/follow/FollowButton";
import FollowCountsStats from "@/components/follow/FollowCountsStats";
import { MessageButton } from "@/components/messaging/MessageButton";
import ReportUserDialog from "@/components/safety/ReportUserDialog";

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ProfileSkeleton() {
  return (
    <div className="flex-1 animate-pulse space-y-6 px-6 py-8">
      <div className="h-5 w-40 rounded bg-slate-100" />
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="h-24 w-24 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 rounded bg-slate-100" />
            <div className="h-4 w-32 rounded bg-slate-100" />
            <div className="h-3 w-64 rounded bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/10">
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{title}</p>
    </div>
  );
}

function ProfileContent({ username }: { username: string }) {
  const { user: currentUser } = useAuth();
  const { data: profile, isLoading, isError, refetch } =
    usePublicProfileByUsername(username);
  const reportUser = useReportUser();
  const blockUser = useBlockUser();

  // Report state is reset by remounting the dialog rather than by an effect:
  // the dialog is conditionally rendered, so closing it discards the draft and
  // the next person the viewer opens starts from a clean form.
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Blocking is confirmed in place instead of in a dialog: it is reversible from
  // Settings, and a second modal to reverse a modal would be heavy-handed.
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockNotice, setBlockNotice] = useState<string | null>(null);

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-white p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-red-400">
            Profile “@{username}” could not be found.
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const xpNeeded = levelSpan(profile.level ?? 1);
  const xpInto = xpIntoLevel(profile.level ?? 1, profile.xp ?? 0);
  const xpLeft = xpRemaining(profile.level ?? 1, profile.xp ?? 0);
  const xpProgress = levelPercent(profile.level ?? 1, profile.xp ?? 0);
  const isOwn = currentUser?.uid === profile.uid;

  // Defined here rather than above the early returns so `profile` is already
  // narrowed to non-nullable — the state hooks it writes to must stay above the
  // returns, but this closure does not.
  const runBlock = async () => {
    setBlockError(null);
    try {
      const result = await blockUser.mutateAsync(profile.uid);
      setConfirmBlock(false);
      setBlockNotice(
        result.created
          ? `@${profile.username} has been blocked. You can undo this in Settings → Privacy.`
          : `@${profile.username} was already blocked.`
      );
    } catch (err) {
      setBlockError(getUserFacingError(err));
    }
  };

  return (
    <div className="flex-1 px-6 py-8">
      <Link
        href="/discover"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Discover
      </Link>

      {/* Profile header */}
      <section className="mb-8">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative flex-shrink-0">
              <Avatar
                name={profile.displayName || profile.username}
                src={profile.photoUrl}
                size={96}
                className="h-24 w-24 ring-4 ring-[#2563EB]/30"
              />
              {!profile.isPrivate && typeof profile.level === "number" && (
                <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1E293B] bg-[#2563EB]">
                  <span className="text-[10px] font-bold text-white">
                    {profile.level}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                <h1 className="text-2xl font-bold text-slate-900">
                  {profile.displayName}
                </h1>
                {profile.isPrivate && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    <Lock className="h-3 w-3" />
                    Private
                  </span>
                )}
                {profile.isPremium && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">
                    <Trophy className="h-3 w-3" />
                    Premium
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>
              {profile.bio && (
                <p className="mt-3 max-w-md text-sm text-slate-600">
                  {profile.bio}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-400">
                Member since {formatDate(profile.joinedAt)}
              </p>
              <div className="mt-3">
                <FollowCountsStats userId={profile.uid} />
              </div>
            </div>

            {!isOwn && (
              <div className="flex flex-col items-center gap-2 sm:items-stretch">
                <FollowButton
                  userId={profile.uid}
                  displayName={profile.displayName || profile.username}
                />
                {/* Message is a secondary action, so it sits below the primary
                    Follow button and does not compete with it. Nothing renders
                    on your own profile. */}
                <MessageButton
                  userId={profile.uid}
                  displayName={profile.displayName || profile.username}
                />
                {/* Reporting is a last resort, deliberately not styled as a
                    peer of Follow/Message: it is reachable but does not invite
                    itself. */}
                <button
                  type="button"
                  onClick={() => {
                    setReportSent(false);
                    setReportOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-700"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Report user
                </button>
                {confirmBlock ? (
                  <div
                    role="group"
                    aria-label={`Confirm blocking @${profile.username}`}
                    className="rounded-lg border border-red-500/30 bg-red-50/50 px-3 py-2 text-left"
                  >
                    <p className="mb-2 text-[11px] leading-relaxed text-slate-600">
                      Unfollow them, and stop both of you from messaging,
                      commenting or seeing each other in the feed. They won&apos;t
                      be told.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={runBlock}
                        disabled={blockUser.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                      >
                        {blockUser.isPending && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        Block
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmBlock(false)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBlockError(null);
                      setBlockNotice(null);
                      setConfirmBlock(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-red-500"
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    Block
                  </button>
                )}
              </div>
            )}

            {!isOwn && (blockError || blockNotice) && (
              <p
                role={blockError ? "alert" : "status"}
                className={`mt-3 text-xs ${
                  blockError ? "text-red-500" : "text-emerald-600"
                }`}
              >
                {blockError ?? blockNotice}
              </p>
            )}
          </div>
        </div>
      </section>

      {profile.isPrivate ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            This profile is private
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Growth data (level, XP, habits and achievements) is only visible to
            the owner.
          </p>
        </section>
      ) : (
        <>
          {/* XP progress */}
          <section className="mb-8">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  Level {profile.level}
                </span>
                <span className="text-xs text-slate-500">
                  {xpInto.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={xpProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="XP progress"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-slate-400">
                {xpProgress}% — {xpLeft.toLocaleString()} XP to Level{" "}
                {(profile.level ?? 1) + 1}
              </p>
            </div>
          </section>

          {/* Growth stats */}
          <section className="mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                icon={<Trophy className="h-5 w-5 text-[#2563EB]" />}
                title="Current Level"
                value={profile.level ?? 0}
              />
              <StatCard
                icon={<Zap className="h-5 w-5 text-amber-500" />}
                title="Total XP"
                value={(profile.xp ?? 0).toLocaleString()}
              />
              <StatCard
                icon={<Flame className="h-5 w-5 text-orange-500" />}
                title="Day Streak"
                value={profile.currentStreak ?? 0}
              />
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                title="Habits Tracked"
                value={profile.totalHabits ?? 0}
              />
              <StatCard
                icon={<Award className="h-5 w-5 text-purple-500" />}
                title="Habit Sessions"
                value={profile.totalCompletions ?? 0}
              />
              <StatCard
                icon={<Award className="h-5 w-5 text-[#2563EB]" />}
                title="Achievements"
                value={profile.achievementsUnlocked ?? 0}
              />
            </div>
          </section>

          {/* Unlocked achievements */}
          {Array.isArray(profile.achievements) &&
            profile.achievements.length > 0 ? (
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Unlocked Achievements
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {profile.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
                      <AchievementGlyph
                        icon={achievement.icon}
                        className="h-5 w-5"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {achievement.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Unlocked Achievements
              </h3>
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/60 py-10 text-center">
                <Award className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">
                  No achievements unlocked yet.
                </p>
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
        <UserIcon className="h-3.5 w-3.5" />
        SkillUp profile — stats shared based on the owner&apos;s privacy setting.
      </div>

      {/* Mounted only while open, so each report starts from a clean form and
          the draft is discarded by unmounting rather than by a reset effect. */}
      {!isOwn && reportOpen && (
        <ReportUserDialog
          userId={profile.uid}
          username={profile.username}
          displayName={profile.displayName}
          submitted={reportSent}
          onClose={() => setReportOpen(false)}
          onSubmit={async (input) => {
            await reportUser.mutateAsync(input);
            setReportSent(true);
          }}
        />
      )}
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const username =
    typeof params?.username === "string" ? params.username : null;

  if (!username) return null;
  return <ProfileContent username={username} />;
}