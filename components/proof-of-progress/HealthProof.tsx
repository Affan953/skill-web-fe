"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
import { Field, NumberInput, TextInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function HealthProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Water (glasses)">
          <NumberInput value={data.waterIntake || ""} onChange={(e) => onChange("waterIntake", parseInt(e.target.value) || 0)} placeholder="e.g. 8" />
        </Field>
        <Field label="Sleep (hours)">
          <NumberInput step="0.5" value={data.sleepDuration || ""} onChange={(e) => onChange("sleepDuration", parseFloat(e.target.value) || 0)} placeholder="e.g. 7.5" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Steps">
          <NumberInput value={data.steps || ""} onChange={(e) => onChange("steps", parseInt(e.target.value) || 0)} placeholder="e.g. 8000" />
        </Field>
        <Field label="Weight">
          <TextInput value={data.weight || ""} onChange={(e) => onChange("weight", e.target.value)} placeholder="e.g. 70 kg" />
        </Field>
      </div>

      <Field label="Energy Level">
        <SegmentedControl options={["Low", "Medium", "High", "Peak"]} value={data.energyLevel || ""} onChange={(v) => onChange("energyLevel", v)} />
      </Field>
    </div>
  );
}
