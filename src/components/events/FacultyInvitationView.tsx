"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Medal01Icon,
  Shield01Icon,
  GlobeIcon,
  Copy01Icon,
  Tick01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import {
  LuVolume2,
  LuVolumeX,
  LuHeart,
  LuSparkles,
  LuCheck,
  LuAward,
  LuCalendar,
  LuClock,
  LuMapPin,
  LuBuilding2,
  LuUserCheck,
} from "react-icons/lu";
import type { FacultyInvitation } from "@/data/facultyInvitations";
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
  const [accepted, setAccepted] = useState(false);
  const [noAttempts, setNoAttempts] = useState(0);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAnnouncement, setCopiedAnnouncement] = useState(false);
  const [showDelayedTooltip, setShowDelayedTooltip] = useState(false);

  // Delayed Tooltip Timer (appears after a few seconds if unopened)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelayedTooltip(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Audio Context ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Element refs
  const envelopeRef = useRef<HTMLDivElement | null>(null);
  const letterSectionRef = useRef<HTMLElement | null>(null);
  const vipPassSectionRef = useRef<HTMLDivElement | null>(null);

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
          gain.gain.exponentialRampToValueAtTime(
            0.05,
            startTime + idx * 0.12 + 0.02,
          );
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + idx * 0.12 + 0.65,
          );

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
  const burstParticles = useCallback((x: number, y: number, count = 75) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const palette = [
      "#38bdf8", // cyan
      "#818cf8", // indigo
      "#c084fc", // purple
      "#fbbf24", // gold
      "#34d399", // emerald
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
      letterSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsOpening(true);

    if (envelopeRef.current) {
      const rect = envelopeRef.current.getBoundingClientRect();
      burstParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        90,
      );
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
      }, 24);

      // Stage 3: Reveal the full invitation letter
      setTimeout(() => {
        setOpened(true);
        setIsOpening(false);
        setShowFlight(false);
        setTimeout(() => {
          letterSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 150);
      }, 1400);
    }, 650);
  };

  // Evasive "No" Button handler
  const handleEvadeNo = () => {
    setNoAttempts((prev) => prev + 1);
    playChime([261.63, 293.66]);

    // Randomize position within generous interactive range
    const maxOffset = Math.min(180, Math.max(100, 80 + noAttempts * 20));
    const randomX = (Math.random() - 0.5) * (maxOffset * 2);
    const randomY = (Math.random() - 0.5) * (maxOffset * 1.4);
    setNoPos({ x: randomX, y: randomY });
  };

  // "Yes" Button acceptance handler
  const handleAccept = () => {
    setAccepted(true);
    burstParticles(window.innerWidth / 2, window.innerHeight / 2, 120);
    playChime([523.25, 659.25, 783.99, 1046.5]);

    setTimeout(() => {
      vipPassSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);
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

  // Handle Copy Announcement Text
  const handleCopyAnnouncement = async () => {
    try {
      const shareText = `Honored Faculty Invitation · DEBUG DECRYPT 3.0\nCordially inviting ${invitation.formalTitle}\n${invitation.designation} · ${invitation.department}\nOrganized by Deviators Club & CSE Department, Dronacharya College of Engineering.\nVIP Access Pass: ${invitation.vipPassCode}\nInvitation Link: ${window.location.href}`;
      await navigator.clipboard.writeText(shareText);
      setCopiedAnnouncement(true);
      playChime([659.25, 783.99]);
      setTimeout(() => setCopiedAnnouncement(false), 2500);
    } catch {}
  };

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

      {/* Dedicated Standalone Top Bar for Invitation */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 pt-8 pb-4 sm:px-8">
        <Link
          href="/events/debug-decrypt-3.0"
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
        >
          <Image
            src={deviatorsLogoMin.src || deviatorsLogoMin}
            alt="Deviators Club"
            width={32}
            height={32}
            className="h-8 w-auto brightness-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]"
          />
          <div className="flex flex-col text-left">
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
      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-4 pb-24 sm:px-6">
        {/* Intro Hero Section */}
        <section className="flex flex-col items-center text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 font-mono text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <LuSparkles size={13} className="text-cyan-300" />
            <span>A NOTE CRAFTED WITH PROFOUND GRATITUDE</span>
          </div>

          <h1 className="font-heading mt-6 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl sm:leading-[1.15]">
            The best ideas begin with{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              someone who believes.
            </span>
          </h1>

          <div className="mt-6 flex flex-col items-center">
            {/* Faculty Portrait Badge */}
            <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-amber-400/40 bg-gradient-to-tr from-[#131b2e] via-[#0d1220] to-[#1e293b] p-1 shadow-[0_0_30px_rgba(245,158,11,0.25)] transition-transform hover:scale-105">
              <div className="relative h-full w-full overflow-hidden rounded-xl">
                {invitation.avatarUrl ? (
                  <Image
                    src={invitation.avatarUrl}
                    alt={invitation.name}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className="font-heading flex h-full w-full items-center justify-center bg-amber-500/10 text-2xl font-black text-amber-300">
                    {invitation.initials}
                  </div>
                )}
              </div>
              <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/60 bg-[#0b0f19] text-amber-300 shadow-md">
                <LuAward size={13} />
              </div>
            </div>

            <h2 className="font-heading max-w-xl text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              {invitation.formalTitle}
            </h2>
            <p className="mt-1 font-mono text-xs font-semibold text-amber-300/90 sm:text-sm">
              {invitation.designation}
            </p>
            <p className="mt-0.5 font-sans text-xs text-white/60 sm:text-sm">
              {invitation.department} · {invitation.institution}
            </p>
            <p className="mt-3 font-sans text-xs text-white/40">
              Tap the seal to unseal your invitation.
            </p>
          </div>

          {/* Countdown Display */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 shadow-2xl backdrop-blur-xl">
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
              {timeLeft.finished
                ? "EVENT COMMENCING NOW"
                : "UNTIL DEBUG DECRYPT 3.0 COMMENCES"}
            </span>
            <div className="mt-2 flex items-center justify-center gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                <span className="font-heading text-2xl font-black text-white sm:text-3xl">
                  {timeLeft.days}
                </span>
                <span className="font-mono text-[9px] text-white/40 uppercase">
                  DAYS
                </span>
              </div>
              <span className="text-lg text-cyan-400/50">:</span>
              <div className="flex flex-col items-center">
                <span className="font-heading text-2xl font-black text-white sm:text-3xl">
                  {timeLeft.hours}
                </span>
                <span className="font-mono text-[9px] text-white/40 uppercase">
                  HRS
                </span>
              </div>
              <span className="text-lg text-cyan-400/50">:</span>
              <div className="flex flex-col items-center">
                <span className="font-heading text-2xl font-black text-white sm:text-3xl">
                  {timeLeft.minutes}
                </span>
                <span className="font-mono text-[9px] text-white/40 uppercase">
                  MIN
                </span>
              </div>
              <span className="text-lg text-cyan-400/50">:</span>
              <div className="flex flex-col items-center">
                <span className="font-heading text-2xl font-black text-white sm:text-3xl">
                  {timeLeft.seconds}
                </span>
                <span className="font-mono text-[9px] text-white/40 uppercase">
                  SEC
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Envelope & Wax Seal Scene */}
          <div className="relative mt-8 flex h-[430px] w-full max-w-[500px] flex-col items-center justify-center">
            {/* Halo Backdrop Ring */}
            <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-indigo-500/20 blur-3xl" />

            {/* Delayed Speech Bubble Tooltip (floating above seal after a few seconds) */}
            <AnimatePresence>
              {!opened && !isOpening && showDelayedTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    y: [0, -6, 0],
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="pointer-events-none absolute top-4 z-30 select-none"
                >
                  <div className="relative rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-[#fef9c3] to-[#fef08a] px-5 py-2.5 text-center shadow-[0_12px_30px_rgba(245,158,11,0.45)]">
                    <p className="font-heading text-xs font-black tracking-tight text-amber-950 sm:text-sm">
                      Tap here to reveal
                      <br />
                      your surprise!
                    </p>
                    {/* Downward pointing speech bubble tail */}
                    <div className="absolute -bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[8px] border-t-[8px] border-x-transparent border-t-[#fef08a]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={envelopeRef}
              onClick={handleOpenEnvelope}
              className={`group relative mt-6 h-[220px] w-[340px] cursor-pointer transition-all duration-700 ease-out sm:h-[240px] sm:w-[380px] ${
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
                  SPECIAL INVITATION
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

              {/* Custom Deviators Wax Seal with Radiating Glow Rays */}
              <div
                className={`absolute top-[40%] left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-300/90 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_0_28px_rgba(245,158,11,0.7),inset_0_2px_4px_rgba(255,255,255,0.6)] transition-all duration-500 ${
                  isOpening || opened
                    ? "scale-50 opacity-0"
                    : "group-hover:scale-110 group-hover:shadow-[0_0_38px_rgba(245,158,11,0.95)]"
                }`}
              >
                {/* Radiating Accent Rays (from design) */}
                {!opened && !isOpening && (
                  <>
                    <span className="pointer-events-none absolute -top-3.5 left-1/2 h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_6px_#f59e0b]" />
                    <span className="pointer-events-none absolute -top-2.5 -left-2.5 h-2.5 w-0.5 -rotate-45 rounded-full bg-amber-300 shadow-[0_0_6px_#f59e0b]" />
                    <span className="pointer-events-none absolute -top-2.5 -right-2.5 h-2.5 w-0.5 rotate-45 rounded-full bg-amber-300 shadow-[0_0_6px_#f59e0b]" />
                    <span className="pointer-events-none absolute top-1/2 -left-3.5 h-0.5 w-2.5 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_6px_#f59e0b]" />
                    <span className="pointer-events-none absolute top-1/2 -right-3.5 h-0.5 w-2.5 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_6px_#f59e0b]" />
                  </>
                )}

                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/40 bg-amber-600/40 text-amber-100 shadow-inner">
                  <LuAward size={20} className="drop-shadow-md" />
                </div>
              </div>

              {/* Teacher's Name Label on Envelope */}
              <div className="absolute right-0 bottom-4 left-0 text-center">
                <span className="font-heading text-sm font-semibold tracking-wide text-cyan-200/90 drop-shadow-md">
                  {invitation.envelopeName}
                </span>
              </div>
            </div>

            {/* Tap Hint Matching Provided Design */}
            <div className="pointer-events-none mt-6 flex flex-col items-center text-center">
              <p className="font-heading text-base font-black tracking-tight text-white sm:text-lg">
                <span className="text-cyan-400">Tap the Seal</span> to Open
              </p>
              <p className="mt-0.5 font-sans text-xs text-white/60">
                A special message awaits you
              </p>
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
                  <LuSparkles size={24} />
                </div>
                <span className="font-mono text-xs font-bold tracking-widest text-cyan-400 uppercase">
                  UNSEALING INVITATION
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

        {/* ========================================================================= */}
        {/* REVEALED INVITATION LETTER & INTERACTIVE ACCEPTANCE SECTION (DYNAMIC MOUNT) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {opened && (
            <motion.section
              key="letter-section"
              ref={letterSectionRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-12"
            >
              {/* Main Invitation Letter */}
              <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#111827]/95 via-[#0f172a]/95 to-[#090d16]/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-10">
                {/* Topline header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                    DEBUG DECRYPT 3.0
                  </span>
                  <span className="font-mono text-[10px] tracking-wider text-white/50 uppercase">
                    GUEST OF HONOR INVITATION
                  </span>
                </div>

                {/* Salutation & Faculty Profile Block */}
                <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-tr from-[#131b2e] via-[#0d1220] to-[#1e293b] p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <div className="relative h-full w-full overflow-hidden rounded-[14px]">
                      {invitation.avatarUrl ? (
                        <Image
                          src={invitation.avatarUrl}
                          alt={invitation.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="font-heading flex h-full w-full items-center justify-center bg-amber-500/10 text-xl font-black text-amber-300">
                          {invitation.initials}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="font-heading text-xl font-black tracking-tight text-cyan-200 sm:text-2xl">
                      {invitation.salutation}
                    </p>
                    <p className="mt-1 font-mono text-xs font-semibold text-amber-300/90 sm:text-sm">
                      {invitation.designation}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-white/60">
                      {invitation.department} · {invitation.institution}
                    </p>
                  </div>
                </div>

                {/* Main Headline */}
                <h2 className="font-heading mt-6 text-2xl font-black tracking-tight text-white sm:text-3xl sm:leading-tight">
                  Will you grace Debug Decrypt 3.0 as our{" "}
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                    Honored Faculty Guest?
                  </span>
                </h2>

                {/* Body Copy */}
                <div className="mt-5 space-y-3 font-sans text-sm leading-relaxed text-white/80 sm:text-base">
                  <p>{invitation.personalMessage}</p>
                  <p className="text-white/60">
                    Your presence, insights, and encouragement would mean the
                    world to all our participating engineering and coding
                    students.
                  </p>
                </div>

                {/* Event Details Box */}
                <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-indigo-950/40 p-5 shadow-inner">
                  <div className="flex flex-col gap-2.5 text-left sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <LuCalendar size={15} className="text-cyan-400" />
                        <span className="font-mono text-xs font-bold text-white">
                          {invitation.eventDateText}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <LuClock size={15} className="text-cyan-400" />
                        <span className="font-mono text-xs text-white/70">
                          {invitation.eventTimeText}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-2 sm:border-t-0 sm:pt-0 sm:text-right">
                      <div className="flex items-center gap-1.5 sm:justify-end">
                        <LuMapPin size={15} className="text-cyan-400" />
                        <span className="font-mono text-xs text-white/80">
                          Computer Labs & Seminar Hall of the College, DCE
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 sm:justify-end">
                        <LuBuilding2 size={14} className="text-cyan-400" />
                        <span className="font-mono text-[11px] text-cyan-300/80">
                          CSE Dept & Deviators Club
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="mt-6 border-t border-white/10 pt-5 text-center">
                  <p className="font-sans text-xs text-white/60 sm:text-sm">
                    With our warmest regards & respect,
                  </p>
                  <p className="font-heading mt-1 text-sm font-extrabold tracking-tight text-white sm:text-base">
                    Department of Computer Science & Engineering & Deviators
                    Club
                  </p>
                </div>

                {/* ================================================================= */}
                {/* INTERACTIVE ACCEPTANCE (YES / NO EVASIVE BUTTONS)                */}
                {/* ================================================================= */}
                <div className="relative mt-8 rounded-2xl border border-cyan-500/30 bg-black/40 p-6 text-center">
                  {!accepted ? (
                    <>
                      <p className="font-heading text-base font-extrabold tracking-tight text-white sm:text-lg">
                        Do you accept our heartfelt invitation?
                      </p>
                      <p className="mt-1 font-sans text-xs text-white/50">
                        {noAttempts > 0
                          ? "The students would be deeply honored if you said yes!"
                          : "Please confirm your presence to receive your official VIP Pass."}
                      </p>

                      <div className="relative mt-6 flex min-h-[90px] items-center justify-center gap-4">
                        {/* YES BUTTON (GROWS BIGGER WITH EACH "NO" ATTEMPT) */}
                        <button
                          type="button"
                          onClick={handleAccept}
                          style={{
                            transform: `scale(${Math.min(1 + noAttempts * 0.16, 2.3)})`,
                            zIndex: 20,
                          }}
                          className="btn-primary font-heading flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black tracking-wide text-white shadow-xl shadow-cyan-500/30 transition-transform duration-200 hover:brightness-110"
                        >
                          <LuCheck size={16} />
                          <span>Yes, I accept!</span>
                        </button>

                        {/* NO BUTTON (EVADES AND JUMPS TO RANDOM POSITIONS) */}
                        <button
                          type="button"
                          onMouseEnter={handleEvadeNo}
                          onClick={handleEvadeNo}
                          style={{
                            transform: `translate(${noPos.x}px, ${noPos.y}px)`,
                            transition: "transform 0.15s ease-out",
                            zIndex: 10,
                          }}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 font-sans text-xs font-semibold text-white/50 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <span>No</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* ACCEPTED CONFIRMATION BANNER */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-400">
                        <LuCheck size={24} />
                      </div>
                      <h3 className="font-heading text-xl font-black tracking-tight text-white">
                        Thank You! Invitation Accepted
                      </h3>
                      <p className="font-sans text-xs text-emerald-300/90 sm:text-sm">
                        We are thrilled to welcome you. Your official VIP Guest
                        Pass is ready below!
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Quick Link Share & Copy */}
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white/70 transition-colors hover:text-white"
                  >
                    <HugeiconsIcon
                      icon={copiedLink ? Tick01Icon : Copy01Icon}
                      size={14}
                      className={copiedLink ? "text-emerald-400" : ""}
                    />
                    <span>
                      {copiedLink
                        ? "Invitation Link Copied"
                        : "Copy Invitation Link"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Surprise Note Section */}
              <div className="mx-auto mt-10 max-w-xl text-center">
                <p className="font-sans text-xs text-white/60 sm:text-sm">
                  One more note from the students...
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const next = !surpriseOpen;
                    setSurpriseOpen(next);
                    if (next) {
                      playChime([659.25, 783.99, 1046.5]);
                      burstParticles(
                        window.innerWidth / 2,
                        window.innerHeight / 2,
                        70,
                      );
                    }
                  }}
                  className="font-heading mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 px-5 py-2.5 text-xs font-bold tracking-tight text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.03] hover:brightness-110"
                >
                  <LuSparkles size={14} className="text-cyan-300" />
                  <span>
                    {surpriseOpen
                      ? "Close Note"
                      : "A Little Note from the Team"}
                  </span>
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
                      <p className="mt-3 font-sans text-base leading-relaxed font-medium text-white sm:text-lg">
                        &ldquo;{invitation.surpriseNote}&rdquo;
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ========================================================================= */}
              {/* THE HONORED FACULTY VIP GUEST PASS (POPS UP ONLY ON ACCEPTANCE)           */}
              {/* ========================================================================= */}
              <AnimatePresence>
                {accepted && (
                  <motion.div
                    ref={vipPassSectionRef}
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mt-16 border-t border-white/10 pt-16"
                  >
                    <div className="mb-8 text-center">
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                        <LuAward size={14} />
                        <span>OFFICIAL FACULTY VIP PASS</span>
                        <span className="text-white/40">·</span>
                        <span className="font-mono text-white/80">
                          {invitation.vipPassCode}
                        </span>
                      </div>
                      <h2 className="font-heading mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                        Honored Faculty Guest Pass
                      </h2>
                      <p className="mt-1 font-sans text-xs text-white/50 sm:text-sm">
                        Your official VIP Guest Pass for DEBUG DECRYPT 3.0 at
                        Dronacharya College of Engineering.
                      </p>
                    </div>

                    {/* Signature Deviators Card Frame */}
                    <div className="group relative mx-auto max-w-xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#0a0e19]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
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

                          {/* Gold Badge */}
                          <div className="absolute top-2 right-2 rounded-full border border-amber-400/40 bg-black/70 p-1 text-amber-300 shadow-md backdrop-blur-md">
                            <LuAward size={14} />
                          </div>
                        </div>

                        {/* Faculty Details */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between text-center sm:text-left">
                          <div>
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 uppercase">
                              <LuUserCheck size={11} />
                              <span>Chief Faculty Guest</span>
                            </div>

                            <h3 className="font-heading mt-2 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                              {invitation.formalTitle}
                            </h3>

                            <p className="mt-0.5 font-mono text-xs font-semibold text-amber-300/90">
                              {invitation.designation}
                            </p>

                            <p className="mt-1 font-sans text-xs text-white/60">
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
                              STATUS: ATTENDING GUEST
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pass Actions Hub */}
                      <div className="mt-6 flex flex-col gap-2.5 border-t border-white/[0.08] pt-5 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleCopyAnnouncement}
                          className="btn-primary font-heading flex-1 justify-center py-2.5 text-xs font-bold tracking-tight text-white"
                        >
                          <HugeiconsIcon
                            icon={copiedAnnouncement ? Tick01Icon : Share01Icon}
                            size={14}
                          />
                          <span>
                            {copiedAnnouncement
                              ? "Announcement Copied"
                              : "Share Guest Card Announcement"}
                          </span>
                        </button>

                        <Link
                          href="/events/debug-decrypt-3.0"
                          className="btn-secondary flex items-center justify-center gap-1.5 px-4 py-2.5 font-sans text-xs font-medium text-white/80 transition-colors hover:text-white"
                        >
                          <HugeiconsIcon icon={GlobeIcon} size={14} />
                          <span>Event Overview</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Global Minimal Footer for Invitation Page */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center">
        <p className="font-mono text-[10px] tracking-wider text-white/40 uppercase">
          CRAFTED WITH RESPECT FOR OUR FACULTY BY DEVIATORS CLUB
        </p>
        <p className="mt-1 font-mono text-[10px] tracking-wider text-white/30">
          DEBUG DECRYPT 3.0 · DRONACHARYA COLLEGE OF ENGINEERING · 2026
        </p>
      </footer>
    </div>
  );
}
