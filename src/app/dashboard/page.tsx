"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Logout01Icon,
  Search01Icon,
  Setting06Icon,
} from "@hugeicons/core-free-icons";
import ProfileSidebar from "@/components/dashboard/ProfileSidebar";
import DashboardTabs, {
  type DashboardTabId,
} from "@/components/dashboard/DashboardTabs";
import EventCard from "@/components/dashboard/EventCard";
import RegisterModal, {
  type RegisterPayload,
} from "@/components/dashboard/RegisterModal";
import MyEvents from "@/components/dashboard/MyEvents";
import CommunityFeed from "@/components/dashboard/CommunityFeed";
import type {
  DemoEvent,
  DemoMember,
  DemoProfile,
  DemoRegistration,
  ProfileTag,
} from "@/lib/dashboard/demo";
import { createClient } from "@/lib/supabase/client";
import {
  createRegistrationDb,
  fetchEventsDb,
  fetchProfile,
  fetchProfileTags,
  fetchRegistrationsDb,
  searchMembersDb,
  withdrawRegistrationDb,
} from "@/lib/dashboard/db";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tags, setTags] = useState<ProfileTag[]>([]);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [regs, setRegs] = useState<DemoRegistration[]>([]);
  const [activeEvent, setActiveEvent] = useState<DemoEvent | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<DashboardTabId>("events");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      if (!user?.email) {
        router.replace("/login?next=/dashboard");
        return;
      }
      setUserId(user.id);
      const p = await fetchProfile(user.id, user.email);
      if (!p || !p.onboarded) {
        router.replace("/onboarding");
        return;
      }
      setProfile(p);
      const [dbTags, dbEvents, dbRegs] = await Promise.all([
        fetchProfileTags(user.id),
        fetchEventsDb(),
        fetchRegistrationsDb(user.id),
      ]);
      setTags(dbTags);
      setEvents(dbEvents);
      setRegs(dbRegs);
      setReady(true);
    })();
  }, [router]);

  const sendRsvp = (eventTitle: string, teamName: string | null) => {
    fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventTitle, teamName }),
    }).catch(() => {});
  };

  const handleRegister = async (
    payload: RegisterPayload,
  ): Promise<string | null> => {
    if (!activeEvent || !userId) {
      return "Something went wrong. Please try again.";
    }
    const { error, reg } = await createRegistrationDb({
      eventId: activeEvent.id,
      userId,
      phone: payload.phone,
      collegeId: payload.collegeId,
      year: payload.year,
      expectations: payload.expectations,
      mode: payload.mode,
      teamName: payload.teamName,
      mateUsernames: payload.mates,
    });
    if (error || !reg) {
      return error ?? "Couldn't complete your registration. Please try again.";
    }
    setRegs((prev) => [
      ...prev.filter((r) => r.eventId !== activeEvent.id),
      reg,
    ]);
    sendRsvp(activeEvent.title, reg.teamName);
    // Jump to My Events once the success modal closes
    setTimeout(() => setTab("my-events"), 1700);
    return null;
  };

  const handleWithdraw = async (eventId: string) => {
    if (userId) {
      await withdrawRegistrationDb(eventId, userId);
    }
    setRegs((prev) => prev.filter((r) => r.eventId !== eventId));
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };

  const handleSearchMembers = useCallback(
    async (q: string): Promise<DemoMember[]> => {
      if (!userId) return [];
      return searchMembersDb(q, userId);
    },
    [userId],
  );

  if (!ready || !profile) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 pt-24">
        <p className="text-sm text-white/40">Loading your dashboard…</p>
      </main>
    );
  }

  const filtered = events.filter((e) =>
    `${e.title} ${e.venue}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-24 pb-16 sm:px-6">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass-card mb-5 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
      >
        <div className="min-w-0 flex-1">
          <p className="font-heading truncate text-sm font-extrabold text-white">
            {profile.displayName}
          </p>
          <p className="truncate font-mono text-xs text-white/45">
            @{profile.username}
          </p>
        </div>
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/30"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setTab("events");
            }}
            placeholder="Search events…"
            className="w-44 rounded-xl border border-white/10 bg-black/40 py-2 pr-3 pl-9 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-blue-500/50 sm:w-52"
          />
        </div>
        <Link
          href="/dashboard/settings"
          title="Settings"
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <HugeiconsIcon icon={Setting06Icon} size={17} />
        </Link>
        <button
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:border-red-400/25 hover:bg-red-400/10 hover:text-red-300"
        >
          <HugeiconsIcon icon={Logout01Icon} size={17} />
        </button>
      </motion.div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <ProfileSidebar profile={profile} tags={tags} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
          className="min-w-0 flex-1"
        >
          {/* GitHub-style tab header — each tab fills this frame */}
          <DashboardTabs
            active={tab}
            onChange={setTab}
            counts={{ events: filtered.length, myEvents: regs.length }}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pt-5"
            >
              {tab === "events" && (
                <div className="space-y-4">
                  {filtered.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      registered={regs.find((r) => r.eventId === e.id)}
                      onRegister={setActiveEvent}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <p className="glass-card rounded-2xl p-6 text-center text-sm text-white/45">
                      {events.length === 0
                        ? "No events right now — check back soon."
                        : `No events match “${query}”.`}
                    </p>
                  )}
                </div>
              )}

              {tab === "my-events" && (
                <MyEvents
                  events={events}
                  registrations={regs}
                  onWithdraw={handleWithdraw}
                />
              )}

              {tab === "community" && <CommunityFeed />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {activeEvent && (
        <RegisterModal
          event={activeEvent}
          defaultEmail={profile.email}
          selfUsername={profile.username}
          onClose={() => setActiveEvent(null)}
          onSubmit={handleRegister}
          searchMembers={handleSearchMembers}
        />
      )}
    </main>
  );
}
