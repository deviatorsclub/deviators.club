"use client";

import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Megaphone01Icon,
  CrownIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

export type DashboardTabId =
  "events" | "my-events" | "invites" | "community" | "admin-teams";

export default function DashboardTabs({
  active,
  onChange,
  counts,
  isPresident = false,
}: {
  active: DashboardTabId;
  onChange: (tab: DashboardTabId) => void;
  counts: {
    events: number;
    myEvents: number;
    invites?: number;
    community?: number;
  };
  isPresident?: boolean;
}) {
  const tabs: {
    id: DashboardTabId;
    label: string;
    icon: typeof Calendar03Icon;
    pill?: string;
    soon?: boolean;
    isSpecial?: boolean;
  }[] = [
    {
      id: "events",
      label: "Events",
      icon: Calendar03Icon,
      pill: String(counts.events),
    },
    {
      id: "my-events",
      label: "My Events",
      icon: CheckmarkCircle01Icon,
      pill: String(counts.myEvents),
    },
    {
      id: "invites",
      label: "Team Invites",
      icon: UserGroupIcon,
      pill: counts.invites ? String(counts.invites) : undefined,
    },
    {
      id: "community",
      label: "Community",
      icon: Megaphone01Icon,
      pill:
        counts.community !== undefined ? String(counts.community) : undefined,
    },
    ...(isPresident
      ? [
          {
            id: "admin-teams" as DashboardTabId,
            label: "Teams Roster",
            icon: CrownIcon,
            pill: "President",
            isSpecial: true,
          },
        ]
      : []),
  ];

  return (
    <div
      role="tablist"
      aria-label="Dashboard sections"
      className="flex gap-1 overflow-x-auto border-b border-white/10 px-1"
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition-colors duration-200 ${
              isActive
                ? "font-semibold text-white"
                : "font-medium text-white/50 hover:text-white/85"
            }`}
          >
            <HugeiconsIcon
              icon={t.icon}
              size={16}
              className={isActive ? "text-brand-light" : "text-white/40"}
            />
            <span>{t.label}</span>
            {t.pill !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                  t.isSpecial
                    ? "border border-amber-400/40 bg-amber-400/20 text-amber-300"
                    : isActive
                      ? "bg-white/[0.12] text-white"
                      : "bg-white/[0.06] text-white/50"
                }`}
              >
                {t.pill}
              </span>
            )}
            {t.soon && (
              <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-violet-300 uppercase">
                Soon
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId="dashboard-tab-underline"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full bg-gradient-to-r from-blue-500 to-sky-300"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
