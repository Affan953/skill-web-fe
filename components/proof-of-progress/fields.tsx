"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none";

interface FieldProps {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: TextInputProps) {
  return <input {...props} className={cn(inputBase, className)} />;
}

type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function NumberInput({ className, ...props }: NumberInputProps) {
  return <input type="number" {...props} className={cn(inputBase, className)} />;
}

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SelectInput({
  className,
  children,
  ...props
}: SelectInputProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(inputBase, "appearance-none pr-9", className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

type TextAreaInputProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaInput({ className, ...props }: TextAreaInputProps) {
  return (
    <textarea {...props} className={cn(inputBase, "resize-none", className)} />
  );
}
