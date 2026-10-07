import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = getAdminClient();

    // Check authorization: User must have 'president' or 'club-official' role
    const { data: userRoles } = await adminDb
      .from("profile_roles")
      .select("tag")
      .eq("profile_id", user.id);

    const isAuthorized = (userRoles || []).some(
      (r) => r.tag === "president" || r.tag === "club-official",
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: President authorization required." },
        { status: 403 },
      );
    }

    // Optional event filter
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

    // 1. Fetch all teams for this event
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

    // 2. Fetch all team members for these teams
    const { data: allMembers } = await adminDb
      .from("team_members")
      .select("team_id, profile_id, status, created_at")
      .in("team_id", teamIds);

    const allProfileIds = Array.from(
      new Set((allMembers || []).map((m) => m.profile_id)),
    );

    // 3. Fetch profiles
    const { data: profiles } = await adminDb
      .from("profiles")
      .select("id, username, display_name, avatar_url, branch, year")
      .in("id", allProfileIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // 4. Fetch registrations to get phone, college roll no, expectations (branch/section)
    const { data: registrations } = await adminDb
      .from("registrations")
      .select("profile_id, team_id, phone, college_id, year, expectations, status")
      .eq("event_id", event.id)
      .in("profile_id", allProfileIds);

    const regMap = new Map((registrations || []).map((r) => [r.profile_id, r]));

    // 5. Fetch auth emails for participants via admin
    // In Supabase, listUsers returns users with emails
    const {
      data: { users: authUsers },
    } = await adminDb.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authUsers || []).map((u) => [u.id, u.email || ""]));

    let totalConfirmed = 0;
    let totalPending = 0;

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
        acceptedCount: teamMembers.filter((m) => m.status === "accepted").length,
        pendingCount: teamMembers.filter((m) => m.status === "pending").length,
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
