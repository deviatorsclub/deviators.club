"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import team from "@/data/team03";

function subscribeWindowWidth(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getWindowWidthSnapshot() {
  return typeof window !== "undefined" ? window.innerWidth : 1024;
}

function getWindowWidthServerSnapshot() {
  return 1024;
}

export default function TeamPreview() {
  const windowWidth = useSyncExternalStore(
    subscribeWindowWidth,
    getWindowWidthSnapshot,
    getWindowWidthServerSnapshot,
  );

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isMobile = windowWidth < 640;
  const currentMembers = isMobile ? team.slice(0, 3) : team;

  const cardWidth = isMobile ? 120 : 210;
  const cardHeight = isMobile ? 165 : 290;
  const archHeight = isMobile ? 30 : 55;
  const horizontalSpacing = isMobile ? 85 : 140;
  const middleIndex = (currentMembers.length - 1) / 2;

  return (
    <section className="overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <h2 className="font-heading text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Meet Our Team
            </h2>
            <p className="mt-3 text-sm text-white/50 sm:text-base lg:text-lg">
              The people who make Deviators what it is
            </p>
          </motion.div>

          {/* Cards Container */}
          <div
            className="relative flex w-full items-center justify-center"
            style={{ height: isMobile ? "210px" : "380px" }}
          >
            {currentMembers.map((member, index) => {
              // Tilt & z-index
              let tilt = 0;
              let zIndex = 10;

              if (!isMobile) {
                const tiltMap = [-6, -3.5, -1, 1, 3.5, 6];
                tilt = tiltMap[index] ?? 0;
                const zMap = [10, 12, 14, 14, 12, 10];
                zIndex = zMap[index] ?? 10;
              } else {
                const tiltMap = [-4, 0, 4];
                tilt = tiltMap[index] ?? 0;
                const zMap = [10, 14, 10];
                zIndex = zMap[index] ?? 10;
              }

              const offsetFromMiddle = index - middleIndex;
              let xPos = offsetFromMiddle * horizontalSpacing;
              const yPos =
                Math.pow(Math.abs(offsetFromMiddle) / (middleIndex || 1), 2) *
                archHeight;

              const isHovered = hoveredIndex === index;
              const isOtherHovered =
                hoveredIndex !== null && hoveredIndex !== index;

              // Subtle neighbor spreading when a card is hovered
              if (isOtherHovered && hoveredIndex !== null) {
                const diff = index - hoveredIndex;
                if (diff > 0) xPos += 14;
                if (diff < 0) xPos -= 14;
              }

              return (
                <motion.div
                  key={member.name}
                  className="absolute cursor-pointer"
                  style={{
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    zIndex: isHovered ? 25 : zIndex,
                  }}
                  animate={{
                    x: xPos,
                    y: isHovered ? yPos - 38 : yPos,
                    rotate: isHovered ? 0 : tilt,
                    scale: isHovered ? 1.12 : isOtherHovered ? 0.94 : 1,
                    opacity: isOtherHovered ? 0.6 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 24,
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Link
                    href={`/dashboard/@${member.username}`}
                    title={`View @${member.username}'s Profile`}
                    className="block h-full w-full"
                  >
                    {/* Premium Specular Glass Polaroid Frame */}
                    <div
                      className={`group flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border p-2 transition-all duration-300 sm:p-2.5 ${
                        isHovered
                          ? "border-blue-400/50 bg-[#141824] shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.25)]"
                          : "border-white/15 bg-[#0e111a] shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/35"
                      }`}
                    >
                      {/* Photo frame */}
                      <div className="relative w-full flex-1 overflow-hidden rounded-lg bg-black/40">
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes={isMobile ? "120px" : "210px"}
                          priority={index === Math.floor(middleIndex)}
                          unoptimized={typeof member.image === "string"}
                        />
                      </div>

                      {/* Polaroid Bottom Caption (Chin) - Name & Role */}
                      <div className="px-1 pt-2 pb-0.5 text-center sm:pt-2.5 sm:pb-1">
                        <p
                          className={`truncate text-xs font-bold transition-colors duration-200 sm:text-sm ${
                            isHovered ? "text-white" : "text-white/90"
                          }`}
                        >
                          {member.name}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-cyan-300/80">
                          {member.roles[0] || `@${member.username}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* View full team button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8"
          >
            <Link href="/team" className="btn-secondary text-sm">
              View All
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
