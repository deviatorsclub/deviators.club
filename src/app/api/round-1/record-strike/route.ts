import { NextRequest, NextResponse } from "next/server";
import { verifyPresidentAuth } from "@/lib/round1/auth";
import {
  getQuizSession,
  updateQuizSession,
  getQuizResponses,
} from "@/lib/round1/sessionStore";
import { gradeSubmission, MAX_STRIKES_ALLOWED } from "@/data/round1Questions";

export async function POST(req: NextRequest) {
  const { user, errorStatus, errorMessage } = await verifyPresidentAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus || 401 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const reason =
      body.reason ||
      "Proctoring violation detected (focus loss / fullscreen exit)";

    // 1. Fetch current session
    const session = await getQuizSession(user.id, "round-1");

    if (!session || session.status !== "in_progress") {
      return NextResponse.json(
        { error: "No active session in progress." },
        { status: 400 },
      );
    }

    const newStrikeCount = (session.strike_count || 0) + 1;
    const isTerminated = newStrikeCount >= MAX_STRIKES_ALLOWED;

    if (isTerminated) {
      const { savedResponses } = await getQuizResponses(session.id);
      const grading = gradeSubmission(savedResponses);

      await updateQuizSession(user.id, "round-1", {
        status: "terminated",
        strike_count: newStrikeCount,
        termination_reason: reason,
        submitted_at: new Date().toISOString(),
        score: grading.score,
        max_score: grading.maxScore,
      });

      return NextResponse.json({
        success: true,
        isTerminated: true,
        strike_count: newStrikeCount,
        reason,
        score: grading.score,
        max_score: grading.maxScore,
      });
    }

    // Strike 1: Update strike count and allow candidate 5s grace window
    await updateQuizSession(user.id, "round-1", {
      strike_count: newStrikeCount,
    });

    return NextResponse.json({
      success: true,
      isTerminated: false,
      strike_count: newStrikeCount,
      warning:
        "Strike 1 logged: return to full screen and focus within 5 seconds.",
    });
  } catch (err: any) {
    console.error("[POST /api/round-1/record-strike error]", err);
    return NextResponse.json(
      { error: "Failed to record proctor strike." },
      { status: 500 },
    );
  }
}
