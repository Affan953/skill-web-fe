"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Sparkles,
  Zap,
  Flame,
  Trophy,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const { login, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed.";
      setError(message);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailOk = email.length > 0 && emailValid;

  const features = [
    {
      icon: <Zap className="h-4 w-4" />,
      text: "Earn XP from your daily habits",
    },
    {
      icon: <Flame className="h-4 w-4" />,
      text: "Build streaks & stay consistent",
    },
    {
      icon: <Trophy className="h-4 w-4" />,
      text: "Unlock achievements & climb ranks",
    },
  ];

  const inputBase =
    "w-full rounded-xl border border-slate-200 bg-white py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 hover:border-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 focus:shadow-[0_10px_24px_-12px_rgba(37,99,235,0.4)]";

  const iconBase =
    "pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors duration-300 peer-focus:text-[#2563EB]";

  return (
    <main className="flex min-h-screen bg-white">
      {/* ===== Left brand panel ===== */}
      <aside className="auth-bg-anim relative hidden w-[48%] flex-col overflow-hidden px-16 py-14 lg:flex">
        {/* Logo */}
        <div className="auth-fade-in flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            SkillUp RPG
          </span>
        </div>

        {/* Center copy */}
        <div className="auth-fade-in mt-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#93C5FD]" />
            Daily Habit RPG
          </p>
          <h1 className="auth-shimmer-text mt-5 text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
            Level up your
            <br />
            real life.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/80">
            Transform your daily habits into an epic adventure. Earn XP,
            unlock achievements, and become a better version of yourself every
            single day.
          </p>

          <ul className="mt-9 space-y-3.5">
            {features.map((f) => (
              <li
                key={f.text}
                className="flex items-center gap-3 text-sm font-medium text-white/85"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/12 text-[#93C5FD] ring-1 ring-white/15">
                  {f.icon}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-auto pt-10 text-xs text-white/45">
          © {new Date().getFullYear()} SkillUp RPG. All rights reserved.
        </p>
      </aside>

      {/* ===== Right form panel ===== */}
      <section className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-white px-6 py-14 lg:w-[52%]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2563EB] opacity-10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#3B82F6] opacity-[0.07] blur-3xl"
        />
        <div className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="auth-fade-in mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] shadow-lg shadow-[#2563EB]/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">SkillUp RPG</h1>
              <p className="mt-1 text-sm text-slate-500">
                Level up your habits. Gamify your productivity.
              </p>
            </div>
          </div>

          <div className="auth-fade-in" style={{ animationDelay: "120ms" }}>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to continue your journey
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-fade-in mt-8 space-y-5"
            noValidate
            style={{ animationDelay: "220ms" }}
          >
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`peer ${inputBase} pl-11 pr-11`}
                />
                <Mail className={`${iconBase} left-3.5`} />
                {showEmailOk && (
                  <CheckCircle2 className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <span className="cursor-pointer text-xs font-medium text-[#2563EB] transition-colors hover:text-[#60A5FA]">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`peer ${inputBase} pl-11 pr-11`}
                />
                <Lock className={`${iconBase} left-3.5`} />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors duration-300 hover:text-slate-600 peer-focus:text-[#2563EB]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                key={error}
                role="alert"
                className="auth-shake rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#2563EB]/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="auth-btn-shine-flow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div
            className="auth-fade-in relative my-6"
            style={{ animationDelay: "320ms" }}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-slate-400">or</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="auth-fade-in w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ animationDelay: "360ms" }}
          >
            {isGoogleLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#2563EB]" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {isGoogleLoading ? "Signing in…" : "Continue with Google"}
          </button>

          {/* Footer */}
          <p
            className="auth-fade-in mt-6 text-center text-sm text-slate-400"
            style={{ animationDelay: "420ms" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[#2563EB] hover:text-[#60A5FA] transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}