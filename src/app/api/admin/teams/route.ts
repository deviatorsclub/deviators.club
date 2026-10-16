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

    const hasAdminOrFacultyRole = (userRoles || []).some(
      (r) =>
        r.tag === "president" ||
        r.tag === "club-official" ||
        r.tag === "faculty-coordinator" ||
        r.tag === "chief-coordinator" ||
        (r.tag || "").toLowerCase().includes("faculty") ||
        (r.tag || "").toLowerCase().includes("coordinator"),
    );

    const usernameLower = (userProfile?.username || "").toLowerCase();
    const emailLower = (user.email || "").toLowerCase();
    const isPresidentOrFacultyIdentity =
      usernameLower === "akshitbhandaricodes" ||
      usernameLower === "aarushi" ||
      usernameLower === "deviatorsclub" ||
      usernameLower === "paperboat" ||
      usernameLower === "kunalwadhwa" ||
      usernameLower === "wadhwakunal" ||
      usernameLower === "renunarwal" ||
      usernameLower === "aam_papad" ||
      emailLower.includes("akshitbhandaricodes") ||
      emailLower.includes("arushik") ||
      emailLower.includes("paperboat") ||
      emailLower.includes("kunalwadhwa") ||
      emailLower.includes("wadhwakunal") ||
      emailLower.includes("renunarwal") ||
      emailLower.includes("renu") ||
      emailLower.includes("anishjuyal6");

    const isAuthorized = hasAdminOrFacultyRole || isPresidentOrFacultyIdentity;

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            "Forbidden: President or Faculty Coordinator authorization required.",
        },
        { status: 403 },
      );
    }

    // 4. Fetch Event
    const { searchParams } = new URL(req.url);
    const eventSlug = searchParams.get("event") || "debug-decrypt-3.0";

    let { data: event } = await adminDb
      .from("events")
      .select("id, slug, title, max_team_size")
      .eq("slug", eventSlug)
      .maybeSingle();

    if (!event && (eventSlug === "round-1" || eventSlug === "craftcon-2k26")) {
      const res = await adminDb
        .from("events")
        .select("id, slug, title, max_team_size")
        .eq("slug", "debug-decrypt-3.0")
        .maybeSingle();
      event = res.data;
    }

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
      new Set([
        ...teams.map((t) => t.leader_id),
        ...(allMembers || []).map((m) => m.profile_id),
      ]),
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
      // Check if leader or any teammate has attempted Round 1
      const teamMemberIds = teamMembers.map((m) => m.profileId);
      if (!teamMemberIds.includes(t.leader_id)) teamMemberIds.push(t.leader_id);

      const r1Session =
        round1Map.get(t.leader_id) ||
        teamMemberIds.map((id) => round1Map.get(id)).find(Boolean);

      return {
        id: t.id,
        name: t.name,
        createdAt: t.created_at,
        leader: {
          profileId: t.leader_id,
          username: leaderProfile?.username || "unknown",
          displayName:
            leaderProfile?.display_name ||
            leaderProfile?.username ||
            "Unknown Leader",
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
        round1: r1Session
          ? {
              hasAttempted: true,
              status: r1Session.status,
              score: r1Session.score,
              maxScore: r1Session.max_score,
              submittedAt: r1Session.submitted_at,
              strikes: r1Session.strike_count || 0,
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

    // Support direct CSV download from API
    if (searchParams.get("format") === "csv") {
      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      };

      const headers = [
        "S.No",
        "Team Name",
        "Created Date",
        "Total Members",
        "Accepted Members",
        "Pending Invites",
        "Team Status",
        "Leader Name",
        "Leader Handle",
        "Leader Email",
        "Leader Phone",
        "Leader Roll No",
        "Leader Branch",
        "Leader Section",
        "Leader Year",
        "Teammate 2 Name",
        "Teammate 2 Handle",
        "Teammate 2 Email",
        "Teammate 2 Phone",
        "Teammate 2 Roll No",
        "Teammate 2 Branch",
        "Teammate 2 Section",
        "Teammate 2 Status",
        "Teammate 3 Name",
        "Teammate 3 Handle",
        "Teammate 3 Email",
        "Teammate 3 Phone",
        "Teammate 3 Roll No",
        "Teammate 3 Branch",
        "Teammate 3 Section",
        "Teammate 3 Status",
        "Round 1 Status",
        "Round 1 Score",
        "Round 1 Max Score",
        "Round 1 Submitted At",
        "Round 1 Strikes",
        "All Members Summary",
      ];

      const csvRows = enrichedTeams.map((t, idx) => {
        const nonLeaderMembers = t.members.filter(
          (m: any) => m.profileId !== t.leader.profileId,
        );
        const m2 = nonLeaderMembers[0];
        const m3 = nonLeaderMembers[1];

        const r1Status = t.round1?.hasAttempted
          ? t.round1.status
          : "Not Attempted";
        const r1Score =
          t.round1?.score !== null && t.round1?.score !== undefined
            ? t.round1.score
            : "N/A";
        const r1Max =
          t.round1?.maxScore !== null && t.round1?.maxScore !== undefined
            ? t.round1.maxScore
            : "N/A";
        const r1SubmittedAt = t.round1?.submittedAt
          ? new Date(t.round1.submittedAt).toLocaleString()
          : "N/A";
        const r1Strikes = t.round1?.strikes ?? 0;

        const teamStatusStr =
          t.acceptedCount === 3
            ? "Complete (3/3)"
            : t.acceptedCount === 2
              ? "Two Members (2/3)"
              : "Solo Leader (1/3)";

        const membersSummary = t.members
          .map(
            (m: any) =>
              `${m.displayName} (@${m.username}, ${m.status}, Roll: ${m.collegeId || "N/A"}, Phone: ${m.phone || "N/A"}, Branch: ${m.branch || "N/A"})`,
          )
          .join(" | ");

        return [
          idx + 1,
          escapeCsv(t.name),
          escapeCsv(new Date(t.createdAt).toLocaleDateString()),
          t.memberCount,
          t.acceptedCount,
          t.pendingCount,
          escapeCsv(teamStatusStr),
          escapeCsv(t.leader.displayName),
          escapeCsv(`@${t.leader.username}`),
          escapeCsv(t.leader.email),
          escapeCsv(t.leader.phone),
          escapeCsv(t.leader.collegeId),
          escapeCsv(t.leader.branch),
          escapeCsv(t.leader.section),
          escapeCsv(t.leader.year),
          escapeCsv(m2?.displayName || ""),
          escapeCsv(m2 ? `@${m2.username}` : ""),
          escapeCsv(m2?.email || ""),
          escapeCsv(m2?.phone || ""),
          escapeCsv(m2?.collegeId || ""),
          escapeCsv(m2?.branch || ""),
          escapeCsv(m2?.section || ""),
          escapeCsv(m2?.status || ""),
          escapeCsv(m3?.displayName || ""),
          escapeCsv(m3 ? `@${m3.username}` : ""),
          escapeCsv(m3?.email || ""),
          escapeCsv(m3?.phone || ""),
          escapeCsv(m3?.collegeId || ""),
          escapeCsv(m3?.branch || ""),
          escapeCsv(m3?.section || ""),
          escapeCsv(m3?.status || ""),
          escapeCsv(r1Status),
          escapeCsv(r1Score),
          escapeCsv(r1Max),
          escapeCsv(r1SubmittedAt),
          r1Strikes,
          escapeCsv(membersSummary),
        ].join(",");
      });

      const csvContent =
        "\uFEFF" + [headers.join(","), ...csvRows].join("\r\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="debug_decrypt_teams_all_${enrichedTeams.length}.csv"`,
        },
      });
    }

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
