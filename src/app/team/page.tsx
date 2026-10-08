"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import team01 from "@/data/team01";
import team02 from "@/data/team02";
import team03, { type TeamMemberData } from "@/data/team03";
import TeamFlexModal from "@/components/team/TeamFlexModal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Github01Icon,
  Linkedin01Icon,
  Link01Icon,
  Medal01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { FaXTwitter } from "react-icons/fa6";
import { SiLeetcode } from "react-icons/si";
import { LuArrowUpRight } from "react-icons/lu";
import { motion, AnimatePresence } from "motion/react";

const sessions = [
  { id: "03", label: "Session 3", subtitle: "2026-27 (Current)", data: team03 },
  { id: "02", label: "Session 2", subtitle: "2025-26", data: team02 },
  { id: "01", label: "Session 1", subtitle: "2024-25", data: team01 },
];

const socialIcon: Record<string, React.ReactNode> = {
  github: <HugeiconsIcon icon={Github01Icon} size={16} />,
  linkedin: <HugeiconsIcon icon={Linkedin01Icon} size={16} />,
  twitter: <FaXTwitter className="h-4 w-4" />,
  portfolio: <HugeiconsIcon icon={Link01Icon} size={16} />,
  leetcode: <SiLeetcode className="h-4 w-4" />,
};

function getRoleBadgeStyle(role: string): string {
  const low = role.toLowerCase();
  if (low.includes("chief coordinator")) {
    return "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-amber-500/10";
  }
  if (low.includes("president")) {
    return "bg-yellow-400/15 text-yellow-300 border-yellow-400/30 shadow-yellow-500/10";
  }
  if (low.includes("faculty")) {
    return "bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-purple-500/10";
  }
  if (low.includes("aiml") || low.includes("ai")) {
    return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-indigo-500/10";
  }
  if (low.includes("dsa")) {
    return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-cyan-500/10";
  }
  if (low.includes("web")) {
    return "bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-blue-500/10";
  }
  if (low.includes("social")) {
    return "bg-pink-500/15 text-pink-300 border-pink-500/30 shadow-pink-500/10";
  }
  if (low.includes("event")) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-emerald-500/10";
  }
  return "bg-brand/15 text-brand-light border-brand/20";
}

