"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Copy01Icon,
  Tick01Icon,
  SparklesIcon,
  Medal01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Shield01Icon,
  GlobeIcon,
  Share01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { LuVolume2, LuVolumeX, LuHeart, LuSparkles } from "react-icons/lu";
import type { FacultyInvitation } from "@/data/facultyInvitations";
import { FACULTY_INVITATIONS } from "@/data/facultyInvitations";
import deviatorsLogoMin from "@/assets/logo/sm.svg";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  rotation: number;
}

export default function FacultyInvitationView({
  invitation,
}: {
  invitation: FacultyInvitation;
}) {
  const [opened, setOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [showFlight, setShowFlight] = useState(false);
  const [typedSalutation, setTypedSalutation] = useState("");
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedStory, setCopiedStory] = useState(false);

  // Audio Context ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Envelope ref
  const envelopeRef = useRef<HTMLDivElement | null>(null);
  const revealSectionRef = useRef<HTMLElement | null>(null);

  // Countdown target: Oct 13, 2026, 7:00 PM IST
  const targetDate = new Date("2026-10-13T19:00:00+05:30").getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    finished: false,
  });

  // Sound Synthesizer using Web Audio API
  const playChime = useCallback(
    (notes: number[]) => {
      if (!soundOn) return;
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        const startTime = ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

          gain.gain.setValueAtTime(0.0001, startTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.05, startTime + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.12 + 0.65);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime + idx * 0.12);
          osc.stop(startTime + idx * 0.12 + 0.68);
        });
      } catch {
        // Audio policy or unsupported
      }
    },
    [soundOn],
  );

  // Particle Canvas Burst
  const burstParticles = useCallback((x: number, y: number, count = 70) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const palette = [
      "#38bdf8", // cyan
      "#818cf8", // indigo
      "#c084fc", // purple
      "#fbbf24", // gold
      "#f472b6", // rose
      "#ffffff", // white
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const power = Math.random() * 5 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power - 1.2,
        life: 1,
        size: Math.random() * 3 + 1.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: Math.random() * Math.PI,
      });
    }

    if (!animFrameRef.current) {
      const animate = () => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

        for (const p of particlesRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.99;
          p.vy += 0.06;
          p.life -= 0.015;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation += 0.04));
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 2.2);
          ctx.restore();
        }

        if (particlesRef.current.length > 0) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          animFrameRef.current = null;
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Countdown timer logic
  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, targetDate - Date.now());
      if (remaining <= 0) {
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
          finished: true,
        });
        return;
      }
      const totalSec = Math.floor(remaining / 1000);
      const d = Math.floor(totalSec / 86400);
      const h = Math.floor((totalSec % 86400) / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setTimeLeft({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
        finished: false,
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Handle Envelope Open Ceremony
  const handleOpenEnvelope = () => {
    if (opened) {
      revealSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsOpening(true);

    if (envelopeRef.current) {
      const rect = envelopeRef.current.getBoundingClientRect();
      burstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 90);
    }

    playChime([392, 523.25, 659.25, 783.99]);

    // Stage 1: Envelope flap opens & letter peeks
    setTimeout(() => {
      setShowFlight(true);
      // Stage 2: Typewriter greeting inside floating letter
      const text = invitation.salutation;
      let i = 0;
      const typeInterval = setInterval(() => {
        i++;
        setTypedSalutation(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(typeInterval);
        }
      }, 26);

      // Stage 3: Reveal the full invitation card
      setTimeout(() => {
        setOpened(true);
        setIsOpening(false);
        setShowFlight(false);
        setTimeout(() => {
          revealSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }, 1450);
    }, 650);
  };

  // Handle Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      playChime([523.25, 659.25]);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  // Handle Copy Share Story
  const handleCopyStory = async () => {
    try {
      const shareText = `✨ Honored Faculty Invitation · DEBUG DECRYPT 3.0\nCordially inviting ${invitation.formalTitle} (${invitation.department})\nOrganized by Deviators Club & CSE Department, Dronacharya College of Engineering.\nVIP Access Pass: ${invitation.vipPassCode}\nInvitation Link: ${window.location.href}`;
      await navigator.clipboard.writeText(shareText);
      setCopiedStory(true);
      playChime([659.25, 783.99]);
      setTimeout(() => setCopiedStory(false), 2500);
    } catch {}
  };

  // Google Calendar URL Generator
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Debug Decrypt 3.0 - Faculty Guest: ${invitation.formalTitle}`,
  )}&dates=20261013T133000Z/20261013T141500Z&details=${encodeURIComponent(
    `Bespoke invitation for ${invitation.formalTitle} to grace Debug Decrypt 3.0 hosted by CSE Department & Deviators Club.\nVIP Pass: ${invitation.vipPassCode}\nInvitation Link: ${typeof window !== "undefined" ? window.location.href : ""}`,
  )}&location=${encodeURIComponent("Dronacharya College of Engineering & Online Arena")}`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07090e] font-sans text-white selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Particle Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      />

      {/* Atmospheric Radial Glows */}
      <div className="pointer-events-none fixed top-[-20%] left-[-15%] h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[160px]" />
      <div className="pointer-events-none fixed top-[20%] right-[-15%] h-[700px] w-[700px] rounded-full bg-indigo-600/15 blur-[180px]" />
      <div className="pointer-events-none fixed bottom-[-10%] left-[30%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[170px]" />

      {/* Subtle Starfield Texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255, 255, 255, 0.4) 1px, transparent 1px), radial-gradient(circle, rgba(56, 189, 248, 0.3) 1px, transparent 1px)",
          backgroundSize: "180px 180px, 320px 320px",
          backgroundPosition: "20px 40px, 110px 150px",
        }}
      />

      {/* Top Bar Navigation */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href="/events/debug-decrypt-3.0"
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
        >
          <Image
            src={deviatorsLogoMin.src || deviatorsLogoMin}
            alt="Deviators Club"
            width={30}
            height={30}
            className="h-7 w-auto brightness-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]"
          />
          <div className="flex flex-col">
            <span className="font-heading text-sm font-black tracking-tight text-white group-hover:text-cyan-300">
              Deviators Club
            </span>
            <span className="font-mono text-[10px] tracking-widest text-cyan-400 uppercase">
              Debug Decrypt 3.0
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 font-mono text-[11px] text-white/60 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            <span>Honored Faculty Invitation</span>
          </div>

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              if (next) playChime([523.25, 659.25]);
            }}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              soundOn
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)] hover:bg-cyan-500/20"
                : "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white"
            }`}
            title={soundOn ? "Mute interactive sounds" : "Enable sound chimes"}
          >
            {soundOn ? <LuVolume2 size={14} /> : <LuVolumeX size={14} />}
            <span>{soundOn ? "Sound on" : "Sound off"}</span>
          </button>
        </div>
      </header>

      {/* Main Experience */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-6 pb-24 sm:px-6">
        {/* Intro Hero Section */}
        <section className="flex flex-col items-center text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 font-mono text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <HugeiconsIcon icon={SparklesIcon} size={13} className="text-cyan-300" />
            <span>A NOTE CRAFTED WITH PROFOUND GRATITUDE</span>
            <span className="text-white/30">✦</span>
          </div>

          <h1 className="font-heading mt-6 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-[1.15]">
            The best ideas begin with{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              someone who believes.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
            This personal invitation has your name on it,{" "}
            <strong className="font-semibold text-white">
              {invitation.formalTitle}
            </strong>
            . Tap the royal seal to open.
          </p>

          {/* Countdown Display */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 shadow-2xl backdrop-blur-xl">
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
              {timeLeft.finished ? "EVENT COMMENCING NOW ✦" : "UNTIL DEBUG DECRYPT 3.0 COMMENCES"}
            </span>
            <div className="mt-2 flex items-center justify-center gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                <span className="font-heading text-2xl font-black text-white sm:text-3xl">
                  {timeLeft.days}
                </span>
                <span className="font-mono text-[9px] text-white/40 uppercase">DAYS</span>
              </div>
              <span className="text-lg text-cyan-400/50">:</span>
              <div className="flex flex-col items-center">
                <span className="font-heading text-2xl font-black text-white sm:text-3xl">
                  {timeLeft.hours}
                </span>
                <span className="font-mono text-[9px] text-white/40 uppercase">HRS</span>
              </div>
              <span className="text-lg text-cyan-400/50">:</span>
              <div className="flex flex-col items-center">
                <span className="font-heading text-2xl font-black text-white sm:text-3xl">
                  {timeLeft.minutes}
                </span>
                <span className="font-mono text-[9px] text-white/40 uppercase">MIN</span>
              </div>
              <span className="text-lg text-cyan-400/50">:</span>
              <div className="flex flex-col items-center">
                <span className="font-heading text-2xl font-black text-white sm:text-3xl">
                  {timeLeft.seconds}
                </span>
                <span className="font-mono text-[9px] text-white/40 uppercase">SEC</span>
              </div>
            </div>
          </div>

          {/* Interactive Envelope & Wax Seal Scene */}
          <div className="relative mt-12 flex h-[360px] w-full max-w-[500px] items-center justify-center">
            {/* Halo Backdrop Ring */}
            <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-indigo-500/20 blur-3xl" />

            <div
              ref={envelopeRef}
              onClick={handleOpenEnvelope}
              className={`group relative h-[220px] w-[340px] cursor-pointer transition-all duration-700 ease-out sm:h-[240px] sm:w-[380px] ${
                opened
                  ? "scale-95 opacity-80"
                  : isOpening
                    ? "scale-105"
                    : "hover:scale-[1.03]"
              }`}
              style={{
                perspective: "1000px",
              }}
            >
              {/* Envelope Body / Base */}
              <div className="absolute inset-0 rounded-2xl border border-white/20 bg-gradient-to-br from-[#1b2236] via-[#101524] to-[#0c0f1a] shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-transform duration-500">
                {/* Diagonal Envelope Folds */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-40"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, transparent 50%), linear-gradient(225deg, rgba(99,102,241,0.12) 0%, transparent 50%)",
                  }}
                />
              </div>

              {/* Letter Peek (Inside Envelope) */}
              <div
                className={`absolute inset-x-5 top-3 flex h-40 flex-col items-center justify-start rounded-t-xl border border-white/20 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] p-4 text-gray-900 shadow-md transition-transform duration-700 ${
                  isOpening || opened ? "-translate-y-24" : "translate-y-0"
                }`}
              >
                <span className="font-mono text-[9px] font-extrabold tracking-widest text-indigo-700 uppercase">
                  DEBUG DECRYPT 3.0
                </span>
                <span className="font-heading mt-1 text-sm font-extrabold tracking-tight text-gray-900">
                  HONORED GUEST INVITATION
                </span>
                <span className="mt-1 font-mono text-[10px] text-gray-500">
                  JUST FOR YOU ✦
                </span>
              </div>

              {/* Envelope Flap (Front polygon) */}
              <div
                className="absolute inset-0 rounded-b-2xl border-t border-white/10"
                style={{
                  clipPath: "polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)",
                  background:
                    "linear-gradient(180deg, #182035 0%, #0e1322 70%, #0a0d18 100%)",
                }}
              />

              {/* Top Folding Triangular Flap */}
              <div
                className={`absolute inset-x-0 top-0 h-[130px] origin-top transition-transform duration-700 ${
                  isOpening || opened
                    ? "-rotate-x-180 opacity-20"
                    : "rotate-x-0"
                }`}
                style={{
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  background:
                    "linear-gradient(180deg, #222c48 0%, #171e33 70%, #101626 100%)",
                }}
              />

              {/* Custom Deviators Wax Seal */}
              <div
                className={`absolute top-[40%] left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-300/80 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_0_25px_rgba(245,158,11,0.6),inset_0_2px_4px_rgba(255,255,255,0.6)] transition-all duration-500 ${
                  isOpening || opened
                    ? "scale-50 opacity-0"
                    : "group-hover:scale-110 group-hover:shadow-[0_0_35px_rgba(245,158,11,0.9)]"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/40 bg-amber-600/40 font-serif text-lg font-bold text-amber-100 shadow-inner">
                  <span className="drop-shadow-md">✦</span>
                </div>
              </div>

              {/* Teacher's Name Label on Envelope */}
              <div className="absolute right-0 bottom-4 left-0 text-center">
                <span className="font-heading text-sm font-semibold italic tracking-wide text-cyan-200/90 drop-shadow-md">
                  {invitation.envelopeName}
                </span>
              </div>
            </div>

            {/* Tap Hint */}
            <div className="pointer-events-none absolute bottom-0 flex items-center gap-1.5 font-mono text-xs text-white/50">
              <span className="text-cyan-400">↗</span>
              <span>{opened ? "Invitation Unsealed ✓" : "Tap the royal seal to open"}</span>
            </div>
          </div>
        </section>

        {/* Flying Letter Transition Modal */}
        <AnimatePresence>
          {showFlight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.8, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 1.05, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative mx-4 flex max-w-lg flex-col items-center justify-center rounded-3xl border border-cyan-400/40 bg-gradient-to-b from-[#0f172a] to-[#020617] p-8 text-center shadow-2xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                  <HugeiconsIcon icon={SparklesIcon} size={24} />
                </div>
                <span className="font-mono text-xs font-bold tracking-widest text-cyan-400 uppercase">
                  UNSEALING BESPOKE INVITATION
                </span>
                <h3 className="font-heading mt-3 min-h-[48px] text-2xl font-black text-white sm:text-3xl">
                  {typedSalutation}
                  <span className="ml-1 inline-block h-6 w-0.5 animate-pulse bg-cyan-400 align-middle" />
                </h3>
                <p className="mt-2 font-mono text-xs text-white/50">
                  Debug Decrypt 3.0 · Deviators Club
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revealed Invitation Section */}
        <section
          ref={revealSectionRef}
          className={`mt-16 transition-opacity duration-700 ${
            opened ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Main Invitation Parchment Card */}
          <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#111827]/95 via-[#0f172a]/95 to-[#090d16]/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-10">
            {/* Corner Decorative Star Glyphs */}
            <span className="absolute top-4 left-5 font-serif text-lg text-cyan-400/40">✧</span>
            <span className="absolute top-4 right-5 font-serif text-lg text-cyan-400/40">✧</span>
            <span className="absolute bottom-4 left-5 font-serif text-lg text-cyan-400/40">✧</span>
            <span className="absolute right-5 bottom-4 font-serif text-lg text-cyan-400/40">✧</span>

            {/* Topline header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-mono text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                DEBUG DECRYPT · 3.0
              </span>
              <span className="font-mono text-[10px] tracking-wider text-white/50 uppercase">
                GUEST OF HONOR INVITATION
              </span>
            </div>

            {/* Central Deviators Emblem */}
            <div className="mx-auto mt-6 mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
              <HugeiconsIcon icon={SparklesIcon} size={22} />
            </div>

            {/* Salutation */}
            <p className="font-heading text-lg font-bold italic text-cyan-200">
              {invitation.salutation}
            </p>

            {/* Main Invitation Hook */}
            <h2 className="font-heading mt-2 text-2xl font-black text-white sm:text-4xl sm:leading-tight">
              Will you join us for a little{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                magic?
              </span>
            </h2>

            {/* Body Copy */}
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-white/80 sm:text-base">
              <p>{invitation.personalMessage}</p>
              <p className="text-white/60">
                Your presence, wisdom, and blessings would make this event truly
                unforgettable for all participating students and builders.
              </p>
            </div>

            {/* Event Ribbon Box */}
            <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-indigo-950/40 p-5 shadow-inner">
              <div className="flex flex-col items-center text-center">
                <span className="font-heading text-xl font-black text-white sm:text-2xl">
                  Debug Decrypt 3.0
                </span>
                <span className="mt-1 font-mono text-xs font-bold tracking-wider text-cyan-300">
                  {invitation.eventDateText} · {invitation.eventTimeText}
                </span>
                <span className="mt-0.5 font-mono text-[11px] text-white/60">
                  {invitation.eventVenueText}
                </span>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[10px] text-white/70">
                  <span>CSE DEPARTMENT · DEVIATORS CLUB</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white"
              >
                <HugeiconsIcon icon={Calendar03Icon} size={15} />
                <span>Add to Google Calendar</span>
                <span className="text-white/60">↗</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold text-white/80 transition-colors hover:text-white"
              >
                <HugeiconsIcon
                  icon={copiedLink ? Tick01Icon : Copy01Icon}
                  size={15}
                  className={copiedLink ? "text-emerald-400" : ""}
                />
                <span>{copiedLink ? "Link Copied ✓" : "Copy Invitation Link"}</span>
              </button>
            </div>

            {/* Signature */}
            <div className="mt-8 border-t border-white/10 pt-6 text-center">
              <p className="font-heading text-sm italic text-white/60">
                With our warmest regards & gratitude,
              </p>
              <p className="mt-1 font-heading text-base font-bold text-white">
                Department of Computer Science & Engineering & Deviators Club{" "}
                <span className="text-rose-400">♡</span>
              </p>
            </div>
          </div>

          {/* Surprise Note Section */}
          <div className="mx-auto mt-10 max-w-xl text-center">
            <p className="font-heading text-sm italic text-white/60">
              One more little thing from all of us...
            </p>
            <button
              type="button"
              onClick={() => {
                const next = !surpriseOpen;
                setSurpriseOpen(next);
                if (next) {
                  playChime([659.25, 783.99, 1046.5]);
                  burstParticles(window.innerWidth / 2, window.innerHeight / 2, 70);
                }
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.03] hover:brightness-110"
            >
              <HugeiconsIcon icon={SparklesIcon} size={14} className="text-cyan-300" />
              <span>{surpriseOpen ? "Close Our Note" : "A Little Note from the Team"}</span>
              <span className="text-cyan-300">↗</span>
            </button>

            <AnimatePresence>
              {surpriseOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-[#0a0e19] p-6 text-left shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex items-center gap-2 text-amber-300">
                    <LuSparkles size={16} />
                    <span className="font-mono text-xs font-bold uppercase">
                      From Every Student You Mentor
                    </span>
                  </div>
                  <p className="font-heading mt-3 text-lg leading-relaxed text-white sm:text-xl">
                    &ldquo;{invitation.surpriseNote}&rdquo;
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================================= */}
          {/* THE HONORED FACULTY VIP GUEST / PROFILE CARD (DEVIATORS ROSTER STYLE)      */}
          {/* ========================================================================= */}
          <div className="mt-16 border-t border-white/10 pt-16">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                <HugeiconsIcon icon={Medal01Icon} size={14} />
                <span>OFFICIAL FACULTY VIP PASS</span>
                <span className="text-white/40">·</span>
                <span className="font-mono text-white/80">
                  {invitation.vipPassCode}
                </span>
              </div>
              <h2 className="font-heading mt-3 text-2xl font-black text-white sm:text-3xl">
                Honored Faculty Guest Pass
              </h2>
              <p className="mt-1 text-xs text-white/50 sm:text-sm">
                Your official VIP Guest Pass for DEBUG DECRYPT 3.0 at Dronacharya
                College of Engineering.
              </p>
            </div>

            {/* Signature Deviators Card Frame */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative mx-auto max-w-xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#0a0e19]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              {/* Subtle Ambient Glow */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-cyan-500/15 blur-2xl transition-all duration-500 group-hover:bg-cyan-500/25" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-blue-500/15 blur-2xl" />

              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Faculty Portrait / Avatar Frame */}
                <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-tr from-[#131b2e] via-[#0d1220] to-[#1e293b] shadow-xl sm:mx-0 sm:h-36 sm:w-36">
                  {invitation.avatarUrl ? (
                    <Image
                      src={invitation.avatarUrl}
                      alt={invitation.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-2xl font-black text-amber-300 shadow-inner">
                        {invitation.initials}
                      </div>
                      <span className="mt-1 font-mono text-[9px] font-bold text-amber-300/80 uppercase">
                        FACULTY MENTOR
                      </span>
                    </div>
                  )}

                  {/* Gold Medal Badge */}
                  <div className="absolute top-2 right-2 rounded-full border border-amber-400/40 bg-black/70 p-1 text-amber-300 shadow-md backdrop-blur-md">
                    <HugeiconsIcon icon={Medal01Icon} size={14} />
                  </div>
                </div>

                {/* Faculty Details */}
                <div className="flex min-w-0 flex-1 flex-col justify-between text-center sm:text-left">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 uppercase">
                      <HugeiconsIcon icon={Shield01Icon} size={11} />
                      <span>Chief Faculty Guest</span>
                    </div>

                    <h3 className="font-heading mt-2 truncate text-xl font-black text-white sm:text-2xl">
                      {invitation.formalTitle}
                    </h3>

                    <p className="mt-0.5 font-mono text-xs font-semibold text-amber-300/90">
                      {invitation.designation}
                    </p>

                    <p className="mt-1 text-xs text-white/60">
                      {invitation.department}
                    </p>

                    <p className="mt-0.5 font-mono text-[11px] text-white/40">
                      {invitation.institution}
                    </p>
                  </div>

                  {/* Pass Security Strip */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-white/[0.08] pt-3 sm:justify-start">
                    <span className="font-mono text-[10px] text-white/40">
                      PASS ID:
                    </span>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                      {invitation.vipPassCode}
                    </span>
                    <span className="text-white/20">·</span>
                    <span className="font-mono text-[10px] text-emerald-400">
                      STATUS: CONFIRMED GUEST
                    </span>
                  </div>
                </div>
              </div>

              {/* Pass Actions Hub */}
              <div className="mt-6 flex flex-col gap-2.5 border-t border-white/[0.08] pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCopyStory}
                  className="btn-primary flex-1 justify-center py-2.5 text-xs font-bold text-white"
                >
                  <HugeiconsIcon
                    icon={copiedStory ? Tick01Icon : Share01Icon}
                    size={14}
                  />
                  <span>
                    {copiedStory ? "Guest Card Copied ✓" : "Share Guest Card Announcement"}
                  </span>
                </button>

                <Link
                  href="/events/debug-decrypt-3.0"
                  className="btn-secondary flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white/80 transition-colors hover:text-white"
                >
                  <HugeiconsIcon icon={GlobeIcon} size={14} />
                  <span>Event Overview</span>
                </Link>
              </div>
            </motion.div>

            {/* Quick Switcher for Club Organizers */}
            <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
              <p className="font-mono text-[10px] tracking-wider text-white/40 uppercase">
                ORGANIZER DIRECTORY · ALL FACULTY INVITATIONS
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {Object.values(FACULTY_INVITATIONS).map((fac) => (
                  <Link
                    key={fac.slug}
                    href={`/event/debug-decrypt-3.0/invitation-${fac.slug}`}
                    className={`rounded-xl px-3 py-1 font-mono text-[11px] transition-all ${
                      fac.slug === invitation.slug
                        ? "border border-cyan-400/50 bg-cyan-500/20 font-bold text-cyan-300 shadow-sm"
                        : "border border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {fac.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-white/40">
        <p>CRAFTED WITH ♥ FOR OUR RESPECTED FACULTY BY DEVIATORS CLUB</p>
        <p className="mt-1 font-mono text-[10px] text-white/30">
          DEBUG DECRYPT 3.0 · DRONACHARYA COLLEGE OF ENGINEERING · 2026
        </p>
      </footer>
    </div>
  );
}
