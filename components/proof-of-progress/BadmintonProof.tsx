"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
import { Field, NumberInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function BadmintonProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Match Duration (min)">
        <NumberInput value={data.matchDuration || ""} onChange={(e) => onChange("matchDuration", parseInt(e.target.value) || 0)} placeholder="e.g. 60" />
      </Field>
      <Field label="Games Played">
        <NumberInput value={data.gamesPlayed || ""} onChange={(e) => onChange("gamesPlayed", parseInt(e.target.value) || 0)} placeholder="e.g. 3" />
      </Field>
      <Field label="Energy Level">
        <SegmentedControl options={["Low", "Medium", "High", "Peak"]} value={data.energyLevel || ""} onChange={(v) => onChange("energyLevel", v)} />
      </Field>
      <Field label="Mood">
        <SegmentedControl options={["Tired", "Good", "Great", "Energized", "Amazing"]} value={data.moodAfter || ""} onChange={(v) => onChange("moodAfter", v)} />
      </Field>
    </div>
  );
}
