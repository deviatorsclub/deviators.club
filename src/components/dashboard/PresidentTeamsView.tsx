"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CrownIcon,
  Search01Icon,
  UserGroupIcon,
  CheckmarkCircle01Icon,
  Time02Icon,
  Download01Icon,
  RefreshIcon,
  Mail01Icon,
  CallIcon,
  IdIcon,
  MortarboardIcon,
} from "@hugeicons/core-free-icons";

type TeamMember = {
  profileId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  phone: string;
  collegeId: string;
  branch: string;
  section: string;
  year: string;
  status: "accepted" | "pending";
  isLeader: boolean;
};

type RegisteredTeam = {
  id: string;
  name: string;
  createdAt: string;
  leader: {
    profileId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    email: string;
    phone: string;
    collegeId: string;
    branch: string;
    section: string;
    year: string;
  };
  members: TeamMember[];
  memberCount: number;
  acceptedCount: number;
  pendingCount: number;
  round1?: {
    hasAttempted: boolean;
    status: "submitted" | "terminated" | "in_progress" | "not_started";
    score: number | null;
    maxScore: number | null;
    submittedAt: string | null;
    strikes: number;
  };
};

export default function PresidentTeamsView() {
  const [teams, setTeams] = useState<RegisteredTeam[]>([]);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalConfirmed: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "complete" | "pending" | "round1"
  >("all");

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/teams", { headers });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load registration data.");
        setLoading(false);
        return;
      }
      setTeams(data.teams || []);
      setStats(
        data.stats || { totalTeams: 0, totalConfirmed: 0, totalPending: 0 },
      );
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams.filter((t) => {
      // Status filter
      if (filterStatus === "complete" && t.acceptedCount < 3) return false;
      if (filterStatus === "pending" && t.pendingCount === 0) return false;
      if (filterStatus === "round1" && !t.round1?.hasAttempted) return false;

      // Text search
      if (!q) return true;
      const teamMatch = t.name.toLowerCase().includes(q);
      const leaderMatch =
        t.leader.displayName.toLowerCase().includes(q) ||
        t.leader.username.toLowerCase().includes(q) ||
        t.leader.collegeId.toLowerCase().includes(q) ||
        t.leader.phone.toLowerCase().includes(q);
      const memberMatch = t.members.some(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.username.toLowerCase().includes(q) ||
          m.collegeId.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          m.branch.toLowerCase().includes(q),
      );
      return teamMatch || leaderMatch || memberMatch;
    });
  }, [teams, search, filterStatus]);

  // Export to CSV
  const exportCsv = () => {
    if (teams.length === 0) return;

    const escapeCsv = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      "S.No",
      "Team ID",
      "Team Name",
      "Created Date",
      "Total Members",
      "Accepted Members",
      "Pending Invites",
      "Leader Name",
      "Leader Handle",
      "Leader Email",
      "Leader Phone",
      "Leader Roll No",
      "Leader Branch",
      "Leader Section",
      "Leader Year",
      "Teammate 2 Name",
      "Teammate 2 Handle",
      "Teammate 2 Email",
      "Teammate 2 Phone",
      "Teammate 2 Roll No",
      "Teammate 2 Branch",
      "Teammate 2 Section",
      "Teammate 2 Status",
      "Teammate 3 Name",
      "Teammate 3 Handle",
      "Teammate 3 Email",
      "Teammate 3 Phone",
      "Teammate 3 Roll No",
      "Teammate 3 Branch",
      "Teammate 3 Section",
      "Teammate 3 Status",
      "Round 1 Status",
      "Round 1 Score",
      "Round 1 Max Score",
      "Round 1 Submitted At",
      "Round 1 Strikes",
      "All Members Summary",
    ];

    const rows = teams.map((t, idx) => {
      // Find teammates (non-leaders)
      const teammates = t.members.filter(
        (m) => m.profileId !== t.leader.profileId && !m.isLeader,
      );
      const m2 = teammates[0];
      const m3 = teammates[1];

      const membersSummary = t.members
        .map(
          (m) =>
            `${m.displayName} (@${m.username}, ${m.status}, Roll: ${m.collegeId || "N/A"}, Phone: ${m.phone || "N/A"}, Branch: ${m.branch || "N/A"})`,
        )
        .join(" | ");

      const r1Status = t.round1?.hasAttempted
        ? t.round1.status
        : "Not Attempted";
      const r1Score =
        t.round1?.score !== null && t.round1?.score !== undefined
          ? t.round1.score
          : "N/A";
      const r1Max = t.round1?.maxScore ?? 30;
      const r1SubmittedAt = t.round1?.submittedAt
        ? new Date(t.round1.submittedAt).toLocaleString()
        : "N/A";
      const r1Strikes = t.round1?.strikes ?? 0;

      return [
        idx + 1,
        escapeCsv(t.id),
        escapeCsv(t.name),
        escapeCsv(new Date(t.createdAt).toLocaleString()),
        t.memberCount,
        t.acceptedCount,
        t.pendingCount,
        // Leader
        escapeCsv(t.leader.displayName),
        escapeCsv(`@${t.leader.username}`),
        escapeCsv(t.leader.email),
        escapeCsv(t.leader.phone),
        escapeCsv(t.leader.collegeId),
        escapeCsv(t.leader.branch),
        escapeCsv(t.leader.section),
        escapeCsv(t.leader.year),
        // Teammate 2
        escapeCsv(m2?.displayName || ""),
        escapeCsv(m2 ? `@${m2.username}` : ""),
        escapeCsv(m2?.email || ""),
        escapeCsv(m2?.phone || ""),
        escapeCsv(m2?.collegeId || ""),
        escapeCsv(m2?.branch || ""),
        escapeCsv(m2?.section || ""),
        escapeCsv(m2?.status || ""),
        // Teammate 3
        escapeCsv(m3?.displayName || ""),
        escapeCsv(m3 ? `@${m3.username}` : ""),
        escapeCsv(m3?.email || ""),
        escapeCsv(m3?.phone || ""),
        escapeCsv(m3?.collegeId || ""),
        escapeCsv(m3?.branch || ""),
        escapeCsv(m3?.section || ""),
        escapeCsv(m3?.status || ""),
        // Round 1
        escapeCsv(r1Status),
        escapeCsv(r1Score),
        escapeCsv(r1Max),
        escapeCsv(r1SubmittedAt),
        escapeCsv(r1Strikes),
        // Full summary
        escapeCsv(membersSummary),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `debug_decrypt_teams_all_${teams.length}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-[#12080a] p-8 text-center text-red-300">
        <HugeiconsIcon
          icon={CrownIcon}
          size={36}
          className="mx-auto mb-3 text-red-400 opacity-80"
        />
        <h3 className="font-heading text-lg font-bold text-white">
          Authorized Access Only
        </h3>
        <p className="mt-1 text-sm text-red-300/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Executive Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300">
              <HugeiconsIcon icon={CrownIcon} size={16} />
            </span>
            <h2 className="font-heading text-xl font-black tracking-tight text-white sm:text-2xl">
              Teams Roster · Debug Decrypt 3.0
            </h2>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Real-time registered teams, member confirmations, and participant
            roll sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/event/debug-decrypt-3.0/round-1"
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-300 transition-colors hover:bg-cyan-500/25"
          >
            <span>⚡ Test Sandbox (Round 1)</span>
          </Link>
          <Link
            href="/event/debug-decrypt-3.0/round-1/leaderboard"
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/25"
          >
            <span>🏆 Live Leaderboard</span>
          </Link>
          <button
            type="button"
            onClick={fetchTeams}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              size={14}
              className={loading ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={teams.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25"
          >
            <HugeiconsIcon icon={Download01Icon} size={14} />
            <span>Export CSV ({teams.length})</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0c111e]/80 p-4">
          <div className="flex items-center justify-between text-white/50">
            <span className="font-mono text-xs font-semibold uppercase">
              Total Teams
            </span>
            <HugeiconsIcon
              icon={UserGroupIcon}
              size={16}
              className="text-blue-400"
            />
          </div>
          <p className="font-heading mt-2 text-3xl font-black text-white">
            {stats.totalTeams}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#081510]/80 p-4">
          <div className="flex items-center justify-between text-emerald-300/60">
            <span className="font-mono text-xs font-semibold uppercase">
              Confirmed Members
            </span>
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              size={16}
              className="text-emerald-400"
            />
          </div>
          <p className="font-heading mt-2 text-3xl font-black text-emerald-300">
            {stats.totalConfirmed}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-[#161208]/80 p-4">
          <div className="flex items-center justify-between text-amber-300/60">
            <span className="font-mono text-xs font-semibold uppercase">
              Pending Invites
            </span>
            <HugeiconsIcon
              icon={Time02Icon}
              size={16}
              className="text-amber-400"
            />
          </div>
          <p className="font-heading mt-2 text-3xl font-black text-amber-300">
            {stats.totalPending}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/35"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team name, member name, handle, roll no, or phone..."
            className="w-full rounded-xl border border-white/10 bg-[#0a0e19] py-2.5 pr-4 pl-10 text-xs text-white placeholder-white/30 focus:border-amber-400/40 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0a0e19] p-1">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === "all"
                ? "bg-amber-400/20 text-amber-300"
                : "text-white/50 hover:text-white"
            }`}
          >
            All ({teams.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("complete")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === "complete"
                ? "bg-emerald-500/20 text-emerald-300"
                : "text-white/50 hover:text-white"
            }`}
          >
            Full (3/3)
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === "pending"
                ? "bg-amber-500/20 text-amber-300"
                : "text-white/50 hover:text-white"
            }`}
          >
            Has Pending
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("round1")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === "round1"
                ? "bg-purple-500/20 text-purple-300"
                : "text-white/50 hover:text-white"
            }`}
          >
            Round 1 ({teams.filter((t) => t.round1?.hasAttempted).length})
          </button>
        </div>
      </div>

      {/* Team Cards Roster */}
      {loading ? (
        <div className="py-16 text-center font-mono text-xs text-white/40">
          Loading registration rosters...
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0c111e]/40 py-16 text-center">
          <p className="font-heading text-sm font-semibold text-white/60">
            No teams found
          </p>
          <p className="mt-1 font-mono text-xs text-white/35">
            {search
              ? `No results matching "${search}"`
              : "No teams have registered yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTeams.map((team, idx) => {
            const isFull = team.acceptedCount === 3;
            return (
              <div
                key={team.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1d]/90 shadow-xl transition-all duration-200 hover:border-white/20"
              >
                {/* Team Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-extrabold text-white/40">
                      #{idx + 1}
                    </span>
                    <h3 className="font-heading text-base font-extrabold text-white">
                      {team.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Round 1 Score Badge */}
                    {team.round1?.hasAttempted ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                          team.round1.status === "submitted"
                            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                            : team.round1.status === "terminated"
                              ? "border-red-400/40 bg-red-500/15 text-red-300"
                              : "animate-pulse border-cyan-400/40 bg-cyan-500/15 text-cyan-300"
                        }`}
                        title={
                          team.round1.submittedAt
                            ? `Submitted: ${new Date(team.round1.submittedAt).toLocaleTimeString()}`
                            : undefined
                        }
                      >
                        {team.round1.status === "submitted"
                          ? `Round 1: ${team.round1.score}/${team.round1.maxScore ?? 30} pts`
                          : team.round1.status === "terminated"
                            ? `Round 1: Terminated (${team.round1.score ?? 0}/${team.round1.maxScore ?? 30})`
                            : "Round 1: In Progress"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 font-mono text-[11px] text-white/40">
                        Round 1: Not Attempted
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                        isFull
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                          : "border-amber-400/30 bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {isFull ? (
                        <>
                          <HugeiconsIcon
                            icon={CheckmarkCircle01Icon}
                            size={12}
                          />
                          Complete (3/3)
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon icon={Time02Icon} size={12} />
                          {team.acceptedCount}/{team.memberCount} Confirmed
                        </>
                      )}
                    </span>
                    <span className="font-mono text-[11px] text-white/40">
                      {new Date(team.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Team Members Roster Grid */}
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {team.members.map((member) => {
                    const isAccepted = member.status === "accepted";
                    return (
                      <div
                        key={member.profileId}
                        className={`relative rounded-xl border p-3.5 transition-all ${
                          member.isLeader
                            ? "border-amber-400/30 bg-gradient-to-br from-amber-500/[0.06] to-transparent"
                            : isAccepted
                              ? "border-white/10 bg-white/[0.02]"
                              : "border-amber-500/20 bg-amber-500/[0.03]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5">
                              {member.avatarUrl ? (
                                <Image
                                  src={member.avatarUrl}
                                  alt={member.displayName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/50">
                                  {member.displayName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-white">
                                {member.displayName}
                              </p>
                              <p className="truncate font-mono text-[10px] text-white/45">
                                @{member.username}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-extrabold uppercase ${
                              member.isLeader
                                ? "border border-amber-400/40 bg-amber-400/20 text-amber-200"
                                : isAccepted
                                  ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                  : "border border-amber-400/30 bg-amber-500/10 text-amber-300"
                            }`}
                          >
                            {member.isLeader
                              ? "Leader"
                              : isAccepted
                                ? "Accepted"
                                : "Request Sent"}
                          </span>
                        </div>

                        {/* Details: Contact, Branch, Roll */}
                        <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-2.5 text-[11px] text-white/70">
                          {member.email && (
                            <div className="flex items-center gap-1.5 truncate">
                              <HugeiconsIcon
                                icon={Mail01Icon}
                                size={12}
                                className="shrink-0 text-white/40"
                              />
                              <span className="truncate">{member.email}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center gap-1.5">
                              <HugeiconsIcon
                                icon={CallIcon}
                                size={12}
                                className="shrink-0 text-white/40"
                              />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {(member.branch || member.section) && (
                            <div className="flex items-center gap-1.5">
                              <HugeiconsIcon
                                icon={MortarboardIcon}
                                size={12}
                                className="shrink-0 text-white/40"
                              />
                              <span>
                                {member.branch}
                                {member.section
                                  ? ` · Sec ${member.section}`
                                  : ""}
                              </span>
                            </div>
                          )}
                          {member.collegeId && (
                            <div className="flex items-center gap-1.5">
                              <HugeiconsIcon
                                icon={IdIcon}
                                size={12}
                                className="shrink-0 text-white/40"
                              />
                              <span className="font-mono text-[10px] text-white/60">
                                Roll: {member.collegeId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
