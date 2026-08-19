"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
import ProgressSlider from "@/components/ui/ProgressSlider";
import { Field, NumberInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function MeditationProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Duration (min)">
        <NumberInput value={data.meditationDuration || ""} onChange={(e) => onChange("meditationDuration", parseInt(e.target.value) || 0)} placeholder="e.g. 20" />
      </Field>

      <Field label="Mood Before">
        <SegmentedControl options={["Anxious", "Neutral", "Calm", "Happy", "Stressed"]} value={data.moodBefore || ""} onChange={(v) => onChange("moodBefore", v)} />
      </Field>

      <Field label="Mood After">
        <SegmentedControl options={["Anxious", "Neutral", "Calm", "Happy", "Peaceful", "Focused"]} value={data.moodAfter || ""} onChange={(v) => onChange("moodAfter", v)} />
      </Field>

      <ProgressSlider value={data.stressLevel || 5} onChange={(v) => onChange("stressLevel", v)} min={1} max={10} label="Stress Level" leftLabel="High" rightLabel="Low" />
    </div>
  );
}
