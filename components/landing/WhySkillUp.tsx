import {
  TrendingUp,
  CalendarCheck,
  Heart,
  BarChart3,
  Gamepad2,
} from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Increase Productivity",
    description:
      "Turn daily routines into measurable progress. Track every habit and see your productivity soar.",
  },
  {
    icon: CalendarCheck,
    title: "Build Consistency",
    description:
      "Streak tracking keeps you accountable. Never break your chain of productive days again.",
  },
  {
    icon: Heart,
    title: "Stay Motivated",
    description:
      "XP, levels, and achievements keep you engaged. Gamification makes self-improvement fun.",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description:
      "Visual dashboards and statistics show your growth over time. Data-driven self-improvement.",
  },
  {
    icon: Gamepad2,
    title: "Gamified Experience",
    description:
      "Level up your real life. Earn rewards, unlock achievements, and compete on leaderboards.",
  },
];

export default function WhySkillUp() {
  return (
    <section id="why" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left: Text */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              Why SkillUp
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Productivity meets
              <br />
              gamification
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              SkillUp combines the science of habit formation with the
              engagement of gamification to help you build lasting positive
              changes.
            </p>

            <div className="mt-10 space-y-6">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/10">
                      <Icon className="h-5 w-5 text-[#2563EB]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {benefit.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
              {/* Level Up Card */}
              <div className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#60A5FA] p-6 text-white">
                <p className="text-sm font-medium text-white/80">
                  Current Level
                </p>
                <p className="mt-1 text-4xl font-bold">24</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-3/4 rounded-full bg-white" />
                </div>
                <p className="mt-2 text-xs text-white/70">
                  2,450 XP to Level 25
                </p>
              </div>

              {/* Achievement */}
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                  <span className="text-xl">🏆</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    7-Day Streak!
                  </p>
                  <p className="text-xs text-slate-500">
                    Consistency Champion
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat label="Habits" value="12" />
                <MiniStat label="Quests" value="5" />
                <MiniStat label="Badges" value="8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
