"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { defaultDemoProfile, type DemoProfile } from "@/lib/dashboard/demo";
import { createClient } from "@/lib/supabase/client";
import {
  claimMemberTag,
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

function prefillFromOAuth(
  base: DemoProfile,
  meta: Record<string, unknown>,
  email: string,
  provider: string,
): DemoProfile {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    ...base,
    email,
    provider: (provider === "github" || provider === "google"
      ? provider
      : "email") as DemoProfile["provider"],
    displayName: str(meta.full_name) || str(meta.name) || base.displayName,
    avatarUrl: str(meta.avatar_url) || str(meta.picture) || base.avatarUrl,
    githubUrl:
      provider === "github" && str(meta.user_name)
        ? `https://github.com/${str(meta.user_name)}`
        : base.githubUrl,
    username:
      provider === "github" && str(meta.user_name)
        ? str(meta.user_name).toLowerCase()
        : base.username,
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [remoteTaken, setRemoteTaken] = useState<boolean | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const initialUsername = useRef("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      const existing = await fetchProfile(user.id, user.email);
      if (existing?.onboarded) {
        router.replace("/dashboard");
        return;
      }
      if (existing) {
        initialUsername.current = existing.username;
        setProfile(existing);
        return;
      }
      const fresh = prefillFromOAuth(
        defaultDemoProfile(),
        (user.user_metadata ?? {}) as Record<string, unknown>,
        user.email,
        user.app_metadata?.provider ?? "email",
      );
      initialUsername.current = fresh.username;
      setProfile(fresh);
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
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 pt-24">
        <p className="text-sm text-white/40">Loading…</p>
      </main>
    );
  }

  const set = (k: keyof DemoProfile, v: string) =>
    setProfile((prev) => (prev ? { ...prev, [k]: v } : prev));

  const nameTaken = remoteTaken ?? profile.username.trim().length < 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || nameTaken) return;
    setSubmitError("");
    setSaving(true);
    const { error } = await upsertProfile(userId, profile.email, {
      ...profile,
      onboarded: true,
    });
    setSaving(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    await claimMemberTag(userId);
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-28 pb-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="glass-card rounded-3xl p-6 sm:p-8"
      >
        <p className="text-brand-light text-[11px] font-semibold tracking-[0.2em] uppercase">
          Setup your account
        </p>
        <h1 className="font-heading mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Make it yours
        </h1>
        <p className="mt-1.5 text-[13px] text-white/50">
          Signed in as <span className="text-white">{profile.email}</span>
        </p>

        <div className="mt-5 flex gap-1.5" aria-hidden>
          <span className="h-1.5 flex-1 rounded-full bg-blue-500" />
          <span className="h-1.5 flex-1 rounded-full bg-blue-500" />
          <span className="h-1.5 flex-1 rounded-full bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Display name *</label>
              <input
                required
                value={profile.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                placeholder="Your name"
                className={inputCls}
              />
            </div>
            <UsernameField
              value={profile.username}
              onChange={(v) => set("username", v)}
              exclude={initialUsername.current}
              taken={remoteTaken}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Bio</label>
            <input
              value={profile.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="One line about you"
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
                placeholder="New Delhi, India"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>GitHub URL</label>
              <input
                value={profile.githubUrl}
                onChange={(e) => set("githubUrl", e.target.value)}
                placeholder="https://github.com/you"
                className={`${inputCls} font-mono text-[13px]`}
              />
            </div>
            <div>
              <label className={labelCls}>LinkedIn URL</label>
              <input
                value={profile.linkedinUrl}
                onChange={(e) => set("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/you"
                className={`${inputCls} font-mono text-[13px]`}
              />
            </div>
          </div>

          {submitError && (
            <p className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-2.5 text-[13px] text-red-300">
              <HugeiconsIcon icon={Alert01Icon} size={15} />
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={nameTaken || saving}
            className="btn-primary w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Continue to dashboard"}
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
        </form>
      </motion.div>
    </main>
  );
}
