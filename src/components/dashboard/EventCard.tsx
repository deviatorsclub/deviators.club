"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import {
  Calendar03Icon,
  Pin02Icon,
  UserGroupIcon,
  PlusSignIcon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import MiniCountdown from "./MiniCountdown";
import type { DemoEvent, DemoRegistration } from "@/lib/dashboard/demo";

export default function EventCard({
  event,
  registered,
  onRegister,
}: {
  event: DemoEvent;
  registered: DemoRegistration | undefined;
  onRegister: (event: DemoEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((event.seatsTaken / event.seats) * 100);
  const date = new Date(event.startsAt).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <article className="glass-card overflow-hidden rounded-3xl">
      {/* Cover with Poster */}
      <div className="relative aspect-[2391/658] w-full overflow-hidden border-b border-white/10 bg-[#090d16]">
        <Image
          src="/debug_decrypt_banner_2.png"
          alt={event.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            Registrations open
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/60">
            {event.mode}
          </span>
          {event.isTeamEvent && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/60">
              Team · up to {event.maxTeamSize}
            </span>
          )}
        </div>

        <div>
          <h3 className="font-heading text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            {event.title}
          </h3>
          <p className="mt-1 text-xs text-white/60 sm:text-sm">
            {event.tagline}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MiniCountdown target={event.regClosesAt} label="Reg closes in" />
          <MiniCountdown
            target={event.startsAt}
            label="Event starts in"
            tone="text-sky-300"
          />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={15}
              className="text-white/35"
            />
            {date} · 10:00 AM
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon
              icon={Pin02Icon}
              size={15}
              className="text-white/35"
            />
            {event.venue}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {registered ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={17} />
              Registered
              {registered.teamName ? ` · ${registered.teamName}` : ""}
            </span>
          ) : (
            <Link
              href={`/events/${event.slug}?register=true`}
              className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Register now
            </Link>
          )}
          <Link
            href={`/events/${event.slug}`}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
          >
            <span>Event Dashboard</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
          </Link>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="btn-secondary rounded-xl px-4 py-2.5 text-sm"
          >
            <HugeiconsIcon icon={InformationCircleIcon} size={16} />
            {expanded ? "Hide details" : "How it works"}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid gap-3 rounded-2xl border border-white/[0.07] bg-black/30 p-4 text-[13px] leading-relaxed text-white/60 sm:grid-cols-3">
                <div>
                  <p className="font-semibold text-white">1 · Register</p>
                  <p className="mt-1">
                    Fill the 30-second form. You&apos;ll get an RSVP email
                    instantly (demo: shown in My Events).
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-white">2 · Build team</p>
                  <p className="mt-1">
                    {event.isTeamEvent
                      ? `Create a team + add up to ${event.maxTeamSize - 1} members by username.`
                      : "Solo event — just bring your laptop."}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-white">3 · Show up</p>
                  <p className="mt-1">
                    Check in with your registered email on event day.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
