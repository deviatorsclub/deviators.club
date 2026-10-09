"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LuTrophy,
  LuClock,
  LuCircleCheck,
  LuShieldAlert,
  LuArrowLeft,
  LuDownload,
  LuUser,
  LuSearch,
} from "react-icons/lu";
import deviatorsLogoMin from "@/assets/logo/sm.svg";
import { createClient } from "@/lib/supabase/client";

interface LeaderboardEntry {
  rank: number;
  profileId: string;
  name: string;
  username: string;
  avatarUrl: string;
  teamName: string;
  role: string;
  status: string;
  submittedAt: string | null;
  score: number | null; // Null for candidates, populated only for Presidents
  maxScore: number | null;
  strikes: number | null;
}

export default function Round1LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPresident, setIsPresident] = useState(false);
  const [search, setSearch] = useState("");

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/round-1/leaderboard", { headers });
      const data = await res.json();

      if (res.ok) {
        setEntries(data.leaderboard || []);
        setIsPresident(Boolean(data.isPresident));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const filtered = entries.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.username.toLowerCase().includes(q) ||
      e.teamName.toLowerCase().includes(q)
    );
  });

  const exportCsv = () => {
    if (entries.length === 0) return;
    const headers = [
      "Rank",
      "Leader Name",
      "Username",
      "Team Name",
      "Role",
      "Status",
      "Submitted At",
      ...(isPresident ? ["Score", "Max Score"] : []),
    ];

    const rows = filtered.map((e) => {
      const base = [
        e.rank,
        `"${e.name.replace(/"/g, '""')}"`,
        `"@${e.username}"`,
        `"${e.teamName.replace(/"/g, '""')}"`,
        `"${e.role}"`,
        `"${e.status}"`,
        `"${e.submittedAt ? new Date(e.submittedAt).toLocaleString("en-IN") : "N/A"}"`,
      ];
      if (isPresident) {
        base.push(e.score ?? "N/A", e.maxScore ?? 30);
      }
      return base.join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `debug-decrypt-round1-standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-16 sm:px-6">
      {/* Top Bar */}
      <div className="glass-card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={deviatorsLogoMin.src}
              alt="Deviators Logo"
              width={28}
              height={28}
              className="h-6 w-auto brightness-125"
            />
            <span className="font-heading text-sm font-extrabold text-white">
              Deviators Club
            </span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="font-mono text-xs text-white/60">
            Debug Decrypt 3.0 · Round 1 Standings
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/debug-decrypt-3.0/round-1"
            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <LuArrowLeft size={13} />
            <span>Test Arena</span>
          </Link>
          <Link href="/dashboard" className="btn-secondary px-3 py-1.5 text-xs">
            Dashboard
          </Link>
        </div>
      </div>

      {/* Header Banner Card */}
      <div className="glass-card mb-6 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-white/70">
                Official Standings
              </span>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-white/70">
                Round 1 · 30 MCQs
              </span>
              {isPresident && (
                <span className="rounded-lg border border-purple-500/30 bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                  President Mode (Scores Unlocked)
                </span>
              )}
            </div>
            <h1 className="font-heading flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              <LuTrophy className="text-amber-400" size={28} />
              Round 1 Team Leader Standings
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/60 sm:text-sm">
              Official status of submitted rounds by registered team leaders for
              Debug Decrypt 3.0. Scores are kept strictly confidential for final
              cutoff determination.
            </p>
          </div>

          {entries.length > 0 && (
            <button
              onClick={exportCsv}
              className="btn-secondary flex shrink-0 items-center gap-2 px-4 py-2 text-xs"
            >
              <LuDownload size={14} />
              <span>Export Standings</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Counter Bar */}
      <div className="glass-card mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="relative min-w-[200px] flex-1">
          <LuSearch
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/30"
            size={14}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by leader name, handle, or team name..."
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pr-4 pl-9 text-xs text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
          />
        </div>

        <div className="font-mono text-xs text-white/50">
          Showing {filtered.length} of {entries.length} participants
        </div>
      </div>

      {/* Standings List / Table */}
      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center font-mono text-xs text-white/40">
          Loading submission standings…
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-white/40">
          {search
            ? "No matching team leaders found."
            : "No team leaders have submitted Round 1 yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div
              key={entry.profileId}
              className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 transition-all hover:border-white/20 sm:p-5"
            >
              {/* Left: Rank & Candidate Info */}
              <div className="flex min-w-[240px] items-center gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 font-mono text-xs font-bold text-white/60">
                  #{entry.rank}
                </div>

                {entry.avatarUrl ? (
                  <Image
                    src={entry.avatarUrl}
                    alt={entry.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60">
                    <LuUser size={16} />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-bold text-white">
                      {entry.name}
                    </span>
                    <span className="font-mono text-xs text-white/40">
                      @{entry.username}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
                    <span className="font-semibold text-white/70">
                      {entry.teamName}
                    </span>
                    <span>·</span>
                    <span className="py-0.2 rounded border border-white/10 bg-white/[0.04] px-1.5 text-[10px] text-white/60">
                      {entry.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Submission Status & Score */}
              <div className="ml-auto flex items-center gap-3">
                {/* Score (Presidents Only) */}
                {isPresident && entry.score !== null && (
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {entry.score} / {entry.maxScore ?? 30} pts
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                      entry.status === "submitted"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : entry.status === "terminated"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "animate-pulse border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                    }`}
                  >
                    {entry.status === "submitted" ? (
                      <>
                        <LuCircleCheck size={13} />
                        <span>Submitted</span>
                      </>
                    ) : entry.status === "terminated" ? (
                      <>
                        <LuShieldAlert size={13} />
                        <span>Disqualified</span>
                      </>
                    ) : (
                      <>
                        <LuClock size={13} />
                        <span>In Progress</span>
                      </>
                    )}
                  </span>

                  {entry.submittedAt && (
                    <span className="mt-1 block font-mono text-[10px] text-white/30">
                      {new Date(entry.submittedAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
