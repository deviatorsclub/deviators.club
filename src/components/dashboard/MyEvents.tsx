"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Megaphone01Icon,
} from "@hugeicons/core-free-icons";
import type { DemoEvent, DemoRegistration } from "@/lib/dashboard/demo";

export default function MyEvents({
  events,
  registrations,
  onWithdraw,
}: {
  events: DemoEvent[];
  registrations: DemoRegistration[];
  onWithdraw: (eventId: string) => void;
}) {
  const byId = new Map(events.map((e) => [e.id, e]));

  return (
    <section className="glass-card rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-extrabold tracking-tight text-white">
          My events
        </h2>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/55">
          {registrations.length} registered
        </span>
      </div>

      {registrations.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-6 text-center">
          <HugeiconsIcon
            icon={Megaphone01Icon}
            size={22}
            className="mx-auto text-white/30"
          />
          <p className="mt-2 text-sm font-medium text-white/70">
            Nothing registered yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/40">
            Registrations from the Events tab will appear here with your team
            and RSVP status.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {registrations.map((r) => {
            const ev = byId.get(r.eventId);
            if (!ev) return null;
            const date = new Date(ev.startsAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            });
            return (
              <li
                key={r.eventId}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/30 p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {ev.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-white/45">
                    {date} · {ev.venue}
                    {r.teamName ? ` · Team ${r.teamName}` : " · Solo"}
                    {r.teamMembers.length > 0 &&
                      ` · +${r.teamMembers.length} mate${r.teamMembers.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  Confirmed
                </span>
                <button
                  onClick={() => onWithdraw(r.eventId)}
                  className="text-xs font-medium text-white/35 transition-colors hover:text-red-300"
                >
                  Withdraw
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
