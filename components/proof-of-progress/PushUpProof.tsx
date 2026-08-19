"use client";

import StepperInput from "@/components/ui/StepperInput";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { Field, NumberInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function PushUpProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Completed Repetitions">
        <StepperInput value={data.completedReps || 0} onChange={(v) => onChange("completedReps", v)} max={500} unit="reps" />
      </Field>
      <Field label="Best Set">
        <NumberInput value={data.bestSet || ""} onChange={(e) => onChange("bestSet", parseInt(e.target.value) || 0)} placeholder="e.g. 20 in one set" />
      </Field>
      <Field label="Difficulty">
        <SegmentedControl options={["Easy", "Medium", "Hard"]} value={data.exerciseDifficulty || "Medium"} onChange={(v) => onChange("exerciseDifficulty", v)} />
      </Field>
    </div>
  );
}
