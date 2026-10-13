import { NextRequest, NextResponse } from "next/server";
import { verifyPresidentAuth } from "@/lib/round1/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  getQuizSession,
  createQuizSession,
  deleteQuizSession,
  QuizSessionData,
} from "@/lib/round1/sessionStore";
import {
  MASTER_QUESTIONS,
  sanitizeQuestion,
  shuffleArray,
  ROUND_1_DURATION_MINUTES,
  isRound1Active,
} from "@/data/round1Questions";

export async function POST(req: NextRequest) {
  const { user, errorStatus, errorMessage } = await verifyPresidentAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus || 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const resetRequested = Boolean(body?.reset);

  // Enforce Contest Schedule: 13th Oct 2026, 7:00 PM to 7:45 PM IST (Presidents can bypass anytime for testing/demo)
  const schedule = isRound1Active(user.isPresident);
  if (!schedule.active) {
    if (!schedule.hasStarted) {
      return NextResponse.json(
        {
          error:
            "Round 1 goes live on October 13, 2026 between 7:00 PM – 7:45 PM IST. Please return then to attempt your test.",
          schedule,
        },
        { status: 403 },
      );
    }
    if (schedule.hasEnded) {
      return NextResponse.json(
        {
          error:
            "Round 1 concluded at 7:45 PM IST on October 13, 2026. The testing window is closed.",
          schedule,
        },
        { status: 403 },
      );
    }
  }

  try {
    // 1. Team-level concurrency check: Only ONE person per team can take Round 1!
    if (!user.isPresident && user.teamId) {
      const adminDb = getAdminClient();
      const { data: teamMembers } = await adminDb
        .from("team_members")
        .select("profile_id")
        .eq("team_id", user.teamId);

      const memberIds = (teamMembers || []).map((m: any) => m.profile_id);
      if (!memberIds.includes(user.id)) memberIds.push(user.id);

      const { data: teamSessions } = await adminDb
        .from("quiz_sessions")
        .select("id, user_id, status")
        .in("user_id", memberIds)
        .eq("round_slug", "round-1");

      if (teamSessions && teamSessions.length > 0) {
        const otherMemberSession = teamSessions.find(
          (s: any) => s.user_id !== user.id,
        );
        if (otherMemberSession) {
          if (otherMemberSession.status === "in_progress") {
            return NextResponse.json(
              {
                error:
                  "Another member of your squad already has an active Round 1 test in progress. At one time, only one team leader can take the test.",
              },
              { status: 400 },
            );
          } else {
            return NextResponse.json(
              {
                error:
                  "Your team has already attempted and completed Round 1. Only one test attempt is permitted per team.",
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // 2. Check existing session for current user
    const existingSession = await getQuizSession(user.id, "round-1");

    if (existingSession) {
      if (
        user.isPresident &&
        (resetRequested || existingSession.status !== "in_progress")
      ) {
        // President can reset or start fresh anytime for testing & demo purposes
        await deleteQuizSession(user.id, "round-1");
      } else if (existingSession.status !== "in_progress") {
        return NextResponse.json(
          {
            error: "Test has already been completed or terminated.",
            status: existingSession.status,
          },
          { status: 400 },
        );
      } else {
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
