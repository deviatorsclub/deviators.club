"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  LuTrophy,
  LuDownload,
  LuSearch,
  LuMedal,
  LuCircleCheck,
  LuSparkles,
  LuExternalLink,
  LuArrowLeft,
} from "react-icons/lu";
import deviatorsLogoMin from "@/assets/logo/sm.svg";
import {
  ROUND_1_SELECTED_TEAMS,
  SelectedTeam,
} from "@/data/round1SelectedTeams";

export default function Round1LeaderboardPage() {
  const [teams, setTeams] = useState<SelectedTeam[]>(ROUND_1_SELECTED_TEAMS);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/round-1/leaderboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.leaderboard?.length) {
          setTeams(data.leaderboard);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => {
      return (
        t.teamName.toLowerCase().includes(q) ||
        t.leaderName.toLowerCase().includes(q) ||
        (t.branch || "").toLowerCase().includes(q) ||
        (t.membersFormatted || "").toLowerCase().includes(q)
      );
    });
  }, [teams, search]);

  const exportCsv = () => {
    const headers = [
      "Rank",
      "Team Name",
      "Test Taker / Leader",
      "Branch",
      "All Team Members",
      "Status",
    ];

    const rows = filtered.map((t) => [
      t.rank,
      `"${t.teamName.replace(/"/g, '""')}"`,
      `"${t.leaderName.replace(/"/g, '""')}"`,
      `"${t.branch}"`,
      `"${(t.members || []).join("; ").replace(/"/g, '""')}"`,
      `"Qualified for Round 2"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `debug-decrypt-round1-selected-teams.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const top3 = teams.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-20 sm:px-6">
      {/* Top Navigation Bar */}
      <div className="glass-card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={deviatorsLogoMin.src}
              alt="Deviators Logo"
              width={26}
              height={26}
              className="h-6 w-auto brightness-125"
            />
            <span className="font-heading text-sm font-extrabold text-white">
              Deviators Club
            </span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="font-mono text-xs text-white/70">
            Debug Decrypt 3.0 · Round 1 Standings
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 transition-colors hover:text-white"
          >
            <LuArrowLeft size={13} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/events/debug-decrypt-3.0"
            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 transition-colors hover:text-white"
          >
            <span>Event Info</span>
            <LuExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="glass-card relative mb-8 overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-10">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                <LuTrophy size={13} />
                Official Round 1 Standings
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-300">
                <LuSparkles size={12} />
                Hosted on Wayground
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <LuCircleCheck size={12} />
                40 Teams Selected
              </span>
            </div>

            <h1 className="font-heading text-2xl font-black tracking-tight text-white sm:text-4xl">
              Selected 40 Teams · Round 1
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/60 sm:text-sm">
              Official ranking of the top 40 teams who qualified in Round 1 of{" "}
              <strong className="text-white">Debug Decrypt 3.0</strong>. The
              team leader listed represents the candidate who completed the
              round on Wayground.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/20 active:scale-[0.98]"
            >
              <LuDownload size={14} />
              <span>Export CSV Standings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <LuMedal className="text-amber-400" size={18} />
          <h2 className="font-heading text-base font-bold text-white">
            Top 3 Shortlisted Teams
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* #2 Prestige */}
          {top3[1] && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card relative order-2 flex flex-col justify-between rounded-2xl border-slate-400/25 bg-gradient-to-b from-slate-400/10 via-transparent to-transparent p-5 sm:order-1"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="font-heading flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300/30 bg-slate-400/20 text-sm font-black text-slate-200">
                  #2
                </span>
                <span className="rounded-lg border border-slate-400/20 bg-slate-400/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  Silver Medal
                </span>
              </div>
              <div>
                <h3 className="font-heading truncate text-lg font-black text-white">
                  {top3[1].teamName}
                </h3>
                <p className="text-xs font-semibold text-slate-300">
                  Leader: {top3[1].leaderName}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                    {top3[1].branch}
                  </span>
                </div>
              </div>
              <p className="mt-4 truncate border-t border-white/5 pt-3 text-[11px] text-white/40">
                {top3[1].membersFormatted}
              </p>
            </motion.div>
          )}

          {/* #1 Inception */}
          {top3[0] && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card relative order-1 flex flex-col justify-between rounded-2xl border-amber-400/40 bg-gradient-to-b from-amber-400/15 via-amber-500/5 to-transparent p-5 shadow-lg shadow-amber-500/10 sm:order-2 sm:-translate-y-2"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="font-heading flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-400/25 text-base font-black text-amber-200 shadow-md">
                  #1
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-black text-amber-300">
                  <LuTrophy size={11} />
                  Top Rank
                </span>
              </div>
              <div>
                <h3 className="font-heading truncate text-xl font-black text-white">
                  {top3[0].teamName}
                </h3>
                <p className="text-xs font-bold text-amber-200">
                  Leader: {top3[0].leaderName}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                    {top3[0].branch}
                  </span>
                </div>
              </div>
              <p className="mt-4 truncate border-t border-white/10 pt-3 text-[11px] text-white/60">
                {top3[0].membersFormatted}
              </p>
            </motion.div>
          )}

          {/* #3 phoenix */}
          {top3[2] && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card relative order-3 flex flex-col justify-between rounded-2xl border-amber-700/30 bg-gradient-to-b from-amber-700/10 via-transparent to-transparent p-5 sm:order-3"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="font-heading flex h-9 w-9 items-center justify-center rounded-xl border border-amber-700/40 bg-amber-700/20 text-sm font-black text-amber-300">
                  #3
                </span>
                <span className="rounded-lg border border-amber-700/30 bg-amber-700/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  Bronze Medal
                </span>
              </div>
              <div>
                <h3 className="font-heading truncate text-lg font-black text-white">
                  {top3[2].teamName}
                </h3>
                <p className="text-xs font-semibold text-amber-200/90">
                  Leader: {top3[2].leaderName}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                    {top3[2].branch}
                  </span>
                </div>
              </div>
              <p className="mt-4 truncate border-t border-white/5 pt-3 text-[11px] text-white/40">
                {top3[2].membersFormatted}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card mb-6 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="relative min-w-[240px] flex-1">
          <LuSearch
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/40"
            size={14}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team name, leader, teammate, or branch..."
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pr-4 pl-9 text-xs text-white placeholder-white/35 transition-colors focus:border-white/30 focus:outline-none"
          />
        </div>

        <div className="px-2 font-mono text-xs text-white/50">
          Showing {filtered.length} of {teams.length} teams
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="glass-card overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold tracking-wider text-white/50 uppercase">
              <tr>
                <th scope="col" className="w-16 px-4 py-3.5 text-center">
                  Rank
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Team Name
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Test Taker / Leader
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Branch
                </th>
                <th scope="col" className="hidden px-5 py-3.5 md:table-cell">
                  Team Members
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtered.map((t) => {
                const isTop1 = t.rank === 1;
                const isTop3 = t.rank <= 3;
                const isTop10 = t.rank <= 10;

                return (
                  <tr
                    key={t.rank}
                    className={`transition-colors hover:bg-white/[0.04] ${
                      isTop1
                        ? "bg-amber-400/[0.04]"
                        : isTop3
                          ? "bg-white/[0.015]"
                          : ""
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`font-heading inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                          isTop1
                            ? "border border-amber-400/50 bg-amber-400/25 text-amber-200 shadow-sm"
                            : t.rank === 2
                              ? "border border-slate-300/40 bg-slate-400/25 text-slate-100"
                              : t.rank === 3
                                ? "border border-amber-700/40 bg-amber-700/25 text-amber-300"
                                : isTop10
                                  ? "border border-white/20 bg-white/10 font-bold text-white"
                                  : "text-white/60"
                        }`}
                      >
                        {t.rank}
                      </span>
                    </td>

                    {/* Team Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-sm font-extrabold text-white">
                          {t.teamName}
                        </span>
                        {isTop1 && (
                          <LuTrophy
                            size={13}
                            className="shrink-0 text-amber-400"
                          />
                        )}
                      </div>
                    </td>

                    {/* Leader / Test Taker */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/80">
                          {t.leaderName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white/90">
                          {t.leaderName}
                        </span>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                        {t.branch}
                      </span>
                    </td>

                    {/* Team Members */}
                    <td className="hidden px-5 py-3.5 text-white/60 md:table-cell">
                      <div className="max-w-xs truncate text-[11px]">
                        {t.membersFormatted}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        <LuCircleCheck size={10} />
                        Qualified
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">
                    No teams match your search &ldquo;{search}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-3 font-mono text-xs text-white/50">
          <span>
            Showing {filtered.length} of {teams.length} qualified teams
          </span>
          <span>Debug Decrypt 3.0 · Deviators Club</span>
        </div>
      </div>
    </main>
  );
}
