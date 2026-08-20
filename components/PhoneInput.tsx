"use client";

import { formatPhone } from "@/lib/phone";

interface PhoneInputProps {
  value: string;
  onChange: (formatted: string) => void;
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  id = "telefone",
  required,
  autoFocus,
}: PhoneInputProps) {
  return (
    <input
      id={id}
      name="telefone"
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="(85) 9 9999-9999"
      value={value}
      required={required}
      autoFocus={autoFocus}
      onChange={(e) => onChange(formatPhone(e.target.value))}
      className="w-full rounded-md border border-pitch-line bg-pitch-raised px-4 py-3 font-mono text-lg tracking-wide text-chalk placeholder:text-chalk-muted/60 focus:border-grass focus:outline-none"
    />
  );
}
