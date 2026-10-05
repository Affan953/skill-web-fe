import {
  PartyPopper,
  Rocket,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import type { ReactionType, GrowthReactionCounts } from "@/types";

export interface ReactionMeta {
  type: ReactionType;
  label: string;
  Icon: LucideIcon;
  /** Tailwind classes applied while the viewer holds this reaction. */
  activeClass: string;
  /** Plain-text description for assistive tech. */
  description: string;
}

export const REACTIONS: ReactionMeta[] = [
  {
    type: "CELEBRATE",
    label: "Celebrate",
    Icon: PartyPopper,
    activeClass: "border-amber-300 bg-amber-50 text-amber-700",
    description: "Celebrate this win",
  },
  {
    type: "ENCOURAGE",
    label: "Encourage",
    Icon: Rocket,
    activeClass: "border-emerald-300 bg-emerald-50 text-emerald-700",
    description: "Encourage this learner",
  },
  {
    type: "SUPPORT",
    label: "Support",
    Icon: HeartHandshake,
    activeClass: "border-sky-300 bg-sky-50 text-sky-700",
    description: "Show support",
  },
];

/** All three tallies at zero — the shape used for optimistic/cache defaults. */
export const EMPTY_REACTION_COUNTS: GrowthReactionCounts = {
  CELEBRATE: 0,
  ENCOURAGE: 0,
  SUPPORT: 0,
};

export function totalReactions(counts: GrowthReactionCounts): number {
  return counts.CELEBRATE + counts.ENCOURAGE + counts.SUPPORT;
}

export function reactionMeta(type: ReactionType): ReactionMeta {
  const found = REACTIONS.find((r) => r.type === type);
  // REACTIONS covers every ReactionType; the fallback keeps this total.
  return found ?? REACTIONS[0];
}
