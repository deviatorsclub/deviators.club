"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import aboutCards, { aboutClub } from "@/data/about";

export default function AboutSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => Math.min(aboutCards.length - 1, prev + 1));
  };

  const currentCard = aboutCards[activeIndex];
  const Icon = currentCard.icon;

  return (
    <section
      id="about"
      className="relative w-full overflow-hidden py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl text-white sm:text-4xl lg:text-5xl">
            About Deviators
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg">
            {aboutClub}
          </p>
        </motion.div>

        {/* Card and Controls */}
        <div className="relative mt-12 flex w-full flex-col items-center justify-center sm:mt-14">
          <div className="flex w-full items-center justify-center gap-3 sm:gap-6">
            {/* Desktop Left Arrow Button */}
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              aria-label="Previous card"
              className={`glass-card hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-all sm:flex sm:h-12 sm:w-12 ${
                activeIndex === 0
                  ? "cursor-not-allowed opacity-25"
                  : "cursor-pointer hover:scale-110 hover:border-white/40 hover:bg-white/10"
              }`}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={22} />
            </button>

            {/* Single Card Container */}
            <div className="w-full max-w-[560px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="glass-card flex min-h-[270px] w-full flex-col justify-between rounded-2xl p-6 shadow-xl sm:min-h-[290px] sm:p-7"
                >
                  <div>
                    {/* Top: Icon + Heading */}
                    <div className="flex items-center gap-3.5">
                      <div className="text-brand-light flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <HugeiconsIcon icon={Icon} size={22} />
                      </div>
                      <h3 className="text-xl font-bold text-white sm:text-2xl">
                        {currentCard.title}
                      </h3>
                    </div>

                    {/* Middle: Description */}
                    <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-base">
                      {currentCard.desc}
                    </p>
                  </div>

                  {/* Bottom: Stat Tag + Counter (without separating border line) */}
                  <div className="flex items-center justify-between pt-4 text-xs">
                    <span className="text-brand-light rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium">
                      {currentCard.stats}
                    </span>
                    <span className="font-mono text-white/40">
                      {activeIndex + 1} / {aboutCards.length}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Right Arrow Button */}
            <button
              onClick={handleNext}
              disabled={activeIndex === aboutCards.length - 1}
              aria-label="Next card"
              className={`glass-card hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-all sm:flex sm:h-12 sm:w-12 ${
                activeIndex === aboutCards.length - 1
                  ? "cursor-not-allowed opacity-25"
                  : "cursor-pointer hover:scale-110 hover:border-white/40 hover:bg-white/10"
              }`}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={22} />
            </button>
          </div>

          {/* Mobile Arrow Buttons (positioned below the card) */}
          <div className="mt-5 flex items-center justify-center gap-4 sm:hidden">
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              aria-label="Previous card"
              className={`glass-card flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition-all ${
                activeIndex === 0
                  ? "cursor-not-allowed opacity-25"
                  : "cursor-pointer hover:scale-105 hover:bg-white/10"
              }`}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
            </button>
            <span className="font-mono text-xs text-white/50">
              {activeIndex + 1} / {aboutCards.length}
            </span>
            <button
              onClick={handleNext}
              disabled={activeIndex === aboutCards.length - 1}
              aria-label="Next card"
              className={`glass-card flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition-all ${
                activeIndex === aboutCards.length - 1
                  ? "cursor-not-allowed opacity-25"
                  : "cursor-pointer hover:scale-105 hover:bg-white/10"
              }`}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
