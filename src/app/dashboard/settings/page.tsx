"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import type { DemoProfile } from "@/lib/dashboard/demo";
import { createClient } from "@/lib/supabase/client";
import {
  fetchProfile,
  isUsernameTakenDb,
  upsertProfile,
} from "@/lib/dashboard/db";
import {
  BranchYearFields,
  PronounsField,
  UsernameField,
  inputCls,
  labelCls,
} from "@/components/dashboard/ProfileFields";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [remoteTaken, setRemoteTaken] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const initialUsername = useRef("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      if (!user?.email) {
        router.replace("/login?next=/dashboard/settings");
        return;
      }
      setUserId(user.id);
      const p = await fetchProfile(user.id, user.email);
      if (!p) {
        router.replace("/onboarding");
        return;
      }
      initialUsername.current = p.username;
      setProfile(p);
    })();
  }, [router]);

  useEffect(() => {
    if (!profile || profile.username.trim().length < 3) {
      setRemoteTaken(null);
      return;
    }
    const id = setTimeout(async () => {
      setRemoteTaken(
        await isUsernameTakenDb(profile.username, userId ?? undefined),
      );
    }, 400);
    return () => clearTimeout(id);
  }, [profile?.username, userId]);

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 pt-24">
        <p className="text-sm text-white/40">Loading…</p>
      </main>
    );
  }

  const set = (k: keyof DemoProfile, v: string) =>
    setProfile((prev) => (prev ? { ...prev, [k]: v } : prev));

  const nameTaken = remoteTaken ?? profile.username.trim().length < 3;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-28 pb-16 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/50 transition-colors hover:text-white"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
        Back to dashboard
      </Link>

      <div className="glass-card mt-4 rounded-3xl p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white">
          Profile settings
        </h1>
        <p className="mt-1.5 font-mono text-[13px] text-white/45">
          @{profile.username}
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!userId || nameTaken) return;
            setSubmitError("");
            const { error } = await upsertProfile(
              userId,
              profile.email,
              profile,
            );
            if (error) {
              setSubmitError(error);
              return;
            }
            initialUsername.current = profile.username;
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          className="mt-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Display name</label>
              <input
                value={profile.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                className={inputCls}
              />
            </div>
            <UsernameField
              value={profile.username}
              onChange={(v) => set("username", v)}
              exclude={initialUsername.current}
              taken={remoteTaken}
            />
          </div>
          <div>
            <label className={labelCls}>Bio</label>
            <input
              value={profile.bio}
              onChange={(e) => set("bio", e.target.value)}
              maxLength={120}
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Location</label>
              <input
                value={profile.location}
                onChange={(e) => set("location", e.target.value)}
                className={inputCls}
              />
            </div>
            <PronounsField
              value={profile.pronouns}
              onChange={(v) => set("pronouns", v)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <BranchYearFields
              branch={profile.branch}
              year={profile.year}
              onBranch={(v) => set("branch", v)}
              onYear={(v) => set("year", v)}
            />
          </div>
          <div>
            <label className={labelCls}>GitHub URL</label>
            <input
              value={profile.githubUrl}
              onChange={(e) => set("githubUrl", e.target.value)}
              className={`${inputCls} font-mono text-[13px]`}
            />
          </div>
          <div>
            <label className={labelCls}>LinkedIn URL</label>
            <input
              value={profile.linkedinUrl}
              onChange={(e) => set("linkedinUrl", e.target.value)}
              className={`${inputCls} font-mono text-[13px]`}
            />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input
              value={profile.website}
              onChange={(e) => set("website", e.target.value)}
              className={`${inputCls} font-mono text-[13px]`}
            />
          </div>

          {submitError && (
            <p className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-2.5 text-[13px] text-red-300">
              <HugeiconsIcon icon={Alert01Icon} size={15} />
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={nameTaken}
            className="btn-primary w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saved ? "Saved" : "Save changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
