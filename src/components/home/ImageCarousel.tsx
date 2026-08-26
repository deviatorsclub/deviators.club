"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import type { PanInfo } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

interface CarouselProps {
  images: StaticImageData[];
}

const variants = {
  enter: () => ({
    opacity: 0,
    scale: 1.05,
  }),
  center: {
    zIndex: 1,
    opacity: 1,
    scale: 1,
  },
  exit: () => ({
    zIndex: 0,
    opacity: 0,
    scale: 0.98,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

function CustomCursor({ isLeft }: { isLeft: boolean }) {
  return (
    <div className="glass-card-active pointer-events-none flex h-14 w-14 items-center justify-center rounded-full">
      <HugeiconsIcon
        icon={isLeft ? ArrowLeft01Icon : ArrowRight01Icon}
        size={24}
        className="text-white/70"
      />
    </div>
  );
}

function TouchableControls({
  paginate,
  images,
  setPage,
  slideIndex,
  resetTimeout,
}: {
  paginate: (newDirection: number) => void;
  images: StaticImageData[];
  setPage: React.Dispatch<React.SetStateAction<[number, number]>>;
  slideIndex: number;
  resetTimeout: () => void;
}) {
  return (
    <div className="relative z-10 mx-auto mt-4 flex w-full max-w-sm items-center justify-between gap-4 px-4 sm:hidden">
      <button
        onClick={() => {
          paginate(-1);
          resetTimeout();
        }}
        aria-label="Previous slide"
        className="glass-card flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:text-white"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
      </button>

      <div className="flex items-center gap-1.5 overflow-x-auto py-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setPage([index, index > slideIndex ? 1 : -1]);
              resetTimeout();
            }}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === slideIndex ? "bg-brand w-6" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => {
          paginate(1);
          resetTimeout();
        }}
        aria-label="Next slide"
        className="glass-card flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:text-white"
      >
        <HugeiconsIcon icon={ArrowRight02Icon} size={20} />
      </button>
    </div>
  );
}

function subscribeIsTouch(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getIsTouchSnapshot() {
  return (
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
}

function getIsTouchServerSnapshot() {
  return false;
}

export default function ImageCarousel({ images }: CarouselProps) {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isLeft, setIsLeft] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const isTouchDevice = useSyncExternalStore(
    subscribeIsTouch,
    getIsTouchSnapshot,
    getIsTouchServerSnapshot,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const imageCount = images.length;
  const slideIndex = ((page % imageCount) + imageCount) % imageCount;

  const paginate = useCallback((newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  }, []);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      paginate(1);
    }, 5000);
  }, [paginate]);

  useEffect(() => {
    resetTimeout();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [page, resetTimeout]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setCursorPos({ x, y });
    setIsLeft(x < rect.width / 2);
  };

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    { offset, velocity }: PanInfo,
  ) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
  };

  return (
    <section className="relative w-full py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-3xl text-white sm:text-4xl lg:text-5xl">
            Club Highlights
          </h2>
          <p className="mt-3 text-sm text-white/40 sm:text-base lg:text-lg">
            Memories and milestones from our community events
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative mx-auto aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            if (!isTouchDevice) {
              paginate(isLeft ? -1 : 1);
              resetTimeout();
            }
          }}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                opacity: { duration: 0.4 },
                scale: { duration: 0.6, ease: "easeOut" },
              }}
              drag={isTouchDevice ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 cursor-pointer"
            >
              <Image
                src={images[slideIndex]}
                alt={`Deviators Club Highlight ${slideIndex + 1}`}
                fill
                priority={slideIndex === 0}
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </motion.div>
          </AnimatePresence>

          {/* Desktop Custom Follow Cursor */}
          {!isTouchDevice && isHovered && (
            <motion.div
              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
              animate={{
                left: cursorPos.x,
                top: cursorPos.y,
              }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 400,
                mass: 0.1,
              }}
            >
              <CustomCursor isLeft={isLeft} />
            </motion.div>
          )}
        </div>

        {/* Mobile controls */}
        {isTouchDevice && (
          <TouchableControls
            paginate={paginate}
            images={images}
            setPage={setPage}
            slideIndex={slideIndex}
            resetTimeout={resetTimeout}
          />
        )}

        <div className="mt-8 text-center">
          <Link href="/gallery" className="btn-secondary text-sm">
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}
