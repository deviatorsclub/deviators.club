"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  CrownIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Time02Icon,
  Mail01Icon,
  CallIcon,
  IdIcon,
  MortarboardIcon,
  ArrowRight01Icon,
  RefreshIcon,
  Alert01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";

type ReceivedInvite = {
  teamId: string;
  teamName: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  leaderId: string;
  leaderUsername: string;
  leaderDisplayName: string;
  leaderAvatarUrl: string;
  invitedAt: string;
  phone: string;
  collegeId: string;
  branch: string;
  section: string;
  year: string;
};

type SentTeam = {
  teamId: string;
  teamName: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  createdAt: string;
  pendingCount: number;
  acceptedCount: number;
  members: {
    profileId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    status: "pending" | "accepted";
    isLeader: boolean;
    phone: string;
    collegeId: string;
    branch: string;
    section: string;
    year: string;
    createdAt: string;
  }[];
};

export default function TeamInvitesView({
  onInviteHandled,
}: {
  onInviteHandled?: () => void;
}) {
  const [received, setReceived] = useState<ReceivedInvite[]>([]);
  const [sent, setSent] = useState<SentTeam[]>([]);
  const [acceptedTeams, setAcceptedTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchInvites = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/user/invitations", { headers });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load invitations.");
        return;
      }
      setReceived(data.received || []);
      setSent(data.sent || []);
      setAcceptedTeams(data.acceptedTeams || []);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  // Handle Accept or Reject
  const handleInviteAction = async (
    invite: ReceivedInvite,
    action: "accept" | "decline",
  ) => {
    setActionLoading(invite.teamId);
    setFeedback(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/events/${invite.eventSlug}/team/invite`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          teamId: invite.teamId,
          action,
          phone: invite.phone,
          collegeId: invite.collegeId,
          branch: invite.branch,
          section: invite.section,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || `Failed to ${action} invitation.`,
        });
        setActionLoading(null);
        return;
      }

      setFeedback({
        type: "success",
        message:
          action === "accept"
            ? `You have joined "${invite.teamName}"! You are now part of the squad.`
            : `Declined invite from "${invite.teamName}". You are free to register a new team or join another squad.`,
      });

      await fetchInvites();
      onInviteHandled?.();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Action failed.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="mt-3 font-mono text-xs text-white/50">
          Loading requests...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 text-xs ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          <HugeiconsIcon
            icon={
              feedback.type === "success" ? CheckmarkCircle01Icon : Alert01Icon
            }
            size={16}
            className={`shrink-0 ${
              feedback.type === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          />
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Accepted Team Status Banner (If already in team) */}
      {acceptedTeams.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#0a1220] to-black/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Active Team Member · {acceptedTeams[0].teamName}
                </p>
                <p className="text-[11px] text-white/60">
                  {acceptedTeams[0].eventTitle} · You are already locked into
                  this squad.
                </p>
              </div>
            </div>

            <Link
              href={`/events/${acceptedTeams[0].eventSlug}/team/@${encodeURIComponent(acceptedTeams[0].teamName)}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-3 py-1.5 font-mono text-xs font-bold text-emerald-200 hover:bg-emerald-500/30"
            >
              <span>View Team Details</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* SECTION 1: REQUESTS RECEIVED (INBOX) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-xs font-bold text-cyan-300">
              {received.length}
            </span>
            <h2 className="font-heading text-base font-bold text-white sm:text-lg">
              Requests Received
            </h2>
          </div>
          <span className="font-mono text-[11px] text-white/40">
            Accept to join squad or reject to stay free
          </span>
        </div>

        {received.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/10 p-6 text-center">
            <HugeiconsIcon
              icon={UserGroupIcon}
              size={24}
              className="mx-auto text-white/30"
            />
            <p className="mt-2 text-xs font-semibold text-white/60">
              No pending team invitations received.
            </p>
            <p className="mt-0.5 text-[11px] text-white/40">
              When a squad leader sends you an invite, it will pop up here with
              all your pre-filled details.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {received.map((inv) => (
              <div
                key={inv.teamId}
                className="glass-card flex flex-col justify-between rounded-2xl border border-cyan-500/30 bg-[#0a0f1d] p-5 shadow-xl transition-all hover:border-cyan-400/50"
              >
                <div>
                  {/* Event & Team Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase">
                        {inv.eventTitle}
                      </span>
                      <h3 className="font-heading text-lg font-black text-white">
                        {inv.teamName}
                      </h3>
                    </div>
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                      Request Sent
                    </span>
                  </div>

                  {/* Leader Info */}
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-white/5 bg-black/40 p-2.5">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                      {inv.leaderAvatarUrl ? (
                        <Image
                          src={inv.leaderAvatarUrl}
                          alt={inv.leaderDisplayName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/50">
                          {inv.leaderDisplayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        Leader: {inv.leaderDisplayName}
                      </p>
                      <p className="truncate font-mono text-[10px] text-white/40">
                        @{inv.leaderUsername}
                      </p>
                    </div>
                  </div>

                  {/* Pre-filled Details by Leader */}
                  <div className="mt-3 space-y-1 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 font-mono text-[11px] text-white/70">
                    <p className="text-[10px] font-bold text-white/40 uppercase">
                      Your Details Provided:
                    </p>
                    {inv.phone && <p>Phone: {inv.phone}</p>}
                    {inv.collegeId && <p>Roll No: {inv.collegeId}</p>}
                    {(inv.branch || inv.section) && (
                      <p>
                        {inv.branch} {inv.section && `· Sec ${inv.section}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Accept or Reject */}
                <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-2">
                  <button
                    onClick={() => handleInviteAction(inv, "accept")}
                    disabled={actionLoading === inv.teamId}
                    className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading === inv.teamId
                      ? "Joining..."
                      : "Accept Request"}
                  </button>

                  <button
                    onClick={() => handleInviteAction(inv, "decline")}
                    disabled={actionLoading === inv.teamId}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 active:scale-95 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: REQUESTS SENT (OUTBOX) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 font-mono text-xs font-bold text-amber-300">
              {sent.length}
            </span>
            <h2 className="font-heading text-base font-bold text-white sm:text-lg">
              Requests Sent (Teams You Lead)
            </h2>
          </div>
          <span className="font-mono text-[11px] text-white/40">
            Track invited squad teammates
          </span>
        </div>

        {sent.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/10 p-6 text-center">
            <HugeiconsIcon
              icon={CrownIcon}
              size={24}
              className="mx-auto text-white/30"
            />
            <p className="mt-2 text-xs font-semibold text-white/60">
              You haven&apos;t created a squad or sent any requests yet.
            </p>
            <p className="mt-0.5 text-[11px] text-white/40">
              When you register a team, all invited teammates and their status
              will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sent.map((st) => (
              <div
                key={st.teamId}
                className="glass-card rounded-2xl border border-white/10 bg-[#0a0e19] p-5 shadow-xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase">
                      {st.eventTitle}
                    </span>
                    <h3 className="font-heading text-lg font-black text-white">
                      {st.teamName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                      {st.acceptedCount} Accepted
                    </span>
                    {st.pendingCount > 0 && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                        {st.pendingCount} Request Sent (Pending)
                      </span>
                    )}

                    <Link
                      href={`/events/${st.eventSlug}/team/@${encodeURIComponent(st.teamName)}`}
                      className="ml-2 inline-flex items-center gap-1 rounded-xl border border-blue-400/30 bg-blue-500/20 px-3 py-1 font-mono text-xs font-bold text-blue-200 hover:bg-blue-500/30"
                    >
                      <span>Manage Squad</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                    </Link>
                  </div>
                </div>

                {/* Squad Members Roster */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {st.members.map((m) => {
                    const isPending = m.status === "pending";
                    return (
                      <div
                        key={m.profileId}
                        className={`rounded-xl border p-3 ${
                          m.isLeader
                            ? "border-amber-400/30 bg-amber-500/[0.04]"
                            : isPending
                              ? "border-amber-500/20 bg-amber-500/[0.02]"
                              : "border-emerald-500/20 bg-emerald-500/[0.02]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                              {m.avatarUrl ? (
                                <Image
                                  src={m.avatarUrl}
                                  alt={m.displayName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/50">
                                  {m.displayName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-white">
                                {m.displayName}
                              </p>
                              <p className="truncate font-mono text-[10px] text-white/40">
                                @{m.username}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-extrabold uppercase ${
                              m.isLeader
                                ? "border border-amber-400/40 bg-amber-400/20 text-amber-200"
                                : isPending
                                  ? "border border-amber-400/30 bg-amber-500/10 text-amber-300"
                                  : "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                            }`}
                          >
                            {m.isLeader
                              ? "Leader"
                              : isPending
                                ? "Request Sent"
                                : "Accepted"}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="mt-2.5 space-y-0.5 border-t border-white/[0.06] pt-2 font-mono text-[10px] text-white/60">
                          {m.phone && <p>Phone: {m.phone}</p>}
                          {m.collegeId && <p>Roll No: {m.collegeId}</p>}
                          {(m.branch || m.section) && (
                            <p>
                              {m.branch} {m.section && `· Sec ${m.section}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
