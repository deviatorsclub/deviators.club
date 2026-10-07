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
  Linkedin01Icon,
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

type CommunityFilterTab = "all" | "leads" | "members" | "ex-deviators";

export default function CommunityFeed({
  members = [],
  loading = false,
}: {
  members?: CommunityMember[];
  loading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<CommunityFilterTab>("all");

  // Group members into discord-style divisions in exact requested order
  const { groups, totalCount, tabCounts } = useMemo(() => {
    // Include Chief Coordinator profile if not already present in Supabase DB
    const chiefFound = members.some(
      (m) =>
        m.username.toLowerCase() === "renunarwal" ||
        m.tags.some(
          (t) =>
            t.tag.toLowerCase().includes("chief") ||
            t.tag.toLowerCase().includes("coordinator"),
        ),
    );

    const fullMemberList: CommunityMember[] = chiefFound
      ? members
      : [
          {
            id: "chief-coordinator-renu",
            username: "renunarwal",
            displayName: "Prof. Renu Narwal",
            avatarUrl: "/team03/renumaam_chiefcoordinator.png",
            branch: "CSE",
            year: "Faculty",
            bio: "Chief Coordinator, Deviators Club",
            tags: [
              {
                tag: "chief-coordinator",
                label: "Chief Coordinator",
                tone: "bg-amber-500/15 text-amber-300 border-amber-500/30",
              },
            ],
          },
          ...members,
        ];

    const q = search.trim().toLowerCase();
    const filtered = q
      ? fullMemberList.filter(
          (m) =>
            m.displayName.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q) ||
            m.branch.toLowerCase().includes(q) ||
            m.tags.some(
              (t) =>
                t.label.toLowerCase().includes(q) ||
                t.tag.toLowerCase().includes(q),
            ),
        )
      : fullMemberList;

    // Track assigned IDs so each user is displayed in their highest role
    const assignedIds = new Set<string>();

    const getMatchingMembers = (predicate: (m: CommunityMember) => boolean) => {
      const match = filtered.filter(
        (m) => !assignedIds.has(m.id) && predicate(m),
      );
      match.forEach((m) => assignedIds.add(m.id));
      return match;
    };

    // 1. Club Profile (Official Deviators Club Profile)
    const official = getMatchingMembers(
      (m) =>
        m.username.toLowerCase() === "deviatorsclub" ||
        m.username.toLowerCase() === "deviators" ||
        m.tags.some(
          (t) =>
            t.tag.toLowerCase().includes("official") ||
            t.tag.toLowerCase().includes("club-official") ||
            t.label.toLowerCase().includes("club profile"),
        ),
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

    // 6. AI/ML Team (Matched ONLY by team role, NEVER by college branch)
    const aiml = getMatchingMembers(
      (m) =>
        m.tags.some(
          (t) =>
            t.tag.toLowerCase() === "aiml-lead" ||
            t.tag.toLowerCase() === "aiml",
        ) || m.username.toLowerCase() === "manas_negi",
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

    // 8. Ex-Deviators (Alumni)
    const exDeviators = getMatchingMembers(
      (m) =>
        m.tags.some((t) => t.tag.toLowerCase().includes("ex-deviator")) ||
        m.year.toLowerCase().includes("alumni") ||
        m.username.toLowerCase() === "dumbhavya",
    );

    // 9. General Community Members
    const general = filtered.filter((m) => !assignedIds.has(m.id));

    const divisionList: DivisionGroup[] = [
      {
        id: "official",
        name: "Club Profile",
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
        id: "ex-deviators",
        name: "Ex-Deviators",
        icon: SparklesIcon,
        color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
        textColor: "text-amber-300",
        badgeBg: "bg-amber-500/15 text-amber-300 border-amber-400/30",
        members: exDeviators,
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

    // Filter by active tab if selected
    let displayedGroups = divisionList.filter((g) => g.members.length > 0);
    if (activeTab === "leads") {
      displayedGroups = displayedGroups.filter((g) =>
        [
          "official",
          "chief",
          "presidents",
          "dsa",
          "web",
          "aiml",
          "social",
        ].includes(g.id),
      );
    } else if (activeTab === "members") {
      displayedGroups = displayedGroups.filter((g) => g.id === "members");
    } else if (activeTab === "ex-deviators") {
      displayedGroups = displayedGroups.filter((g) => g.id === "ex-deviators");
    }

    const leadsTotal =
      official.length +
      chief.length +
      presidents.length +
      dsa.length +
      web.length +
      aiml.length +
      social.length;

    return {
      groups: displayedGroups,
      totalCount: members.length,
      tabCounts: {
        all: members.length,
        leads: leadsTotal,
        members: general.length,
        exDeviators: exDeviators.length,
      },
    };
  }, [members, search, activeTab]);

  return (
    <section className="glass-card relative overflow-hidden rounded-3xl border border-white/10 bg-[#070b14]/90 p-5 sm:p-7">
      {/* Discord Server Style Top Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <h2 className="font-heading text-xl font-black tracking-tight whitespace-nowrap text-white sm:text-2xl">
              Deviators Community
            </h2>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold whitespace-nowrap text-emerald-300">
            Live Directory
          </span>
          <span className="hidden font-mono text-xs text-white/30 sm:inline">
            ·
          </span>
          <p className="font-mono text-xs whitespace-nowrap text-white/50">
            Total{" "}
            <span className="font-bold text-white">{totalCount} Members</span>
          </p>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-80">
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
            className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pr-3.5 pl-9 text-xs text-white transition-colors outline-none placeholder:text-white/35 focus:border-cyan-400/60"
          />
        </div>
      </div>

      {/* Community Filter Tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-white/50 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <span>All</span>
          <span className="py-0.2 rounded-md bg-black/30 px-1.5 font-mono text-[10px] opacity-80">
            {tabCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leads")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "leads"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-white/50 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <span>Team Leads</span>
          <span className="py-0.2 rounded-md bg-black/30 px-1.5 font-mono text-[10px] opacity-80">
            {tabCounts.leads}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "members"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-white/50 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <span>Members</span>
          <span className="py-0.2 rounded-md bg-black/30 px-1.5 font-mono text-[10px] opacity-80">
            {tabCounts.members}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ex-deviators")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "ex-deviators"
              ? "border border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/10"
              : "text-amber-300/60 hover:bg-amber-500/10 hover:text-amber-300"
          }`}
        >
          <HugeiconsIcon
            icon={SparklesIcon}
            size={13}
            className="text-amber-400"
          />
          <span>Ex-Deviators</span>
          <span className="py-0.2 rounded-md bg-amber-400/20 px-1.5 font-mono text-[10px] font-bold text-amber-200">
            {tabCounts.exDeviators}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-white/40">
          Loading community roster...
        </div>
      ) : groups.length === 0 ? (
        <div className="py-12 text-center font-mono text-xs text-white/40">
          No members found in this section
          {search ? ` matching "${search}"` : ""}.
        </div>
      ) : (
        /* Discord Member List View */
        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="space-y-2">
              {/* Category Divider Header (e.g. Leads — 1) */}
              <div className="flex items-center gap-2 px-1">
                <span className="font-mono text-xs font-bold tracking-wider text-white/50 uppercase">
                  {group.name}
                </span>
                <span className="font-mono text-white/30">—</span>
                <span className="font-mono text-xs font-extrabold text-white/70">
                  {group.members.length}
                </span>
              </div>

              {/* Members in this Division */}
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {group.members.map((member) => {
                  const isChief =
                    group.id === "chief" ||
                    member.id === "chief-coordinator-renu" ||
                    member.username.toLowerCase() === "renunarwal";

                  if (isChief) {
                    return (
                      <div
                        key={member.id}
                        className="group relative flex items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-[#0c111e]/70 p-3 transition-all duration-200"
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
                            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-[#0c111e] bg-amber-400" />
                          </div>

                          {/* Name & Role details */}
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-xs font-bold tracking-tight sm:text-sm ${group.textColor}`}
                            >
                              {member.displayName}
                            </p>

                            <p className="mt-0.5 truncate font-mono text-[11px] text-white/45">
                              Chief Coordinator · Faculty
                            </p>
                          </div>
                        </div>

                        {/* LinkedIn Profile action link */}
                        <a
                          href="https://www.linkedin.com/in/renu-narwal-42b2352a5/"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View LinkedIn Profile"
                          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/40 transition-all hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-300"
                        >
                          <HugeiconsIcon icon={Linkedin01Icon} size={15} />
                        </a>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={member.id}
                      href={`/dashboard/@${member.username}`}
                      className="group relative flex items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-[#0c111e]/70 p-3 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-xl active:scale-[0.99]"
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
                          <p
                            className={`truncate text-xs font-bold tracking-tight sm:text-sm ${group.textColor} transition-colors group-hover:text-white`}
                          >
                            {member.displayName}
                          </p>

                          <p className="mt-0.5 truncate font-mono text-[11px] text-white/45">
                            @{member.username}
                            {member.branch ? ` · ${member.branch}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Arrow mapping indicator */}
                      <div className="shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-300">
                        <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
