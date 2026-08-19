import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2563EB] to-[#60A5FA] px-8 py-16 text-center sm:px-16">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10" />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to Level Up?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Join SkillUp today and transform your daily habits into an epic
              adventure. Start your journey now.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-[#2563EB] shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