export default function TeamSection() {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState("03");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [flexMember, setFlexMember] = useState<TeamMemberData | null>(null);
  const [dynamicProfiles, setDynamicProfiles] = useState<Record<string, any>>(
    {},
  );

  const isCurrentSession = activeSession === "03";

  // Fetch dynamic profiles ONLY for the current active roster (Session 3)
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select(
        `
        username,
        display_name,
        avatar_url,
        branch,
        year,
        bio,
        github_url,
        linkedin_url,
        website,
        profile_roles(
          roles(
            label,
            tone
          )
        )
      `,
      )
      .then(({ data }) => {
        if (data && data.length > 0) {
          const map: Record<string, any> = {};
          data.forEach((p) => {
            if (p.username) {
              map[p.username.toLowerCase()] = p;
            }
          });
          setDynamicProfiles(map);
        }
      });
  }, []);

  const session = sessions.find((s) => s.id === activeSession)!;

  // 1. Current Session 03 Team Data (Dynamic Supabase integration)
  const currentTeam: TeamMemberData[] = useMemo(() => {
    return team03.map((m) => {
      const username = (
        m.username || m.name.toLowerCase().replace(/[^a-z0-9]/g, "_")
      ).toLowerCase();
      const prof =
        dynamicProfiles[username] ||
        dynamicProfiles[username.replace("dhruvi", "dhruviii78")];

      let roles = m.roles;
      if (prof?.profile_roles && prof.profile_roles.length > 0) {
        const dbRoles = prof.profile_roles
          .map((pr: any) => pr.roles?.label)
          .filter((label: string) => label && label !== "Member");
        if (dbRoles.length > 0) {
          roles = dbRoles;
        }
      }

      const urls = { ...m.urls };
      if (prof?.github_url) urls.github = prof.github_url;
      if (prof?.linkedin_url) urls.linkedin = prof.linkedin_url;
      if (prof?.website) urls.portfolio = prof.website;

      return {
        name: prof?.display_name || m.name,
        roles,
        intro: prof?.bio || m.intro,
        urls,
        image: prof?.avatar_url || m.image,
        keywords: m.keywords || [],
        username: prof?.username || m.username || username,
        branch: prof?.branch || m.branch || "CSE",
        year: prof?.year || m.year || "3rd Year",
        hasNoProfile: Boolean(m.hasNoProfile),
      };
    });
  }, [dynamicProfiles]);

  const currentCategories = [
    "All",
    "Leader",
    "Web",
    "DSA",
    "AIML",
    "Social & Events",
  ];

  const filteredCurrentTeam = useMemo(() => {
    if (selectedCategory === "All") return currentTeam;
    const cat = selectedCategory.toLowerCase();
    return currentTeam.filter((member) => {
      const allText = [...member.roles, ...member.keywords]
        .join(" ")
        .toLowerCase();

      if (cat === "leader") {
        return (
          allText.includes("president") ||
          allText.includes("coordinator") ||
          allText.includes("lead")
        );
      }
      if (cat === "web") {
        return allText.includes("web") || allText.includes("frontend");
      }
      if (cat === "dsa") {
        return allText.includes("dsa") || allText.includes("algorithm");
      }
      if (cat === "aiml") {
        return (
          allText.includes("aiml") ||
          allText.includes("ai") ||
          allText.includes("ml")
        );
      }
      if (cat === "social & events") {
        return allText.includes("social") || allText.includes("event");
      }
      return allText.includes(cat);
    });
  }, [selectedCategory, currentTeam]);

  // 2. Previous Sessions (Session 01 & 02) - EXACT original logic with ZERO changes
  const pastCategories = useMemo(() => {
    if (isCurrentSession) return [];
    const allKeywords = new Set<string>();
    (session.data as any[]).forEach((m) =>
      m.keywords.forEach((k: string) => allKeywords.add(k)),
    );
    allKeywords.delete("club");
    return ["All", ...Array.from(allKeywords)];
  }, [isCurrentSession, session.data]);

  const filteredPastTeam = useMemo(() => {
    if (isCurrentSession) return [];
    const rawList = session.data as any[];
    if (selectedCategory === "All") return rawList;
    return rawList.filter((member) =>
      member.keywords.some((role: string) =>
        role.toLowerCase().includes(selectedCategory.toLowerCase()),
      ),
    );
  }, [isCurrentSession, session.data, selectedCategory]);

  const handleSessionSwitch = (id: string) => {
    setActiveSession(id);
    setSelectedCategory("All");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section
      id="team"
      className="relative overflow-hidden pt-32 pb-24 text-white sm:pt-36 lg:pt-40"
    >
      {/* Background ambient lighting for current session */}
      {isCurrentSession && (
        <>
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[130px]" />
          <div className="pointer-events-none absolute top-1/3 -right-40 h-[400px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />
        </>
      )}

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          key={`header-${isCurrentSession ? "current" : "past"}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:mb-12"
        >
          {isCurrentSession ? (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300">
                <HugeiconsIcon icon={UserGroupIcon} size={14} />
                <span>Deviators Core Roster</span>
                <span className="text-white/40">·</span>
                <span className="font-mono text-white/80">
                  Session 3 (2026–27)
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Meet The Deviators
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-white/50 sm:text-base">
                The visionary leads, coordinators, and builders powering tech
                innovation, hackathons, and community growth.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl text-white sm:text-4xl lg:text-5xl">
                Meet Our Team
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/40 sm:text-base">
                The people behind Deviators Club pushing boundaries
              </p>
            </>
          )}
        </motion.div>

        {/* Filter pills */}
        {isCurrentSession ? (
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6 sm:mb-12">
            <div className="flex flex-wrap gap-2">
              {currentCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                    selectedCategory === category
                      ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/25"
                      : "glass-card text-white/60 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <p className="font-mono text-xs text-white/40">
              Showing{" "}
              <span className="font-medium text-white">
                {filteredCurrentTeam.length}
              </span>{" "}
              members
            </p>
          </div>
        ) : (
          <div className="mb-10 flex flex-wrap justify-center gap-2 sm:mb-12">
            {pastCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-2xl px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                  selectedCategory === category
                    ? "bg-brand text-white"
                    : "glass-card text-white/50 hover:text-white/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Team Grid */}
        <AnimatePresence mode="wait">
          {isCurrentSession ? (
            /* Current Session Cards */
            <motion.div
              key={`grid-03-${selectedCategory}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2"
            >
              {filteredCurrentTeam.map((member, index) => {
                const isLead = member.roles.some((r) =>
                  /president|coordinator|lead/i.test(r),
                );

                return (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    whileHover={{ y: -3 }}
                    onClick={() => {
                      if (member.hasNoProfile) return;
                      if (member.username) {
                        router.push(`/dashboard/@${member.username}`);
                      } else {
                        setFlexMember(member);
                      }
                    }}
                    className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0e19]/90 p-5 shadow-xl transition-all duration-300 sm:p-6 ${
                      member.hasNoProfile
                        ? "cursor-default"
                        : "cursor-pointer hover:border-blue-500/40 hover:bg-[#0c1222]"
                    }`}
                  >
                    {/* Subtle top card glow */}
                    <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-all duration-500 group-hover:bg-blue-500/20" />

                    <div className="flex gap-4 sm:gap-5">
                      {/* Photo with status indicator */}
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] shadow-inner sm:h-32 sm:w-32">
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 112px, 128px"
                          priority={index < 4}
                          unoptimized
                        />
                        {isLead && (
                          <div className="absolute top-2 right-2 rounded-full border border-amber-400/30 bg-black/60 p-1 text-amber-300 shadow-sm backdrop-blur-md">
                            <HugeiconsIcon icon={Medal01Icon} size={12} />
                          </div>
                        )}
                      </div>

                      {/* Member Details */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          {/* Name & Handle */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-heading truncate text-lg font-bold text-white transition-colors group-hover:text-blue-300 sm:text-xl">
                                {member.name}
                              </h3>
                              {member.hasNoProfile ? (
                                <p className="truncate font-mono text-xs text-amber-300/80">
                                  Chief Coordinator · Faculty
                                </p>
                              ) : (
                                <p className="truncate font-mono text-xs text-white/45">
                                  @{member.username}
                                </p>
                              )}
                            </div>

                            {/* Profile Badge Link Icon */}
                            {!member.hasNoProfile && (
                              <Link
                                href={
                                  member.username
                                    ? `/dashboard/@${member.username}`
                                    : "#"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!member.username) {
                                    e.preventDefault();
                                    setFlexMember(member);
                                  }
                                }}
                                title={`Open @${member.username}'s profile badge`}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition-all duration-200 hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-blue-300 active:scale-95"
                              >
                                <LuArrowUpRight className="h-4 w-4" />
                              </Link>
                            )}
                          </div>

                          {/* Role Badges */}
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {member.roles.map((role) => (
                              <span
                                key={role}
                                className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-medium shadow-sm transition-colors ${getRoleBadgeStyle(
                                  role,
                                )}`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>

                          {/* Short intro bio */}
                          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-white/50 sm:text-sm">
                            {member.intro}
                          </p>
                        </div>

                        {/* Footer: Branch/Year & Socials */}
                        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                          <span className="font-mono text-[11px] text-white/40">
                            {member.branch} · {member.year}
                          </span>

                          <div className="flex items-center gap-2">
                            {Object.entries(member.urls)
                              .filter(([_, url]) => Boolean(url && url.trim()))
                              .map(([key, url]) => (
                                <Link
                                  key={key}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/40 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                                  title={key}
                                >
                                  {socialIcon[key]}
                                </Link>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* Previous Sessions Cards - EXACT original structure and styles with ZERO changes */
            <motion.div
              key={`grid-${activeSession}-${selectedCategory}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2"
            >
              {filteredPastTeam.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="glass-card flex gap-4 rounded-2xl p-4 transition-colors duration-300 hover:bg-white/[0.06] sm:gap-5 sm:p-5"
                >
                  {/* Photo */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                      priority={index < 6}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <h3 className="truncate text-base text-white sm:text-lg">
                      {member.name}
                    </h3>

                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {member.roles.map((role: string) => (
                        <span
                          key={role}
                          className="bg-brand/15 text-brand-light rounded-lg px-2 py-0.5 text-[10px] font-medium sm:text-xs"
                        >
                          {role}
                        </span>
                      ))}
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/35 sm:text-sm">
                      {member.intro}
                    </p>

                    <div className="mt-2.5 flex gap-2">
                      {Object.entries(member.urls).map(([key, url]) => (
                        <Link
                          key={key}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-brand-light text-white/25 transition-colors duration-200"
                          title={key}
                        >
                          {socialIcon[key]}
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session switcher */}
        <div className="mt-12 flex justify-center sm:mt-16">
          <div className="glass-card inline-flex rounded-2xl p-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSessionSwitch(s.id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 sm:px-5 sm:py-2.5 ${
                  activeSession === s.id
                    ? "bg-brand text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <span>{s.label}</span>
                <span className="ml-1.5 text-[10px] opacity-60 sm:text-xs">
                  {s.subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Flex Card Modal for clicked member */}
      <TeamFlexModal member={flexMember} onClose={() => setFlexMember(null)} />
    </section>
  );
}
