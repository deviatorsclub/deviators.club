import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import FlexBadge from "@/components/dashboard/FlexBadge";
import type { DemoProfile, ProfileTag } from "@/lib/dashboard/demo";

type CardJson = {
  username: string;
  display_name: string;
  bio: string;
  pronouns: string;
  location: string;
  branch: string;
  year: string;
  avatar_url: string;
  github_url: string;
  linkedin_url: string;
  website: string;
  created_at: string;
  tags: ProfileTag[];
};

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function getCard(raw: string): Promise<CardJson | null> {
  // Next may hand params encoded (%40user) or decoded (@user) depending on
  // the caller — normalize both before lookup.
  let username = raw.trim();
  try {
    username = decodeURIComponent(username);
  } catch {
    // keep raw value if it isn't validly encoded
  }
  username = username.replace(/^@/, "").trim();
  if (!username) return null;
  const { data, error } = await anonClient().rpc("get_member_card", {
    p_username: username,
  });
  if (error || !data || typeof data !== "object") return null;
  const card = data as CardJson;
  if (!card.username) return null;
  return card;
}

function toProfile(card: CardJson): DemoProfile {
  return {
    email: "",
    displayName: card.display_name,
    username: card.username,
    bio: card.bio,
    pronouns: card.pronouns,
    location: card.location,
    branch: card.branch,
    year: card.year,
    avatarUrl: card.avatar_url,
    provider: "email",
    githubUrl: card.github_url,
    linkedinUrl: card.linkedin_url,
    website: card.website,
    onboarded: true,
    memberSince: card.created_at,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const card = await getCard(username);
  if (!card) return { title: "Badge not found · Deviators Club" };
  return {
    title: `I AM A DEVIATOR — @${card.username} · Deviators Club`,
    description: card.bio || `Check out @${card.username}'s Deviator badge.`,
  };
}

export default async function PublicBadgePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const card = await getCard(username);
  if (!card) notFound();

  return (
    <main className="mx-auto w-full max-w-sm px-4 pt-28 pb-16 sm:px-6">
      <FlexBadge profile={toProfile(card)} tags={card.tags} />

      <div className="glass-card mt-5 rounded-3xl p-5 text-center sm:p-6">
        <p className="text-sm text-white/60">
          This is <span className="font-mono text-white">@{card.username}</span>
          &rsquo;s Deviator badge.
        </p>
        <Link href="/login" className="btn-primary mt-4 w-full py-3 text-sm">
          Create your own badge
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
        <Link
          href="/"
          className="mt-2.5 inline-block text-[13px] font-medium text-white/45 transition-colors hover:text-white"
        >
          Explore the club
        </Link>
      </div>
    </main>
  );
}
