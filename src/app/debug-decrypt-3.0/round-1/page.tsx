"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  LuTrophy,
  LuSparkles,
  LuCircleCheck,
  LuArrowRight,
  LuShieldCheck,
  LuCalendar,
  LuExternalLink,
} from "react-icons/lu";
import deviatorsLogoMin from "@/assets/logo/sm.svg";

export default function Round1ConcludedPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-4 py-16 sm:px-6">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 p-6 text-center sm:p-10"
      >
        {/* Header Logo */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <Image
            src={deviatorsLogoMin.src}
            alt="Deviators Logo"
            width={32}
            height={32}
            className="h-7 w-auto brightness-125"
          />
          <span className="font-heading text-sm font-extrabold text-white">
            Deviators Club
          </span>
        </div>

        {/* Status Pill */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300">
          <LuCircleCheck size={13} />
          <span>Round 1 Officially Concluded</span>
        </div>

        {/* Main Title */}
        <h1 className="font-heading text-3xl font-black tracking-tight text-white sm:text-4xl">
          Debug Decrypt 3.0
        </h1>
        <p className="mt-2 text-sm font-semibold text-white/80">
          Round 1 Assessment Has Ended
        </p>

        {/* Description Card */}
        <div className="my-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left text-xs leading-relaxed text-white/70">
          <p className="mb-3">
            Round 1 of Debug Decrypt 3.0 was conducted on{" "}
            <strong className="text-white">Wayground</strong> on Tuesday,
            October 13, 2026. The online testing portal is now closed.
          </p>
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2 text-white/80">
              <LuSparkles className="shrink-0 text-amber-400" size={14} />
              <span>
                <strong className="text-white">40 Teams</strong> successfully
                shortlisted for Round 2.
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <LuShieldCheck className="shrink-0 text-emerald-400" size={14} />
              <span>
                Official standings and rankings are now published and publicly
                available.
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <LuCalendar className="shrink-0 text-sky-400" size={14} />
              <span>
                Round 2 schedule & guidelines will be shared with leaders.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/event/debug-decrypt-3.0/round-1/leaderboard"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-red-600/25 transition-all hover:scale-[1.02] hover:shadow-red-600/40 active:scale-[0.98]"
          >
            <LuTrophy size={15} />
            <span>View Round 1 Leaderboard</span>
            <LuArrowRight size={14} />
          </Link>

          <Link
            href="/dashboard"
            className="btn-secondary flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-semibold text-white/80"
          >
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-[11px] text-white/40">
          For queries or assistance, contact your event coordinator via the{" "}
          <Link
            href="/events/debug-decrypt-3.0"
            className="text-white/70 underline underline-offset-2 hover:text-white"
          >
            event page
          </Link>
          .
        </p>
      </motion.div>
    </main>
  );
}
