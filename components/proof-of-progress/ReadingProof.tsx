"use client";

import StepperInput from "@/components/ui/StepperInput";
import { Field, NumberInput, TextAreaInput, TextInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function ReadingProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Book / Article">
        <TextInput value={data.bookTitle || ""} onChange={(e) => onChange("bookTitle", e.target.value)} placeholder="e.g. Atomic Habits" />
      </Field>

      <Field label="Pages Read">
        <StepperInput value={data.pagesRead || 0} onChange={(v) => onChange("pagesRead", v)} max={500} unit="pages" />
      </Field>

      <Field label="Reading Duration (min)">
        <NumberInput value={data.readingDuration || ""} onChange={(e) => onChange("readingDuration", parseInt(e.target.value) || 0)} placeholder="e.g. 30" />
      </Field>

      <Field label="Favorite Quote">
        <TextInput value={data.favoriteQuote || ""} onChange={(e) => onChange("favoriteQuote", e.target.value)} placeholder="A memorable quote" />
      </Field>

      <Field label="Biggest Lesson">
        <TextAreaInput rows={2} value={data.biggestLesson || ""} onChange={(e) => onChange("biggestLesson", e.target.value)} placeholder="What stood out?" />
      </Field>
    </div>
  );
}
