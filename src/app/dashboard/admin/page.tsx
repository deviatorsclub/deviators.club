import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import PresidentTeamsView from "@/components/dashboard/PresidentTeamsView";

export const metadata = {
  title: "President Portal · Registered Teams | Deviators Club",
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100">
      <main className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="glass-card rounded-3xl border border-white/10 bg-[#070b14]/90 p-5 sm:p-8">
          <PresidentTeamsView />
        </div>
      </main>
    </div>
  );
}
