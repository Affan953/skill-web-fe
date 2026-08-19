"use client";

import type { HabitCategory } from "@/types";
import LanguageProof from "./LanguageProof";
import CodingProof from "./CodingProof";
import FitnessProof from "./FitnessProof";
import ReadingProof from "./ReadingProof";
import MeditationProof from "./MeditationProof";
import HealthProof from "./HealthProof";
import ProductivityProof from "./ProductivityProof";
import FinanceProof from "./FinanceProof";
import CustomProof from "./CustomProof";
import RunningProof from "./RunningProof";
import BadmintonProof from "./BadmintonProof";
import PushUpProof from "./PushUpProof";
import BookReadingProof from "./BookReadingProof";
import EnglishLearningProof from "./EnglishLearningProof";

interface ProofOfProgressFormProps {
  category: HabitCategory;
  activity?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: Record<string, any>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ACTIVITY_COMPONENTS: Record<string, React.ComponentType<{ data: Record<string, any>; onChange: (key: string, val: any) => void }>> = {
  running: RunningProof,
  badminton: BadmintonProof,
  "push up": PushUpProof,
  book: BookReadingProof,
  english: EnglishLearningProof,
};

export default function ProofOfProgressForm({
  category,
  activity,
  value,
  onChange,
}: ProofOfProgressFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = (key: string, val: any) => onChange({ ...value, [key]: val });

  const activityKey = activity?.trim().toLowerCase() ?? "";
  const ActivityComponent = ACTIVITY_COMPONENTS[activityKey];

  if (ActivityComponent) {
    return <ActivityComponent data={value} onChange={update} />;
  }

  switch (category) {
    case "Language":
      return <LanguageProof data={value} onChange={update} />;
    case "Coding":
      return <CodingProof data={value} onChange={update} />;
    case "Fitness":
      return <FitnessProof data={value} onChange={update} />;
    case "Reading":
      return <ReadingProof data={value} onChange={update} />;
    case "Meditation":
      return <MeditationProof data={value} onChange={update} />;
    case "Health":
      return <HealthProof data={value} onChange={update} />;
    case "Productivity":
      return <ProductivityProof data={value} onChange={update} />;
    case "Finance":
      return <FinanceProof data={value} onChange={update} />;
    case "Learning":
      return <LanguageProof data={value} onChange={update} />;
    default:
      return <CustomProof data={value} onChange={update} />;
  }
}
