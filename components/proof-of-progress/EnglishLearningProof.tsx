"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
import { Field, TextInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function EnglishLearningProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Grammar Topic">
        <TextInput value={data.grammarTopic || ""} onChange={(e) => onChange("grammarTopic", e.target.value)} placeholder="e.g. Present Perfect Tense" />
      </Field>
      <Field label="Vocabulary Learned">
        <TextInput value={data.vocabularyLearned || ""} onChange={(e) => onChange("vocabularyLearned", e.target.value)} placeholder="e.g. 10 new words" />
      </Field>
      <Field label="Speaking Practice">
        <SegmentedControl options={["None", "Brief", "Some", "A lot"]} value={data.speakingPractice || ""} onChange={(v) => onChange("speakingPractice", v)} />
      </Field>
      <Field label="Confidence">
        <SegmentedControl options={["Not Confident", "Okay", "Confident", "Very Confident"]} value={data.confidenceLevel || ""} onChange={(v) => onChange("confidenceLevel", v)} />
      </Field>
    </div>
  );
}
