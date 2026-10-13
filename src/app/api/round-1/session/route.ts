import { NextRequest, NextResponse } from "next/server";
import { verifyRound1Auth } from "@/lib/round1/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  getQuizSession,
  updateQuizSession,
  getQuizResponses,
} from "@/lib/round1/sessionStore";
import {
  MASTER_QUESTIONS,
  sanitizeQuestion,
  gradeSubmission,
  ROUND_1_DURATION_MINUTES,
  ROUND_1_HARD_DEADLINE,
  isRound1Active,
} from "@/data/round1Questions";

export async function GET(req: NextRequest) {
  const { user, errorStatus, errorMessage } = await verifyRound1Auth(req);
  if (!user) {
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus || 401 },
    );
  }

  try {
    const session = await getQuizSession(user.id, "round-1");
    const schedule = isRound1Active(user.isPresident);

    // If no session started yet
    if (!session) {
      if (!user.isPresident && user.teamId) {
        const adminDb = getAdminClient();
        const { data: teamMembers } = await adminDb
          .from("team_members")
          .select("profile_id")
          .eq("team_id", user.teamId);

        const memberIds = (teamMembers || []).map((m: any) => m.profile_id);
        const { data: teamSessions } = await adminDb
          .from("quiz_sessions")
          .select("*")
          .in("user_id", memberIds)
          .eq("round_slug", "round-1");

        const otherSession = (teamSessions || []).find(
          (s: any) => s.user_id !== user.id,
        );

        if (otherSession) {
          if (otherSession.status === "in_progress") {
            return NextResponse.json({
              hasSession: false,
              user,
              roundSlug: "round-1",
              durationMinutes: ROUND_1_DURATION_MINUTES,
              totalQuestions: MASTER_QUESTIONS.length,
              schedule,
              teamSessionActive: true,
              teamSessionMessage:
                "Another member of your squad already has an active Round 1 test in progress. At one time, only one team leader can take the test.",
            });
          } else {
            // Team already submitted
            return NextResponse.json({
              hasSession: true,
              user,
              session: {
                id: otherSession.id,
                status: otherSession.status,
                termination_reason: otherSession.termination_reason,
                started_at: otherSession.started_at,
                submitted_at:
                  otherSession.submitted_at || otherSession.expires_at,
                strike_count: otherSession.strike_count || 0,
              },
              teamSessionMessage:
                "Your team has already attempted and completed Round 1.",
            });
          }
        }
      }

      return NextResponse.json({
        hasSession: false,
        user,
        roundSlug: "round-1",
        durationMinutes: ROUND_1_DURATION_MINUTES,
        totalQuestions: MASTER_QUESTIONS.length,
        schedule,
      });
    }

    // Check if session has expired while in progress or 7:40 PM hard cutoff reached
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const hardCutoff = new Date(ROUND_1_HARD_DEADLINE);
    let currentStatus = session.status;
    const strikeCount = session.strike_count || 0;

    const isHardCutoffReached = !user.isPresident && now > hardCutoff;
    const isSessionExpired = now > expiresAt;

    if (
      currentStatus === "in_progress" &&
      (isSessionExpired || isHardCutoffReached)
    ) {
      currentStatus = "submitted";

      const { savedResponses, questionTimes } = await getQuizResponses(
        session.id,
      );
      const grading = gradeSubmission(savedResponses);
      const totalTimeSeconds = Math.round(
        (now.getTime() - new Date(session.started_at).getTime()) / 1000,
      );

      await updateQuizSession(user.id, "round-1", {
        status: "submitted",
        termination_reason: isHardCutoffReached
          ? "Contest window concluded at 7:40 PM IST cutoff"
          : "Time limit expired",
        submitted_at: now.toISOString(),
        score: grading.score,
        max_score: grading.maxScore,
        total_time_seconds: totalTimeSeconds,
        question_times: questionTimes,
      });
    }

    // If test is completed (submitted or terminated)
    if (currentStatus !== "in_progress") {
      return NextResponse.json({
        hasSession: true,
        user,
        session: {
          id: session.id,
          status: currentStatus,
          termination_reason: session.termination_reason,
          started_at: session.started_at,
          submitted_at: session.submitted_at || session.expires_at,
          // CRITICAL: Scores are hidden from regular candidates - only Presidents and Faculty see preview scores
          score: user.isPresident ? session.score : undefined,
          max_score: user.isPresident ? session.max_score : undefined,
          strike_count: strikeCount,
        },
      });
    }

    // Active in-progress test
    const { savedResponses, questionTimes, flaggedQuestions } =
      await getQuizResponses(session.id);

    const shuffledOrder: string[] = Array.isArray(session.shuffled_order)
      ? session.shuffled_order
      : MASTER_QUESTIONS.map((q) => q.id);

    const questionMap = new Map(MASTER_QUESTIONS.map((q) => [q.id, q]));
    const orderedQuestions = shuffledOrder
      .map((id) => {
        const masterQ = questionMap.get(id);
        if (!masterQ) return null;
        const optOrder = session.shuffled_options?.[id];
        let opts = masterQ.options;
        if (optOrder && optOrder.length > 0) {
          const optMap = new Map(masterQ.options.map((o) => [o.id, o]));
          opts = optOrder
            .map((optId) => optMap.get(optId))
            .filter(Boolean) as any;
        }
        return {
          ...sanitizeQuestion(masterQ),
          options: opts,
        };
      })
      .filter(Boolean);

    if (orderedQuestions.length === 0) {
      MASTER_QUESTIONS.forEach((q) =>
        orderedQuestions.push(sanitizeQuestion(q)),
      );
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
    );

    return NextResponse.json({
      hasSession: true,
      user,
      session: {
        id: session.id,
        status: "in_progress",
        started_at: session.started_at,
        expires_at: session.expires_at,
        strike_count: strikeCount,
      },
      remainingSeconds,
      questions: orderedQuestions,
      savedResponses,
      flaggedQuestions,
    });
  } catch (err: any) {
    console.error("[GET /api/round-1/session error]", err);
    return NextResponse.json(
      { error: "Failed to load session details." },
      { status: 500 },
    );
  }
}
