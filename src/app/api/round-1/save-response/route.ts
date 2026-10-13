import { NextRequest, NextResponse } from "next/server";
import { verifyPresidentAuth } from "@/lib/round1/auth";
import { getQuizSession, saveQuizResponse } from "@/lib/round1/sessionStore";
import { ROUND_1_HARD_DEADLINE } from "@/data/round1Questions";

export async function POST(req: NextRequest) {
  const { user, errorStatus, errorMessage } = await verifyPresidentAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus || 401 },
    );
  }

  try {
    const body = await req.json();
    const { question_id, selected_answers, is_flagged, time_spent_seconds } =
      body;

    if (!question_id) {
      return NextResponse.json(
        { error: "question_id is required." },
        { status: 400 },
      );
    }

    // 1. Verify user's active session
    const session = await getQuizSession(user.id, "round-1");

    if (!session || session.status !== "in_progress") {
      return NextResponse.json(
        { error: "No active session or test has already ended." },
        { status: 403 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const hardCutoff = new Date(ROUND_1_HARD_DEADLINE);

    if (!user.isPresident && now > hardCutoff) {
      return NextResponse.json(
        {
          error:
            "Contest window concluded at 7:40 PM IST. Assessment is auto-submitted.",
        },
        { status: 403 },
      );
    }

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "Session time limit has expired." },
        { status: 403 },
      );
    }

    // 2. Save response with time record
    await saveQuizResponse(
      session.id,
      user.id,
      question_id,
      selected_answers,
      Boolean(is_flagged),
      Number(time_spent_seconds) || 0,
    );

    return NextResponse.json({ success: true, savedAt: now.toISOString() });
  } catch (err: any) {
    console.error("[POST /api/round-1/save-response error]", err);
    return NextResponse.json(
      { error: "Error saving response." },
      { status: 500 },
    );
  }
}
