"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Medal01Icon,
  GithubIcon,
  Linkedin02Icon,
  GlobeIcon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import {
  formatMemberSince,
  type DemoProfile,
  type ProfileTag,
} from "@/lib/dashboard/demo";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function FlexBadge({
  profile,
  tags,
}: {
  profile: DemoProfile;
  tags: ProfileTag[];
}) {
  const memberSince = formatMemberSince(profile.memberSince);
  const links = [
    profile.githubUrl
      ? { icon: GithubIcon, href: profile.githubUrl, label: "GitHub" }
      : null,
    profile.linkedinUrl
      ? { icon: Linkedin02Icon, href: profile.linkedinUrl, label: "LinkedIn" }
      : null,
    profile.website
      ? { icon: GlobeIcon, href: profile.website, label: "Website" }
      : null,
  ].filter((l): l is { icon: typeof GithubIcon; href: string; label: string } =>
    Boolean(l),
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a0e19]">
      {/* Tagline header */}
      <div className="border-b border-white/[0.07] px-6 pt-6 pb-5 text-center">
        <p className="font-mono text-[11px] font-medium tracking-[0.24em] text-white/40 uppercase">
          Deviators Club · Member Badge
        </p>
        <p className="font-heading mt-2.5 text-[30px] leading-[1.02] font-extrabold tracking-tight">
          <span className="text-white">I AM A</span>
          <br />
          <span className="text-brand-light">DEVIATOR</span>
        </p>
      </div>

      <div className="px-6 pt-6 pb-6 text-center">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={profile.displayName}
            width={96}
            height={96}
            className="mx-auto h-24 w-24 rounded-full border border-white/15 object-cover"
            unoptimized
          />
        ) : (
          <div className="font-heading mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-2xl font-extrabold text-white">
            {initials(profile.displayName || "D")}
          </div>
        )}

        <h3 className="font-heading mt-4 text-2xl font-extrabold tracking-tight text-white">
          {profile.displayName}
        </h3>
        <p className="mt-1 font-mono text-[13px] text-white/50">
          @{profile.username}
          {profile.pronouns && profile.pronouns !== "prefer not to say"
            ? ` · ${profile.pronouns}`
            : ""}
        </p>
        {profile.bio && (
          <p className="mx-auto mt-2.5 max-w-[30ch] text-sm leading-relaxed text-white/65">
            {profile.bio}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t.tag}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${t.tone}`}
              >
                {t.tag === "president" && (
                  <HugeiconsIcon icon={Medal01Icon} size={12} />
                )}
                {t.label}
              </span>
            ))}
          </div>
        )}

        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-white/55">
          {memberSince && (
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={14}
                className="text-white/35"
              />
              Member since {memberSince}
            </span>
          )}
          <span aria-hidden className="text-white/20">
            ·
          </span>
          <span>
            {profile.branch} · {profile.year}
          </span>
        </p>

        {links.length > 0 && (
          <div className="mt-4 flex justify-center gap-2">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                aria-label={l.label}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:text-white"
              >
                <HugeiconsIcon icon={l.icon} size={17} />
              </a>
            ))}
          </div>
        )}

        <p className="mt-5 font-mono text-[11px] tracking-wider text-white/30">
          deviators.club/dashboard
        </p>
      </div>
    </div>
  );
}
