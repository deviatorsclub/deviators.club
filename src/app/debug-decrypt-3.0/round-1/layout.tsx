import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Round 1 · Online Shortlisting | Debug Decrypt 3.0",
  description:
    "Official online proctored shortlisting round for Debug Decrypt 3.0 by Deviators Club.",
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
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-[#030712] text-white selection:bg-cyan-500/30 selection:text-white">
      {children}
    </div>
  );
}
