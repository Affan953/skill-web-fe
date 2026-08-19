"use client";

import StepperInput from "@/components/ui/StepperInput";
import AnimatedToggle from "@/components/ui/AnimatedToggle";
import { Field, NumberInput, SelectInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function LanguageProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Grammar Topic">
        <SelectInput
          value={data.grammarTopic || ""}
          onChange={(e) => onChange("grammarTopic", e.target.value)}
        >
          <option value="">Select topic</option>
          <option value="present-simple">Present Simple</option>
          <option value="present-continuous">Present Continuous</option>
          <option value="past-simple">Past Simple</option>
          <option value="past-continuous">Past Continuous</option>
          <option value="present-perfect">Present Perfect</option>
          <option value="future-tense">Future Tense</option>
          <option value="conditionals">Conditionals</option>
          <option value="passive-voice">Passive Voice</option>
          <option value="reported-speech">Reported Speech</option>
          <option value="phrasal-verbs">Phrasal Verbs</option>
          <option value="other">Other</option>
        </SelectInput>
      </Field>

      <Field label="Vocabulary Learned">
        <StepperInput value={data.vocabularyCount || 0} onChange={(v) => onChange("vocabularyCount", v)} max={200} unit="words" />
      </Field>

      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700">Skills Practiced</span>
        <div className="grid grid-cols-2 gap-2">
          <AnimatedToggle checked={data.speakingPractice || false} onChange={(v) => onChange("speakingPractice", v)} label="Speaking" />
          <AnimatedToggle checked={data.listeningPractice || false} onChange={(v) => onChange("listeningPractice", v)} label="Listening" />
          <AnimatedToggle checked={data.readingPractice || false} onChange={(v) => onChange("readingPractice", v)} label="Reading" />
          <AnimatedToggle checked={data.writingPractice || false} onChange={(v) => onChange("writingPractice", v)} label="Writing" />
        </div>
      </div>

      <Field label="Study Duration (min)">
        <NumberInput
          value={data.studyDuration || ""}
          onChange={(e) => onChange("studyDuration", parseInt(e.target.value) || 0)}
          placeholder="e.g. 45"
        />
      </Field>
    </div>
  );
}
