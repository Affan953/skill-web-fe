"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AiOrbProps {
  onClick: () => void;
}

/**
 * The floating entry point of the AI assistant.
 *
 * `position: fixed` keeps it on screen while the page scrolls, and it is
 * deliberately rendered at `z-40` — above in-page content, below modals (z-50).
 * Flat brand blue, matching SkillUp's primary button, so it reads as part of
 * the product rather than a third-party "AI gadget".
 */
export function AiOrb({ onClick }: AiOrbProps) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 24 }}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40"
    >
      <motion.button
        type="button"
        onClick={onClick}
        aria-label="Open SkillUp assistant"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg shadow-blue-900/20 ring-1 ring-black/5"
      >
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </motion.button>
    </motion.div>
  );
}