"use client";

import StepperInput from "@/components/ui/StepperInput";
import { Field, TextAreaInput, TextInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function BookReadingProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Pages Read">
        <StepperInput value={data.pagesRead || 0} onChange={(v) => onChange("pagesRead", v)} max={999} unit="pages" />
      </Field>
      <Field label="Book">
        <TextInput value={data.book || ""} onChange={(e) => onChange("book", e.target.value)} placeholder="e.g. Atomic Habits" />
      </Field>
      <Field label="Chapter">
        <TextInput value={data.chapter || ""} onChange={(e) => onChange("chapter", e.target.value)} placeholder="e.g. Chapter 3" />
      </Field>
      <Field label="Favorite Quote">
        <TextAreaInput rows={2} value={data.favoriteQuote || ""} onChange={(e) => onChange("favoriteQuote", e.target.value)} placeholder="A line worth remembering…" />
      </Field>
    </div>
  );
}
