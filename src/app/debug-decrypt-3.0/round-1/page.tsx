"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LuShieldAlert,
  LuClock,
  LuCircleCheck,
  LuTriangleAlert,
  LuMaximize2,
  LuArrowRight,
  LuArrowLeft,
  LuFlag,
  LuCheck,
  LuLock,
  LuUser,
} from "react-icons/lu";
import deviatorsLogoMin from "@/assets/logo/sm.svg";
import { createClient } from "@/lib/supabase/client";
import {
  ROUND_1_START_TIME,
  ROUND_1_END_TIME,
  ROUND_1_DURATION_MINUTES,
  type ClientQuestion,
} from "@/data/round1Questions";

type SessionStatus =
  | "loading"
  | "unauthorized"
  | "not_president"
  | "briefing"
  | "in_progress"
  | "submitted"
  | "terminated";

interface UserInfo {
  id: string;
  email: string;
  username: string;
  displayName: string;
  teamName?: string;
  role?: string;
  isPresident?: boolean;
  isLeader?: boolean;
}

export default function DebugDecryptRound1Page() {
  // --- Core States ---
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState<UserInfo | null>(null);

  // Contest Schedule Countdown (13th Oct 2026, 7:00 PM to 8:00 PM IST)
  const [scheduleState, setScheduleState] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
    hasEnded: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
    hasEnded: false,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const start = new Date(ROUND_1_START_TIME).getTime();
      const end = new Date(ROUND_1_END_TIME).getTime();

      if (now > end) {
        setScheduleState({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isLive: false,
          hasEnded: true,
        });
        return;
      }

      if (now >= start && now <= end) {
        setScheduleState({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isLive: true,
          hasEnded: false,
        });
        return;
      }

      const diff = Math.max(0, start - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setScheduleState({
        days,
        hours,
        minutes,
        seconds,
        isLive: false,
        hasEnded: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Briefing
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Active Assessment (45 Minutes)
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(
    ROUND_1_DURATION_MINUTES * 60,
  );
  const [strikeCount, setStrikeCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );

  // Post-Assessment Stats
  const [finalResult, setFinalResult] = useState<{
    status: string;
    score?: number;
    max_score?: number;
    termination_reason?: string;
    submitted_at?: string;
    strike_count?: number;
  } | null>(null);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Proctor Grace Modal (Strike 1)
  const [showGraceModal, setShowGraceModal] = useState(false);
  const [graceSecondsLeft, setGraceSecondsLeft] = useState(5.0);
  const [graceReason, setGraceReason] = useState("");

  // Refs
  const strikeCountRef = useRef(strikeCount);
  strikeCountRef.current = strikeCount;
  const isTestActiveRef = useRef(status === "in_progress");
  isTestActiveRef.current = status === "in_progress";
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inGraceRef = useRef(false);

  // Helper: Get Supabase auth headers
  const getAuthHeaders = useCallback(async (): Promise<
    Record<string, string>
  > => {
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
      return headers;
    } catch {
      return { "Content-Type": "application/json" };
    }
  }, []);

  // 1. Initial Session Verification
  const fetchSession = useCallback(async () => {
    try {
      setStatus("loading");
      const headers = await getAuthHeaders();
      const res = await fetch("/api/round-1/session", { headers });

      if (res.status === 401) {
        setStatus("unauthorized");
        return;
      }
      if (res.status === 403) {
        setStatus("not_president");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to load assessment.");
        setStatus("unauthorized");
        return;
      }

      setUser(data.user);

      if (!data.hasSession) {
        setStatus("briefing");
        return;
      }

      if (
        data.session.status === "submitted" ||
        data.session.status === "terminated"
      ) {
        setFinalResult({
          status: data.session.status,
          score: data.session.score,
          max_score: data.session.max_score,
          termination_reason: data.session.termination_reason,
          submitted_at: data.session.submitted_at,
          strike_count: data.session.strike_count,
        });
        setStatus(data.session.status);
        return;
      }

      setQuestions(data.questions || []);
      setResponses(data.savedResponses || {});
      setFlagged(new Set(data.flaggedQuestions || []));
      setRemainingSeconds(data.remainingSeconds || 3600);
      setStrikeCount(data.session.strike_count || 0);
      setStatus("in_progress");
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error connecting to assessment engine.");
      setStatus("unauthorized");
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // 2. Countdown Timer
  useEffect(() => {
    if (status !== "in_progress") {
      if (testTimerRef.current) clearInterval(testTimerRef.current);
      return;
    }

    testTimerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(testTimerRef.current!);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (testTimerRef.current) clearInterval(testTimerRef.current);
    };
  }, [status]);

  const handleTimeExpired = async () => {
    try {
      const headers = await getAuthHeaders();
      await fetch("/api/round-1/submit", { method: "POST", headers });
      await fetchSession();
    } catch (e) {
      console.error("Auto submit on expiry failed", e);
    }
  };

  // 3. Proctor Violation Handler
  const triggerViolation = useCallback(
    async (reason: string) => {
      if (!isTestActiveRef.current || inGraceRef.current) return;

      const currentStrikes = strikeCountRef.current;

      if (currentStrikes === 0) {
        inGraceRef.current = true;
        setGraceReason(reason);
        setGraceSecondsLeft(5.0);
        setShowGraceModal(true);

        const headers = await getAuthHeaders();
        fetch("/api/round-1/record-strike", {
          method: "POST",
          headers,
          body: JSON.stringify({ reason }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.strike_count !== undefined) {
              setStrikeCount(data.strike_count);
            }
          })
          .catch((err) => console.error(err));

        const startTime = Date.now();
        const duration = 5000;

        if (graceTimerRef.current) clearInterval(graceTimerRef.current);
        graceTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const left = Math.max(0, (duration - elapsed) / 1000);
          setGraceSecondsLeft(Number(left.toFixed(1)));

          if (left <= 0) {
            clearInterval(graceTimerRef.current!);
            inGraceRef.current = false;
            terminateTest(
              "Failed to return to full screen within 5-second grace window",
            );
          }
        }, 100);
      } else {
        terminateTest(`Second proctor violation: ${reason}`);
      }
    },
    [getAuthHeaders],
  );

  const terminateTest = async (reason: string) => {
    setShowGraceModal(false);
    inGraceRef.current = false;
    if (graceTimerRef.current) clearInterval(graceTimerRef.current);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/round-1/record-strike", {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      setFinalResult({
        status: "terminated",
        termination_reason: reason,
        strike_count: data.strike_count || 2,
        score: data.score,
        max_score: data.max_score,
        submitted_at: new Date().toISOString(),
      });
      setStatus("terminated");

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {
      console.error("Termination error", e);
      setStatus("terminated");
    }
  };

  const resumeFromGrace = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setShowGraceModal(false);
      inGraceRef.current = false;
      if (graceTimerRef.current) clearInterval(graceTimerRef.current);
    } catch (e) {
      console.error("Fullscreen re-entry failed", e);
    }
  };

  // 4. Attach Proctor Listeners
  useEffect(() => {
    if (status !== "in_progress") return;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && isTestActiveRef.current) {
        triggerViolation("Exited full screen mode");
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isTestActiveRef.current) {
        triggerViolation("Switched tab or minimized browser window");
      }
    };

    const onWindowBlur = () => {
      if (isTestActiveRef.current) {
        triggerViolation("Lost window focus (Alt+Tab or application switch)");
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" || e.key === "F11" || e.key === "F5") {
        e.preventDefault();
        return false;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x", "a", "u", "w", "r", "p", "s"].includes(
          e.key.toLowerCase(),
        )
      ) {
        e.preventDefault();
        return false;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["i", "j", "c"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        return false;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const onCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Leaving this page will terminate and auto-submit your test session!";
      return e.returnValue;
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("copy", onCopyPaste);
    window.addEventListener("paste", onCopyPaste);
    window.addEventListener("cut", onCopyPaste);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("copy", onCopyPaste);
      window.removeEventListener("paste", onCopyPaste);
      window.removeEventListener("cut", onCopyPaste);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [status, triggerViolation]);

  // 5. Start Test Handler
  const handleStartTest = async () => {
    if (!agreedToRules) return;
    setIsStarting(true);
    setErrorMessage("");

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }

      const headers = await getAuthHeaders();
      const res = await fetch("/api/round-1/start", {
        method: "POST",
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to initialize test session.");
        setIsStarting(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      setQuestions(data.questions || []);
      setRemainingSeconds(data.remainingSeconds || 3600);
      setStrikeCount(0);
      setCurrentIndex(0);
      setResponses({});
      setFlagged(new Set());
      setStatus("in_progress");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        "Could not enter fullscreen mode or start session. Please allow fullscreen.",
      );
      setIsStarting(false);
    }
  };

  // 6. Autosave Answer
  const saveAnswer = async (qId: string, val: any, isFlg = false) => {
    setSaveStatus("saving");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/round-1/save-response", {
        method: "POST",
        headers,
        body: JSON.stringify({
          question_id: qId,
          selected_answers: val,
          is_flagged: isFlg,
        }),
      });
      if (res.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  const handleSelectOption = (qId: string, optId: string) => {
    setResponses((prev) => ({ ...prev, [qId]: optId }));
    saveAnswer(qId, optId, flagged.has(qId));
  };

  const toggleFlag = (qId: string) => {
    const nextFlagged = new Set(flagged);
    let isFlg = false;
    if (nextFlagged.has(qId)) {
      nextFlagged.delete(qId);
    } else {
      nextFlagged.add(qId);
      isFlg = true;
    }
    setFlagged(nextFlagged);
    saveAnswer(qId, responses[qId], isFlg);
  };

  // 7. Manual Submit Test
  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/round-1/submit", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      setShowSubmitModal(false);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      setFinalResult({
        status: "submitted",
        score: data.score,
        max_score: data.max_score,
        submitted_at: data.submitted_at,
        strike_count: strikeCount,
      });
      setStatus("submitted");
    } catch (err) {
      console.error(err);
      alert("Submission error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ----------------------------------------------------
  // A. Loading State
  // ----------------------------------------------------
  if (status === "loading") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4">
        <p className="text-sm font-medium text-white/40">
          Loading assessment dashboard…
        </p>
      </main>
    );
  }

  // ----------------------------------------------------
  // B. Unauthorized
  // ----------------------------------------------------
  if (status === "unauthorized") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
        <div className="glass-card w-full rounded-2xl p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <LuLock size={22} />
          </div>
          <h2 className="font-heading mb-2 text-lg font-bold text-white">
            Authentication Required
          </h2>
          <p className="mb-5 text-xs leading-relaxed text-white/60">
            {errorMessage ||
              "You must be signed in to your Deviators Club account to access Round 1."}
          </p>
          <Link
            href="/login?next=/debug-decrypt-3.0/round-1"
            className="btn-primary w-full text-xs"
          >
            Sign In with Deviators Club
            <LuArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // C. Restricted Candidate Access (Not Leader or President)
  // ----------------------------------------------------
  if (status === "not_president") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
        <div className="glass-card w-full rounded-2xl border-amber-500/20 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
            <LuShieldAlert size={22} />
          </div>
          <h2 className="font-heading mb-2 text-lg font-bold text-white">
            Restricted Access · Team Leaders Only
          </h2>
          <p className="mb-5 text-xs leading-relaxed text-white/60">
            Round 1 is strictly restricted to registered Team Leaders of Debug
            Decrypt 3.0 teams and Club Officials. If you are a team member,
            please have your designated Team Leader attempt the test.
          </p>
          <Link href="/dashboard" className="btn-secondary w-full text-xs">
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // D. Post-Assessment Screen
  // ----------------------------------------------------
  if (status === "submitted" || status === "terminated") {
    const isTerm = status === "terminated";
    return (
      <main className="mx-auto w-full max-w-4xl px-4 pt-12 pb-16 sm:px-6">
        <div className="glass-card rounded-2xl p-6 text-center sm:p-10">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${
              isTerm
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {isTerm ? <LuShieldAlert size={28} /> : <LuCircleCheck size={28} />}
          </div>

          <span
            className={`mb-2.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${
              isTerm
                ? "border border-red-500/20 bg-red-500/10 text-red-400"
                : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {isTerm ? "Disqualified · Auto-Submitted" : "Assessment Complete"}
          </span>

          <h2 className="font-heading mb-2 text-xl font-bold text-white sm:text-2xl">
            {isTerm
              ? "Session Terminated by Proctor"
              : "Round 1 Successfully Submitted"}
          </h2>

          <p className="mx-auto mb-6 max-w-md text-xs leading-relaxed text-white/60">
            {isTerm
              ? `Your session was terminated due to a proctoring violation: "${
                  finalResult?.termination_reason ||
                  "Focus loss / Fullscreen exit"
                }". Your recorded answers have been saved.`
              : "Thank you for completing Round 1! Your answers have been safely recorded on the server."}
          </p>

          <div className="mx-auto mb-6 max-w-sm space-y-2.5 rounded-xl border border-white/10 bg-black/40 p-4 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/40">Leader</span>
              <span className="font-medium text-white">
                {user?.displayName || user?.username}
              </span>
            </div>
            {user?.teamName && (
              <div className="flex items-center justify-between">
                <span className="text-white/40">Team</span>
                <span className="font-medium text-white">{user.teamName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-white/40">Strikes</span>
              <span
                className={`font-semibold ${
                  (finalResult?.strike_count || 0) >= 2
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                {finalResult?.strike_count || 0} / 2
              </span>
            </div>
            {finalResult?.score !== undefined && (
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-white/40">Score (President View)</span>
                <span className="text-sm font-bold text-white">
                  {finalResult.score} / {finalResult.max_score} pts
                </span>
              </div>
            )}
            {finalResult?.submitted_at && (
              <div className="flex items-center justify-between pt-1 text-[11px] text-white/30">
                <span>Submitted</span>
                <span>
                  {new Date(finalResult.submitted_at).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <Link
              href="/debug-decrypt-3.0/round-1/leaderboard"
              className="btn-primary text-xs"
            >
              View Standings
            </Link>
            <Link href="/dashboard" className="btn-secondary text-xs">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // E. Briefing Screen (DEVIATORS DASHBOARD THEME)
  // ----------------------------------------------------
  if (status === "briefing") {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-16 sm:px-6">
        {/* Top bar (Exact Deviators Dashboard format) */}
        <div className="glass-card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={deviatorsLogoMin.src}
                alt="Deviators Logo"
                width={28}
                height={28}
                className="h-6 w-auto brightness-125"
              />
              <span className="font-heading text-sm font-extrabold text-white">
                Deviators Club
              </span>
            </Link>
            <span className="text-white/20">/</span>
            <span className="font-mono text-xs text-white/60">
              Debug Decrypt 3.0 · Round 1
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/debug-decrypt-3.0/round-1/leaderboard"
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Standings
            </Link>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/60">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span>Proctor Online</span>
            </div>
            <Link
              href="/dashboard"
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Contest Schedule Live Countdown Window Banner */}
        {!scheduleState.isLive && !scheduleState.hasEnded && (
          <div className="glass-card mb-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-black/50 to-blue-950/30 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
              <LuClock size={24} />
            </div>
            <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
              Official Assessment Schedule
            </span>
            <h2 className="font-heading mt-2 text-xl font-bold text-white sm:text-2xl">
              Round 1 Opens October 13, 2026
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-white/70 sm:text-sm">
              Please come back on{" "}
              <strong className="text-white">
                13th October between 7:00 PM to 8:00 PM IST
              </strong>{" "}
              to attempt your 45-minute assessment. The launch portal will
              unlock automatically.
            </p>

            {/* Live Countdown Counters */}
            <div className="mx-auto mt-6 grid max-w-sm grid-cols-4 gap-2.5 sm:gap-3">
              <div className="rounded-xl border border-white/10 bg-black/60 p-3">
                <div className="font-heading text-xl font-black text-white sm:text-2xl">
                  {scheduleState.days}
                </div>
                <div className="text-[10px] tracking-wider text-white/40 uppercase">
                  Days
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/60 p-3">
                <div className="font-heading text-xl font-black text-white sm:text-2xl">
                  {scheduleState.hours.toString().padStart(2, "0")}
                </div>
                <div className="text-[10px] tracking-wider text-white/40 uppercase">
                  Hours
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/60 p-3">
                <div className="font-heading text-xl font-black text-white sm:text-2xl">
                  {scheduleState.minutes.toString().padStart(2, "0")}
                </div>
                <div className="text-[10px] tracking-wider text-white/40 uppercase">
                  Mins
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/60 p-3">
                <div className="font-heading text-xl font-black text-cyan-300 sm:text-2xl">
                  {scheduleState.seconds.toString().padStart(2, "0")}
                </div>
                <div className="text-[10px] tracking-wider text-white/40 uppercase">
                  Secs
                </div>
              </div>
            </div>

            {user?.isPresident && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
                <span>
                  President Bypass: You can start or preview the assessment at
                  any time.
                </span>
              </div>
            )}
          </div>
        )}

        {scheduleState.hasEnded && (
          <div className="glass-card mb-6 rounded-2xl border border-red-500/20 bg-red-950/20 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <LuShieldAlert size={24} />
            </div>
            <h2 className="font-heading text-xl font-bold text-white">
              Round 1 Testing Window Has Concluded
            </h2>
            <p className="mt-2 text-xs text-white/60">
              The testing window closed at 8:00 PM IST on October 13, 2026.
              Submissions are no longer accepted.
            </p>
          </div>
        )}

        {/* Hero Section Card */}
        <div className="glass-card mb-6 rounded-2xl p-6 sm:p-8">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-white/70">
              Round 1 Shortlisting
            </span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-white/70">
              30 MCQs
            </span>
            <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
              45 Minutes
            </span>
          </div>

          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Online Shortlisting Round
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/60 sm:text-sm">
            Welcome, {user?.displayName || user?.username}. You are about to
            attempt the 30-question DSA shortlisting round. Questions and
            options are shuffled for each participant.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
              <div className="mb-1 text-xs text-white/40">Total Questions</div>
              <div className="font-heading text-lg font-bold text-white">
                30
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
              <div className="mb-1 text-xs text-white/40">Time Limit</div>
              <div className="font-heading text-lg font-bold text-cyan-300">
                45 Mins
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
              <div className="mb-1 text-xs text-white/40">Marking Scheme</div>
              <div className="font-heading text-lg font-bold text-white">
                +1 / 0
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
              <div className="mb-1 text-xs text-white/40">Negative Marking</div>
              <div className="font-heading text-lg font-bold text-white">
                None
              </div>
            </div>
          </div>
        </div>

        {/* Proctoring Protocol Section (Clean Lucide Icons, Zero Emojis) */}
        <div className="glass-card mb-6 rounded-2xl border border-white/10 p-6 sm:p-7">
          <div className="mb-4 flex items-center gap-2">
            <LuShieldAlert size={18} className="text-white/80" />
            <h2 className="font-heading text-sm font-bold text-white sm:text-base">
              Anti-Cheating & Proctoring Rules
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
              <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/80">
                <LuMaximize2 size={16} />
              </div>
              <div>
                <span className="mb-0.5 block font-bold text-white">
                  Fullscreen Enforced
                </span>
                <span className="block leading-relaxed text-white/55">
                  The test must remain in fullscreen mode throughout the
                  duration.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
              <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/80">
                <LuTriangleAlert size={16} />
              </div>
              <div>
                <span className="mb-0.5 block font-bold text-white">
                  Zero Tab Switching
                </span>
                <span className="block leading-relaxed text-white/55">
                  Switching tabs, minimizing, or clicking outside triggers an
                  instant violation.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
              <div className="shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-300">
                <LuClock size={16} />
              </div>
              <div>
                <span className="mb-0.5 block font-bold text-amber-300">
                  Strike 1: 5s Grace Window
                </span>
                <span className="block leading-relaxed text-white/55">
                  First violation logs a strike with a 5-second countdown to
                  return to fullscreen.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
              <div className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400">
                <LuShieldAlert size={16} />
              </div>
              <div>
                <span className="mb-0.5 block font-bold text-red-400">
                  Strike 2: Direct Auto-Submit
                </span>
                <span className="block leading-relaxed text-white/55">
                  A second violation or grace expiry instantly terminates and
                  submits the test.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ready Card & Launch */}
        <div className="glass-card rounded-2xl border border-white/10 p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <label className="flex cursor-pointer items-start gap-3 select-none sm:items-center">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="text-brand focus:ring-brand mt-0.5 h-4 w-4 cursor-pointer rounded border-white/20 bg-black/40 focus:ring-offset-black sm:mt-0"
              />
              <span className="text-xs leading-relaxed text-white/70">
                I understand the rules and agree to take the 45-minute proctored
                test in fullscreen mode.
              </span>
            </label>

            {!scheduleState.isLive &&
            !scheduleState.hasEnded &&
            !user?.isPresident ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-semibold text-white/50">
                <LuLock size={14} />
                <span>Opens 13 Oct, 7:00 PM IST</span>
              </div>
            ) : scheduleState.hasEnded && !user?.isPresident ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-xs font-semibold text-red-400">
                <LuLock size={14} />
                <span>Assessment Window Closed</span>
              </div>
            ) : (
              <button
                onClick={handleStartTest}
                disabled={!agreedToRules || isStarting}
                className={`btn-primary shrink-0 px-6 py-3 text-xs ${
                  !agreedToRules || isStarting
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
              >
                {isStarting ? (
                  <span>Entering Fullscreen…</span>
                ) : (
                  <>
                    <span>Enter Fullscreen & Start Test</span>
                    <LuArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>

          {errorMessage && (
            <p className="mt-3 text-xs text-red-400">{errorMessage}</p>
          )}
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // F. Active Assessment Interface (Contest Dashboard)
  // ----------------------------------------------------
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(responses).length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#030712] font-sans text-white select-none">
      {/* Contest Top Bar */}
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src={deviatorsLogoMin.src}
            alt="Deviators Logo"
            width={24}
            height={24}
            className="h-5 w-auto brightness-125"
          />
          <span className="font-heading text-xs font-extrabold text-white sm:text-sm">
            Debug Decrypt 3.0
          </span>
          <span className="hidden text-xs text-white/30 sm:inline">/</span>
          <span className="hidden text-xs text-white/60 sm:inline">
            Round 1
          </span>

          {/* Strikes Counter */}
          <div
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${
              strikeCount === 0
                ? "border-white/10 bg-white/[0.04] text-white/50"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            }`}
          >
            <LuShieldAlert size={12} />
            <span>Strikes: {strikeCount} / 2</span>
          </div>

          {/* Sync status */}
          <div className="hidden items-center gap-1 text-[11px] text-white/40 md:flex">
            {saveStatus === "saving" && (
              <span className="text-amber-400">Saving…</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-emerald-400">Saved ✓</span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-400">Sync error</span>
            )}
          </div>
        </div>

        {/* Center / Right: Live Timer & Submission */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 font-mono text-xs font-bold sm:text-sm ${
              remainingSeconds < 300
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : remainingSeconds < 900
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-white/10 bg-black/40 text-white"
            }`}
          >
            <LuClock size={14} />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn-primary cursor-pointer rounded-xl px-3.5 py-1.5 text-xs"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Problem Statement & Choices */}
        <main className="flex flex-1 flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentQuestion ? (
            <div className="mx-auto w-full max-w-3xl pb-6">
              {/* Question Meta */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-white">
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-white/50">
                    +{currentQuestion.points} mark
                  </span>
                </div>

                <button
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    flagged.has(currentQuestion.id)
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                  }`}
                >
                  <LuFlag size={12} />
                  <span>
                    {flagged.has(currentQuestion.id)
                      ? "Marked"
                      : "Review Later"}
                  </span>
                </button>
              </div>

              {/* Title & Description */}
              <h2 className="font-heading mb-2 text-base leading-snug font-bold text-white sm:text-lg">
                {currentQuestion.title}
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-white/75 sm:text-[15px]">
                {currentQuestion.description}
              </p>

              {/* Code Snippet Box (clean monospace container) */}
              {currentQuestion.code_snippet && (
                <div className="mb-5 overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-cyan-200 sm:text-sm">
                  <pre className="leading-relaxed">
                    <code>{currentQuestion.code_snippet}</code>
                  </pre>
                </div>
              )}

              {/* Options */}
              <div className="my-5 space-y-2.5">
                {currentQuestion.options?.map((opt) => {
                  const isSelected = responses[currentQuestion.id] === opt.id;
                  const letter = opt.id.toUpperCase();

                  return (
                    <div
                      key={opt.id}
                      onClick={() =>
                        handleSelectOption(currentQuestion.id, opt.id)
                      }
                      className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-3.5 transition-all sm:p-4 ${
                        isSelected
                          ? "border-white/40 bg-white/[0.08] text-white shadow-sm"
                          : "border-white/10 bg-black/30 text-white/70 hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${
                          isSelected
                            ? "border-white bg-white text-black"
                            : "border-white/20 bg-black/40 text-white/50"
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="pt-0.5 text-sm font-medium">
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center text-white/40">
              No question selected.
            </div>
          )}

          {/* Bottom Bar */}
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between border-t border-white/10 pt-4">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs ${
                currentIndex === 0
                  ? "cursor-not-allowed opacity-30"
                  : "cursor-pointer"
              }`}
            >
              <LuArrowLeft size={13} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => {
                const nextResponses = { ...responses };
                delete nextResponses[currentQuestion.id];
                setResponses(nextResponses);
                saveAnswer(
                  currentQuestion.id,
                  null,
                  flagged.has(currentQuestion.id),
                );
              }}
              className="cursor-pointer px-2 py-1 text-xs text-white/40 transition-colors hover:text-white/80"
            >
              Clear Choice
            </button>

            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(totalQuestions - 1, prev + 1),
                )
              }
              disabled={currentIndex === totalQuestions - 1}
              className={`btn-primary flex items-center gap-1.5 px-4 py-2 text-xs ${
                currentIndex === totalQuestions - 1
                  ? "cursor-not-allowed opacity-30"
                  : "cursor-pointer"
              }`}
            >
              <span>Next</span>
              <LuArrowRight size={13} />
            </button>
          </div>
        </main>

        {/* Right Palette (Clean 30-Question Matrix) */}
        <aside className="hidden w-72 shrink-0 flex-col justify-between overflow-y-auto border-l border-white/10 bg-black/40 p-5 backdrop-blur-xl lg:flex">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-heading text-xs font-bold tracking-wider text-white uppercase">
                Questions
              </span>
              <span className="font-mono text-xs text-white/40">
                {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* Quick Status Legend */}
            <div className="mb-4 grid grid-cols-2 gap-2 text-[11px] text-white/60">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded border border-emerald-500/40 bg-emerald-500/20" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded border border-white/15 bg-black/60" />
                <span>Pending ({totalQuestions - answeredCount})</span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded border border-amber-500/40 bg-amber-500/20" />
                <span>Review Later ({flagged.size})</span>
              </div>
            </div>

            {/* 30 Question Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered =
                  responses[q.id] !== undefined &&
                  responses[q.id] !== "" &&
                  (!Array.isArray(responses[q.id]) ||
                    responses[q.id].length > 0);
                const isFlg = flagged.has(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-8 cursor-pointer rounded-lg font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? "border border-white bg-white text-black"
                        : isAnswered
                          ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                          : "border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {idx + 1}
                    {isFlg && (
                      <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-white/40">
            <span>@{user?.username}</span>
            <span className="text-emerald-400">Proctored</span>
          </div>
        </aside>
      </div>

      {/* Proctor Strike Grace Warning Modal */}
      {showGraceModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-red-500/40 bg-[#0a0a0f] p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
              <LuShieldAlert size={24} />
            </div>

            <span className="rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-red-400 uppercase">
              Warning 1 of 2
            </span>

            <h3 className="font-heading mt-2 mb-1 text-lg font-bold text-white">
              Proctor Violation Detected
            </h3>

            <p className="mb-4 text-xs leading-relaxed text-white/60">
              {graceReason ||
                "You exited full screen mode or switched application window focus."}
            </p>

            <div className="mb-5 rounded-xl border border-white/10 bg-black/60 p-3">
              <div className="mb-1 text-[11px] text-white/40">
                Return to fullscreen within:
              </div>
              <div className="font-mono text-2xl font-bold text-red-400">
                {graceSecondsLeft}s
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-red-500 transition-all duration-100 ease-linear"
                  style={{ width: `${(graceSecondsLeft / 5.0) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={resumeFromGrace}
              className="btn-primary w-full bg-red-600 py-2.5 text-xs hover:bg-red-500"
            >
              Return to Full Screen
            </button>
          </div>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 text-center">
            <h3 className="font-heading mb-1 text-lg font-bold text-white">
              Submit Round 1?
            </h3>
            <p className="mb-5 text-xs text-white/60">
              Once submitted, your answers cannot be changed.
            </p>

            <div className="mb-5 space-y-1.5 rounded-xl border border-white/10 bg-black/40 p-3 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Total Questions</span>
                <span className="font-medium text-white">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Answered</span>
                <span className="font-semibold text-emerald-400">
                  {answeredCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Pending</span>
                <span className="font-semibold text-amber-400">
                  {totalQuestions - answeredCount}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                Keep Reviewing
              </button>
              <button
                onClick={handleSubmitTest}
                disabled={isSubmitting}
                className="btn-primary flex-1 py-2 text-xs"
              >
                {isSubmitting ? "Submitting…" : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
