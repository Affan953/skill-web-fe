"use client";

import StepperInput from "@/components/ui/StepperInput";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { Field, NumberInput, SelectInput, TextInput } from "./fields";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, val: any) => void;
}

export default function CodingProof({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Programming Language">
        <SelectInput
          value={data.language || ""}
          onChange={(e) => onChange("language", e.target.value)}
        >
          <option value="">Select language</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="csharp">C#</option>
          <option value="cpp">C++</option>
          <option value="other">Other</option>
        </SelectInput>
      </Field>

      <Field label="Coding Duration (min)">
        <NumberInput
          value={data.codingDuration || ""}
          onChange={(e) => onChange("codingDuration", parseInt(e.target.value) || 0)}
          placeholder="e.g. 60"
        />
      </Field>

      <Field label="Problems Solved">
        <StepperInput value={data.problemsSolved || 0} onChange={(v) => onChange("problemsSolved", v)} max={50} />
      </Field>

      <Field label="Feature Built">
        <TextInput
          value={data.featureBuilt || ""}
          onChange={(e) => onChange("featureBuilt", e.target.value)}
          placeholder="e.g. User authentication flow"
        />
      </Field>

      <Field label="Difficulty">
        <SegmentedControl options={["Easy", "Medium", "Hard"]} value={data.codingDifficulty || "Medium"} onChange={(v) => onChange("codingDifficulty", v)} />
      </Field>

      <Field label="GitHub Commit" hint="optional">
        <TextInput
          value={data.githubCommit || ""}
          onChange={(e) => onChange("githubCommit", e.target.value)}
          placeholder="Commit message or hash"
        />
      </Field>
    </div>
  );
}
