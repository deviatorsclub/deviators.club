"use client";

import { motion } from "motion/react";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-36 pb-24 sm:pt-40 sm:pb-28 lg:pt-44">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Tagline */}
          <motion.div variants={itemVariants}>
            <span className="glass-card text-brand-light inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-xs font-medium tracking-widest sm:text-sm">
              Code. Create. Deviate.
            </span>
          </motion.div>

          {/* Large Main Heading */}
          <motion.h1
            variants={itemVariants}
            className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl lg:whitespace-nowrap"
            style={{ lineHeight: 1.08 }}
          >
            Deviators Club
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg md:text-xl"
          >
            A community of builders, hackers, and dreamers breaking the mold on
            campus. We ship open-source projects, run hackathons, and host
            workshops, all while having way too much fun doing it.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          >
            <Link
              href="https://linktree.deviators.club/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm sm:text-base"
            >
              Connect with us
            </Link>
            <Link href="/learn" className="btn-secondary text-sm sm:text-base">
              Explore resources
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
