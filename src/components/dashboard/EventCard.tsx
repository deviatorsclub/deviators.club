"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Pin02Icon,
  UserGroupIcon,
  PlusSignIcon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
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
      {/* Cover — pure CSS, zero image weight */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-[#0a1a3a] to-black px-6 py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            Registrations open
          </span>
          <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/60">
            {event.mode}
          </span>
          {event.isTeamEvent && (
            <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/60">
              Team · up to {event.maxTeamSize}
            </span>
          )}
        </div>
        <h3 className="font-heading relative mt-3 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {event.title}
        </h3>
        <p className="relative mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/60">
          {event.tagline}
        </p>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
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
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon
              icon={UserGroupIcon}
              size={15}
              className="text-white/35"
            />
            {event.seatsTaken}/{event.seats} seats
          </span>
        </div>

        {/* Seats bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {registered ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={17} />
              Registered
              {registered.teamName ? ` · ${registered.teamName}` : ""}
            </span>
          ) : (
            <button
              onClick={() => onRegister(event)}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Register now
            </button>
          )}
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
