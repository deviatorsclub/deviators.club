"use client";

import { use, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  UserGroupIcon,
  CrownIcon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  Search01Icon,
  Delete02Icon,
  CallIcon,
  IdIcon,
  BookOpen01Icon,
  SparklesIcon,
  Shield01Icon,
  Time02Icon,
  PlusSignIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { getEventDetails } from "@/data/eventDetails";
import { createClient } from "@/lib/supabase/client";

type SearchResultUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  branch: string;
  year: string;
};

type TeammateFormData = {
  profile: SearchResultUser | null;
  phone: string;
  collegeId: string;
  branch: string;
  section: string;
  year: string;
};

export default function EventRegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = use(params);
  const event = getEventDetails(slug);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Current user state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [existingTeam, setExistingTeam] = useState<any>(null);

  // Form Fields
  const [teamName, setTeamName] = useState("");

  // Leader Details
  const [leaderPhone, setLeaderPhone] = useState("");
  const [leaderCollegeId, setLeaderCollegeId] = useState("");
  const [leaderBranch, setLeaderBranch] = useState("CSE");
  const [leaderSection, setLeaderSection] = useState("");
  const [leaderYear, setLeaderYear] = useState("3rd Year");

  // Member 1 (Required Teammate)
  const [member1Search, setMember1Search] = useState("");
  const [member1Searching, setMember1Searching] = useState(false);
  const [member1Results, setMember1Results] = useState<SearchResultUser[]>([]);
  const [member1, setMember1] = useState<TeammateFormData>({
    profile: null,
    phone: "",
    collegeId: "",
    branch: "CSE",
    section: "",
    year: "3rd Year",
  });

  // Member 2 (Optional Teammate)
  const [hasMember2, setHasMember2] = useState(false);
  const [member2Search, setMember2Search] = useState("");
  const [member2Searching, setMember2Searching] = useState(false);
  const [member2Results, setMember2Results] = useState<SearchResultUser[]>([]);
  const [member2, setMember2] = useState<TeammateFormData>({
    profile: null,
    phone: "",
    collegeId: "",
    branch: "CSE",
    section: "",
    year: "3rd Year",
  });

  // Load auth user and verify if already registered
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        const user = session.user;

        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        // Check if user is onboarded
        if (profile && !profile.onboarded) {
          router.replace(`/onboarding?next=/events/${slug}/registration`);
          return;
        }

        setCurrentUser({
          ...profile,
          email: user.email,
        });

        if (profile?.branch) {
          setLeaderBranch(profile.branch);
        }
        if (profile?.year) {
          setLeaderYear(profile.year);
        }

        // Fetch team status
        const headers: Record<string, string> = {};
        if (session.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`/api/events/${slug}/team`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.registered && data.team) {
            setExistingTeam(data.team);
          }
          if (data.user) {
            if (data.user.phone) setLeaderPhone(data.user.phone);
            if (data.user.collegeId) setLeaderCollegeId(data.user.collegeId);
            if (data.user.branch) setLeaderBranch(data.user.branch);
            if (data.user.section) setLeaderSection(data.user.section);
            if (data.user.year) setLeaderYear(data.user.year);
          }
        }
      } catch (err) {
        console.error("Error loading registration state:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, router]);

  // Search Members debounce helper
  const searchTeammates = async (
    query: string,
  ): Promise<SearchResultUser[]> => {
    if (!query.trim() || query.trim().length < 1) return [];
    try {
      const res = await fetch(
        `/api/members/search?q=${encodeURIComponent(query.trim())}&selfId=${currentUser?.id || ""}`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  };

  // Debounced search for Member 1
  useEffect(() => {
    if (!member1Search.trim() || member1.profile) {
      setMember1Results([]);
      return;
    }
    const timer = setTimeout(async () => {
      setMember1Searching(true);
      const results = await searchTeammates(member1Search);
      setMember1Results(
        results.filter(
          (u) =>
            u.id !== currentUser?.id &&
            (!member2.profile || u.id !== member2.profile.id),
        ),
      );
      setMember1Searching(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [member1Search, member1.profile, member2.profile, currentUser?.id]);

  // Debounced search for Member 2
  useEffect(() => {
    if (!member2Search.trim() || member2.profile) {
      setMember2Results([]);
      return;
    }
    const timer = setTimeout(async () => {
      setMember2Searching(true);
      const results = await searchTeammates(member2Search);
      setMember2Results(
        results.filter(
          (u) =>
            u.id !== currentUser?.id &&
            (!member1.profile || u.id !== member1.profile.id),
        ),
      );
      setMember2Searching(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [member2Search, member2.profile, member1.profile, currentUser?.id]);

  // Handle Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!currentUser) {
      router.push(`/login?next=/events/${slug}/registration`);
      return;
    }

    if (!teamName.trim() || teamName.trim().length < 2) {
      setErrorMessage(
        "Please enter a valid Team Name (at least 2 characters).",
      );
      return;
    }

    // Leader validation
    if (
      !leaderPhone.trim() ||
      !leaderCollegeId.trim() ||
      !leaderBranch.trim() ||
      !leaderSection.trim()
    ) {
      setErrorMessage(
        "Please fill out all leader contact and academic details (Phone, Roll No., Branch, Section).",
      );
      return;
    }

    // Member 1 validation
    if (!member1.profile) {
      setErrorMessage(
        "Please search and select Member 1 to form a team of at least 2 members.",
      );
      return;
    }
    if (
      !member1.phone.trim() ||
      !member1.collegeId.trim() ||
      !member1.branch.trim() ||
      !member1.section.trim()
    ) {
      setErrorMessage(
        `Please fill out Member 1 (@${member1.profile.username}) details completely (Phone, Roll No., Branch, Section).`,
      );
      return;
    }

    // Member 2 validation (if added)
    if (hasMember2) {
      if (!member2.profile) {
        setErrorMessage(
          "You added Member 2 slot. Please select a teammate or remove Member 2.",
        );
        return;
      }
      if (
        !member2.phone.trim() ||
        !member2.collegeId.trim() ||
        !member2.branch.trim() ||
        !member2.section.trim()
      ) {
        setErrorMessage(
          `Please fill out Member 2 (@${member2.profile.username}) details completely (Phone, Roll No., Branch, Section).`,
        );
        return;
      }
    }

    // Duplicate phone number check within squad
    const pLeader = leaderPhone.trim().replace(/\D/g, "");
    const p1 = member1.phone.trim().replace(/\D/g, "");
    const p2 = hasMember2 ? member2.phone.trim().replace(/\D/g, "") : "";

    if (pLeader && p1 && pLeader === p1) {
      setErrorMessage(
        "Leader and Member 1 cannot have the same phone number. Duplicate phone numbers are not allowed.",
      );
      return;
    }
    if (hasMember2 && p2) {
      if (pLeader === p2) {
        setErrorMessage(
          "Leader and Member 2 cannot have the same phone number. Duplicate phone numbers are not allowed.",
        );
        return;
      }
      if (p1 === p2) {
        setErrorMessage(
          "Member 1 and Member 2 cannot have the same phone number. Duplicate phone numbers are not allowed.",
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const teammateUsernames: string[] = [member1.profile.username];
      const membersData: any[] = [
        {
          username: member1.profile.username,
          profileId: member1.profile.id,
          phone: member1.phone.trim(),
          collegeId: member1.collegeId.trim(),
          branch: member1.branch.trim(),
          section: member1.section.trim(),
          year: member1.year,
        },
      ];

      if (hasMember2 && member2.profile) {
        teammateUsernames.push(member2.profile.username);
        membersData.push({
          username: member2.profile.username,
          profileId: member2.profile.id,
          phone: member2.phone.trim(),
          collegeId: member2.collegeId.trim(),
          branch: member2.branch.trim(),
          section: member2.section.trim(),
          year: member2.year,
        });
      }

      const payload = {
        teamName: teamName.trim(),
        phone: leaderPhone.trim(),
        collegeId: leaderCollegeId.trim(),
        branch: leaderBranch.trim(),
        section: leaderSection.trim(),
        year: leaderYear,
        teammateUsernames,
        membersData,
      };

      const res = await fetch(`/api/events/${slug}/team`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error || "Failed to register team. Please try again.",
        );
        setSubmitting(false);
        return;
      }

      setSuccessMessage(
        `Team "${teamName.trim()}" created successfully! Invitations have been sent to your squad.`,
      );

      // Redirect to team card page after short celebration delay
      setTimeout(() => {
        router.push(
          `/events/${slug}/team/@${encodeURIComponent(teamName.trim())}`,
        );
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected network error occurred.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 pt-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="font-mono text-xs text-white/50">
            Loading registration form...
          </p>
        </div>
      </main>
    );
  }

  // If user is already registered in an accepted team
  if (existingTeam) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pt-28 pb-20">
        <div className="glass-card rounded-3xl border border-emerald-500/30 bg-[#0a0f1d] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-300">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
          </div>

          <span className="mt-4 inline-block rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
            Registration Confirmed
          </span>

          <h1 className="font-heading mt-3 text-2xl font-black text-white sm:text-3xl">
            You Are Already In Team &ldquo;{existingTeam.name}&rdquo;
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Each person can only participate in one team for {event.title}. You
            have full access to your team card and live announcements.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/events/${slug}/team/@${encodeURIComponent(existingTeam.name)}`}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-lg shadow-blue-500/25"
            >
              <span>View Team Details</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // If user is not logged in
  if (!currentUser) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pt-28 pb-20">
        <div className="glass-card rounded-3xl border border-white/10 bg-[#0a0e19] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-400">
            <HugeiconsIcon icon={Shield01Icon} size={32} />
          </div>

          <h1 className="font-heading mt-4 text-2xl font-bold text-white">
            Authentication Required
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Please log in with your Deviators Club account to register your team
            for {event.title}.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={`/login?next=/events/${slug}/registration`}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-bold"
            >
              <span>Sign In to Continue</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 pt-24 pb-24 sm:px-6">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-white/60 transition-colors hover:text-white"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          <span>Back to {event.title}</span>
        </Link>

        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-semibold text-cyan-300">
          Unstop-Grade Team Registration
        </span>
      </div>

      {/* Main Form Container */}
      <div className="glass-card overflow-hidden rounded-3xl border border-white/15 bg-[#090d18] shadow-2xl">
        {/* Banner Header */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-blue-900/30 via-[#0a1122] to-black/60 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold tracking-wider text-cyan-300 uppercase">
                Step-by-Step Registration
              </span>
              <h1 className="font-heading mt-1 text-2xl font-black text-white sm:text-3xl">
                Register Team · {event.title}
              </h1>
              <p className="mt-1.5 text-xs text-white/60 sm:text-sm">
                Min 2 Members · Max 3 Members. Fill leader details, search
                teammates, provide their info, and send squad requests.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2 font-mono text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-white/80">Offline Event · Free</span>
            </div>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="m-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
            <HugeiconsIcon
              icon={Alert01Icon}
              size={18}
              className="shrink-0 text-red-400"
            />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="m-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              size={18}
              className="shrink-0 text-emerald-400"
            />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
          {/* 1. TEAM NAME */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 font-mono text-xs font-bold text-white">
                1
              </span>
              <h2 className="font-heading text-base font-bold sm:text-lg">
                Team Name
              </h2>
            </div>
            <p className="text-xs text-white/50">
              Pick a unique squad moniker that will appear on the leaderboard,
              certificates, and ID badges.
            </p>

            <div className="relative">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Binary Beasts, Null Pointers, ByteForce..."
                maxLength={32}
                required
                className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3.5 font-sans text-sm font-semibold text-white placeholder-white/30 transition-all outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
              />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-mono text-[11px] text-white/30">
                {teamName.length}/32
              </span>
            </div>
          </section>

          {/* 2. TEAM LEADER (YOU) */}
          <section className="space-y-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-black">
                  2
                </span>
                <h2 className="font-heading text-base font-bold text-white sm:text-lg">
                  Team Leader Details (You)
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/20 px-2.5 py-0.5 font-mono text-[10px] font-extrabold tracking-wider text-amber-200 uppercase">
                <HugeiconsIcon icon={CrownIcon} size={11} />
                Leader
              </span>
            </div>

            {/* Profile Pill */}
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5">
                {currentUser.avatar_url ? (
                  <Image
                    src={currentUser.avatar_url}
                    alt={currentUser.display_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-white/60">
                    {currentUser.display_name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white sm:text-sm">
                  {currentUser.display_name || currentUser.username}
                </p>
                <p className="truncate font-mono text-[11px] text-white/40">
                  @{currentUser.username} · {currentUser.email}
                </p>
              </div>
            </div>

            {/* Fields Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block font-mono text-[11px] text-white/60 uppercase">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={leaderPhone}
                  onChange={(e) => setLeaderPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] text-white/60 uppercase">
                  College Roll / ID *
                </label>
                <input
                  type="text"
                  value={leaderCollegeId}
                  onChange={(e) => setLeaderCollegeId(e.target.value)}
                  placeholder="e.g. 02115602722"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] text-white/60 uppercase">
                  Branch *
                </label>
                <input
                  type="text"
                  value={leaderBranch}
                  onChange={(e) => setLeaderBranch(e.target.value)}
                  placeholder="e.g. CSE, IT, AI-ML"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] text-white/60 uppercase">
                  Section *
                </label>
                <input
                  type="text"
                  value={leaderSection}
                  onChange={(e) => setLeaderSection(e.target.value)}
                  placeholder="e.g. A, B, C, CSE-2"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </section>

          {/* 3. MEMBER 1 (REQUIRED TEAMMATE) */}
          <section className="space-y-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.04] to-transparent p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 font-mono text-xs font-bold text-white">
                  3
                </span>
                <h2 className="font-heading text-base font-bold text-white sm:text-lg">
                  Member 1 (Required Teammate)
                </h2>
              </div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                Minimum 2 Members
              </span>
            </div>

            {/* Teammate 1 Search / Selection */}
            {!member1.profile ? (
              <div className="space-y-2">
                <label className="block text-xs text-white/60">
                  Search Member 1 by Deviators @username or name:
                </label>
                <div className="relative">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/30"
                  />
                  <input
                    type="text"
                    value={member1Search}
                    onChange={(e) => setMember1Search(e.target.value)}
                    placeholder="Search @handle or name..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                  />
                  {member1Searching && (
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[10px] text-cyan-300">
                      Searching...
                    </span>
                  )}
                </div>

                {/* Dropdown Results */}
                {member1Results.length > 0 && (
                  <div className="divide-y divide-white/5 rounded-xl border border-white/15 bg-[#0e1424] shadow-2xl">
                    {member1Results.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => {
                          setMember1((prev) => ({
                            ...prev,
                            profile: u,
                            branch: u.branch || prev.branch,
                            year: u.year || prev.year,
                          }));
                          setMember1Search("");
                          setMember1Results([]);
                        }}
                        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                          {u.avatarUrl ? (
                            <Image
                              src={u.avatarUrl}
                              alt={u.displayName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/50">
                              {u.displayName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-white">
                            {u.displayName}
                          </p>
                          <p className="truncate font-mono text-[10px] text-white/40">
                            @{u.username} · {u.branch || "CSE"}
                          </p>
                        </div>
                        <span className="rounded-lg bg-cyan-500/20 px-2 py-1 font-mono text-[10px] font-bold text-cyan-300">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Member 1 + Pop-up Details Fields */
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/5">
                      {member1.profile.avatarUrl ? (
                        <Image
                          src={member1.profile.avatarUrl}
                          alt={member1.profile.displayName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60">
                          {member1.profile.displayName
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">
                        {member1.profile.displayName}
                      </p>
                      <p className="truncate font-mono text-[10px] text-cyan-300">
                        @{member1.profile.username}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMember1({
                        profile: null,
                        phone: "",
                        collegeId: "",
                        branch: "CSE",
                        section: "",
                        year: "3rd Year",
                      })
                    }
                    className="flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                    <span>Change</span>
                  </button>
                </div>

                {/* Pop-up Fields for Member 1 */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="mb-3 font-mono text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
                    Member 1 Details (Will show in request & portal):
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={member1.phone}
                        onChange={(e) =>
                          setMember1((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="10-digit mobile"
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                        College Roll / ID *
                      </label>
                      <input
                        type="text"
                        value={member1.collegeId}
                        onChange={(e) =>
                          setMember1((prev) => ({
                            ...prev,
                            collegeId: e.target.value,
                          }))
                        }
                        placeholder="e.g. 02115602722"
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                        Branch *
                      </label>
                      <input
                        type="text"
                        value={member1.branch}
                        onChange={(e) =>
                          setMember1((prev) => ({
                            ...prev,
                            branch: e.target.value,
                          }))
                        }
                        placeholder="e.g. CSE, IT"
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                        Section *
                      </label>
                      <input
                        type="text"
                        value={member1.section}
                        onChange={(e) =>
                          setMember1((prev) => ({
                            ...prev,
                            section: e.target.value,
                          }))
                        }
                        placeholder="e.g. A, B, C"
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 4. MEMBER 2 (OPTIONAL TEAMMATE) */}
          <section className="space-y-4 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.04] to-transparent p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 font-mono text-xs font-bold text-white">
                  4
                </span>
                <h2 className="font-heading text-base font-bold text-white sm:text-lg">
                  Member 2 (Optional Teammate)
                </h2>
              </div>

              {!hasMember2 ? (
                <button
                  type="button"
                  onClick={() => setHasMember2(true)}
                  className="flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/20 px-3 py-1 font-mono text-xs font-bold text-purple-300 transition-colors hover:bg-purple-500/30"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={13} />
                  <span>Add Member 2</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setHasMember2(false);
                    setMember2({
                      profile: null,
                      phone: "",
                      collegeId: "",
                      branch: "CSE",
                      section: "",
                      year: "3rd Year",
                    });
                  }}
                  className="flex items-center gap-1 font-mono text-xs text-red-400 hover:underline"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={13} />
                  <span>Remove Member 2</span>
                </button>
              )}
            </div>

            {hasMember2 && (
              <div className="space-y-4">
                {!member2.profile ? (
                  <div className="space-y-2">
                    <label className="block text-xs text-white/60">
                      Search Member 2 by Deviators @username or name:
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Search01Icon}
                        size={16}
                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/30"
                      />
                      <input
                        type="text"
                        value={member2Search}
                        onChange={(e) => setMember2Search(e.target.value)}
                        placeholder="Search @handle or name..."
                        className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-white/30 outline-none focus:border-purple-400"
                      />
                      {member2Searching && (
                        <span className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[10px] text-purple-300">
                          Searching...
                        </span>
                      )}
                    </div>

                    {/* Dropdown Results */}
                    {member2Results.length > 0 && (
                      <div className="divide-y divide-white/5 rounded-xl border border-white/15 bg-[#0e1424] shadow-2xl">
                        {member2Results.map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => {
                              setMember2((prev) => ({
                                ...prev,
                                profile: u,
                                branch: u.branch || prev.branch,
                                year: u.year || prev.year,
                              }));
                              setMember2Search("");
                              setMember2Results([]);
                            }}
                            className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.05]"
                          >
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                              {u.avatarUrl ? (
                                <Image
                                  src={u.avatarUrl}
                                  alt={u.displayName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/50">
                                  {u.displayName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-white">
                                {u.displayName}
                              </p>
                              <p className="truncate font-mono text-[10px] text-white/40">
                                @{u.username} · {u.branch || "CSE"}
                              </p>
                            </div>
                            <span className="rounded-lg bg-purple-500/20 px-2 py-1 font-mono text-[10px] font-bold text-purple-300">
                              Select
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Selected Member 2 + Pop-up Details Fields */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-purple-400/30 bg-purple-500/10 p-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/5">
                          {member2.profile.avatarUrl ? (
                            <Image
                              src={member2.profile.avatarUrl}
                              alt={member2.profile.displayName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60">
                              {member2.profile.displayName
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white">
                            {member2.profile.displayName}
                          </p>
                          <p className="truncate font-mono text-[10px] text-purple-300">
                            @{member2.profile.username}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setMember2({
                            profile: null,
                            phone: "",
                            collegeId: "",
                            branch: "CSE",
                            section: "",
                            year: "3rd Year",
                          })
                        }
                        className="flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} />
                        <span>Change</span>
                      </button>
                    </div>

                    {/* Pop-up Fields for Member 2 */}
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="mb-3 font-mono text-[11px] font-bold tracking-wider text-purple-300 uppercase">
                        Member 2 Details (Will show in request & portal):
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={member2.phone}
                            onChange={(e) =>
                              setMember2((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="10-digit mobile"
                            required
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-purple-400"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                            College Roll / ID *
                          </label>
                          <input
                            type="text"
                            value={member2.collegeId}
                            onChange={(e) =>
                              setMember2((prev) => ({
                                ...prev,
                                collegeId: e.target.value,
                              }))
                            }
                            placeholder="e.g. 02115602722"
                            required
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-purple-400"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                            Branch *
                          </label>
                          <input
                            type="text"
                            value={member2.branch}
                            onChange={(e) =>
                              setMember2((prev) => ({
                                ...prev,
                                branch: e.target.value,
                              }))
                            }
                            placeholder="e.g. CSE, IT"
                            required
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-purple-400"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-white/60 uppercase">
                            Section *
                          </label>
                          <input
                            type="text"
                            value={member2.section}
                            onChange={(e) =>
                              setMember2((prev) => ({
                                ...prev,
                                section: e.target.value,
                              }))
                            }
                            placeholder="e.g. A, B, C"
                            required
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SQUAD NOTICE & SUBMISSION CTA */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-4 text-xs text-white/70">
            <div className="flex items-start gap-2.5">
              <HugeiconsIcon
                icon={Time02Icon}
                size={16}
                className="mt-0.5 shrink-0 text-cyan-400"
              />
              <div>
                <p className="font-semibold text-white">
                  How Invitations Work:
                </p>
                <p className="mt-0.5 leading-relaxed text-white/60">
                  Submitting will create team{" "}
                  <span className="font-bold text-cyan-300">
                    {teamName || "[Team Name]"}
                  </span>{" "}
                  and send registration requests to your teammates. They will
                  appear under{" "}
                  <span className="font-mono text-amber-300">
                    &quot;Request Sent (Pending)&quot;
                  </span>{" "}
                  in both the President Portal and their dashboards until
                  accepted. You retain full control to edit team name or manage
                  members.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-4 font-sans text-sm font-extrabold tracking-wider text-white uppercase shadow-xl shadow-blue-600/25 transition-all duration-200 hover:border-blue-400 hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Registering Squad & Sending Requests...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={SparklesIcon}
                    size={18}
                    className="text-cyan-300"
                  />
                  <span>Send Squad Invites & Register Team</span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
