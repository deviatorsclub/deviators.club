"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, Alert01Icon } from "@hugeicons/core-free-icons";
import {
  BRANCH_OPTIONS,
  PRONOUN_OPTIONS,
  YEAR_OPTIONS,
  isUsernameTaken,
  normalizeUsername,
} from "@/lib/dashboard/demo";

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-blue-500/50";
export const labelCls = "mb-1.5 block text-xs font-medium text-white/50";

const chipCls = (selected: boolean) =>
  `rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-all ${
    selected
      ? "border-blue-500/50 bg-blue-500/15 text-white"
      : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
  }`;

export function UsernameField({
  value,
  onChange,
  exclude,
  required = false,
  taken: takenOverride = null,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude?: string;
  required?: boolean;
  /** Remote (DB) availability result — falls back to local check when null. */
  taken?: boolean | null;
}) {
  const taken = takenOverride ?? isUsernameTaken(value, exclude);
  const empty = value.trim().length === 0;
  return (
    <div>
      <label className={labelCls}>Username{required ? " *" : ""}</label>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(normalizeUsername(e.target.value))}
        placeholder="your-username"
        minLength={3}
        className={`${inputCls} font-mono`}
      />
      {!empty &&
        (taken ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-300">
            <HugeiconsIcon icon={Alert01Icon} size={13} />@{value} is taken
          </p>
        ) : (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-300">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />@{value} is
            available
          </p>
        ))}
    </div>
  );
}

export function PronounsField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isCustom = value !== "" && !PRONOUN_OPTIONS.includes(value);
  return (
    <div>
      <label className={labelCls}>Pronouns</label>
      <div className="flex flex-wrap gap-2">
        {PRONOUN_OPTIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={chipCls(value === p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange("")}
          className={chipCls(isCustom)}
        >
          Custom…
        </button>
      </div>
      {isCustom && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 30))}
          placeholder="e.g. xe/xem"
          className={`${inputCls} mt-2`}
        />
      )}
    </div>
  );
}

export function BranchYearFields({
  branch,
  year,
  onBranch,
  onYear,
}: {
  branch: string;
  year: string;
  onBranch: (v: string) => void;
  onYear: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className={labelCls}>Branch</label>
        <div className="flex flex-wrap gap-2">
          {BRANCH_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onBranch(b)}
              className={chipCls(branch === b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Year</label>
        <div className="flex flex-wrap gap-2">
          {YEAR_OPTIONS.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onYear(y)}
              className={chipCls(year === y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
