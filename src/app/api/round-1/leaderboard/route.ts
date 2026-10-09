import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getAllQuizSessions } from "@/lib/round1/sessionStore";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const adminDb = getAdminClient();

    // 1. Check if caller is President
    let isPresident = false;
    let currentUser: any = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data } = await adminDb.auth.getUser(token);
      if (data?.user) currentUser = data.user;
    }

    if (!currentUser) {
      try {
        const serverSupabase = await createServerClient();
        const { data } = await serverSupabase.auth.getUser();
        currentUser = data?.user || null;
      } catch {}
    }

    if (currentUser) {
      const { data: userProfile } = await adminDb
        .from("profiles")
        .select("username")
        .eq("id", currentUser.id)
        .maybeSingle();

      const { data: userRoles } = await adminDb
        .from("profile_roles")
        .select("tag")
        .eq("profile_id", currentUser.id);

      const hasPresidentRole = (userRoles || []).some(
        (r: any) => r.tag === "president" || r.tag === "club-official",
      );

      const usernameLower = (userProfile?.username || "").toLowerCase();
      const emailLower = (currentUser.email || "").toLowerCase();
      isPresident =
        hasPresidentRole ||
        usernameLower === "akshitbhandaricodes" ||
        usernameLower === "aarushi" ||
        usernameLower === "deviatorsclub" ||
        emailLower.includes("akshitbhandaricodes") ||
        emailLower.includes("arushik");
    }

    // 2. Fetch all Round 1 sessions
    const sessions = await getAllQuizSessions("round-1");

    // 3. Fetch user profiles and teams for these session owners
    const userIds = Array.from(new Set(sessions.map((s) => s.user_id)));

    const { data: profiles } = await adminDb
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Fetch team names for these leaders
    const { data: teams } = await adminDb
      .from("teams")
      .select("id, name, leader_id")
      .in("leader_id", userIds);

    const teamMap = new Map((teams || []).map((t) => [t.leader_id, t]));

    // 4. Sort standings
    // If president, sort by score descending, then submitted_at ascending.
    // If not president, sort by submission time ascending.
    const sortedSessions = [...sessions].sort((a, b) => {
      if (isPresident) {
        if (b.score !== a.score) return b.score - a.score;
      }
      const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return timeB - timeA;
    });

    const leaderboard = sortedSessions.map((s, index) => {
      const prof = profileMap.get(s.user_id);
      const team = teamMap.get(s.user_id);

      return {
        rank: index + 1,
        profileId: s.user_id,
        name: prof?.display_name || prof?.username || "Candidate",
        username: prof?.username || "deviator",
        avatarUrl: prof?.avatar_url || "",
        teamName: team?.name || "Independent Leader",
        role: "Team Leader",
        status: s.status, // "submitted" | "terminated" | "in_progress"
        submittedAt: s.submitted_at,
        // CRITICAL RULE: Scores are only exposed to Presidents!
        score: isPresident ? s.score : null,
        maxScore: isPresident ? s.max_score : null,
        strikes: isPresident ? s.strike_count : null,
      };
    });

    return NextResponse.json({
      round: "round-1",
      totalSubmissions: leaderboard.length,
      isPresident,
      leaderboard,
    });
  } catch (err: any) {
    console.error("[GET /api/round-1/leaderboard]", err);
    return NextResponse.json(
      { error: "Failed to load leaderboard." },
      { status: 500 },
    );
  }
}
