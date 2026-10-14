import { NextRequest, NextResponse } from "next/server";
import { ROUND_1_SELECTED_TEAMS } from "@/data/round1SelectedTeams";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // 1. Optional Executive/President check for extra badges
    let isPresident = false;
    let currentUser: any = null;

    try {
      const adminDb = getAdminClient();
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const { data } = await adminDb.auth.getUser(token);
        if (data?.user) currentUser = data.user;
      }

      if (!currentUser) {
        const serverSupabase = await createServerClient();
        const { data } = await serverSupabase.auth.getUser();
        currentUser = data?.user || null;
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
          return (
            tag === "president" ||
            tag === "club-president" ||
            tag === "faculty-coordinator" ||
            tag === "chief-coordinator" ||
            tag.includes("faculty") ||
            tag.includes("chief") ||
            tag.includes("coordinator")
          );
        });

        const usernameLower = (userProfile?.username || "")
          .toLowerCase()
          .trim();
        const emailLower = (currentUser.email || "").toLowerCase().trim();
        isPresident =
          hasPresidentRole ||
          usernameLower === "akshitbhandaricodes" ||
          usernameLower === "akshit" ||
          usernameLower === "aarushi" ||
          usernameLower === "deviatorsclub" ||
          usernameLower === "paperboat" ||
          usernameLower === "kunalwadhwa" ||
          usernameLower === "wadhwakunal" ||
          usernameLower === "renunarwal" ||
          usernameLower === "aam_papad" ||
          emailLower === "akshitbhandaricodes@gmail.com" ||
          emailLower.includes("akshitbhandaricodes") ||
          emailLower.includes("arushik") ||
          emailLower.includes("paperboat") ||
          emailLower.includes("kunalwadhwa") ||
          emailLower.includes("wadhwakunal") ||
          emailLower.includes("renunarwal") ||
          emailLower.includes("renu") ||
          emailLower.includes("anishjuyal6");
      }
    } catch {}

    // 2. Return the official 40 selected and ranked teams from Round 1 (Wayground)
    const leaderboard = ROUND_1_SELECTED_TEAMS.map((t) => ({
      rank: t.rank,
      teamName: t.teamName,
      quizName: t.quizName,
      leaderName: t.leaderName,
      year: t.year,
      branch: t.branch,
      members: t.members,
      membersFormatted: t.membersFormatted,
      status: "Qualified for Round 2",
      totalTeams: 40,
    }));

    return NextResponse.json({
      success: true,
      isPresident,
      totalSelected: leaderboard.length,
      platform: "Wayground",
      roundTitle: "Round 1 - Debug Decrypt 3.0",
      leaderboard,
    });
  } catch (error: any) {
    console.error("[GET /api/round-1/leaderboard error]", error);
    return NextResponse.json(
      {
        error: "Failed to load Round 1 leaderboard standings.",
        leaderboard: ROUND_1_SELECTED_TEAMS,
      },
      { status: 500 },
    );
  }
}
