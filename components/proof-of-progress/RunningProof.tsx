"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
import { Field, NumberInput, TextInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function RunningProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Distance Completed (KM)">
        <NumberInput step="0.1" value={data.distance || ""} onChange={(e) => onChange("distance", parseFloat(e.target.value) || 0)} placeholder="e.g. 5" />
      </Field>
      <Field label="Average Pace">
        <TextInput value={data.averagePace || ""} onChange={(e) => onChange("averagePace", e.target.value)} placeholder="e.g. 6:30 /km" />
      </Field>
      <Field label="Duration (min)">
        <NumberInput value={data.duration || ""} onChange={(e) => onChange("duration", parseInt(e.target.value) || 0)} placeholder="e.g. 32" />
      </Field>
      <Field label="Energy Level">
        <SegmentedControl options={["Low", "Medium", "High", "Peak"]} value={data.energyLevel || ""} onChange={(v) => onChange("energyLevel", v)} />
      </Field>
    </div>
  );
}
