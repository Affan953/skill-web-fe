import { CheckSquare, Shield, Zap, Flame } from "lucide-react";

const stats = [
  {
    icon: CheckSquare,
    label: "Active Habits",
    value: "12",
    description: "Habits you're building",
    color: "bg-[#2563EB]/10 text-[#2563EB]",
    barColor: "from-[#2563EB] to-[#60A5FA]",
    barWidth: "w-3/4",
  },
  {
    icon: Shield,
    label: "Current Level",
    value: "24",
    description: "Adventurer rank",
    color: "bg-[#10B981]/10 text-[#10B981]",
    barColor: "from-[#10B981] to-[#34D399]",
    barWidth: "w-4/5",
  },
  {
    icon: Zap,
    label: "Total XP",
    value: "8,450",
    description: "Experience earned",
    color: "bg-amber-100 text-amber-500",
    barColor: "from-amber-400 to-yellow-500",
    barWidth: "w-2/3",
  },
  {
    icon: Flame,
    label: "Longest Streak",
    value: "31",
    description: "Days in a row",
    color: "bg-orange-100 text-orange-500",
    barColor: "from-orange-400 to-red-500",
    barWidth: "w-5/6",
  },
];

export default function StatsShowcase() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent ">
            Dashboard Preview
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Your progress at a glance
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Beautiful dashboards that keep you informed and motivated every
            day.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex rounded-xl p-2.5 ${stat.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {stat.label}
                </p>
                <p className="text-xs text-slate-400">{stat.description}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${stat.barColor} ${stat.barWidth} transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
