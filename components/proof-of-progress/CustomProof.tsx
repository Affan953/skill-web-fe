"use client";

import { Plus, X } from "lucide-react";
import { Field, TextInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

interface CustomMetric {
  name: string;
  value: string;
  unit: string;
}

export default function CustomProof({ data, onChange }: Props) {
  const metrics: CustomMetric[] = data.customMetrics || [{ name: "", value: "", unit: "" }];

  const updateMetric = (index: number, field: keyof CustomMetric, val: string) => {
    const updated = [...metrics];
    updated[index] = { ...updated[index], [field]: val };
    onChange("customMetrics", updated);
  };

  const addMetric = () => onChange("customMetrics", [...metrics, { name: "", value: "", unit: "" }]);
  const removeMetric = (index: number) => onChange("customMetrics", metrics.filter((_: CustomMetric, i: number) => i !== index));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Define your own metrics to track.</p>
      {metrics.map((m: CustomMetric, i: number) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1 space-y-2">
            <Field label={`Metric ${i + 1}`}>
              <TextInput type="text" value={m.name} onChange={(e) => updateMetric(i, "name", e.target.value)} placeholder="Metric name" />
            </Field>
            <div className="flex gap-2">
              <TextInput type="text" value={m.value} onChange={(e) => updateMetric(i, "value", e.target.value)} placeholder="Value" />
              <TextInput type="text" value={m.unit} onChange={(e) => updateMetric(i, "unit", e.target.value)} placeholder="Unit" className="w-24 flex-none" />
            </div>
          </div>
          {metrics.length > 1 && (
            <button
              type="button"
              onClick={() => removeMetric(i)}
              className="mt-7 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-400"
              aria-label="Remove metric"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addMetric}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/60 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
      >
        <Plus className="h-4 w-4" /> Add Metric
      </button>
    </div>
  );
}
