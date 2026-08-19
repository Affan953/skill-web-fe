import { UserPlus, ListChecks, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Account",
    description:
      "Sign up in seconds with your email or Google account. Set up your profile and you're ready to go.",
  },
  {
    icon: ListChecks,
    step: "02",
    title: "Build Habits",
    description:
      "Define the habits you want to build. Set goals, frequency, and let SkillUp guide your journey.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Level Up",
    description:
      "Complete habits to earn XP, maintain streaks, and watch yourself level up as consistency pays off.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
            How It Works
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Start in three simple steps
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Getting started with SkillUp is easy. Begin your transformation
            today.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 hidden md:block">
          <div className="relative flex items-start justify-between">
            {/* Connector lines layer */}
            <div className="absolute left-[calc(16.67%+40px)] top-10 h-0.5 w-[calc(66.67%-80px)] bg-slate-200" />

            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative w-1/3 text-center">
                  <div className="relative mx-auto inline-flex">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                      <Icon className="h-8 w-8 text-[#2563EB]" />
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-md">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Steps - Mobile */}
        <div className="mt-16 md:hidden">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative mb-12 text-center last:mb-0">
                <div className="relative mx-auto inline-flex">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                    <Icon className="h-8 w-8 text-[#2563EB]" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-md">
                    {step.step}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
