"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Shield01Icon,
  Calendar03Icon,
  Pin02Icon,
  Medal01Icon,
  Copy01Icon,
  Tick01Icon,
  NewTwitterIcon,
  Linkedin02Icon,
  WhatsappIcon,
  InstagramIcon,
  FlashIcon,
  GithubIcon,
  GlobeIcon,
} from "@hugeicons/core-free-icons";
import { getEventDetails } from "@/data/eventDetails";
import TeamFlexModal from "@/components/team/TeamFlexModal";
import type { TeamMemberData } from "@/data/team03";
import { createClient } from "@/lib/supabase/client";

export default function TeamShowcasePage({
  params,
}: {
  params: Promise<{ slug: string; teamName: string }>;
}) {
  const { slug, teamName: rawTeamName } = use(params);
  const cleanTeamName = decodeURIComponent(rawTeamName)
    .replace(/^@/, "")
    .trim();
  const event = getEventDetails(slug);

  const [teamData, setTeamData] = useState<{
    id: string;
    name: string;
    leaderId: string;
    members: {
      profileId: string;
      username: string;
      displayName: string;
      bio: string;
      avatarUrl: string;
      branch: string;
      year: string;
      role: "Leader" | "Member";
      status: string;
      githubUrl?: string;
      linkedinUrl?: string;
      website?: string;
    }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedStory, setCopiedStory] = useState(false);
  const [selectedFlexMember, setSelectedFlexMember] =
    useState<TeamMemberData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        // Look up team by name (case-insensitive)
        const { data: teams } = await supabase
          .from("teams")
          .select("id, name, leader_id")
          .ilike("name", cleanTeamName)
          .limit(1);

        if (teams && teams.length > 0) {
          const t = teams[0];
          const { data: tm } = await supabase
            .from("team_members")
            .select("profile_id, status")
            .eq("team_id", t.id);

          // Only include accepted teammates or the team leader
          const acceptedTm = (tm || []).filter(
            (x) => x.status === "accepted" || x.profile_id === t.leader_id,
          );

          const profileIds = acceptedTm.map((x) => x.profile_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select(
              "id, username, display_name, bio, avatar_url, branch, year, github_url, linkedin_url, website",
            )
            .in(
              "id",
              profileIds.length > 0
                ? profileIds
                : ["00000000-0000-0000-0000-000000000000"],
            );

          const pMap = new Map((profiles || []).map((p) => [p.id, p]));

          const members = acceptedTm.map((x) => {
            const p = pMap.get(x.profile_id);
            const isLeader = x.profile_id === t.leader_id;
            return {
              profileId: x.profile_id,
              username: p?.username || "deviator",
              displayName: p?.display_name || p?.username || "Deviator Member",
              bio: p?.bio || "",
              avatarUrl: p?.avatar_url || "",
              branch: p?.branch || "CSE",
              year: p?.year || "3rd Year",
              role: (isLeader ? "Leader" : "Member") as "Leader" | "Member",
              status: x.status,
              githubUrl: p?.github_url || "",
              linkedinUrl: p?.linkedin_url || "",
              website: p?.website || "",
            };
          });

          setTeamData({
            id: t.id,
            name: t.name,
            leaderId: t.leader_id,
            members,
          });
        } else {
          setTeamData(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [cleanTeamName]);

  const pageUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://www.deviators.club/events/${slug}/team/@${encodeURIComponent(cleanTeamName)}`;
  const shareText = `We are participating in DEBUG DECRYPT 3.0 — The Ultimate Algorithm Challenge! Meet team "${cleanTeamName}" on Deviators Club:`;
  const enc = encodeURIComponent;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyStory = async () => {
    try {
      const storyText = `⚡ WE ARE PARTICIPATING IN DEBUG DECRYPT 3.0\nTeam: ${cleanTeamName}\nOrganized by Deviators Club\n15 OCT 2026 · Dronacharya College of Engineering\nCheck us out: ${pageUrl}`;
      await navigator.clipboard.writeText(storyText);
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07090e] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="font-mono text-xs tracking-wider text-white/50 uppercase">
            Loading Team Card...
          </p>
        </div>
      </main>
    );
  }

  if (!teamData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#07090e] px-4 pt-24 pb-20 text-center text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-[#0a0e19] p-8 shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
            <HugeiconsIcon icon={Shield01Icon} size={30} />
          </div>
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-mono text-[11px] font-bold text-red-300 uppercase">
            Team Not Found
          </span>
          <h1 className="font-heading mt-3 text-2xl font-black text-white sm:text-3xl">
            @{cleanTeamName}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
            This team does not exist or has been disbanded. Please check the
            team name or view other teams in {event.title}.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href={`/events/${slug}`}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
              <span>Back to {event.title}</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090e] pt-24 pb-20 text-white sm:pt-28">
      {/* Background radial lights */}
      <div className="pointer-events-none fixed top-0 left-1/2 h-[500px] w-full max-w-7xl -translate-x-1/2 bg-blue-600/10 blur-[150px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 h-[400px] w-[500px] bg-cyan-500/10 blur-[140px]" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={`/events/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
            Back to Event Dashboard
          </Link>
        </div>

        {/* Top Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-300 shadow-lg shadow-blue-500/10">
            <HugeiconsIcon icon={Medal01Icon} size={14} />
            <span>Official Contender Team Badge</span>
          </div>

          <p className="font-mono text-sm tracking-[0.22em] text-white/60 uppercase">
            We are participating in
          </p>

          <h1 className="font-heading mt-1 text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
            {event.title}
          </h1>

          <p className="mt-2 text-sm font-medium text-white/60 sm:text-base">
            {event.subTagline}
          </p>

          {/* Team Badge Box */}
          <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-3xl border border-white/15 bg-[#0a0e19] px-8 py-5 shadow-2xl">
            <span className="font-mono text-[11px] tracking-widest text-white/40 uppercase">
              Team Roster
            </span>
            <span className="font-heading mt-1 bg-gradient-to-r from-blue-300 via-sky-200 to-white bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
              {cleanTeamName}
            </span>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-white/60">
              <span className="inline-flex items-center gap-1">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={14}
                  className="text-white/40"
                />
                15 Oct 2026
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <HugeiconsIcon
                  icon={Pin02Icon}
                  size={14}
                  className="text-white/40"
                />
                {event.location}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Teammates Showcase Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teamData?.members?.map((member, idx) => (
            <motion.div
              key={member.profileId || idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="glass-card group relative overflow-hidden rounded-3xl border border-white/15 bg-[#0a0e19] p-6 text-center shadow-xl transition-all duration-300 hover:border-blue-500/40"
            >
              {/* Role badge */}
              <div className="mb-4 flex justify-center">
                {member.role === "Leader" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                    <HugeiconsIcon icon={Shield01Icon} size={12} />
                    Team Leader
                  </span>
                ) : (
                  <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                    Teammate
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-white/20 bg-black/40 shadow-inner">
                {member.avatarUrl ? (
                  <Image
                    src={member.avatarUrl}
                    alt={member.displayName}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="font-heading flex h-full w-full items-center justify-center text-2xl font-black text-white/70">
                    {member.displayName?.[0] || "M"}
                  </div>
                )}
              </div>

              {/* Name & Handle */}
              <h3 className="font-heading mt-4 text-lg font-bold text-white">
                {member.displayName}
              </h3>
              <p className="font-mono text-xs text-white/50">
                @{member.username}
              </p>

              {member.bio && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/60">
                  {member.bio}
                </p>
              )}

              <p className="mt-3 font-mono text-[11px] text-white/40">
                {member.branch} · {member.year}
              </p>

              {/* Social links */}
              <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/[0.08] pt-4">
                {member.githubUrl && (
                  <a
                    href={member.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-white"
                  >
                    <HugeiconsIcon icon={GithubIcon} size={14} />
                  </a>
                )}
                {member.linkedinUrl && (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-white"
                  >
                    <HugeiconsIcon icon={Linkedin02Icon} size={14} />
                  </a>
                )}
                {member.website && (
                  <a
                    href={member.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-white"
                  >
                    <HugeiconsIcon icon={GlobeIcon} size={14} />
                  </a>
                )}

                {/* Inspect Flex Badge */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFlexMember({
                      name: member.displayName,
                      roles: [
                        member.role === "Leader"
                          ? "Team Leader"
                          : "Team Member",
                      ],
                      intro: member.bio,
                      urls: {
                        github: member.githubUrl || "",
                        linkedin: member.linkedinUrl || "",
                        portfolio: member.website || "",
                      },
                      image: member.avatarUrl || "",
                      keywords: ["Team Member"],
                      username: member.username,
                      branch: member.branch,
                      year: member.year,
                    })
                  }
                  title="Inspect Deviator Flex Badge"
                  className="inline-flex items-center gap-1 rounded-xl border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 transition-colors hover:bg-blue-500/25"
                >
                  <HugeiconsIcon
                    icon={FlashIcon}
                    size={12}
                    className="text-yellow-400"
                  />
                  Badge
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social Sharing Hub */}
        <div className="glass-card mt-10 rounded-3xl border border-white/15 bg-[#0a0e19] p-6 text-center sm:p-8">
          <h2 className="font-heading text-lg font-bold text-white sm:text-xl">
            Share Your Team Contender Card
          </h2>
          <p className="mt-1 text-xs text-white/50 sm:text-sm">
            Tag @deviatorsclub and show the campus your squad is ready for{" "}
            {event.title}!
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {/* Instagram Story Copy */}
            <button
              onClick={handleCopyStory}
              className="flex items-center gap-2 rounded-2xl border border-pink-500/30 bg-pink-500/15 px-4 py-2.5 text-xs font-bold text-pink-300 transition-colors hover:bg-pink-500/25"
            >
              <HugeiconsIcon icon={InstagramIcon} size={16} />
              <span>
                {copiedStory ? "Story Text Copied!" : "Instagram Story"}
              </span>
            </button>

            {/* Post on X */}
            <a
              href={`https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(pageUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/10"
            >
              <HugeiconsIcon icon={NewTwitterIcon} size={15} />
              <span>Post on X</span>
            </a>

            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(pageUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-600/20 px-4 py-2.5 text-xs font-bold text-blue-300 transition-colors hover:bg-blue-600/30"
            >
              <HugeiconsIcon icon={Linkedin02Icon} size={15} />
              <span>LinkedIn Post</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${enc(`${shareText} ${pageUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25"
            >
              <HugeiconsIcon icon={WhatsappIcon} size={15} />
              <span>WhatsApp</span>
            </a>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-white/80 transition-colors hover:bg-white/10"
            >
              <HugeiconsIcon
                icon={copied ? Tick01Icon : Copy01Icon}
                size={15}
                className={copied ? "text-emerald-400" : ""}
              />
              <span>{copied ? "Link Copied" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* Clickable Socials and Links at bottom */}
        <div className="mt-12 border-t border-white/[0.08] pt-8 text-center">
          <p className="font-mono text-xs font-bold tracking-wider text-white/40 uppercase">
            Deviators Club · Connect With Us
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-white/60">
            <Link href="/" className="transition-colors hover:text-white">
              Official Website
            </Link>
            <a
              href="https://github.com/AkshitBhandariCodes/deviators.club"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              GitHub Organization
            </a>
            <a
              href="https://linkedin.com/company/deviators-club"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              LinkedIn
            </a>
            <a
              href="https://instagram.com/deviatorsclub"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              Instagram
            </a>
            <a
              href="https://x.com/deviatorsclub"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              Twitter / X
            </a>
          </div>
          <p className="mt-4 font-mono text-[11px] text-white/30">
            © 2026 Deviators Club · The Community for Student Builders
          </p>
        </div>
      </div>

      {/* Flex Badge Modal */}
      <TeamFlexModal
        member={selectedFlexMember}
        onClose={() => setSelectedFlexMember(null)}
      />
    </main>
  );
}
