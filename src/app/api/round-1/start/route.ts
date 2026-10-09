import { NextRequest, NextResponse } from "next/server";
import { verifyPresidentAuth } from "@/lib/round1/auth";
import {
  getQuizSession,
  createQuizSession,
  QuizSessionData,
} from "@/lib/round1/sessionStore";
import {
  MASTER_QUESTIONS,
  sanitizeQuestion,
  shuffleArray,
  ROUND_1_DURATION_MINUTES,
} from "@/data/round1Questions";

export async function POST(req: NextRequest) {
  const { user, errorStatus, errorMessage } = await verifyPresidentAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus || 401 },
    );
  }

  try {
    // 1. Check existing session
    const existingSession = await getQuizSession(user.id, "round-1");

    if (existingSession) {
      if (existingSession.status !== "in_progress") {
        return NextResponse.json(
          {
            error: "Test has already been completed or terminated.",
            status: existingSession.status,
          },
          { status: 400 },
        );
      }
      // If already in progress, resume session
      const questionMap = new Map(
        MASTER_QUESTIONS.map((q) => [q.id, sanitizeQuestion(q)]),
      );
      const orderedQuestions = (existingSession.shuffled_order || [])
        .map((id) => questionMap.get(id))
        .filter(Boolean);

      const now = new Date();
      const expiresAt = new Date(existingSession.expires_at);
      const remainingSeconds = Math.max(
        0,
        Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      );

      return NextResponse.json({
        message: "Active session resumed.",
        session: existingSession,
        questions: orderedQuestions.length
          ? orderedQuestions
          : MASTER_QUESTIONS.map(sanitizeQuestion),
        remainingSeconds,
      });
    }

    // 2. Generate randomized shuffled question order
    const shuffledQuestions = shuffleArray(MASTER_QUESTIONS);
    const shuffledOrder = shuffledQuestions.map((q) => q.id);

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + ROUND_1_DURATION_MINUTES * 60 * 1000,
    );
    const sessionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess_${Date.now()}`;

    const newSessionData: QuizSessionData = {
      id: sessionId,
      user_id: user.id,
      round_slug: "round-1",
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      submitted_at: null,
      status: "in_progress",
      termination_reason: null,
      strike_count: 0,
      shuffled_order: shuffledOrder,
      score: 0,
      max_score: 0,
      created_at: startedAt.toISOString(),
    };

    const savedSession = await createQuizSession(newSessionData);

    const sanitizedQuestions = shuffledQuestions.map((q) =>
      sanitizeQuestion(q),
    );

    return NextResponse.json({
      success: true,
      session: {
        id: savedSession.id,
        started_at: savedSession.started_at,
        expires_at: savedSession.expires_at,
        status: savedSession.status,
        strike_count: 0,
      },
      remainingSeconds: ROUND_1_DURATION_MINUTES * 60,
      questions: sanitizedQuestions,
    });
  } catch (err: any) {
    console.error("[POST /api/round-1/start error]", err);
    return NextResponse.json(
      {
        error: `Server error starting test: ${err?.message || "Internal error"}`,
      },
      { status: 500 },
    );
  }
}
