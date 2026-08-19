"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is SkillUp?",
    answer:
      "SkillUp is a gamified habit-tracking app that turns your daily routines into an RPG-style adventure. You earn XP, level up, and unlock achievements as you build positive habits.",
  },
  {
    question: "Is SkillUp free?",
    answer:
      "Yes! SkillUp offers a generous free tier that includes habit tracking, basic stats, and core gamification features. Premium features may be available in the future.",
  },
  {
    question: "Can I use it daily?",
    answer:
      "Absolutely. SkillUp is designed for daily use. The app tracks your daily habits, maintains streaks, and provides fresh daily quests to keep you engaged every day.",
  },
  {
    question: "How are XP calculated?",
    answer:
      "XP is earned by completing habits. The amount depends on the habit difficulty, your streak length, and whether you complete bonus quests. Longer streaks earn bonus XP.",
  },
  {
    question: "Can I track streaks?",
    answer:
      "Yes! Streak tracking is a core feature. SkillUp tracks consecutive days of habit completion and rewards you for maintaining long streaks with bonus XP and achievements.",
  },
  {
    question: "Does it support mobile?",
    answer:
      "SkillUp is built as a responsive web application that works great on mobile devices, tablets, and desktops. You can access it from any browser.",
  },
  {
    question: "How do achievements work?",
    answer:
      "Achievements are unlocked when you reach specific milestones, such as completing your first habit, maintaining a 7-day streak, or reaching Level 10. Each achievement earns bonus XP.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section id="faq" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            FAQ
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
            Got questions? We&apos;ve got answers.
          </p>
        </div>

        {/* Accordion */}
        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300"
            >
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
                aria-expanded={openIndex === index}
              >
                <span className="text-sm font-semibold text-slate-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="px-6 pb-4 text-sm leading-relaxed text-slate-500">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
