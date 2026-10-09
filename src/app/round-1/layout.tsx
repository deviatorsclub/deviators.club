import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Round 1 · Shortlisting Test | Deviators Club",
  description:
    "Official online shortlisting round with strict proctoring for Deviators Club.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Round1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-[#05070f] text-slate-100 selection:bg-purple-500/30 selection:text-white">
      {children}
    </div>
  );
}
