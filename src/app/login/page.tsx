"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GithubIcon,
  GoogleIcon,
  Mail01Icon,
  ArrowRight01Icon,
  Alert01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import deviatorsLogoMin from "@/assets/logo/sm.svg";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/onboarding";
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState<"email" | "github" | "google" | null>(null);

  useEffect(() => {
    if (!configured) return;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) router.replace("/dashboard");
      });
  }, [configured, router]);

  const callbackUrl = (path: string) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;

  const handleOAuth = async (provider: "github" | "google") => {
    setBusy(provider);
    setError("");
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) {
      setBusy(null);
      setError(error.message);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy("email");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl(next) },
    });
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setLinkSent(true);
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-blue-500/50";

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 pt-24 pb-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="grid w-full gap-5 lg:grid-cols-[1.1fr_1fr]"
      >
        <div className="glass-card hidden flex-col justify-between rounded-3xl p-8 lg:flex">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={deviatorsLogoMin.src}
              alt="Deviators Club"
              width={36}
              height={36}
              className="h-7 w-auto shrink-0"
            />
            <span className="font-heading text-sm font-extrabold tracking-wide text-white">
              DEVIATORS CLUB
            </span>
          </Link>
          <div>
            <p className="text-brand-light inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium tracking-widest uppercase">
              Members dashboard
            </p>
            <h1 className="font-heading mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight text-white">
              Code.
              <br />
              Create.
              <br />
              Deviate.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
              Your profile, event registrations and teams — in one place.
            </p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Image
              src={deviatorsLogoMin.src}
              alt="Deviators Club"
              width={32}
              height={32}
              className="h-6 w-auto shrink-0"
            />
            <span className="font-heading text-sm font-extrabold text-white">
              DEVIATORS CLUB
            </span>
          </div>
          <h2 className="font-heading mt-4 text-2xl font-extrabold tracking-tight text-white lg:mt-0">
            Welcome back
          </h2>
          <p className="mt-1.5 text-[13px] text-white/50">
            Log in to open your dashboard. New here? Any method creates an
            account.
          </p>

          {!configured ? (
            <p className="mt-5 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-2.5 text-[13px] text-red-300">
              <HugeiconsIcon icon={Alert01Icon} size={15} />
              Login is not configured on this deployment.
            </p>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleOAuth("github")}
                  disabled={busy !== null}
                  className="btn-secondary rounded-xl px-3 py-2.5 text-sm disabled:opacity-60"
                >
                  <HugeiconsIcon icon={GithubIcon} size={17} />
                  {busy === "github" ? "…" : "GitHub"}
                </button>
                <button
                  onClick={() => handleOAuth("google")}
                  disabled={busy !== null}
                  className="btn-secondary rounded-xl px-3 py-2.5 text-sm disabled:opacity-60"
                >
                  <HugeiconsIcon icon={GoogleIcon} size={17} />
                  {busy === "google" ? "…" : "Gmail"}
                </button>
              </div>

              <div className="my-5 flex items-center gap-3 text-[11px] font-medium tracking-widest text-white/30 uppercase">
                <span className="h-px flex-1 bg-white/10" /> or with email{" "}
                <span className="h-px flex-1 bg-white/10" />
              </div>

              {linkSent ? (
                <p className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-3 text-[13px] text-emerald-300">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                  Check your inbox — login link sent to {email.trim()}.
                </p>
              ) : (
                <form onSubmit={handleEmail} className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Email
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={15}
                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/30"
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@college.edu"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-2.5 text-[13px] text-red-300">
                      <HugeiconsIcon icon={Alert01Icon} size={15} />
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="btn-primary w-full py-3 text-sm disabled:opacity-60"
                  >
                    {busy === "email" ? "Sending…" : "Send login link"}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
