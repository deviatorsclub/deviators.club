import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const adminDb = getAdminClient();
    let user = null;

    // 1. Try Bearer token from client session header
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data, error } = await adminDb.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    }

    // 2. Fall back to Next.js cookie session
    if (!user) {
      try {
        const serverSupabase = await createServerClient();
        const { data } = await serverSupabase.auth.getUser();
        user = data?.user || null;
      } catch {
        // cookies unavailable
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in." },
        { status: 401 },
      );
    }

    // 3. Fetch user profile and roles
    const { data: userProfile } = await adminDb
      .from("profiles")
      .select("id, username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const { data: userRoles } = await adminDb
      .from("profile_roles")
      .select("tag")
      .eq("profile_id", user.id);

    const hasPresidentRole = (userRoles || []).some(
      (r) => r.tag === "president" || r.tag === "club-official",
    );

    const usernameLower = (userProfile?.username || "").toLowerCase();
    const emailLower = (user.email || "").toLowerCase();
    const isPresidentIdentity =
      usernameLower === "akshitbhandaricodes" ||
      usernameLower === "aarushi" ||
      usernameLower === "deviatorsclub" ||
      emailLower.includes("akshitbhandaricodes") ||
      emailLower.includes("arushik");

    const isAuthorized = hasPresidentRole || isPresidentIdentity;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: President authorization required." },
        { status: 403 },
      );
    }

    // 4. Fetch Event
    const { searchParams } = new URL(req.url);
    const eventSlug = searchParams.get("event") || "debug-decrypt-3.0";

    const { data: event } = await adminDb
      .from("events")
      .select("id, slug, title, max_team_size")
      .or(`slug.eq.${eventSlug},slug.eq.debug-decrypt-3.0`)
      .maybeSingle();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 5. Fetch all teams for this event
    const { data: teams, error: teamsErr } = await adminDb
      .from("teams")
      .select("id, name, leader_id, created_at")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });

    if (teamsErr) {
      return NextResponse.json({ error: teamsErr.message }, { status: 500 });
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        event: { id: event.id, title: event.title, slug: event.slug },
        teams: [],
        stats: { totalTeams: 0, totalConfirmed: 0, totalPending: 0 },
      });
    }

    const teamIds = teams.map((t) => t.id);

    // 6. Fetch all team members for these teams
    const { data: allMembers } = await adminDb
      .from("team_members")
      .select("team_id, profile_id, status, created_at")
      .in("team_id", teamIds);

    const allProfileIds = Array.from(
      new Set((allMembers || []).map((m) => m.profile_id)),
    );

    // 7. Fetch profiles
    const { data: profiles } = await adminDb
      .from("profiles")
      .select("id, username, display_name, avatar_url, branch, year")
      .in("id", allProfileIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // 8. Fetch registrations (phone, roll no, branch, section)
    const { data: registrations } = await adminDb
      .from("registrations")
      .select(
        "profile_id, team_id, phone, college_id, year, expectations, status",
      )
      .eq("event_id", event.id)
      .in("profile_id", allProfileIds);

    const regMap = new Map((registrations || []).map((r) => [r.profile_id, r]));

    // 9. Fetch auth emails safely (non-fatal if listUsers is restricted)
    let emailMap = new Map<string, string>();
    try {
      const { data: authData } = await adminDb.auth.admin.listUsers({
        perPage: 1000,
      });
      if (authData?.users) {
        emailMap = new Map(authData.users.map((u) => [u.id, u.email || ""]));
      }
    } catch (e) {
      console.warn("Could not list auth users:", e);
    }

    let totalConfirmed = 0;
    let totalPending = 0;

    // 10. Fetch Round 1 quiz sessions for leaders
    const { getAllQuizSessions } = await import("@/lib/round1/sessionStore");
    const allRound1Sessions = await getAllQuizSessions("round-1");
    const round1Map = new Map(allRound1Sessions.map((s) => [s.user_id, s]));

    const enrichedTeams = teams.map((t) => {
      const leaderProfile = profileMap.get(t.leader_id);
      const leaderReg = regMap.get(t.leader_id);
      const leaderEmail = emailMap.get(t.leader_id) || "";

      let leaderBranch = leaderProfile?.branch || "";
      let leaderSection = "";
      if (leaderReg?.expectations) {
        const bMatch = leaderReg.expectations.match(/Branch:\s*([^|]+)/i);
        const sMatch = leaderReg.expectations.match(/Section:\s*(.+)/i);
        if (bMatch) leaderBranch = bMatch[1].trim();
        if (sMatch) leaderSection = sMatch[1].trim();
      }

      const teamMembers = (allMembers || [])
        .filter((m) => m.team_id === t.id)
        .map((m) => {
          const prof = profileMap.get(m.profile_id);
          const reg = regMap.get(m.profile_id);
          const email = emailMap.get(m.profile_id) || "";
          const isLeader = m.profile_id === t.leader_id;

          let branch = prof?.branch || "";
          let section = "";
          if (reg?.expectations) {
            const bMatch = reg.expectations.match(/Branch:\s*([^|]+)/i);
            const sMatch = reg.expectations.match(/Section:\s*(.+)/i);
            if (bMatch) branch = bMatch[1].trim();
            if (sMatch) section = sMatch[1].trim();
          }

          if (m.status === "accepted") {
            totalConfirmed++;
          } else {
            totalPending++;
          }

          return {
            profileId: m.profile_id,
            username: prof?.username || "deviator",
            displayName: prof?.display_name || prof?.username || "Member",
            avatarUrl: prof?.avatar_url || "",
            email,
            phone: reg?.phone || "",
            collegeId: reg?.college_id || "",
            branch,
            section,
            year: reg?.year || prof?.year || "3rd Year",
            status: m.status as "accepted" | "pending",
            isLeader,
          };
        });

      return {
        id: t.id,
        name: t.name,
        createdAt: t.created_at,
        leader: {
          profileId: t.leader_id,
          username: leaderProfile?.username || "leader",
          displayName:
            leaderProfile?.display_name || leaderProfile?.username || "Leader",
          avatarUrl: leaderProfile?.avatar_url || "",
          email: leaderEmail,
          phone: leaderReg?.phone || "",
          collegeId: leaderReg?.college_id || "",
          branch: leaderBranch,
          section: leaderSection,
          year: leaderReg?.year || leaderProfile?.year || "3rd Year",
        },
        members: teamMembers,
        memberCount: teamMembers.length,
        acceptedCount: teamMembers.filter((m) => m.status === "accepted")
          .length,
        pendingCount: teamMembers.filter((m) => m.status === "pending").length,
        round1: round1Map.has(t.leader_id)
          ? {
              hasAttempted: true,
              status: round1Map.get(t.leader_id)!.status,
              score: round1Map.get(t.leader_id)!.score,
              maxScore: round1Map.get(t.leader_id)!.max_score,
              submittedAt: round1Map.get(t.leader_id)!.submitted_at,
              strikes: round1Map.get(t.leader_id)!.strike_count || 0,
            }
          : {
              hasAttempted: false,
              status: "not_started",
              score: null,
              maxScore: null,
              submittedAt: null,
              strikes: 0,
            },
      };
    });

    return NextResponse.json({
      event: { id: event.id, title: event.title, slug: event.slug },
      teams: enrichedTeams,
      stats: {
        totalTeams: enrichedTeams.length,
        totalConfirmed,
        totalPending,
      },
    });
  } catch (err: any) {
    console.error("[api/admin/teams]", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
