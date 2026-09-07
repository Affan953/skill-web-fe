"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Sparkles,
  Sword,
  Gem,
  Rocket,
  User,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Check,
  Circle,
} from "lucide-react";

const STRENGTH_LEVELS = [
  { label: "Too weak", color: "text-red-500", bar: "bg-red-500" },
  { label: "Weak", color: "text-orange-500", bar: "bg-orange-500" },
  { label: "Fair", color: "text-amber-500", bar: "bg-amber-500" },
  { label: "Good", color: "text-lime-500", bar: "bg-lime-500" },
  { label: "Strong", color: "text-emerald-500", bar: "bg-emerald-500" },
];

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  function passwordScore(pw: string) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 5);
  }

  const score = passwordScore(password);
  const strength = score > 0 ? STRENGTH_LEVELS[score - 1] : null;
  const confirmTouched = confirm.length > 0;
  const confirmOk = confirmTouched && password === confirm;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, username);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const usernameValid = username.trim().length >= 3;
  const showUserOk = username.length > 0 && usernameValid;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailOk = email.length > 0 && emailValid;

  const passwordChecks = [
    { ok: password.length >= 6, label: "6+ chars" },
    { ok: /[A-Z]/.test(password), label: "Uppercase" },
    { ok: /[0-9]/.test(password), label: "Number" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "Symbol" },
  ];

  const perks = [
    {
      icon: <Sword className="h-4 w-4" />,
      text: "Start your adventure with a personal Hero",
    },
    {
      icon: <Gem className="h-4 w-4" />,
      text: "Track habits and earn XP as you grow",
    },
    {
      icon: <Rocket className="h-4 w-4" />,
      text: "Rise through ranks & unlock achievements",
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
        <div className="mt-10">
          <p className="auth-fade-in inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#93C5FD]" />
            Gamified Productivity
          </p>
          <h1 className="auth-shimmer-text mt-5 text-5xl font-bold leading-[1.05] tracking-tight">
            Your journey
            <br />
            starts here.
          </h1>
          <p className="auth-fade-in mt-6 max-w-md text-[15px] leading-relaxed text-white/80">
            Join thousands of players turning small daily wins into real
            progress. Create your account and start leveling up today.
          </p>

          <ul className="auth-fade-in mt-9 space-y-3.5">
            {perks.map((p) => (
              <li
                key={p.text}
                className="flex items-center gap-3 text-sm font-medium text-white/85"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/12 text-[#93C5FD] ring-1 ring-white/15">
                  {p.icon}
                </span>
                {p.text}
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
                Start your productivity journey today
              </p>
            </div>
          </div>

          <div className="auth-fade-in" style={{ animationDelay: "120ms" }}>
            <h2 className="text-2xl font-bold text-slate-900">
              Create your account
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Join and start leveling up your habits
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-fade-in mt-8 space-y-5"
            noValidate
            style={{ animationDelay: "220ms" }}
          >
            {/* Username */}
            <div>
              <label
                htmlFor="register-username"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <div className="relative">
                <input
                  id="register-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="adventurer42"
                  className={`peer ${inputBase} pl-11 pr-11`}
                />
                <User className={`${iconBase} left-3.5`} />
                {showUserOk && (
                  <CheckCircle2 className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" />
                )}
              </div>
              {username.length > 0 && !usernameValid && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  At least 3 characters
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="register-email"
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
              <label
                htmlFor="register-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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

              {/* Strength meter */}
              {password.length > 0 && strength && (
                <div className="mt-2.5">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i < score ? strength.bar : "bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {passwordChecks.map((c) => (
                      <span
                        key={c.label}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition-all duration-300 ${
                          c.ok
                            ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                            : "bg-slate-50 text-slate-400 ring-slate-200"
                        }`}
                      >
                        {c.ok ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="register-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={`peer ${
                    confirmTouched && !confirmOk
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10 focus:shadow-[0_10px_24px_-12px_rgba(239,68,68,0.4)]"
                      : ""
                  } ${inputBase} pl-11 pr-11`}
                />
                <ShieldCheck className={`${iconBase} left-3.5`} />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors duration-300 hover:text-slate-600 peer-focus:text-[#2563EB]"
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Confirm match hint */}
              {confirmTouched && (
                <p
                  className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                    confirmOk ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {confirmOk ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" />
                      Passwords do not match
                    </>
                  )}
                </p>
              )}
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
              id="register-submit"
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#2563EB]/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="auth-btn-shine-flow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <p
            className="auth-fade-in mt-6 text-center text-sm text-slate-400"
            style={{ animationDelay: "320ms" }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#2563EB] hover:text-[#60A5FA] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}