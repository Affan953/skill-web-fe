"use client";

import StepperInput from "@/components/ui/StepperInput";
import ProgressSlider from "@/components/ui/ProgressSlider";
import { Field, NumberInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function ProductivityProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Deep Work Duration (min)">
        <NumberInput value={data.deepWorkDuration || ""} onChange={(e) => onChange("deepWorkDuration", parseInt(e.target.value) || 0)} placeholder="e.g. 90" />
      </Field>

      <Field label="Tasks Finished">
        <StepperInput value={data.tasksFinished || 0} onChange={(v) => onChange("tasksFinished", v)} max={50} />
      </Field>

      <ProgressSlider value={data.focusScore || 5} onChange={(v) => onChange("focusScore", v)} min={1} max={10} label="Focus Score" />

      <Field label="Interruptions">
        <NumberInput value={data.interruptions || 0} onChange={(e) => onChange("interruptions", parseInt(e.target.value) || 0)} placeholder="e.g. 2" />
      </Field>
    </div>
  );
}
