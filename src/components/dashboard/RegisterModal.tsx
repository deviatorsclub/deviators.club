"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  PlusSignIcon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import {
  YEAR_OPTIONS,
  type DemoEvent,
  type DemoMember,
} from "@/lib/dashboard/demo";

export type RegisterPayload = {
  phone: string;
  collegeId: string;
  year: string;
  expectations: string;
  mode: "solo" | "team";
  teamName: string;
  mates: string[];
};

export default function RegisterModal({
  event,
  defaultEmail,
  selfUsername,
  onClose,
  onSubmit,
  searchMembers,
}: {
  event: DemoEvent | null;
  defaultEmail: string;
  selfUsername: string;
  onClose: () => void;
  /** Resolves with an error sentence on failure, null on success. */
  onSubmit: (payload: RegisterPayload) => Promise<string | null>;
  /** Live member search against onboarded profiles. */
  searchMembers: (q: string) => Promise<DemoMember[]>;
}) {
  const [phone, setPhone] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [year, setYear] = useState(YEAR_OPTIONS[1]);
  const [expectations, setExpectations] = useState("");
  const [mode, setMode] = useState<"solo" | "team">("solo");
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<DemoMember[]>([]);
  const [search, setSearch] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [remoteResults, setRemoteResults] = useState<DemoMember[]>([]);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const maxMates = event ? event.maxTeamSize - 1 : 3;

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setRemoteResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setRemoteResults(await searchMembers(q));
    }, 300);
    return () => clearTimeout(id);
  }, [search, searchMembers]);

  const results = useMemo(
    () =>
      remoteResults
        .filter(
          (m) =>
            m.username.toLowerCase() !== selfUsername.toLowerCase() &&
            !members.some((x) => x.username === m.username),
        )
        .slice(0, 5),
    [members, selfUsername, remoteResults],
  );

  if (!event) return null;

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-blue-500/50";

  const addMember = (m: DemoMember) => {
    if (members.length >= maxMates) return;
    setMembers((prev) => [...prev, m]);
    setSearch("");
  };

  const removeMember = (username: string) =>
    setMembers((prev) => prev.filter((m) => m.username !== username));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    const err = await onSubmit({
      phone: phone.trim(),
      collegeId: collegeId.trim(),
      year,
      expectations: expectations.trim(),
      mode,
      teamName: teamName.trim(),
      mates: mode === "team" ? members.map((m) => m.username) : [],
    });
    setSubmitting(false);
    if (err) {
      setSubmitError(err);
      return;
    }
    setSent(true);
    setTimeout(onClose, 1600);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card-active max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
        >
          {sent ? (
            <div className="flex flex-col items-center py-8 text-center">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={44}
                className="text-emerald-300"
              />
              <h3 className="font-heading mt-4 text-xl font-extrabold text-white">
                You&apos;re in
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
                RSVP sent to <span className="text-white">{defaultEmail}</span>.
                {mode === "team" && members.length > 0
                  ? " Invites sent — mates accept from My Events."
                  : " Find it under My Events."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-lg font-extrabold text-white">
                    Register · {event.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-white/50">
                    Confirmation email included
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-xl p-2 text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Phone
                  </label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    College ID / Roll no.
                  </label>
                  <input
                    required
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    placeholder="CSE-2024-042"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Year
                </label>
                <div className="flex flex-wrap gap-2">
                  {YEAR_OPTIONS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={`rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-all ${
                        year === y
                          ? "border-blue-500/50 bg-blue-500/15 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {event.isTeamEvent && (
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      size={16}
                      className="text-white/50"
                    />
                    Solo or team?
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(["solo", "team"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition-all ${
                          mode === m
                            ? "border-blue-500/50 bg-blue-500/15 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                        }`}
                      >
                        {m === "solo"
                          ? "Solo"
                          : `Team (up to ${event.maxTeamSize})`}
                      </button>
                    ))}
                  </div>

                  {mode === "team" && (
                    <div className="mt-3 space-y-2.5">
                      <input
                        required={mode === "team"}
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Team name"
                        maxLength={40}
                        className={inputCls}
                      />

                      {/* Added members */}
                      {members.length > 0 && (
                        <ul className="space-y-1.5">
                          {members.map((m) => (
                            <li
                              key={m.username}
                              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[11px] font-bold text-blue-200">
                                {m.displayName[0]}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-medium text-white">
                                  {m.displayName}
                                </p>
                                <p className="truncate font-mono text-[11px] text-white/40">
                                  @{m.username} · {m.year}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMember(m.username)}
                                aria-label={`Remove ${m.username}`}
                                className="rounded-lg p-1.5 text-white/45 transition-colors hover:bg-red-400/10 hover:text-red-300"
                              >
                                <HugeiconsIcon icon={Cancel01Icon} size={15} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Search members */}
                      {members.length < maxMates && (
                        <div className="relative">
                          <HugeiconsIcon
                            icon={Search01Icon}
                            size={15}
                            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/30"
                          />
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onFocus={() => setSearchFocus(true)}
                            onBlur={() =>
                              setTimeout(() => setSearchFocus(false), 150)
                            }
                            placeholder={`Search members by username (${members.length}/${maxMates} added)`}
                            className={`${inputCls} pl-10`}
                          />
                          {searchFocus && search.trim() && (
                            <ul className="absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f1a] shadow-2xl">
                              {results.map((m) => (
                                <li key={m.username}>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => addMember(m)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                                  >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[11px] font-bold text-blue-200">
                                      {m.displayName[0]}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[13px] font-medium text-white">
                                        {m.displayName}
                                      </span>
                                      <span className="block truncate font-mono text-[11px] text-white/40">
                                        @{m.username}
                                      </span>
                                    </span>
                                    <HugeiconsIcon
                                      icon={PlusSignIcon}
                                      size={15}
                                      className="shrink-0 text-white/40"
                                    />
                                  </button>
                                </li>
                              ))}
                              {results.length === 0 && (
                                <li className="px-3 py-3 text-center text-xs text-white/40">
                                  No members found — they need to sign up first.
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Expectations <span className="text-white/30">(optional)</span>
                </label>
                <textarea
                  value={expectations}
                  onChange={(e) => setExpectations(e.target.value)}
                  rows={2}
                  placeholder="Anything we should know?"
                  className={`${inputCls} resize-none`}
                />
              </div>

              {submitError && (
                <p className="mt-5 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-2.5 text-[13px] text-red-300">
                  <HugeiconsIcon icon={Alert01Icon} size={15} />
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary mt-5 w-full py-3 text-sm disabled:opacity-60"
              >
                {submitting ? "Registering…" : "Confirm registration"}
              </button>
              <p className="mt-2.5 text-center text-[11px] text-white/35">
                RSVP goes to {defaultEmail}
              </p>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
