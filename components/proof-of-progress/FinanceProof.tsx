"use client";

import { Field, TextAreaInput, TextInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function FinanceProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Money Saved">
          <TextInput value={data.moneySaved || ""} onChange={(e) => onChange("moneySaved", e.target.value)} placeholder="e.g. $25" />
        </Field>
        <Field label="Expense Avoided">
          <TextInput value={data.expenseAvoided || ""} onChange={(e) => onChange("expenseAvoided", e.target.value)} placeholder="e.g. Skipped eating out" />
        </Field>
      </div>

      <Field label="Lesson Learned">
        <TextAreaInput rows={2} value={data.lessonLearned || ""} onChange={(e) => onChange("lessonLearned", e.target.value)} placeholder="What did you learn about money?" />
      </Field>
    </div>
  );
}
