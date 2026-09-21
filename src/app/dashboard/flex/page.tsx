"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  NewTwitterIcon,
  Linkedin02Icon,
  WhatsappIcon,
  Share01Icon,
  Copy01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import FlexBadge from "@/components/dashboard/FlexBadge";
import type { DemoProfile, ProfileTag } from "@/lib/dashboard/demo";
import { createClient } from "@/lib/supabase/client";
import { fetchProfile, fetchProfileTags } from "@/lib/dashboard/db";

export default function FlexPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [tags, setTags] = useState<ProfileTag[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      if (!user?.email) {
        router.replace("/login?next=/dashboard/flex");
        return;
      }
      const p = await fetchProfile(user.id, user.email);
      if (!p || !p.onboarded) {
        router.replace("/onboarding");
        return;
      }
      setProfile(p);
      setTags(await fetchProfileTags(user.id));
    })();
  }, [router]);

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 pt-24">
        <p className="text-sm text-white/40">Loading…</p>
      </main>
    );
  }

  // Shares always carry the live canonical URL, never localhost.
  const pageUrl = `https://www.deviators.club/dashboard/@${profile.username}`;
  const shareText = "I AM A DEVIATOR ⚡";
  const enc = encodeURIComponent;
  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: "I AM A DEVIATOR",
        text: shareText,
        url: pageUrl,
      });
    } catch {
      // user dismissed — nothing to do
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${pageUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const rows = [
    {
      label: "Post on X",
      hint: "Shares the badge text + link",
      icon: NewTwitterIcon,
      href: `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(pageUrl)}`,
    },
    {
      label: "Share on LinkedIn",
      hint: "Pulls the link preview",
      icon: Linkedin02Icon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(pageUrl)}`,
    },
    {
      label: "Share on WhatsApp",
      hint: "Pick a chat or My Status",
      icon: WhatsappIcon,
      href: `https://wa.me/?text=${enc(`${shareText} ${pageUrl}`)}`,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-28 pb-16 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/50 transition-colors hover:text-white"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
        Back to dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <h1 className="font-heading mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Flex Your Card
        </h1>
        <p className="mt-1.5 text-[13px] text-white/50">
          Your Deviator badge — share it anywhere.
        </p>

        <div className="mt-6 grid items-start gap-5 md:grid-cols-[360px_1fr]">
          <FlexBadge profile={profile} tags={tags} />

          <div className="glass-card rounded-3xl p-5 sm:p-6">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-white/40 uppercase">
              Share
            </p>
            <div className="mt-3 space-y-2">
              {rows.map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-black/30 p-3.5 transition-colors hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors group-hover:text-white">
                    <HugeiconsIcon icon={r.icon} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">
                      {r.label}
                    </span>
                    <span className="block truncate text-xs text-white/40">
                      {r.hint}
                    </span>
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    className="shrink-0 text-white/30 transition-colors group-hover:text-white/70"
                  />
                </a>
              ))}
              <button
                onClick={handleCopy}
                className="group flex w-full items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-black/30 p-3.5 text-left transition-colors hover:border-white/15 hover:bg-white/[0.05]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors group-hover:text-white">
                  <HugeiconsIcon
                    icon={copied ? Tick01Icon : Copy01Icon}
                    size={18}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">
                    {copied ? "Copied" : "Copy text"}
                  </span>
                  <span className="block truncate text-xs text-white/40">
                    Badge text + link for anywhere else
                  </span>
                </span>
              </button>
              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="btn-primary w-full py-3 text-sm"
                >
                  <HugeiconsIcon icon={Share01Icon} size={16} />
                  Share via… (Status, apps, more)
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
