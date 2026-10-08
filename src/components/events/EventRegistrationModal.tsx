"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Search01Icon,
  UserGroupIcon,
  PlusSignIcon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  ArrowRight01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import type { EventDetailsData } from "@/data/eventDetails";
import type { SearchMemberResult } from "@/app/api/members/search/route";

export default function EventRegistrationModal({
  event,
  currentUser,
  onClose,
  onSuccess,
}: {
  event: EventDetailsData;
  currentUser: {
    id: string;
    username: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    onboarded?: boolean;
    phone?: string;
    collegeId?: string;
    branch?: string;
    section?: string;
    year?: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [collegeId, setCollegeId] = useState(currentUser?.collegeId || "");
  const [branch, setBranch] = useState(currentUser?.branch || "CSE");
  const [section, setSection] = useState(currentUser?.section || "");
  const [year, setYear] = useState(currentUser?.year || "3rd Year");

  const [profileAvatar, setProfileAvatar] = useState(
    currentUser?.avatarUrl || (currentUser as any)?.avatar_url || "",
  );
  const [profileName, setProfileName] = useState(
    currentUser?.displayName ||
      (currentUser as any)?.display_name ||
      currentUser?.username ||
      "",
  );

  useEffect(() => {
    if (currentUser) {
      if (currentUser.avatarUrl || (currentUser as any)?.avatar_url) {
        setProfileAvatar(
          currentUser.avatarUrl || (currentUser as any)?.avatar_url,
        );
      }
      if (currentUser.displayName || (currentUser as any)?.display_name) {
        setProfileName(
          currentUser.displayName || (currentUser as any)?.display_name,
        );
      }
      if (currentUser.phone && !phone) setPhone(currentUser.phone);
      if (currentUser.collegeId && !collegeId)
        setCollegeId(currentUser.collegeId);
      if (currentUser.branch && (!branch || branch === "CSE"))
        setBranch(currentUser.branch);
      if (currentUser.section && !section) setSection(currentUser.section);
      if (currentUser.year) setYear(currentUser.year);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.id && (!profileAvatar || !profileName)) {
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", currentUser.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.avatar_url) setProfileAvatar(data.avatar_url);
            if (data.display_name) setProfileName(data.display_name);
          }
        });
    }
  }, [currentUser?.id, profileAvatar, profileName]);

  const [mates, setMates] = useState<SearchMemberResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMemberResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Total team size = Current user (Leader) + added mates
  const totalMembers = 1 + mates.length;
  const minRequired = event.minTeamSize || 2;
  const maxAllowed = event.maxTeamSize || 3;
  const canAddMore = mates.length < maxAllowed - 1;
  const isTeamSizeValid =
    totalMembers >= minRequired && totalMembers <= maxAllowed;

  // Debounced search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/members/search?q=${encodeURIComponent(q)}&selfId=${currentUser?.id || ""}`,
        );
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id]);

  // Filter out already selected teammates
  const filteredSearchResults = useMemo(() => {
    return searchResults.filter(
      (r) =>
        r.username.toLowerCase() !== currentUser?.username?.toLowerCase() &&
        !mates.some(
          (m) => m.username.toLowerCase() === r.username.toLowerCase(),
        ),
    );
  }, [searchResults, mates, currentUser?.username]);

  const handleAddMate = (member: SearchMemberResult) => {
    if (!canAddMore) return;
    setMates((prev) => [...prev, member]);
    setSearchQuery("");
    setSearchResults([]);
    setErrorMsg("");
  };

  const handleRemoveMate = (username: string) => {
    setMates((prev) => prev.filter((m) => m.username !== username));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!currentUser) {
      setErrorMsg("Please log in before registering.");
      return;
    }
    if (!currentUser.onboarded) {
      setErrorMsg("Please complete your profile first.");
      return;
    }
    if (totalMembers < minRequired) {
      setErrorMsg(
        `Your team must have at least ${minRequired} members. Please add a teammate.`,
      );
      return;
    }
    if (totalMembers > maxAllowed) {
      setErrorMsg(`Team cannot exceed ${maxAllowed} members.`);
      return;
    }
    if (!teamName.trim() || teamName.trim().length < 2) {
      setErrorMsg("Please provide a team name (at least 2 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/events/${event.slug}/team`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          teamName: teamName.trim(),
          teammateUsernames: mates.map((m) => m.username),
          phone: phone.trim(),
          collegeId: collegeId.trim(),
          branch: branch.trim(),
          section: section.trim(),
          year,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register team.");
      }

      setSuccessMsg("Team registered successfully! Redirecting...");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during registration.");
    } finally {
      setSubmitting(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#090d16] p-5 shadow-2xl shadow-blue-500/10 sm:p-7"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-0.5 text-xs font-semibold text-blue-300">
              <HugeiconsIcon icon={UserGroupIcon} size={14} />
              <span>
                Team Formation ({minRequired}–{maxAllowed} Members)
              </span>
            </div>
            <h2 className="font-heading text-xl font-extrabold text-white sm:text-2xl">
              Register for {event.title}
            </h2>
            <p className="text-xs text-white/50">
              Build your roster, invite teammates via{" "}
              <span className="font-mono text-blue-300">@handle</span> or email.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition-colors hover:bg-white/15 hover:text-white"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Profile check gate */}
        {!currentUser && (
          <div className="my-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-center">
            <p className="text-sm font-medium text-amber-200">
              You must be logged in to register for this event.
            </p>
            <Link
              href={`/login?next=/events/${event.slug}`}
              className="btn-primary mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              Sign In to Deviators Club
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Link>
          </div>
        )}

        {currentUser && !currentUser.onboarded && (
          <div className="my-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-center">
            <p className="text-sm font-semibold text-amber-200">
              Profile Incomplete
            </p>
            <p className="mt-1 text-xs text-amber-200/80">
              Please complete your Deviator profile (handle, branch, year)
              before creating a team.
            </p>
            <Link
              href={`/onboarding?next=/events/${event.slug}`}
              className="btn-primary mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              Build Your Profile Now
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Link>
          </div>
        )}

        {/* Registration Form */}
        {currentUser && currentUser.onboarded && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Team Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-white/70 uppercase">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. ByteCraft Syndicate, Kernel Panic..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500/60"
              />
            </div>

            {/* Team Roster Section */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
                  Team Members ({totalMembers} / {maxAllowed})
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-xs font-medium ${
                    isTeamSizeValid
                      ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                      : "border border-amber-500/30 bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {isTeamSizeValid
                    ? "✓ Valid Team Size"
                    : `Need ${minRequired - totalMembers} more member`}
                </span>
              </div>

              {/* Members List */}
              <div className="mb-4 space-y-2.5">
                {/* Member 1: Leader (Current User) */}
                <div className="flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-amber-400/40 bg-black/40">
                      {profileAvatar ? (
                        <Image
                          src={profileAvatar}
                          alt={profileName || "Leader"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-amber-300">
                          {(profileName ||
                            currentUser.username)?.[0]?.toUpperCase() || "L"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">
                          {profileName || currentUser.username}
                        </p>
                        <span className="py-0.2 inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 text-[10px] font-semibold text-amber-300">
                          <HugeiconsIcon icon={Shield01Icon} size={11} />
                          Leader
                        </span>
                      </div>
                      <p className="font-mono text-xs text-white/45">
                        @{currentUser.username}{" "}
                        {currentUser.email ? `· ${currentUser.email}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-white/40">You</span>
                </div>

                {/* Added Teammates */}
                {mates.map((mate) => (
                  <div
                    key={mate.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-black/40">
                        {mate.avatarUrl ? (
                          <Image
                            src={mate.avatarUrl}
                            alt={mate.displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-blue-300">
                            {mate.displayName?.[0] || "M"}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">
                            {mate.displayName}
                          </p>
                          <span className="py-0.2 rounded-full border border-blue-400/20 bg-blue-500/10 px-2 text-[10px] font-medium text-blue-300">
                            Member
                          </span>
                        </div>
                        <p className="font-mono text-xs text-white/45">
                          @{mate.username}{" "}
                          {mate.branch ? `· ${mate.branch}` : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMate(mate.username)}
                      title="Remove member"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Teammate Search Input */}
              {canAddMore ? (
                <div className="relative">
                  <div className="relative">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={16}
                      className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/40"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type @username or college email to invite teammate..."
                      className="w-full rounded-xl border border-blue-500/30 bg-black/50 py-2.5 pr-4 pl-10 text-xs text-white outline-none placeholder:text-white/35 focus:border-blue-400 sm:text-sm"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {searchQuery.trim().length > 0 && (
                    <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-white/15 bg-[#0f1422] p-2 shadow-2xl">
                      {searching && (
                        <p className="p-3 text-center font-mono text-xs text-white/40">
                          Searching members...
                        </p>
                      )}

                      {!searching && filteredSearchResults.length === 0 && (
                        <p className="p-3 text-center text-xs text-white/40">
                          No onboarded member found for “{searchQuery}”.
                        </p>
                      )}

                      {!searching &&
                        filteredSearchResults.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-white/[0.06]"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                                {m.avatarUrl ? (
                                  <Image
                                    src={m.avatarUrl}
                                    alt={m.displayName}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60">
                                    {m.displayName?.[0] || "M"}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-white">
                                  {m.displayName}
                                </p>
                                <p className="font-mono text-[11px] text-white/40">
                                  @{m.username} {m.email ? `(${m.email})` : ""}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddMate(m)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-400/30 bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30 hover:text-white"
                            >
                              <HugeiconsIcon icon={PlusSignIcon} size={13} />
                              Add
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-center font-mono text-xs text-emerald-400/80">
                  ✓ Maximum team limit reached ({maxAllowed} members).
                </p>
              )}
            </div>

            {/* Leader Academic & Contact Details (Auto-fetched & Editable) */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
                  Leader Details (Auto-Fetched from Profile)
                </span>
                <span className="font-mono text-[11px] text-cyan-300/80">
                  Editable if details changed
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-white/70 uppercase">
                    Phone / WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-white/70 uppercase">
                    College Roll / ID No.{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    placeholder="e.g. 26CS1049"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-white/70 uppercase">
                    Branch <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE, CS-AIML, IT, ECE"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-white/70 uppercase">
                    Section <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. Section A, Section B"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
                  />
                </div>
              </div>
            </div>

            {/* Status alerts */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">
                <HugeiconsIcon icon={Alert01Icon} size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || !isTeamSizeValid || !teamName.trim()}
                className="btn-primary px-6 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Registering Team..." : "Confirm & Register Team"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
