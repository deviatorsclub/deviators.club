"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Pin02Icon,
  UserGroupIcon,
  CheckmarkCircle01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  InformationCircleIcon,
  Medal01Icon,
  Notification01Icon,
  HelpCircleIcon,
  Copy01Icon,
  Tick01Icon,
  NewTwitterIcon,
  Linkedin02Icon,
  WhatsappIcon,
  InstagramIcon,
  CodeCircleIcon,
  SparklesIcon,
  Shield01Icon,
  Clock01Icon,
  GlobeIcon,
  BookOpen01Icon,
} from "@hugeicons/core-free-icons";
import { getEventDetails, type EventDetailsData } from "@/data/eventDetails";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";
import EventTeamManager, {
  type EventTeamInfo,
  type TeamInvitation,
} from "@/components/events/EventTeamManager";
import { createClient } from "@/lib/supabase/client";

export default function EventDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const event = getEventDetails(slug);

  const [activeTab, setActiveTab] = useState<
    | "details"
    | "announcements"
    | "timeline"
    | "prizes"
    | "rules"
    | "faqs"
    | "sponsors"
  >("details");

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    onboarded?: boolean;
    phone?: string;
    collegeId?: string;
    branch?: string;
    section?: string;
    year?: string;
  } | null>(null);

  const [registered, setRegistered] = useState(false);
  const [team, setTeam] = useState<EventTeamInfo | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedStory, setCopiedStory] = useState(false);

  // Live countdown timers: Registration Cutoff (12 Oct 2026, 11:59 PM) & Event Kickoff (15 Oct 2026, 8:00 AM)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [regTimeLeft, setRegTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isClosed: false,
  });

  useEffect(() => {
    const regTarget = new Date("2026-10-12T23:59:59+05:30").getTime();
    const eventTarget = new Date("2026-10-15T08:00:00+05:30").getTime();

    const updateCountdowns = () => {
      const now = new Date().getTime();
      const regDiff = Math.max(0, regTarget - now);
      const eventDiff = Math.max(0, eventTarget - now);

      setRegTimeLeft({
        days: Math.floor(regDiff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((regDiff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((regDiff / 1000 / 60) % 60),
        seconds: Math.floor((regDiff / 1000) % 60),
        isClosed: regDiff <= 0,
      });

      setTimeLeft({
        days: Math.floor(eventDiff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((eventDiff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((eventDiff / 1000 / 60) % 60),
        seconds: Math.floor((eventDiff / 1000) % 60),
      });
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check URL query parameters for ?register=true to automatically open modal
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("register") === "true") {
        setShowRegModal(true);
      }
    }
  }, []);

  // Load auth state & team registration status
  const fetchStatus = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const baseUser = {
          id: user.id,
          username: profile?.username || "deviator",
          displayName:
            profile?.display_name || user.email?.split("@")[0] || "Deviator",
          email: user.email,
          avatarUrl: profile?.avatar_url || "",
          onboarded: profile?.onboarded ?? false,
          branch: profile?.branch || "",
          year: profile?.year || "",
        };

        setCurrentUser(baseUser);

        // Fetch team registration & pending invitations
        const teamRes = await fetch(`/api/events/${slug}/team`);
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setRegistered(teamData.registered);
          setTeam(teamData.team);
          setInvitations(teamData.invitations || []);
          if (teamData.user) {
            setCurrentUser({
              ...baseUser,
              ...teamData.user,
              displayName:
                teamData.user.displayName ||
                teamData.user.display_name ||
                baseUser.displayName,
              avatarUrl:
                teamData.user.avatarUrl ||
                teamData.user.avatar_url ||
                baseUser.avatarUrl,
            });
          }
        }
      } else {
        setCurrentUser(null);
        setRegistered(false);
        setTeam(null);
        setInvitations([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [slug]);

  const pageUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://www.deviators.club/events/${slug}`;
  const shareText = `DEBUG DECRYPT 3.0 — The Ultimate Algorithm Challenge! Offline competitive programming event on 15 Oct 2026. Register your 2-3 member squad:`;
  const enc = encodeURIComponent;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopyStory = async () => {
    try {
      const storyText = `⚡ DEBUG DECRYPT 3.0 — The Ultimate Algorithm Challenge\nThink. Debug. Optimize. Conquer.\n15 OCT 2026 · Dronacharya College of Engineering\n₹18,000 Cash Prizes · Teams of 2–3\nRegister: ${pageUrl}`;
      await navigator.clipboard.writeText(storyText);
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 2000);
    } catch {}
  };

  return (
    <main className="min-h-screen bg-[#06080d] pt-24 pb-20 font-sans text-white antialiased selection:bg-blue-500 selection:text-white sm:pt-28">
      {/* Background ambient light */}
      <div className="pointer-events-none fixed top-0 left-1/2 h-[520px] w-full max-w-7xl -translate-x-1/2 bg-blue-600/10 blur-[150px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 h-[400px] w-[500px] bg-cyan-500/10 blur-[140px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <HugeiconsIcon
                icon={copiedLink ? Tick01Icon : Copy01Icon}
                size={14}
                className={copiedLink ? "text-emerald-400" : ""}
              />
              <span>{copiedLink ? "Link Copied" : "Share Event"}</span>
            </button>
          </div>
        </div>

        {/* Top Event Banner Poster */}
        <div className="relative aspect-[2345/670] w-full overflow-hidden rounded-3xl border border-white/15 bg-[#090d16] shadow-2xl">
          <Image
            src={event.bannerUrl}
            alt={event.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Main Grid: Left Content vs Right Sticky Sidebar */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT CONTENT COLUMN */}
          <div className="min-w-0 space-y-6">
            {/* Header Card */}
            <div className="glass-card relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0e19] p-6 sm:p-7">
              <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                      <HugeiconsIcon icon={Pin02Icon} size={13} />
                      {event.mode}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-xs font-medium text-white/70">
                      Team Size: {event.minTeamSize}–{event.maxTeamSize} Members
                    </span>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                      Registrations Open
                    </span>
                  </div>

                  <h1 className="font-heading text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
                    {event.title}
                  </h1>
                  <p className="mt-1 font-mono text-xs font-semibold tracking-wide text-cyan-300 sm:text-sm">
                    {event.subtitle}
                  </p>

                  {/* Location & Time info */}
                  <div className="mt-4 space-y-2 border-t border-white/[0.08] pt-4 text-xs text-white/70 sm:text-sm">
                    <div className="flex items-start gap-2.5">
                      <HugeiconsIcon
                        icon={Pin02Icon}
                        size={16}
                        className="mt-0.5 shrink-0 text-white/40"
                      />
                      <div>
                        <span className="font-semibold text-white/90">
                          Location:{" "}
                        </span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={16}
                        className="shrink-0 text-white/40"
                      />
                      <div>
                        <span className="font-semibold text-white/90">
                          Date & Time:{" "}
                        </span>
                        <span>15 October 2026 · {event.timeRange}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {event.categories.map((c) => (
                      <span
                        key={c}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] font-medium text-white/60"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Event Emblem */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-[#090d16] shadow-xl sm:h-24 sm:w-24">
                  <Image
                    src={event.logoUrl}
                    alt="Event Badge"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* Team Manager Panel (Active team or pending invitations) */}
            <EventTeamManager
              slug={slug}
              team={team}
              invitations={invitations}
              currentUser={currentUser}
              onRefresh={fetchStatus}
            />

            {/* Navigation Tabs */}
            <div className="flex scrollbar-none overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0e19] p-1.5 shadow-md">
              {[
                {
                  id: "details",
                  label: "Details",
                  icon: InformationCircleIcon,
                },
                {
                  id: "announcements",
                  label: `Announcements (${event.announcements.length})`,
                  icon: Notification01Icon,
                },
                { id: "timeline", label: "Timeline", icon: Calendar03Icon },
                { id: "prizes", label: "Prizes", icon: Medal01Icon },
                { id: "rules", label: "Rules", icon: Shield01Icon },
                { id: "faqs", label: "FAQs", icon: HelpCircleIcon },
                { id: "sponsors", label: "Sponsors", icon: SparklesIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-indigo-600/20 font-bold text-cyan-200 shadow-lg shadow-cyan-500/10"
                      : "text-white/50 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <HugeiconsIcon icon={tab.icon} size={15} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <div className="glass-card min-h-[420px] rounded-3xl border border-white/10 bg-[#0a0e19] p-6 sm:p-8">
              {/* 1. DETAILS */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white sm:text-xl">
                      All that you need to know about {event.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">
                      {event.overview}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">
                      {event.progressiveModel}
                    </p>
                  </div>

                  {/* Competition Structure Stages */}
                  <div className="border-t border-white/[0.08] pt-6">
                    <h4 className="font-heading text-base font-bold text-white">
                      Competition Structure
                    </h4>
                    <div className="mt-4 space-y-4">
                      {event.stages.map((st, idx) => (
                        <div
                          key={st.title}
                          className="rounded-2xl border border-white/10 bg-black/40 p-5 transition-colors hover:border-blue-500/30"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold tracking-wider text-blue-300 uppercase">
                              Stage {idx + 1} · {st.stageType}
                            </span>
                          </div>
                          <h5 className="font-heading mt-1 text-base font-bold text-white">
                            {st.title}
                          </h5>
                          <p className="mt-2 text-xs leading-relaxed text-white/65 sm:text-sm">
                            {st.desc}
                          </p>
                          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                            <span className="font-mono text-[11px] font-semibold text-white/40 uppercase">
                              Objective:{" "}
                            </span>
                            <span className="text-xs text-white/70">
                              {st.objective}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Event Highlights */}
                  <div className="border-t border-white/[0.08] pt-6">
                    <h4 className="font-heading text-base font-bold text-white">
                      Event Highlights
                    </h4>
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {event.highlights.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/75"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Venue Details */}
                  <div className="border-t border-white/[0.08] pt-6">
                    <h4 className="font-heading text-base font-bold text-white">
                      Venue Details
                    </h4>
                    <p className="mt-2 text-xs text-white/60 sm:text-sm">
                      {event.venueDetails}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. ANNOUNCEMENTS */}
              {activeTab === "announcements" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <h3 className="font-heading text-lg font-bold text-white">
                      Official Announcements & Broadcasts
                    </h3>
                    <span className="font-mono text-xs text-blue-400">
                      {event.announcements.length} updates
                    </span>
                  </div>

                  {event.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="rounded-2xl border border-white/10 bg-black/40 p-5 transition-colors hover:border-blue-500/20"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                          {ann.tag}
                        </span>
                        <span className="font-mono text-[11px] text-white/40">
                          {ann.postedAt}
                        </span>
                      </div>
                      <h4 className="font-heading mt-2.5 text-base font-bold text-white">
                        {ann.title}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-white/65 sm:text-sm">
                        {ann.content}
                      </p>
                      <p className="mt-3 font-mono text-[11px] text-white/35">
                        Posted by {ann.author}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. TIMELINE */}
              {activeTab === "timeline" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      Event Schedule — 15 October 2026
                    </h3>
                    <p className="mt-1 text-xs text-white/50">
                      Full-day algorithmic challenge running from 8:00 AM to
                      7:00 PM.
                    </p>
                  </div>

                  <div className="relative space-y-5 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5 before:bg-white/10">
                    {event.timeline.map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute top-1.5 -left-[27px] h-3.5 w-3.5 rounded-full border-2 border-[#090d16] bg-blue-400" />
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-heading text-sm font-bold text-white">
                              {item.stage}
                            </h4>
                            <span className="font-mono text-xs font-semibold text-blue-300">
                              {item.time}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-white/60">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. PRIZES */}
              {activeTab === "prizes" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      ₹18,000 Total Cash Prize Pool
                    </h3>
                    <p className="mt-1 text-xs text-white/50">
                      Awarded to top performers of DEBUG DECRYPT 3.0.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {event.prizes.map((p) => (
                      <div
                        key={p.rank}
                        className={`rounded-2xl border p-5 ${p.tone}`}
                      >
                        <span className="font-mono text-xs font-bold tracking-wider uppercase">
                          {p.rank}
                        </span>
                        <h4 className="mt-1 text-base font-extrabold text-white">
                          {p.title}
                        </h4>
                        <p className="font-heading mt-2 text-3xl font-black text-white">
                          {p.reward}
                        </p>
                        <p className="mt-3 text-xs text-white/70">{p.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/[0.08] pt-6">
                    <h4 className="font-heading text-sm font-bold text-white">
                      Special Prizes & Tracks
                    </h4>
                    <div className="mt-3 space-y-2">
                      {event.specialPrizes.map((sp, idx) => (
                        <p
                          key={idx}
                          className="text-xs leading-relaxed text-white/65"
                        >
                          • {sp}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. RULES */}
              {activeTab === "rules" && (
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-bold text-white">
                    Participation Rules & Guidelines
                  </h3>
                  <div className="space-y-2.5">
                    {event.rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-3.5"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-mono text-xs font-bold text-blue-300">
                          {idx + 1}
                        </span>
                        <p className="text-xs leading-relaxed text-white/75 sm:text-sm">
                          {rule}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. FAQS */}
              {activeTab === "faqs" && (
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-bold text-white">
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-3">
                    {event.faqs.map((faq, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4"
                      >
                        <h4 className="text-sm font-bold text-white">
                          {faq.q}
                        </h4>
                        <p className="mt-1.5 text-xs leading-relaxed text-white/65">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. SPONSORS */}
              {activeTab === "sponsors" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      Official Sponsors & Partners
                    </h3>
                    <p className="mt-1 text-xs text-white/50">
                      Empowering student coders with national reach and systems
                      challenge tooling.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {event.sponsors.map((s) => (
                      <div
                        key={s.name}
                        className="rounded-3xl border border-white/15 bg-black/40 p-6 transition-colors hover:border-blue-500/30"
                      >
                        <span className="font-mono text-xs font-semibold tracking-wider text-blue-300 uppercase">
                          {s.tier}
                        </span>
                        <h4 className="font-heading mt-1 text-xl font-bold text-white">
                          {s.name}
                        </h4>
                        <p className="mt-2 text-xs leading-relaxed text-white/70 sm:text-sm">
                          {s.offering}
                        </p>
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
                        >
                          <span>Visit {s.name}</span>
                          <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Closing Callout */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#0c1322] via-[#080d18] to-[#070b14] p-7 text-center">
              <p className="font-heading text-lg font-black tracking-wider text-white uppercase sm:text-2xl">
                {event.closingQuote.heading}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-xs text-white/60 sm:text-sm">
                {event.closingQuote.subheading}
              </p>
              <p className="font-heading mt-4 text-base font-extrabold tracking-widest text-cyan-300 uppercase">
                {event.closingQuote.ctaText}
              </p>
            </div>
          </div>

          {/* RIGHT STICKY SIDEBAR (Unstop-Style Registration & Big Timer) */}
          <div className="h-fit space-y-5 lg:sticky lg:top-24">
            <div className="glass-card relative overflow-hidden rounded-3xl border border-white/15 bg-[#0a0e19] p-6 shadow-2xl">
              {/* Competition Mode & Entry Pass Header */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-black/30 p-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                    </span>
                    <span className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase">
                      Offline · On-Campus
                    </span>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                    100% Free Entry
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-t border-white/[0.06] pt-3">
                  <div>
                    <p className="font-mono text-[10px] tracking-wider text-white/40 uppercase">
                      Challenge Format
                    </p>
                    <p className="text-xs font-semibold text-slate-200">
                      Competitive DSA & Debugging
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-2xl font-black tracking-tight text-white">
                      {event.fee}
                    </p>
                    <p className="font-mono text-[10px] tracking-wider text-white/40 uppercase">
                      Zero Registration Fee
                    </p>
                  </div>
                </div>
              </div>

              {/* User Identity Card (Unstop pattern) */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-3.5">
                {currentUser ? (
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/[0.05]">
                      {currentUser.avatarUrl ? (
                        <Image
                          src={currentUser.avatarUrl}
                          alt={currentUser.displayName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-white">
                          {currentUser.displayName?.[0] || "U"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {currentUser.displayName}
                      </p>
                      <p className="truncate font-mono text-xs text-white/50">
                        {currentUser.email || `@${currentUser.username}`}
                      </p>
                    </div>
                    {currentUser.onboarded && (
                      <span
                        className="rounded-full bg-emerald-500/15 p-1 text-emerald-400"
                        title="Profile Verified"
                      >
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <p className="text-xs text-white/60">
                      Sign in with your Deviators account to register.
                    </p>
                    <Link
                      href={`/login?next=/events/${slug}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      Sign In Now
                      <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                    </Link>
                  </div>
                )}
              </div>

              {/* REGISTRATION CLOSING TIMELINE (3 DAYS PRIOR CUTOFF) */}
              <div className="mt-5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-[#0a0f1d] to-[#080d1a] p-4 text-center shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                    <HugeiconsIcon icon={Clock01Icon} size={13} />
                    Registration Cutoff
                  </span>
                  <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
                    3 Days Before Event
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-4 gap-1.5 font-mono">
                  <div className="rounded-xl border border-white/10 bg-black/60 p-2">
                    <span className="font-heading block text-xl font-black text-amber-200 sm:text-2xl">
                      {String(regTimeLeft.days).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] tracking-wider text-white/40 uppercase">
                      Days
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/60 p-2">
                    <span className="font-heading block text-xl font-black text-amber-200 sm:text-2xl">
                      {String(regTimeLeft.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] tracking-wider text-white/40 uppercase">
                      Hours
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/60 p-2">
                    <span className="font-heading block text-xl font-black text-amber-200 sm:text-2xl">
                      {String(regTimeLeft.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] tracking-wider text-white/40 uppercase">
                      Mins
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/60 p-2">
                    <span className="font-heading block text-xl font-black text-amber-200 sm:text-2xl">
                      {String(regTimeLeft.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] tracking-wider text-white/40 uppercase">
                      Secs
                    </span>
                  </div>
                </div>

                <p className="mt-2 font-mono text-[11px] text-white/50">
                  Strict Cutoff: 12 Oct 2026 · 11:59 PM
                </p>
              </div>

              {/* EVENT START COUNTDOWN SNIPPET */}
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] tracking-wider text-white/50 uppercase">
                    Event Kickoff:
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    15 Oct 2026 · 8:00 AM
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="mt-5 space-y-3">
                {registered ? (
                  <div className="space-y-2">
                    <Link
                      href={`/events/${slug}/team/@${encodeURIComponent(team?.name || "")}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/20 py-3.5 text-sm font-bold text-emerald-300 shadow-lg transition-colors hover:bg-emerald-500/30"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={17} />
                      <span>View Team Card · {team?.name}</span>
                    </Link>
                    <p className="text-center font-mono text-[11px] text-white/40">
                      Team Leader: {team?.isLeader ? "You" : "Teammate"} ·{" "}
                      {team?.members?.length} members
                    </p>
                  </div>
                ) : currentUser && !currentUser.onboarded ? (
                  <div className="space-y-2">
                    <Link
                      href={`/onboarding?next=/events/${slug}`}
                      className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-sm font-bold"
                    >
                      Build Profile to Register
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                    </Link>
                    <p className="text-center text-[11px] text-amber-300/70">
                      * Complete your profile to form a team.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        window.location.href = `/login?next=/events/${slug}?register=true`;
                      } else {
                        setShowRegModal(true);
                      }
                    }}
                    className="group relative flex w-full items-center justify-center gap-2.5 rounded-2xl border border-blue-500/40 bg-blue-600 px-6 py-4 text-sm font-extrabold tracking-wider text-white uppercase shadow-xl shadow-blue-600/25 transition-all duration-200 hover:border-blue-400 hover:bg-blue-500 hover:shadow-blue-500/40 active:scale-[0.99]"
                  >
                    <span className="flex h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                    <span className="font-heading font-black tracking-wider text-white uppercase">
                      Register Team Now
                    </span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={17}
                      className="text-blue-200 transition-transform group-hover:translate-x-1 group-hover:text-white"
                    />
                  </button>
                )}
              </div>

              {/* Social Sharing Direct Hub */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                <p className="text-xs font-semibold text-white">
                  Share Event Direct to Socials
                </p>
                <p className="mt-0.5 text-[11px] text-white/45">
                  Post on Instagram stories, LinkedIn, or X!
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  {/* Instagram story */}
                  <button
                    onClick={handleCopyStory}
                    title="Copy for Instagram Story"
                    className="flex h-8 items-center gap-1 rounded-xl border border-pink-500/30 bg-pink-500/15 px-2.5 text-xs font-semibold text-pink-300 transition-colors hover:bg-pink-500/25"
                  >
                    <HugeiconsIcon icon={InstagramIcon} size={13} />
                    <span>{copiedStory ? "Copied" : "Story"}</span>
                  </button>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(pageUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Post on X"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:text-white"
                  >
                    <HugeiconsIcon icon={NewTwitterIcon} size={14} />
                  </a>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(pageUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Share on LinkedIn"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:text-white"
                  >
                    <HugeiconsIcon icon={Linkedin02Icon} size={14} />
                  </a>

                  <a
                    href={`https://wa.me/?text=${enc(`${shareText} ${pageUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Share on WhatsApp"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:text-white"
                  >
                    <HugeiconsIcon icon={WhatsappIcon} size={14} />
                  </a>

                  <button
                    onClick={handleCopyLink}
                    title="Copy event URL"
                    className="flex h-8 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-xs text-white/70 transition-colors hover:text-white"
                  >
                    <HugeiconsIcon
                      icon={copiedLink ? Tick01Icon : Copy01Icon}
                      size={13}
                    />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Sponsors snippet */}
              <div className="mt-5 border-t border-white/[0.08] pt-4 text-center">
                <span className="block font-mono text-[10px] tracking-wider text-white/40 uppercase">
                  Official Partners
                </span>
                <div className="mt-2 flex items-center justify-center gap-4 text-xs font-bold text-white/70">
                  <a
                    href="https://unstop.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white"
                  >
                    Unstop
                  </a>
                  <span className="text-white/20">·</span>
                  <a
                    href="https://codecrafters.io"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white"
                  >
                    CodeCrafters
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <EventRegistrationModal
          event={event}
          currentUser={currentUser}
          onClose={() => setShowRegModal(false)}
          onSuccess={fetchStatus}
        />
      )}
    </main>
  );
}
