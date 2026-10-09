import { NextRequest, NextResponse } from "next/server";
import { verifyRound1Auth } from "@/lib/round1/auth";
import {
  getQuizSession,
  updateQuizSession,
  getQuizResponses,
} from "@/lib/round1/sessionStore";
import { gradeSubmission } from "@/data/round1Questions";

export async function POST(req: NextRequest) {
  const { user, errorStatus, errorMessage } = await verifyRound1Auth(req);
  if (!user) {
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus || 401 },
    );
  }

  try {
    const session = await getQuizSession(user.id, "round-1");

    if (!session) {
      return NextResponse.json(
        { error: "No test session found to submit." },
        { status: 400 },
      );
    }

    if (session.status !== "in_progress") {
      return NextResponse.json({
        message: "Test is already finalized.",
        status: session.status,
      });
    }

    // 2. Fetch responses to grade on the server
    const { savedResponses } = await getQuizResponses(session.id);
    const grading = gradeSubmission(savedResponses);
    const submittedAt = new Date().toISOString();

    await updateQuizSession(user.id, "round-1", {
      status: "submitted",
      termination_reason: "Manual submission by candidate",
      submitted_at: submittedAt,
      score: grading.score,
      max_score: grading.maxScore,
    });

    return NextResponse.json({
      success: true,
      status: "submitted",
      submitted_at: submittedAt,
      // CRITICAL: Score is hidden from candidates
      score: user.isPresident ? grading.score : undefined,
      max_score: user.isPresident ? grading.maxScore : undefined,
      totalAnswered: Object.keys(savedResponses).length,
    });
  } catch (err: any) {
    console.error("[POST /api/round-1/submit error]", err);
    return NextResponse.json(
      { error: "Server error processing submission." },
      { status: 500 },
    );
  }
}
