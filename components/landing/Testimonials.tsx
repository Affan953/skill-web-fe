import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Developer",
    initials: "AC",
    rating: 5,
    text: "SkillUp completely changed how I approach my daily routine. The gamification makes building habits actually fun. I've maintained a 60-day streak on coding practice!",
    avatarBg: "bg-[#2563EB]",
  },
  {
    name: "Sarah Kim",
    role: "Product Manager",
    initials: "SK",
    rating: 5,
    text: "The XP system is surprisingly motivating. I find myself wanting to complete habits just to level up. My productivity has increased significantly since I started.",
    avatarBg: "bg-[#10B981]",
  },
  {
    name: "Marcus Johnson",
    role: "Fitness Enthusiast",
    initials: "MJ",
    rating: 5,
    text: "As someone who struggled with consistency, the streak tracking and achievements keep me accountable. SkillUp turned habit-building into a game I actually want to play.",
    avatarBg: "bg-amber-500",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
            Testimonials
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Loved by productive people
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            See what our users have to say about their experience with
            SkillUp.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${testimonial.avatarBg}`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
