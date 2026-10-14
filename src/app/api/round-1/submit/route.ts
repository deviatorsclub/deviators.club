import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Round 1 has concluded. The assessment was hosted on Wayground on October 13, 2026.",
      concluded: true,
    },
    { status: 410 },
  );
}
