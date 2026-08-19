import {
  CheckSquare,
  Zap,
  Trophy,
  Target,
  BarChart3,
  Flame,
} from "lucide-react";

const features = [
  {
    icon: CheckSquare,
    title: "Habit Tracking",
    description:
      "Create and track daily habits with ease. Build consistency with streaks and visual progress indicators.",
    color: "bg-[#2563EB]/10 text-[#2563EB]",
  },
  {
    icon: Zap,
    title: "XP & Level System",
    description:
      "Earn experience points for every completed habit. Level up and unlock new milestones as you grow.",
    color: "bg-amber-100 text-amber-500",
  },
  {
    icon: Trophy,
    title: "Achievements",
    description:
      "Unlock badges and achievements for reaching goals. Collect them all and showcase your dedication.",
    color: "bg-[#10B981]/10 text-[#10B981]",
  },
  {
    icon: Target,
    title: "Daily Quests",
    description:
      "Fresh challenges every day to keep you engaged. Complete quests for bonus XP and rewards.",
    color: "bg-purple-100 text-purple-500",
  },
  {
    icon: BarChart3,
    title: "Leaderboard",
    description:
      "Compete with others and climb the ranks. Stay motivated by seeing how you stack up against the community.",
    color: "bg-orange-100 text-orange-500",
  },
  {
    icon: Flame,
    title: "Statistics",
    description:
      "Deep insights into your productivity patterns. Visualize your growth with detailed charts and analytics.",
    color: "bg-red-100 text-red-500",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Features
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Everything you need to level up
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            A complete toolkit for building better habits and boosting your
            productivity.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex rounded-xl p-3 ${feature.color} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
