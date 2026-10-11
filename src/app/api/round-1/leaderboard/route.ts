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

      const hasPresidentRole = (userRoles || []).some((r: any) => {
        const tag = (r.tag || "").toLowerCase().trim();
        return tag === "president" || tag === "club-president";
      });

      const usernameLower = (userProfile?.username || "").toLowerCase().trim();
      const emailLower = (currentUser.email || "").toLowerCase().trim();
      isPresident =
        hasPresidentRole ||
        usernameLower === "akshitbhandaricodes" ||
        usernameLower === "akshit" ||
        usernameLower === "aarushi" ||
        emailLower === "akshitbhandaricodes@gmail.com" ||
        emailLower.includes("akshitbhandaricodes") ||
        emailLower.includes("arushik");
    }

    // STRICT: Only Club Presidents can view the leaderboard!
    if (!isPresident) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Round 1 leaderboard and standings are restricted exclusively to Club Presidents.",
          isPresident: false,
          leaderboard: [],
        },
        { status: 403 },
      );
    }

    // 2. Fetch all Round 1 sessions
    const sessions = await getAllQuizSessions("round-1");

    // 3. Fetch user profiles and teams for these session owners
    const userIds = Array.from(new Set(sessions.map((s) => s.user_id)));

    const { data: profiles } = await adminDb
      .from("profiles")
      .select("id, username, display_name, avatar_url, branch, year")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Fetch team names for these leaders
    const { data: teams } = await adminDb
      .from("teams")
      .select("id, name, leader_id")
      .in("leader_id", userIds);

    const teamMap = new Map((teams || []).map((t) => [t.leader_id, t]));

    // Fetch event registrations to get accurate branch / year fallback
    const { data: event } = await adminDb
      .from("events")
      .select("id")
      .or("slug.eq.debug-decrypt-3.0,slug.eq.craftcon-2k26")
      .maybeSingle();

    let regMap = new Map<string, any>();
    if (event?.id && userIds.length > 0) {
      const { data: registrations } = await adminDb
        .from("registrations")
        .select("profile_id, year, expectations")
        .eq("event_id", event.id)
        .in("profile_id", userIds);
      if (registrations) {
        regMap = new Map(registrations.map((r) => [r.profile_id, r]));
      }
    }

    // 4. Sort standings
    // Primary: Score descending. Tie-breaker: Faster time taken to complete wins.
    const sortedSessions = [...sessions].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const timeTakenA =
        a.started_at && a.submitted_at
          ? new Date(a.submitted_at).getTime() -
            new Date(a.started_at).getTime()
          : 999999999;
      const timeTakenB =
        b.started_at && b.submitted_at
          ? new Date(b.submitted_at).getTime() -
            new Date(b.started_at).getTime()
          : 999999999;
      if (timeTakenA !== timeTakenB) return timeTakenA - timeTakenB;

      const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return timeA - timeB;
    });

    const leaderboard = sortedSessions.map((s, index) => {
      const prof = profileMap.get(s.user_id);
      const team = teamMap.get(s.user_id);
      const reg = regMap.get(s.user_id);

      let leaderBranch = prof?.branch || "";
      let leaderYear = reg?.year || prof?.year || "";
      if (reg?.expectations) {
        const bMatch = reg.expectations.match(/Branch:\s*([^|]+)/i);
        if (bMatch) leaderBranch = bMatch[1].trim();
      }
      if (!leaderBranch) leaderBranch = "CSE";
      if (!leaderYear) leaderYear = "3rd Year";

      let timeTakenSeconds: number | null = null;
      let timeTakenFormatted = "--";
      if (s.started_at && s.submitted_at) {
        const startMs = new Date(s.started_at).getTime();
        const endMs = new Date(s.submitted_at).getTime();
        const diffSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));
        timeTakenSeconds = diffSecs;
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        timeTakenFormatted = `${mins}m ${secs.toString().padStart(2, "0")}s`;
      } else if (s.started_at && s.status === "in_progress") {
        timeTakenFormatted = "In Progress";
      }

      return {
        rank: index + 1,
        profileId: s.user_id,
        name: prof?.display_name || prof?.username || "Candidate",
        username: prof?.username || "deviator",
        avatarUrl: prof?.avatar_url || "",
        teamName: team?.name || "Independent Leader",
        branch: leaderBranch,
        year: leaderYear,
        role: "Team Leader",
        status: s.status, // "submitted" | "terminated" | "in_progress"
        startedAt: s.started_at,
        submittedAt: s.submitted_at,
        timeTakenSeconds,
        timeTakenFormatted,
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
