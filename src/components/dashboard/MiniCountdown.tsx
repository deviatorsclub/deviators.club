"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";

function parts(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, over: true };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000) % 24,
    m: Math.floor(diff / 60000) % 60,
    s: Math.floor(diff / 1000) % 60,
    over: false,
  };
}

export default function MiniCountdown({
  target,
  label,
  tone = "text-amber-300",
}: {
  target: string;
  label: string;
  tone?: string;
}) {
  const [t, setT] = useState(() => parts(target));

  useEffect(() => {
    const id = setInterval(() => setT(parts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs font-medium ${tone}`}
    >
      <HugeiconsIcon icon={Clock01Icon} size={14} />
      <span>
        {label}:{" "}
        {t.over ? (
          "closed"
        ) : (
          <>
            {t.d}d {t.h}h {t.m}m {t.s}s
          </>
        )}
      </span>
    </div>
  );
}
