"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  PlusSignIcon,
  Delete02Icon,
  Shield01Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  Copy01Icon,
  Tick01Icon,
  ArrowRight01Icon,
  Edit02Icon,
  Clock01Icon,
  Time02Icon,
  NewTwitterIcon,
  Linkedin02Icon,
  WhatsappIcon,
  InstagramIcon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { SearchMemberResult } from "@/app/api/members/search/route";
import { normalizePhone, isValidPhone, normalizeRollNo } from "@/lib/utils";

export type EventTeamInfo = {
  id: string;
  name: string;
  leaderId: string;
  isLeader: boolean;
  members: {
    profileId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    branch: string;
    year: string;
    role: "Leader" | "Member";
    status: string; // 'accepted' | 'pending'
    phone?: string;
    collegeId?: string;
    section?: string;
  }[];
  maxMembers: number;
  canAddMore: boolean;
};

export type TeamInvitation = {
  teamId: string;
  teamName: string;
  leaderUsername: string;
  leaderDisplayName: string;
  leaderAvatarUrl: string;
  invitedAt: string;
};

export default function EventTeamManager({
  slug,
  team,
  invitations = [],
  currentUser,
  onRefresh,
}: {
  slug: string;
  team: EventTeamInfo | null;
  invitations?: TeamInvitation[];
  currentUser?: {
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
  onRefresh: () => void;
}) {
  // Member invite search & teammate details state
  const [memberSearch, setMemberSearch] = useState("");
  const [searchingMember, setSearchingMember] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMemberResult[]>([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<SearchMemberResult | null>(null);

  // Teammate details to collect just like registration form
  const [candidatePhone, setCandidatePhone] = useState("");
  const [candidateCollegeId, setCandidateCollegeId] = useState("");
  const [candidateBranch, setCandidateBranch] = useState("CSE");
  const [candidateSection, setCandidateSection] = useState("");
  const [candidateYear, setCandidateYear] = useState("3rd Year");

  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedStory, setCopiedStory] = useState(false);

  // Round 1 Contest Timer (13 Oct 2026, 7:00 PM IST)
  const [round1Timer, setRound1Timer] = useState<{
    expired: boolean;
    label: string;
  }>({ expired: false, label: "" });

  useEffect(() => {
    const checkSchedule = () => {
      const now = Date.now();
      const start = new Date("2026-10-13T19:00:00+05:30").getTime();
      const diff = start - now;

      if (diff <= 0) {
        setRound1Timer({ expired: true, label: "Live Now" });
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        const label =
          d > 0
            ? `${d}d ${h}h left`
            : `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        setRound1Timer({ expired: false, label });
      }
    };
    checkSchedule();
    const interval = setInterval(checkSchedule, 1000);
    return () => clearInterval(interval);
  }, []);

  // Invitation acceptance details modal state
  const [acceptingInv, setAcceptingInv] = useState<TeamInvitation | null>(null);
  const [memberPhone, setMemberPhone] = useState(currentUser?.phone || "");
  const [memberRoll, setMemberRoll] = useState(currentUser?.collegeId || "");
  const [memberBranch, setMemberBranch] = useState(
    currentUser?.branch || "CSE",
  );
  const [memberSection, setMemberSection] = useState(
    currentUser?.section || "",
  );
  const [submittingAccept, setSubmittingAccept] = useState(false);

  // Sync member details from currentUser when available
  const handleOpenAcceptModal = (inv: TeamInvitation) => {
    setAcceptingInv(inv);
    if (currentUser?.phone) setMemberPhone(currentUser.phone);
    if (currentUser?.collegeId) setMemberRoll(currentUser.collegeId);
    if (currentUser?.branch) setMemberBranch(currentUser.branch);
    if (currentUser?.section) setMemberSection(currentUser.section);
    setActionError("");
  };

  // Confirm and accept invitation with academic/contact details
  const handleConfirmAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingInv) return;

    if (
      !memberPhone.trim() ||
      !memberRoll.trim() ||
      !memberBranch.trim() ||
      !memberSection.trim()
    ) {
      setActionError(
        "Please fill in all details (Phone, Roll No., Branch, and Section).",
      );
      return;
    }

    if (!isValidPhone(memberPhone)) {
      setActionError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const cleanMemberPhone = normalizePhone(memberPhone);
    const cleanMemberRoll = normalizeRollNo(memberRoll);

    if (!cleanMemberRoll || cleanMemberRoll.length < 2) {
      setActionError("Please enter a valid college roll number / ID.");
      return;
    }

    setSubmittingAccept(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/events/${slug}/team/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: acceptingInv.teamId,
          action: "accept",
          phone: cleanMemberPhone,
          collegeId: cleanMemberRoll,
          branch: memberBranch.trim(),
          section: memberSection.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process invitation.");
      }
      setActionSuccess(data.message);
      setAcceptingInv(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to process invitation.");
    } finally {
      setSubmittingAccept(false);
    }
  };

  // Team name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(team?.name || "");
  const [savingName, setSavingName] = useState(false);

  // Respond to invitation (Decline directly)
  const handleDeclineInvitation = async (teamId: string) => {
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`/api/events/${slug}/team/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, action: "decline" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process invitation.");
      }
      setActionSuccess(data.message);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to process invitation.");
    }
  };

  const handleSaveTeamName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !editedName.trim() || editedName.trim() === team.name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/events/${slug}/team`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, name: editedName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename team.");
      setActionSuccess(`Team renamed to "${data.name}"!`);
      setIsEditingName(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to rename team.");
    } finally {
      setSavingName(false);
    }
  };

  // Debounced search for teammates
  useEffect(() => {
    if (!memberSearch.trim() || selectedCandidate) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingMember(true);
      try {
        const res = await fetch(
          `/api/members/search?q=${encodeURIComponent(memberSearch.trim())}&selfId=${currentUser?.id || ""}`,
        );
        if (!res.ok) {
          setSearchResults([]);
          return;
        }
        const data = await res.json();
        const existingMemberIds = new Set(
          team?.members.map((m) => m.profileId) || [],
        );
        if (currentUser?.id) existingMemberIds.add(currentUser.id);

        const filtered = (data.results || []).filter(
          (u: SearchMemberResult) => !existingMemberIds.has(u.id),
        );
        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchingMember(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [memberSearch, selectedCandidate, currentUser?.id, team?.members]);

  const handleSelectCandidate = (u: SearchMemberResult) => {
    setSelectedCandidate(u);
    setMemberSearch("");
    setSearchResults([]);
    setCandidateBranch(u.branch || "CSE");
    setCandidateYear(u.year || "3rd Year");
    setActionError("");
    setActionSuccess("");
  };

  const handleClearSelectedCandidate = () => {
    setSelectedCandidate(null);
    setMemberSearch("");
    setSearchResults([]);
    setCandidatePhone("");
    setCandidateCollegeId("");
    setCandidateSection("");
    setCandidateBranch("CSE");
    setCandidateYear("3rd Year");
    setActionError("");
  };

  const handleSendInvitation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!team || !selectedCandidate) return;
    setActionError("");
    setActionSuccess("");

    if (
      !candidatePhone.trim() ||
      !candidateCollegeId.trim() ||
      !candidateBranch.trim() ||
      !candidateSection.trim()
    ) {
      setActionError(
        "Please fill out all teammate details (Phone, Roll No., Branch, Section).",
      );
      return;
    }

    if (!isValidPhone(candidatePhone)) {
      setActionError(
        "Please enter a valid 10-digit mobile number for your teammate.",
      );
      return;
    }

    const cleanCandidatePhone = normalizePhone(candidatePhone);
    const cleanCandidateRoll = normalizeRollNo(candidateCollegeId);

    if (!cleanCandidateRoll || cleanCandidateRoll.length < 2) {
      setActionError(
        "Please enter a valid college roll number for your teammate.",
      );
      return;
    }

    // Check against leader phone & roll
    const cleanLeaderPhone = normalizePhone(currentUser?.phone || "");
    if (cleanLeaderPhone && cleanLeaderPhone === cleanCandidatePhone) {
      setActionError(
        "Leader and Teammate cannot have the same phone number. Duplicate phone numbers are not allowed.",
      );
      return;
    }

    const cleanLeaderRoll = normalizeRollNo(currentUser?.collegeId || "");
    if (cleanLeaderRoll && cleanLeaderRoll === cleanCandidateRoll) {
      setActionError(
        "Leader and Teammate cannot have the same college roll number. Duplicate roll numbers are not allowed.",
      );
      return;
    }

    // Check against existing teammates
    for (const m of team.members) {
      if (m.phone && normalizePhone(m.phone) === cleanCandidatePhone) {
        setActionError(
          `Teammate @${m.username} already uses this phone number. Duplicate phone numbers are not allowed.`,
        );
        return;
      }
      if (m.collegeId && normalizeRollNo(m.collegeId) === cleanCandidateRoll) {
        setActionError(
          `Teammate @${m.username} already uses this college roll number. Duplicate roll numbers are not allowed.`,
        );
        return;
      }
    }

    setAdding(true);

    try {
      const res = await fetch(`/api/events/${slug}/team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          usernameOrEmail: selectedCandidate.username,
          phone: cleanCandidatePhone,
          collegeId: cleanCandidateRoll,
          branch: candidateBranch.trim(),
          section: candidateSection.trim(),
          year: candidateYear.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not invite teammate.");
      }

      setActionSuccess(
        data.message || `Invitation sent to @${selectedCandidate.username}!`,
      );
      handleClearSelectedCandidate();
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to invite teammate.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (profileId: string, username: string) => {
    if (!team) return;
    if (
      !confirm(
        `Are you sure you want to remove @${username} from ${team.name}?`,
      )
    ) {
      return;
    }
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(
        `/api/events/${slug}/team?teamId=${team.id}&memberProfileId=${profileId}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove member.");
      }
      setActionSuccess(`Removed @${username} from team.`);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to remove member.");
    }
  };

  const handleWithdrawTeam = async () => {
    if (!team) return;
    if (
      !confirm(
        "Are you sure you want to withdraw your team's registration? This will disband the team.",
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/events/${slug}/team?teamId=${team.id}&action=withdraw`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Withdrawal failed");
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to withdraw.");
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    if (!confirm(`Are you sure you want to leave team "${team.name}"?`)) return;
    try {
      const res = await fetch(
        `/api/events/${slug}/team?teamId=${team.id}&action=leave`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Could not leave team");
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to leave team.");
    }
  };

  const teamShowcaseUrl = team
    ? typeof window !== "undefined"
      ? `${window.location.origin}/events/${slug}/team/@${encodeURIComponent(team.name)}`
      : `/events/${slug}/team/@${encodeURIComponent(team.name)}`
    : "";

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(
        `We are participating in DEBUG DECRYPT 3.0! Join or check out team "${team?.name}" at: ${teamShowcaseUrl}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyStory = async () => {
    try {
      await navigator.clipboard.writeText(
        `⚡ WE ARE PARTICIPATING IN DEBUG DECRYPT 3.0\nTeam: ${team?.name}\n15 OCT 2026 · Dronacharya College of Engineering\nCheck our team: ${teamShowcaseUrl}`,
      );
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* 1. Pending Incoming Invitations Section */}
      {invitations.length > 0 && (
        <div className="rounded-3xl border border-cyan-500/25 bg-[#0a0f1d] p-5 shadow-2xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-2 w-2 animate-ping rounded-full bg-cyan-400" />
            <span className="font-heading text-xs font-bold tracking-wider text-cyan-300 uppercase">
              Pending Team Invitations ({invitations.length})
            </span>
          </div>

          <div className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.teamId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <div>
                  <p className="text-sm font-bold text-white">{inv.teamName}</p>
                  <p className="font-mono text-xs text-white/50">
                    Invited by @{inv.leaderUsername} ({inv.leaderDisplayName})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAcceptModal(inv)}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/30"
                  >
                    Accept Invitation
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(inv.teamId)}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Invitation Acceptance Modal */}
      <AnimatePresence>
        {acceptingInv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submittingAccept && setAcceptingInv(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-10 my-auto w-full max-w-lg rounded-3xl border border-white/15 bg-[#090d16] p-6 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                    <HugeiconsIcon icon={UserGroupIcon} size={13} />
                    <span>Join Team Roster</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white">
                    Accept Invitation: {acceptingInv.teamName}
                  </h3>
                  <p className="font-mono text-xs text-white/50">
                    Leader: @{acceptingInv.leaderUsername} (
                    {acceptingInv.leaderDisplayName})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => !submittingAccept && setAcceptingInv(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>

              <form onSubmit={handleConfirmAccept} className="mt-5 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-white/70">
                  <p className="font-medium text-white/90">
                    Confirm your academic & contact details
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/50">
                    Auto-fetched from your profile. Please check and edit if
                    needed before confirming your slot.
                  </p>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold tracking-wider text-white/70 uppercase">
                      Phone / WhatsApp <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold tracking-wider text-white/70 uppercase">
                      College Roll / ID No.{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={memberRoll}
                      onChange={(e) => setMemberRoll(e.target.value)}
                      placeholder="e.g. 26CS1049"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold tracking-wider text-white/70 uppercase">
                      Branch <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={memberBranch}
                      onChange={(e) => setMemberBranch(e.target.value)}
                      placeholder="e.g. CSE, CS-AIML, IT, ECE"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold tracking-wider text-white/70 uppercase">
                      Section <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={memberSection}
                      onChange={(e) => setMemberSection(e.target.value)}
                      placeholder="e.g. Section A, Section B"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 font-mono text-[11px] text-amber-200/90">
                  ⚠ Note: You can only be a confirmed member of 1 team for this
                  event.
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-white/[0.08] pt-3">
                  <button
                    type="button"
                    disabled={submittingAccept}
                    onClick={() => setAcceptingInv(null)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submittingAccept ||
                      !memberPhone.trim() ||
                      !memberRoll.trim() ||
                      !memberBranch.trim() ||
                      !memberSection.trim()
                    }
                    className="btn-primary px-5 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    {submittingAccept ? "Joining..." : "Confirm & Join Team"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Registered Active Team Panel */}
      {team && (
        <div className="rounded-3xl border border-white/10 bg-[#0a0e19] p-5 shadow-xl sm:p-6">
          {/* Team Header & Renaming */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                  Registered Team
                </span>
                <span className="font-mono text-xs text-white/40">
                  ({team.members.length} / {team.maxMembers} Members)
                </span>
              </div>

              {isEditingName ? (
                <form
                  onSubmit={handleSaveTeamName}
                  className="mt-2 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    required
                    className="font-heading rounded-xl border border-blue-500/50 bg-black/60 px-3 py-1.5 text-lg font-bold text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingName}
                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-500"
                  >
                    {savingName ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditedName(team.name);
                    }}
                    className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="mt-1.5 flex items-center gap-2.5">
                  <h3 className="font-heading text-xl font-extrabold text-white sm:text-2xl">
                    {team.name}
                  </h3>
                  {team.isLeader && (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      title="Edit team name"
                      className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <HugeiconsIcon icon={Edit02Icon} size={15} />
                    </button>
                  )}
                </div>
              )}

              <p className="mt-1 font-mono text-xs text-white/50">
                {team.isLeader
                  ? "You are the Team Leader"
                  : "You are a Team Member"}
              </p>
            </div>

            {/* Direct Link to Team Showcase Card & Round 1 Button */}
            <div className="flex flex-wrap items-center gap-2">
              {slug === "debug-decrypt-3.0" &&
                (round1Timer.expired ? (
                  <Link
                    href="/debug-decrypt-3.0/round-1"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] hover:brightness-110"
                  >
                    <span>⚡ Attempt Round 1</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Link>
                ) : (
                  <div
                    title="Round 1 goes live on October 13 at 7:00 PM IST"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300"
                  >
                    <HugeiconsIcon
                      icon={Time02Icon}
                      size={14}
                      className="text-cyan-400"
                    />
                    <span>Round 1 in {round1Timer.label}</span>
                  </div>
                ))}

              <Link
                href={`/events/${slug}/team/@${encodeURIComponent(team.name)}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-bold text-blue-300 transition-colors hover:bg-blue-500/20"
              >
                <span>View Team Card</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </div>
          </div>

          {/* Members Roster List */}
          <div className="mt-4 space-y-2.5">
            {team.members.map((m) => (
              <div
                key={m.profileId}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-3 transition-colors hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/[0.05]">
                    {m.avatarUrl ? (
                      <Image
                        src={m.avatarUrl}
                        alt={m.displayName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-white/60">
                        {m.displayName?.[0] || "M"}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {m.displayName}
                      </span>
                      {m.role === "Leader" ? (
                        <span className="py-0.2 inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 text-[10px] font-semibold text-amber-300">
                          <HugeiconsIcon icon={Shield01Icon} size={11} />
                          Leader
                        </span>
                      ) : (
                        <span className="py-0.2 rounded-full border border-blue-400/20 bg-blue-500/10 px-2 text-[10px] font-medium text-blue-300">
                          Member
                        </span>
                      )}

                      {/* Request status badge */}
                      {m.status === "pending" ? (
                        <span className="py-0.2 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 text-[10px] font-semibold text-amber-300">
                          <HugeiconsIcon icon={Clock01Icon} size={10} />
                          Invite Sent
                        </span>
                      ) : (
                        <span className="py-0.2 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-300">
                          Accepted
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-white/45">
                      @{m.username} · {m.branch} · {m.year}
                    </p>
                  </div>
                </div>

                {/* Leader action: delete member */}
                {team.isLeader && m.role !== "Leader" && (
                  <button
                    onClick={() => handleRemoveMember(m.profileId, m.username)}
                    title="Remove teammate"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Teammate Section (Leader only) */}
          {team.canAddMore && team.isLeader && (
            <div className="mt-4 border-t border-white/[0.08] pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-white uppercase">
                    Invite {team.members.length === 1 ? "2nd" : "3rd"} Member
                  </h4>
                  <p className="text-[11px] text-white/50">
                    Search by username, name or email &amp; enter their details
                    to send an invitation.
                  </p>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300">
                  {team.members.length} / {team.maxMembers} Members
                </span>
              </div>

              {!selectedCandidate ? (
                /* 1. Search Box with Live Suggestions */
                <div className="relative">
                  <div className="relative">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={16}
                      className="absolute top-1/2 left-3.5 -translate-y-1/2 text-white/40"
                    />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Type username (e.g. @username) or name..."
                      className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pr-24 pl-10 text-xs text-white placeholder-white/30 transition-colors outline-none focus:border-cyan-400 sm:text-sm"
                    />
                    {searchingMember && (
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[10px] text-cyan-300">
                        Searching...
                      </span>
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {(searchResults.length > 0 ||
                    memberSearch.trim().length >= 2) && (
                    <div className="mt-2 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/15 bg-[#0e1424] shadow-2xl">
                      {searchResults.map((u) => (
                        <button
                          type="button"
                          key={u.id}
                          onClick={() => handleSelectCandidate(u)}
                          className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.05]"
                        >
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                            {u.avatarUrl ? (
                              <Image
                                src={u.avatarUrl}
                                alt={u.displayName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/50">
                                {u.displayName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-white">
                              {u.displayName}
                            </p>
                            <p className="truncate font-mono text-[10px] text-white/40">
                              @{u.username} · {u.branch || "CSE"} ·{" "}
                              {u.year || "3rd Year"}
                            </p>
                          </div>
                          <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 font-mono text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/30">
                            Select
                          </span>
                        </button>
                      ))}

                      {/* Option to invite custom handle directly */}
                      {memberSearch.trim().length >= 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const clean = memberSearch.trim().replace(/^@/, "");
                            handleSelectCandidate({
                              id: "",
                              username: clean,
                              displayName: clean,
                              email: memberSearch.includes("@")
                                ? memberSearch.trim()
                                : "",
                              avatarUrl: "",
                              branch: "CSE",
                              year: "3rd Year",
                            });
                          }}
                          className="flex w-full items-center justify-between bg-white/[0.02] p-2.5 text-left transition-colors hover:bg-cyan-500/10"
                        >
                          <span className="truncate font-mono text-[11px] text-cyan-300">
                            Invite &quot;@
                            {memberSearch.trim().replace(/^@/, "")}&quot;
                            directly
                          </span>
                          <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-200">
                            Fill Details →
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* 2. Selected Candidate & Details Form (just like registration form) */
                <form onSubmit={handleSendInvitation} className="space-y-3">
                  {/* Selected Teammate Header Card */}
                  <div className="flex items-center justify-between rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/5">
                        {selectedCandidate.avatarUrl ? (
                          <Image
                            src={selectedCandidate.avatarUrl}
                            alt={selectedCandidate.displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60">
                            {selectedCandidate.displayName
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">
                          {selectedCandidate.displayName}
                        </p>
                        <p className="truncate font-mono text-[10px] text-cyan-300">
                          @{selectedCandidate.username}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearSelectedCandidate}
                      className="flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} />
                      <span>Change</span>
                    </button>
                  </div>

                  {/* Form Details Grid */}
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <p className="mb-3 font-mono text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
                      Teammate Details (Will show in request &amp; portal):
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={candidatePhone}
                          onChange={(e) => setCandidatePhone(e.target.value)}
                          placeholder="10-digit mobile"
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                          College Roll No. / ID *
                        </label>
                        <input
                          type="text"
                          value={candidateCollegeId}
                          onChange={(e) =>
                            setCandidateCollegeId(e.target.value)
                          }
                          placeholder="e.g. 26042"
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                          Branch *
                        </label>
                        <select
                          value={candidateBranch}
                          onChange={(e) => setCandidateBranch(e.target.value)}
                          required
                          className="w-full rounded-xl border border-white/10 bg-[#0e1424] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                        >
                          <option value="CSE">
                            Computer Science &amp; Engineering (CSE)
                          </option>
                          <option value="IT">
                            Information Technology (IT)
                          </option>
                          <option value="ECE">
                            Electronics &amp; Comm. (ECE)
                          </option>
                          <option value="CSIT">
                            Computer Science &amp; IT (CSIT)
                          </option>
                          <option value="AIML">
                            AI &amp; Machine Learning (AIML)
                          </option>
                          <option value="Robotics">
                            Robotics &amp; Automation
                          </option>
                          <option value="Other">Other Branch</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                          Section *
                        </label>
                        <input
                          type="text"
                          value={candidateSection}
                          onChange={(e) => setCandidateSection(e.target.value)}
                          placeholder="e.g. A, B, C"
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
                      <div className="w-full sm:w-48">
                        <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                          Year of Study *
                        </label>
                        <select
                          value={candidateYear}
                          onChange={(e) => setCandidateYear(e.target.value)}
                          required
                          className="w-full rounded-xl border border-white/10 bg-[#0e1424] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                        >
                          <option value="1st Year">1st Year (Freshers)</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleClearSelectedCandidate}
                          className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/70 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            adding ||
                            !candidatePhone.trim() ||
                            !candidateCollegeId.trim() ||
                            !candidateBranch.trim() ||
                            !candidateSection.trim()
                          }
                          className="btn-primary flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-40"
                        >
                          <HugeiconsIcon icon={PlusSignIcon} size={15} />
                          <span>
                            {adding
                              ? "Sending Invitation..."
                              : `Send Team Invitation to @${selectedCandidate.username}`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Social Sharing bar for team */}
          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
            <p className="mb-2 text-xs font-semibold text-white/80">
              Share your team card on socials:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyStory}
                className="flex items-center gap-1.5 rounded-xl border border-pink-500/30 bg-pink-500/10 px-3 py-1.5 text-xs font-semibold text-pink-300 transition-colors hover:bg-pink-500/20"
              >
                <HugeiconsIcon icon={InstagramIcon} size={14} />
                <span>{copiedStory ? "Story Copied!" : "Instagram Story"}</span>
              </button>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `We are participating in DEBUG DECRYPT 3.0! Meet team "${team.name}" on Deviators Club:`,
                )}&url=${encodeURIComponent(teamShowcaseUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
              >
                <HugeiconsIcon icon={NewTwitterIcon} size={13} />
                <span>Post on X</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(teamShowcaseUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-600/15 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-600/25"
              >
                <HugeiconsIcon icon={Linkedin02Icon} size={13} />
                <span>LinkedIn</span>
              </a>

              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <HugeiconsIcon
                  icon={copied ? Tick01Icon : Copy01Icon}
                  size={13}
                  className={copied ? "text-emerald-400" : ""}
                />
                <span>{copied ? "Link Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Action alerts */}
          {actionError && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-300">
              <HugeiconsIcon icon={Alert01Icon} size={14} />
              {actionError}
            </p>
          )}
          {actionSuccess && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
              {actionSuccess}
            </p>
          )}

          {/* Leader disband / Member leave options */}
          <div className="mt-4 flex justify-end border-t border-white/[0.08] pt-3">
            {team.isLeader ? (
              <button
                onClick={handleWithdrawTeam}
                className="text-xs text-red-400/60 underline transition-colors hover:text-red-300"
              >
                Disband & Withdraw Team
              </button>
            ) : (
              <button
                onClick={handleLeaveTeam}
                className="text-xs text-red-400/60 underline transition-colors hover:text-red-300"
              >
                Leave Team
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
