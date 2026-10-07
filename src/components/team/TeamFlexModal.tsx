"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Copy01Icon,
  Tick01Icon,
  NewTwitterIcon,
  Linkedin02Icon,
  WhatsappIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import FlexBadge from "@/components/dashboard/FlexBadge";
import type { DemoProfile, ProfileTag } from "@/lib/dashboard/demo";
import type { TeamMemberData } from "@/data/team03";

function memberToProfile(member: TeamMemberData): DemoProfile {
  const avatarUrl =
    typeof member.image === "string" ? member.image : member.image.src;

  return {
    displayName: member.name,
    username:
      member.username || member.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    email: "",
    bio: member.intro,
    pronouns: "",
    location: "New Delhi, India",
    branch: member.branch || "CSE",
    year: member.year || "3rd Year",
    avatarUrl,
    provider: "github",
    githubUrl: member.urls.github || "",
    linkedinUrl: member.urls.linkedin || "",
    website: member.urls.portfolio || "",
    onboarded: true,
    memberSince: "2024-08-01",
  };
}

function memberToTags(member: TeamMemberData): ProfileTag[] {
  return member.roles.map((r) => {
    let tone = "bg-white/[0.06] text-white/70 border-white/10";
    const low = r.toLowerCase();
    if (low.includes("president")) {
      tone = "bg-amber-400/10 text-amber-300 border-amber-400/25";
    } else if (low.includes("coordinator")) {
      tone = "bg-amber-500/10 text-amber-300 border-amber-500/20";
    } else if (low.includes("web")) {
      tone = "bg-blue-500/10 text-blue-300 border-blue-500/20";
    } else if (low.includes("aiml") || low.includes("ai")) {
      tone = "bg-purple-500/10 text-purple-300 border-purple-500/20";
    } else if (low.includes("dsa")) {
      tone = "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
    } else if (low.includes("lead")) {
      tone = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
    }
    return {
      tag: low.replace(/\s+/g, "-"),
      label: r,
      tone,
    };
  });
}

export default function TeamFlexModal({
  member,
  onClose,
}: {
  member: TeamMemberData | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (member) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [member, onClose]);

  if (!member) return null;

  const profile = memberToProfile(member);
  const tags = memberToTags(member);
  const pageUrl = `https://www.deviators.club/dashboard/@${profile.username}`;
  const shareText = `Check out ${member.name} (${member.roles.join(", ")}) on Deviators Club! ⚡`;
  const enc = encodeURIComponent;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${pageUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 my-auto w-full max-w-md rounded-3xl border border-white/15 bg-[#090d16] p-5 shadow-2xl shadow-blue-500/10 sm:p-6"
        >
          {/* Header controls */}
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
              Deviator Flex Card
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Close modal"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>

          {/* The Flex Badge Card */}
          <div className="shadow-xl">
            <FlexBadge profile={profile} tags={tags} />
          </div>

          {/* Action Row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-2">
            <div className="flex items-center gap-1.5">
              <a
                href={`https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(pageUrl)}`}
                target="_blank"
                rel="noreferrer"
                title="Share on X"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <HugeiconsIcon icon={NewTwitterIcon} size={15} />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(pageUrl)}`}
                target="_blank"
                rel="noreferrer"
                title="Share on LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <HugeiconsIcon icon={Linkedin02Icon} size={15} />
              </a>
              <a
                href={`https://wa.me/?text=${enc(`${shareText} ${pageUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                title="Share on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <HugeiconsIcon icon={WhatsappIcon} size={15} />
              </a>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `⚡ DEVIATOR BADGE: ${member.name} (${member.roles.join(", ")})\nJoin the community at: ${pageUrl}`,
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {}
                }}
                title="Copy for Instagram Story"
                className="flex h-9 items-center gap-1.5 rounded-xl border border-pink-500/30 bg-pink-500/10 px-2.5 text-xs font-semibold text-pink-300 transition-colors hover:bg-pink-500/20"
              >
                <span>Instagram Story</span>
              </button>
              <button
                onClick={handleCopy}
                title="Copy Card Link"
                className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <HugeiconsIcon
                  icon={copied ? Tick01Icon : Copy01Icon}
                  size={14}
                  className={copied ? "text-emerald-400" : ""}
                />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <Link
              href={`/dashboard/@${profile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              Public Profile
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
