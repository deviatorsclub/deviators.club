"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Megaphone01Icon, SparklesIcon } from "@hugeicons/core-free-icons";

export default function CommunityFeed() {
  return (
    <section className="glass-card relative overflow-hidden rounded-3xl p-5 opacity-90 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-extrabold tracking-tight text-white">
          Community
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
          <HugeiconsIcon icon={SparklesIcon} size={13} />
          Later version
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-white/10 p-4 text-[13px] text-white/40">
        <HugeiconsIcon icon={Megaphone01Icon} size={16} />
        Shoutouts, wins and announcements will live here.
      </div>
    </section>
  );
}
