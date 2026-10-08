import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }
  return null;
}

async function getAuthUser(req: NextRequest) {
  const token = extractToken(req);
  if (token) {
    const admin = getAdminClient(token);
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data?.user) return data.user;
  }
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// GET: Fetch incoming and outgoing invitations for the logged-in user
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = extractToken(req);
  const supabase = getAdminClient(token);

  try {
    // 1. Fetch invitations RECEIVED by this user (status: 'pending')
    const { data: receivedMemberships, error: recErr } = await supabase
      .from("team_members")
      .select(
        `
        team_id,
        status,
        created_at,
        teams:teams!inner (
          id,
          name,
          leader_id,
          created_at,
          event_id,
          events:events!inner (
            id,
            slug,
            title
          )
        )
      `,
      )
      .eq("profile_id", user.id)
      .eq("status", "pending");

    let receivedList: any[] = [];
    if (!recErr && receivedMemberships) {
      const leaderIds = receivedMemberships.map(
        (rm: any) => (rm.teams as any).leader_id,
      );
      const eventIds = receivedMemberships.map(
        (rm: any) => (rm.teams as any).event_id,
      );

      const [{ data: leaderProfiles }, { data: userRegs }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in(
            "id",
            leaderIds.length > 0
              ? leaderIds
              : ["00000000-0000-0000-0000-000000000000"],
          ),
        supabase
          .from("registrations")
          .select("event_id, phone, college_id, year, expectations")
          .eq("profile_id", user.id)
          .in(
            "event_id",
            eventIds.length > 0
              ? eventIds
              : ["00000000-0000-0000-0000-000000000000"],
          ),
      ]);

      const leaderMap = new Map((leaderProfiles || []).map((p) => [p.id, p]));
      const regMap = new Map((userRegs || []).map((r) => [r.event_id, r]));

      receivedList = receivedMemberships.map((rm: any) => {
        const teamObj = rm.teams;
        const eventObj = teamObj.events;
        const leader = leaderMap.get(teamObj.leader_id);
        const reg = regMap.get(teamObj.event_id);

        let branch = "";
        let section = "";
        if (reg?.expectations) {
          const bMatch = reg.expectations.match(/Branch:\s*([^|]+)/i);
          const sMatch = reg.expectations.match(/Section:\s*(.+)/i);
          if (bMatch) branch = bMatch[1].trim();
          if (sMatch) section = sMatch[1].trim();
        }

        return {
          teamId: teamObj.id,
          teamName: teamObj.name,
          eventId: eventObj.id,
          eventSlug: eventObj.slug,
          eventTitle: eventObj.title,
          leaderId: teamObj.leader_id,
          leaderUsername: leader?.username || "leader",
          leaderDisplayName:
            leader?.display_name || leader?.username || "Team Leader",
          leaderAvatarUrl: leader?.avatar_url || "",
          invitedAt: rm.created_at,
          phone: reg?.phone || "",
          collegeId: reg?.college_id || "",
          branch,
          section,
          year: reg?.year || "3rd Year",
        };
      });
    }

    // 2. Fetch teams LED by this user to get SENT requests
    const { data: ledTeams } = await supabase
      .from("teams")
      .select(
        `
        id,
        name,
        created_at,
        event_id,
        events:events!inner (
          id,
          slug,
          title
        )
      `,
      )
      .eq("leader_id", user.id);

    const sentList: any[] = [];
    if (ledTeams && ledTeams.length > 0) {
      const teamIds = ledTeams.map((t) => t.id);
      const { data: allMembers } = await supabase
        .from("team_members")
        .select("team_id, profile_id, status, created_at")
        .in("team_id", teamIds);

      const otherProfileIds = (allMembers || [])
        .map((m) => m.profile_id)
        .filter((id) => id !== user.id);

      const [{ data: mateProfiles }, { data: mateRegs }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, branch, year")
          .in(
            "id",
            otherProfileIds.length > 0
              ? otherProfileIds
              : ["00000000-0000-0000-0000-000000000000"],
          ),
        supabase
          .from("registrations")
          .select("profile_id, team_id, phone, college_id, year, expectations")
          .in("team_id", teamIds),
      ]);

      const profMap = new Map((mateProfiles || []).map((p) => [p.id, p]));
      const regKey = (profId: string, teamId: string) => `${profId}_${teamId}`;
      const regMap = new Map(
        (mateRegs || []).map((r) => [regKey(r.profile_id, r.team_id), r]),
      );

      for (const t of ledTeams) {
        const teamMems = (allMembers || []).filter((m) => m.team_id === t.id);
        const eventObj = (t as any).events;

        const membersInfo = teamMems.map((m) => {
          const prof = profMap.get(m.profile_id);
          const isLeader = m.profile_id === user.id;
          const reg = regMap.get(regKey(m.profile_id, t.id));

          let branch = prof?.branch || "";
          let section = "";
          if (reg?.expectations) {
            const bMatch = reg.expectations.match(/Branch:\s*([^|]+)/i);
            const sMatch = reg.expectations.match(/Section:\s*(.+)/i);
            if (bMatch) branch = bMatch[1].trim();
            if (sMatch) section = sMatch[1].trim();
          }

          return {
            profileId: m.profile_id,
            username: isLeader ? "you" : prof?.username || "deviator",
            displayName: isLeader
              ? "You (Leader)"
              : prof?.display_name || prof?.username || "Teammate",
            avatarUrl: prof?.avatar_url || "",
            status: m.status, // 'pending' | 'accepted'
            isLeader,
            phone: reg?.phone || "",
            collegeId: reg?.college_id || "",
            branch,
            section,
            year: reg?.year || prof?.year || "3rd Year",
            createdAt: m.created_at,
          };
        });

        sentList.push({
          teamId: t.id,
          teamName: t.name,
          eventId: eventObj.id,
          eventSlug: eventObj.slug,
          eventTitle: eventObj.title,
          createdAt: t.created_at,
          members: membersInfo,
          pendingCount: membersInfo.filter((m) => m.status === "pending")
            .length,
          acceptedCount: membersInfo.filter((m) => m.status === "accepted")
            .length,
        });
      }
    }

    // 3. Check if user is already an accepted member of any team
    const { data: acceptedTeamRows } = await supabase
      .from("team_members")
      .select(
        "team_id, teams:teams!inner(id, name, event_id, events:events!inner(slug, title))",
      )
      .eq("profile_id", user.id)
      .eq("status", "accepted");

    const acceptedTeams = (acceptedTeamRows || []).map((r: any) => ({
      teamId: r.teams.id,
      teamName: r.teams.name,
      eventSlug: r.teams.events.slug,
      eventTitle: r.teams.events.title,
    }));

    return NextResponse.json({
      success: true,
      received: receivedList,
      sent: sentList,
      acceptedTeams,
      hasPendingReceived: receivedList.length > 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch invitations." },
      { status: 500 },
    );
  }
}
