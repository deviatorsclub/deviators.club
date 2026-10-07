"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Search01Icon,
  SparklesIcon,
  Shield01Icon,
  CrownIcon,
  CodeCircleIcon,
  GlobeIcon,
  AiBrain01Icon,
  Megaphone01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import type { CommunityMember } from "@/lib/dashboard/db";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type DivisionGroup = {
  id: string;
  name: string;
  icon: typeof Shield01Icon;
  color: string;
  textColor: string;
  badgeBg: string;
  members: CommunityMember[];
};

export default function CommunityFeed({
  members = [],
  loading = false,
}: {
  members?: CommunityMember[];
  loading?: boolean;
}) {
  const [search, setSearch] = useState("");

  // Group members into discord-style divisions in exact requested order
  const { groups, totalCount } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? members.filter(
          (m) =>
            m.displayName.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q) ||
            m.branch.toLowerCase().includes(q) ||
            m.tags.some((t) => t.label.toLowerCase().includes(q)),
        )
      : members;

    // Track assigned IDs so each user is displayed in their highest role
    const assignedIds = new Set<string>();

    const getMatchingMembers = (predicate: (m: CommunityMember) => boolean) => {
      const match = filtered.filter(
        (m) => !assignedIds.has(m.id) && predicate(m),
      );
      match.forEach((m) => assignedIds.add(m.id));
      return match;
    };

    // 1. Club Official Profile
    const official = getMatchingMembers(
      (m) =>
        m.username.toLowerCase() === "deviators" ||
        m.tags.some((t) => t.tag.toLowerCase().includes("official")),
    );

    // 2. Chief Coordinator
    const chief = getMatchingMembers((m) =>
      m.tags.some(
        (t) =>
          t.tag.toLowerCase().includes("chief") ||
          t.tag.toLowerCase().includes("coordinator"),
      ),
    );

    // 3. Presidents
    const presidents = getMatchingMembers((m) =>
      m.tags.some((t) => t.tag.toLowerCase().includes("president")),
    );

    // 4. DSA Team
    const dsa = getMatchingMembers(
      (m) =>
        m.tags.some((t) => t.tag.toLowerCase().includes("dsa")) ||
        m.username.toLowerCase() === "ayush",
    );

    // 5. Web Team
    const web = getMatchingMembers(
      (m) =>
        m.tags.some((t) => t.tag.toLowerCase().includes("web")) ||
        m.username.toLowerCase().startsWith("dhruvi"),
    );

    // 6. AI/ML Team
    const aiml = getMatchingMembers(
      (m) =>
        m.tags.some(
          (t) =>
            t.tag.toLowerCase().includes("aiml") ||
            t.tag.toLowerCase().includes("ai"),
        ) ||
        m.username.toLowerCase().includes("manas") ||
        m.branch.toLowerCase().includes("aiml"),
    );

    // 7. Social & Events Team
    const social = getMatchingMembers(
      (m) =>
        m.tags.some(
          (t) =>
            t.tag.toLowerCase().includes("social") ||
            t.tag.toLowerCase().includes("event"),
        ) || m.username.toLowerCase() === "aam_papad",
    );

    // 8. General Community Members
    const general = filtered.filter((m) => !assignedIds.has(m.id));

    const divisionList: DivisionGroup[] = [
      {
        id: "official",
        name: "Club Official",
        icon: Shield01Icon,
        color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
        textColor: "text-emerald-300",
        badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
        members: official,
      },
      {
        id: "chief",
        name: "Chief Coordinator",
        icon: CrownIcon,
        color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
        textColor: "text-amber-300",
        badgeBg: "bg-amber-500/15 text-amber-300 border-amber-400/30",
        members: chief,
      },
      {
        id: "presidents",
        name: "Presidents",
        icon: CrownIcon,
        color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
        textColor: "text-yellow-300",
        badgeBg: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
        members: presidents,
      },
      {
        id: "dsa",
        name: "DSA Team",
        icon: CodeCircleIcon,
        color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
        textColor: "text-cyan-300",
        badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
        members: dsa,
      },
      {
        id: "web",
        name: "Web Team",
        icon: GlobeIcon,
        color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
        textColor: "text-blue-300",
        badgeBg: "bg-blue-500/15 text-blue-300 border-blue-400/30",
        members: web,
      },
      {
        id: "aiml",
        name: "AI / ML Team",
        icon: AiBrain01Icon,
        color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
        textColor: "text-purple-300",
        badgeBg: "bg-purple-500/15 text-purple-300 border-purple-400/30",
        members: aiml,
      },
      {
        id: "social",
        name: "Social & Events Team",
        icon: Megaphone01Icon,
        color: "text-pink-400 border-pink-500/30 bg-pink-500/10",
        textColor: "text-pink-300",
        badgeBg: "bg-pink-500/15 text-pink-300 border-pink-400/30",
        members: social,
      },
      {
        id: "members",
        name: "Community Members",
        icon: UserGroupIcon,
        color: "text-slate-400 border-white/10 bg-white/[0.04]",
        textColor: "text-slate-200",
        badgeBg: "bg-white/[0.06] text-white/70 border-white/10",
        members: general,
      },
    ];

    // Filter out empty groups unless they have members
    const activeGroups = divisionList.filter((g) => g.members.length > 0);

    return {
      groups: activeGroups,
      totalCount: members.length,
    };
  }, [members, search]);

  return (
    <section className="glass-card relative overflow-hidden rounded-3xl border border-white/10 bg-[#070b14]/90 p-5 sm:p-7">
      {/* Discord Server Style Top Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <h2 className="font-heading text-xl font-black tracking-tight text-white sm:text-2xl">
              Deviators Community
            </h2>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-300">
              Live Directory
            </span>
          </div>

          <p className="mt-1 font-mono text-xs text-white/50">
            Total Community —{" "}
            <span className="font-bold text-white">{totalCount} Members</span>{" "}
            registered
          </p>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-72">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name, @handle..."
            className="w-full rounded-xl border border-white/10 bg-black/50 py-2 pr-3.5 pl-9 text-xs text-white outline-none placeholder:text-white/35 focus:border-cyan-400/60"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-white/40">
          Loading community roster...
        </div>
      ) : groups.length === 0 ? (
        <div className="py-12 text-center font-mono text-xs text-white/40">
          No community members match &ldquo;{search}&rdquo;.
        </div>
      ) : (
        /* Discord Member List View */
        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="space-y-2">
              {/* Category Divider Header (e.g. Leads — 1) */}
              <div className="flex items-center gap-2 px-2">
                <span className="font-mono text-xs font-bold tracking-wider text-white/50 uppercase">
                  {group.name}
                </span>
                <span className="font-mono text-white/30">—</span>
                <span className="font-mono text-xs font-extrabold text-white/70">
                  {group.members.length}
                </span>
              </div>

              {/* Members in this Division */}
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {group.members.map((member) => (
                  <Link
                    key={member.id}
                    href={`/dashboard/@${member.username}`}
                    className="group relative flex items-center justify-between gap-3 rounded-2xl border border-white/[0.04] bg-[#0c111e]/60 p-2.5 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-lg"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Avatar with Discord status dot */}
                      <div className="relative h-10 w-10 shrink-0">
                        {member.avatarUrl ? (
                          <Image
                            src={member.avatarUrl}
                            alt={member.displayName}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full border border-white/10 object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-xs font-bold text-white">
                            {initials(member.displayName)}
                          </div>
                        )}
                        {/* Discord-style Online status dot */}
                        <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-[#0c111e] bg-emerald-400" />
                      </div>

                      {/* Name & Role details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <p
                            className={`truncate text-xs font-bold tracking-tight ${group.textColor} transition-colors group-hover:text-white`}
                          >
                            {member.displayName}
                          </p>
                          {member.username === "deviators" ? (
                            <span className="py-0.2 rounded bg-emerald-500/20 px-1 font-mono text-[9px] font-bold text-emerald-300">
                              BOT
                            </span>
                          ) : null}
                        </div>

                        <p className="truncate font-mono text-[11px] text-white/40">
                          @{member.username}{" "}
                          {member.branch ? `· ${member.branch}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Arrow mapping indicator */}
                    <div className="shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-300">
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
