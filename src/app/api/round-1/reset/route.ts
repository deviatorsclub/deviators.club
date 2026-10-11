import { NextRequest, NextResponse } from "next/server";
import { verifyPresidentAuth } from "@/lib/round1/auth";
import { deleteQuizSession } from "@/lib/round1/sessionStore";

export async function POST(req: NextRequest) {
  const { user, errorStatus, errorMessage } = await verifyPresidentAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus || 401 },
    );
  }

  if (!user.isPresident) {
    return NextResponse.json(
      { error: "Forbidden: Only Club Presidents can reset test sessions." },
      { status: 403 },
    );
  }

  try {
    await deleteQuizSession(user.id, "round-1");
    return NextResponse.json({
      success: true,
      message: "President test session reset successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to reset session." },
      { status: 500 },
    );
  }
}
