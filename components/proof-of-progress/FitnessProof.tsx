"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
import { Field, NumberInput, TextInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function FitnessProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Workout Type">
        <SegmentedControl options={["Running", "Weight Training", "Yoga", "Swimming", "Cycling", "HIIT", "Other"]} value={data.workoutType || ""} onChange={(v) => onChange("workoutType", v)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Distance">
          <TextInput value={data.distance || ""} onChange={(e) => onChange("distance", e.target.value)} placeholder="e.g. 5 km" />
        </Field>
        <Field label="Duration (min)">
          <NumberInput value={data.duration || ""} onChange={(e) => onChange("duration", parseInt(e.target.value) || 0)} placeholder="e.g. 45" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Calories">
          <NumberInput value={data.calories || ""} onChange={(e) => onChange("calories", parseInt(e.target.value) || 0)} placeholder="e.g. 350" />
        </Field>
        <Field label="Heart Rate">
          <TextInput value={data.heartRate || ""} onChange={(e) => onChange("heartRate", e.target.value)} placeholder="e.g. 140 bpm" />
        </Field>
      </div>

      <Field label="Energy Level">
        <SegmentedControl options={["Low", "Medium", "High", "Peak"]} value={data.energyLevel || ""} onChange={(v) => onChange("energyLevel", v)} />
      </Field>

      <Field label="Mood After">
        <SegmentedControl options={["Tired", "Good", "Great", "Energized", "Amazing"]} value={data.moodAfter || ""} onChange={(v) => onChange("moodAfter", v)} />
      </Field>
    </div>
  );
}
