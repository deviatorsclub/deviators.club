import { NextRequest, NextResponse } from "next/server";
import { verifyRound1Auth } from "@/lib/round1/auth";
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
      return NextResponse.json({
        hasSession: false,
        user,
        roundSlug: "round-1",
        durationMinutes: ROUND_1_DURATION_MINUTES,
        totalQuestions: MASTER_QUESTIONS.length,
        schedule,
      });
    }

    // Check if session has expired while in progress
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    let currentStatus = session.status;
    const strikeCount = session.strike_count || 0;

    if (currentStatus === "in_progress" && now > expiresAt) {
      currentStatus = "submitted";

      const { savedResponses } = await getQuizResponses(session.id);
      const grading = gradeSubmission(savedResponses);

      await updateQuizSession(user.id, "round-1", {
        status: "submitted",
        termination_reason: "Time limit expired",
        submitted_at: now.toISOString(),
        score: grading.score,
        max_score: grading.maxScore,
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
          // CRITICAL: Scores are hidden from regular candidates - only Presidents see preview scores
          score: user.isPresident ? session.score : undefined,
          max_score: user.isPresident ? session.max_score : undefined,
          strike_count: strikeCount,
        },
      });
    }

    // Active in-progress test
    const { savedResponses, flaggedQuestions } = await getQuizResponses(
      session.id,
    );

    const shuffledOrder: string[] = Array.isArray(session.shuffled_order)
      ? session.shuffled_order
      : MASTER_QUESTIONS.map((q) => q.id);

    const questionMap = new Map(
      MASTER_QUESTIONS.map((q) => [q.id, sanitizeQuestion(q)]),
    );
    const orderedQuestions = shuffledOrder
      .map((id) => questionMap.get(id))
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
