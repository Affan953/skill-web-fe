import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[90vh] items-center overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-16"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-[#2563EB]/5 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-[#10B981]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 pt-3.5">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-[#2563EB]" />
            <span className="text-sm font-medium text-[#2563EB]">
              Gamified Productivity
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Level Up Your
            <br />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
              Real Life
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-lg text-slate-500 sm:text-xl">
            Transform your daily habits into an epic adventure. Earn XP,
            unlock achievements, and watch your productivity soar with
            SkillUp RPG.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-[#2563EB]/30"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              Login
            </Link>
          </div>

          {/* Hero Visual - Dashboard Preview */}
          <div className="mt-16 w-full max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/50 sm:p-8">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatPreview
                  label="Active Habits"
                  value="12"
                  color="bg-[#2563EB]"
                />
                <StatPreview
                  label="Current Level"
                  value="24"
                  color="bg-[#10B981]"
                />
                <StatPreview
                  label="Total XP"
                  value="8,450"
                  color="bg-amber-500"
                />
                <StatPreview
                  label="Day Streak"
                  value="31"
                  color="bg-orange-500"
                />
              </div>
              <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Daily Progress
                  </span>
                  <span className="text-sm font-semibold text-[#2563EB]">
                    75%
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatPreview({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
      <div className={`mx-auto mb-2 h-2 w-2 rounded-full ${color}`} />
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
