"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Location01Icon,
  Mail01Icon,
  UserEdit01Icon,
  CheckmarkBadge01Icon,
  GraduationScrollIcon,
} from "@hugeicons/core-free-icons";
import { GithubIcon } from "@hugeicons/core-free-icons";
import { Linkedin02Icon } from "@hugeicons/core-free-icons";
import { GlobeIcon } from "@hugeicons/core-free-icons";
import { Medal01Icon } from "@hugeicons/core-free-icons";
import type { DemoProfile, ProfileTag } from "@/lib/dashboard/demo";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfileSidebar({
  profile,
  tags,
}: {
  profile: DemoProfile;
  tags: ProfileTag[];
}) {
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    setImgOk(true);
  }, [profile.avatarUrl]);

  return (
    <aside className="glass-card w-full shrink-0 rounded-3xl p-6 lg:sticky lg:top-24 lg:w-[300px] lg:self-start">
      {/* Avatar */}
      <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/40 via-transparent to-amber-500/20 blur-xl" />
        {imgOk && profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={profile.displayName}
            width={176}
            height={176}
            className="relative h-full w-full rounded-full border border-white/10 object-cover"
            onError={() => setImgOk(false)}
            unoptimized
          />
        ) : (
          <div className="font-heading relative flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-blue-700 to-slate-900 text-4xl font-extrabold text-white">
            {initials(profile.displayName || "D")}
          </div>
        )}
        <span
          className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/70"
          title={`Signed in with ${profile.provider}`}
        >
          <HugeiconsIcon
            icon={CheckmarkBadge01Icon}
            size={15}
            className="text-emerald-300"
          />
        </span>
      </div>

      {/* Name block */}
      <h1 className="font-heading mt-5 text-center text-2xl font-extrabold tracking-tight text-white lg:text-left">
        {profile.displayName}
      </h1>
      <p className="mt-1 text-center text-sm text-white/50 lg:text-left">
        @{profile.username}
        {profile.pronouns && profile.pronouns !== "prefer not to say"
          ? ` · ${profile.pronouns}`
          : ""}
      </p>
      {profile.bio && (
        <p className="mt-3 text-center text-sm leading-relaxed text-white/70 lg:text-left">
          {profile.bio}
        </p>
      )}

      <Link
        href="/dashboard/settings"
        className="btn-secondary mt-4 w-full rounded-xl py-2 text-sm"
      >
        <HugeiconsIcon icon={UserEdit01Icon} size={16} />
        Edit profile
      </Link>

      {/* Tags — assigned by admins, read from the database */}
      {tags.length > 0 && (
        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-white/40 uppercase">
            Roles & tags
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
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
        </div>
      )}

      {/* Meta list — only filled fields render */}
      <ul className="mt-4 space-y-2.5 border-t border-white/[0.07] pt-4 text-[13px] text-white/60">
        {profile.location && (
          <li className="flex items-center gap-2.5">
            <HugeiconsIcon
              icon={Location01Icon}
              size={15}
              className="shrink-0 text-white/35"
            />
            {profile.location}
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <HugeiconsIcon
            icon={GraduationScrollIcon}
            size={15}
            className="shrink-0 text-white/35"
          />
          {profile.branch} · {profile.year}
        </li>
        <li className="flex items-center gap-2.5">
          <HugeiconsIcon
            icon={Mail01Icon}
            size={15}
            className="shrink-0 text-white/35"
          />
          <span className="truncate">{profile.email}</span>
        </li>
        {profile.githubUrl && (
          <li>
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 transition-colors hover:text-white"
            >
              <HugeiconsIcon
                icon={GithubIcon}
                size={15}
                className="shrink-0 text-white/35"
              />
              <span className="truncate">
                {profile.githubUrl.replace("https://github.com/", "@")}
              </span>
            </a>
          </li>
        )}
        {profile.linkedinUrl && (
          <li>
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 transition-colors hover:text-white"
            >
              <HugeiconsIcon
                icon={Linkedin02Icon}
                size={15}
                className="shrink-0 text-white/35"
              />
              <span className="truncate">
                {profile.linkedinUrl.replace("https://", "")}
              </span>
            </a>
          </li>
        )}
        {profile.website && (
          <li>
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 transition-colors hover:text-white"
            >
              <HugeiconsIcon
                icon={GlobeIcon}
                size={15}
                className="shrink-0 text-white/35"
              />
              <span className="truncate">
                {profile.website.replace("https://", "")}
              </span>
            </a>
          </li>
        )}
      </ul>
    </aside>
  );
}
