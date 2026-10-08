import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

// Helper to extract bearer token from Authorization header
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }
  return null;
}

// Helper to get authenticated user from request (Bearer token or Cookie)
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

// GET: Fetch user's registration, team details, and any pending invitations
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({
      registered: false,
      user: null,
      team: null,
      invitations: [],
    });
  }

  const token = extractToken(req);
  const supabase = getAdminClient(token);

  // Find event (support slug aliases e.g. debug-decrypt-3.0 or craftcon-2k26)
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title, max_team_size, is_team_event")
    .or(`slug.eq.${slug},slug.eq.debug-decrypt-3.0`)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Find user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 1. Check if user is an accepted member or leader of a team
  const { data: userMemberships } = await supabase
    .from("team_members")
    .select(
      "team_id, status, teams!inner(id, name, leader_id, created_at, event_id)",
    )
    .eq("profile_id", user.id)
    .eq("status", "accepted")
    .eq("teams.event_id", event.id);

  let activeTeam = null;
  const acceptedMembership = userMemberships?.[0];

  if (acceptedMembership) {
    const t = acceptedMembership.teams as any;
    // Fetch all team members
    const { data: members } = await supabase
      .from("team_members")
      .select("profile_id, status")
      .eq("team_id", t.id);

    const memberProfileIds = (members || []).map((m) => m.profile_id);
    const { data: memberProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, branch, year")
      .in("id", memberProfileIds);

    const profileMap = new Map((memberProfiles || []).map((p) => [p.id, p]));

    const enrichedMembers = (members || []).map((m) => {
      const p = profileMap.get(m.profile_id);
      const isLeader = m.profile_id === t.leader_id;
      return {
        profileId: m.profile_id,
        username: p?.username || "deviator",
        displayName: p?.display_name || p?.username || "Deviator Member",
        avatarUrl: p?.avatar_url || "",
        branch: p?.branch || "CSE",
        year: p?.year || "3rd Year",
        role: isLeader ? "Leader" : "Member",
        status: m.status || "accepted", // 'accepted' or 'pending'
      };
    });

    activeTeam = {
      id: t.id,
      name: t.name,
      leaderId: t.leader_id,
      isLeader: t.leader_id === user.id,
      members: enrichedMembers,
      maxMembers: event.max_team_size || 3,
      canAddMore:
        enrichedMembers.length < (event.max_team_size || 3) &&
        t.leader_id === user.id,
    };
  }

  // 2. Check for incoming pending invitations (if not in an accepted team)
  let invitations: any[] = [];
  const { data: pendingRows } = await supabase
    .from("team_members")
    .select("team_id, created_at, teams!inner(id, name, leader_id, event_id)")
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .eq("teams.event_id", event.id);

  if (pendingRows && pendingRows.length > 0) {
    const leaderIds = pendingRows.map((r) => (r.teams as any).leader_id);
    const { data: leaderProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", leaderIds);

    const leaderMap = new Map((leaderProfiles || []).map((p) => [p.id, p]));

    invitations = pendingRows.map((r) => {
      const t = r.teams as any;
      const leader = leaderMap.get(t.leader_id);
      return {
        teamId: t.id,
        teamName: t.name,
        leaderUsername: leader?.username || "leader",
        leaderDisplayName: leader?.display_name || "Team Leader",
        leaderAvatarUrl: leader?.avatar_url || "",
        invitedAt: r.created_at,
      };
    });
  }

  // 3. Find user's latest registration details (to autofetch phone, roll no, branch, section)
  const { data: userReg } = await supabase
    .from("registrations")
    .select("phone, college_id, year, expectations")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let autoSection = "";
  let autoBranch = profile?.branch || "";
  if (userReg?.expectations) {
    const branchMatch = userReg.expectations.match(/Branch:\s*([^|]+)/i);
    const sectionMatch = userReg.expectations.match(/Section:\s*(.+)/i);
    if (branchMatch) autoBranch = branchMatch[1].trim();
    if (sectionMatch) autoSection = sectionMatch[1].trim();
  }

  return NextResponse.json({
    registered: Boolean(activeTeam),
    user: profile
      ? {
          ...profile,
          displayName: profile.display_name || profile.username,
          display_name: profile.display_name || profile.username,
          avatarUrl: profile.avatar_url || "",
          avatar_url: profile.avatar_url || "",
          email: user.email,
          phone: userReg?.phone || "",
          collegeId: userReg?.college_id || "",
          branch: autoBranch || profile?.branch || "",
          section: autoSection,
        }
      : null,
    team: activeTeam,
    invitations,
  });
}

// POST: Create team & Register
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Please log in to register." },
      { status: 401 },
    );
  }

  const token = extractToken(req);
  const supabase = getAdminClient(token);
  const body = await req.json();
  const {
    teamName,
    teammateUsernames = [],
    phone = "",
    collegeId = "",
    branch = "",
    section = "",
    year = "3rd Year",
    expectations = "",
  } = body;

  // 1. Fetch event
  const { data: event, error: eErr } = await supabase
    .from("events")
    .select("id, slug, title, max_team_size, is_team_event, reg_closes_at")
    .or(`slug.eq.${slug},slug.eq.debug-decrypt-3.0`)
    .maybeSingle();

  if (eErr || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  // 2. Validate user has onboarded profile
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("id, username, onboarded")
    .eq("id", user.id)
    .single();

  if (!userProfile || !userProfile.onboarded) {
    return NextResponse.json(
      {
        error: "Please complete your Deviator profile before registering.",
        needOnboarding: true,
      },
      { status: 400 },
    );
  }

  // Rule: One user can create/lead one team only for this event!
  const { data: existingLedTeam } = await supabase
    .from("teams")
    .select("id, name")
    .eq("event_id", event.id)
    .eq("leader_id", user.id);

  if (existingLedTeam && existingLedTeam.length > 0) {
    return NextResponse.json(
      {
        error: `You have already created team "${existingLedTeam[0].name}". One user can create one team only.`,
      },
      { status: 400 },
    );
  }

  // Rule: User can only join/be in ONE team at a time!
  const { data: existingUserTeam } = await supabase
    .from("team_members")
    .select("team_id, status, teams!inner(name, event_id)")
    .eq("profile_id", user.id)
    .eq("status", "accepted")
    .eq("teams.event_id", event.id);

  if (existingUserTeam && existingUserTeam.length > 0) {
    const existingName = (existingUserTeam[0].teams as any)?.name;
    return NextResponse.json(
      {
        error: `You are already part of team "${existingName}". You can only be in one team at a time.`,
      },
      { status: 400 },
    );
  }

  // Rule: Team names must be unique for this event (case-insensitive)
  const trimmedName = (teamName || "").trim();
  if (trimmedName.length < 2) {
    return NextResponse.json(
      { error: "Please provide a valid team name (at least 2 characters)." },
      { status: 400 },
    );
  }

  const { data: duplicateNameTeam } = await supabase
    .from("teams")
    .select("id, name")
    .eq("event_id", event.id)
    .ilike("name", trimmedName);

  if (duplicateNameTeam && duplicateNameTeam.length > 0) {
    return NextResponse.json(
      {
        error: `The team name "${trimmedName}" is already taken. Please choose a unique team name.`,
      },
      { status: 400 },
    );
  }

  // 4. Resolve teammate profiles
  const cleanMates = teammateUsernames
    .map((u: string) => u.replace(/^@/, "").toLowerCase().trim())
    .filter((u: string) => u && u !== userProfile.username.toLowerCase());

  let mateProfiles: any[] = [];
  if (cleanMates.length > 0) {
    const { data: foundMates } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("username", cleanMates);
    mateProfiles = foundMates || [];
  }

  if (mateProfiles.length !== cleanMates.length) {
    return NextResponse.json(
      {
        error:
          "One or more teammate usernames could not be found. Please check their handles.",
      },
      { status: 400 },
    );
  }

  // Rule 2 check for mates: Check if any teammate is already in another accepted team for this event
  for (const mate of mateProfiles) {
    const { data: mateExisting } = await supabase
      .from("team_members")
      .select("team_id, teams!inner(name, event_id)")
      .eq("profile_id", mate.id)
      .eq("status", "accepted")
      .eq("teams.event_id", event.id);

    if (mateExisting && mateExisting.length > 0) {
      const existingName = (mateExisting[0].teams as any)?.name;
      return NextResponse.json(
        {
          error: `@${mate.username} is already an accepted member of team "${existingName}". Each person can only join one team at a time.`,
        },
        { status: 400 },
      );
    }
  }

  // 5. Create team entity
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .insert({
      event_id: event.id,
      name: teamName.trim(),
      leader_id: user.id,
    })
    .select("id, name")
    .single();

  if (teamErr || !team) {
    return NextResponse.json(
      {
        error:
          teamErr?.message ||
          "Failed to create team. Team name may already exist.",
      },
      { status: 500 },
    );
  }

  // 6. Insert Leader as 'accepted' and Teammates as 'pending'
  const teamMemberRows = [
    { team_id: team.id, profile_id: user.id, status: "accepted" },
    ...mateProfiles.map((m) => ({
      team_id: team.id,
      profile_id: m.id,
      status: "pending", // Shows "Request Sent"
    })),
  ];

  await supabase.from("team_members").insert(teamMemberRows);

  // 7. Register Leader
  const detailsStr =
    expectations ||
    `Branch: ${branch || ""} | Section: ${section || ""}`.trim();
  await supabase.from("registrations").upsert(
    {
      event_id: event.id,
      profile_id: user.id,
      team_id: team.id,
      phone,
      college_id: collegeId,
      year,
      expectations: detailsStr,
      status: "confirmed",
    },
    { onConflict: "event_id,profile_id" },
  );

  if (branch) {
    await supabase.from("profiles").update({ branch }).eq("id", user.id);
  }

  // 8. Store invited teammate details entered during registration
  const membersDataList = Array.isArray(body.membersData)
    ? body.membersData
    : [];
  for (const mate of mateProfiles) {
    const mData = membersDataList.find(
      (md: any) =>
        (md.username &&
          md.username.toLowerCase() === mate.username.toLowerCase()) ||
        md.profileId === mate.id,
    );
    const mPhone = mData?.phone || "";
    const mCollegeId = mData?.collegeId || "";
    const mBranch = mData?.branch || "";
    const mSection = mData?.section || "";
    const mYear = mData?.year || "3rd Year";
    const mDetails = `Branch: ${mBranch} | Section: ${mSection}`.trim();

    await supabase.from("registrations").upsert(
      {
        event_id: event.id,
        profile_id: mate.id,
        team_id: team.id,
        phone: mPhone,
        college_id: mCollegeId,
        year: mYear,
        expectations: mDetails,
        status: "confirmed",
      },
      { onConflict: "event_id,profile_id" },
    );
  }

  return NextResponse.json({
    success: true,
    teamId: team.id,
    teamName: team.name,
    message:
      "Team created successfully! Invitations have been sent to your teammates.",
  });
}

// PUT: Leader updates the team name
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = extractToken(req);
  const supabase = getAdminClient(token);
  const { teamId, name } = await req.json();

  if (!teamId || !name || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Team name must be at least 2 characters." },
      { status: 400 },
    );
  }

  // Verify leader
  const { data: team } = await supabase
    .from("teams")
    .select("id, leader_id")
    .eq("id", teamId)
    .single();

  if (!team || team.leader_id !== user.id) {
    return NextResponse.json(
      { error: "Only team leaders can rename the team." },
      { status: 403 },
    );
  }

  const { error: updErr } = await supabase
    .from("teams")
    .update({ name: name.trim() })
    .eq("id", teamId);

  if (updErr) {
    return NextResponse.json(
      { error: "Could not rename team." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, name: name.trim() });
}

// PATCH: Leader invites/adds a teammate to existing team
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = extractToken(req);
  const supabase = getAdminClient(token);

  const body = await req.json();
  const {
    teamId,
    usernameOrEmail,
    phone = "",
    collegeId = "",
    branch = "",
    section = "",
    year = "3rd Year",
  } = body;

  if (!teamId || !usernameOrEmail) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  // Verify user is leader
  const { data: team } = await supabase
    .from("teams")
    .select("id, event_id, leader_id")
    .eq("id", teamId)
    .single();

  if (!team || team.leader_id !== user.id) {
    return NextResponse.json(
      { error: "Only the team leader can invite new members." },
      { status: 403 },
    );
  }

  // Check event max team size
  const { data: event } = await supabase
    .from("events")
    .select("id, max_team_size")
    .eq("id", team.event_id)
    .single();

  const { count } = await supabase
    .from("team_members")
    .select("profile_id", { count: "exact", head: true })
    .eq("team_id", teamId);

  const max = event?.max_team_size || 3;
  if ((count || 0) >= max) {
    return NextResponse.json(
      { error: `Team already has maximum ${max} members.` },
      { status: 400 },
    );
  }

  // Find candidate profile
  const clean = usernameOrEmail.replace(/^@/, "").trim().toLowerCase();
  let candidateProfile = null;

  const { data: byUser } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .ilike("username", clean)
    .maybeSingle();

  if (byUser) {
    candidateProfile = byUser;
  } else {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const foundAuth = authUsers?.users?.find(
      (u: any) => u.email && u.email.toLowerCase() === clean,
    );
    if (foundAuth) {
      const { data: byId } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", foundAuth.id)
        .maybeSingle();
      candidateProfile = byId;
    }
  }

  if (!candidateProfile) {
    return NextResponse.json(
      { error: "No member found with that handle or email." },
      { status: 404 },
    );
  }

  // Rule 2: Check if candidate is already in an accepted team for this event
  const { data: mateExisting } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(name, event_id)")
    .eq("profile_id", candidateProfile.id)
    .eq("status", "accepted")
    .eq("teams.event_id", team.event_id);

  if (mateExisting && mateExisting.length > 0) {
    const existingName = (mateExisting[0].teams as any)?.name;
    return NextResponse.json(
      {
        error: `@${candidateProfile.username} is already an accepted member of team "${existingName}". Members can only be in one team.`,
      },
      { status: 400 },
    );
  }

  // Insert as pending (Request Sent)
  const { error: insErr } = await supabase.from("team_members").insert({
    team_id: teamId,
    profile_id: candidateProfile.id,
    status: "pending",
  });

  if (insErr) {
    return NextResponse.json(
      { error: "Member already has a pending or accepted invitation." },
      { status: 400 },
    );
  }

  // Optionally store teammate details if leader supplied them
  if (phone || collegeId || branch || section) {
    const detailsStr = `Branch: ${branch} | Section: ${section}`.trim();
    await supabase.from("registrations").upsert(
      {
        event_id: team.event_id,
        profile_id: candidateProfile.id,
        team_id: teamId,
        phone,
        college_id: collegeId,
        year,
        expectations: detailsStr,
        status: "confirmed",
      },
      { onConflict: "event_id,profile_id" },
    );
  }

  return NextResponse.json({
    success: true,
    added: {
      profileId: candidateProfile.id,
      username: candidateProfile.username,
      displayName: candidateProfile.display_name,
      status: "pending",
    },
    message: `Invitation sent to @${candidateProfile.username}!`,
  });
}

// DELETE: Remove member or disband/withdraw team
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = extractToken(req);
  const supabase = getAdminClient(token);
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  const memberProfileId = searchParams.get("memberProfileId");
  const action = searchParams.get("action"); // "withdraw" | "leave"

  if (!teamId) {
    return NextResponse.json({ error: "Missing team ID" }, { status: 400 });
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id, event_id, leader_id")
    .eq("id", teamId)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Leader withdraws/disbands whole team
  if (action === "withdraw" && team.leader_id === user.id) {
    await supabase.from("registrations").delete().eq("team_id", teamId);
    await supabase.from("teams").delete().eq("id", teamId);
    return NextResponse.json({
      success: true,
      message: "Team disbanded and registration withdrawn.",
    });
  }

  // Member leaving voluntarily
  if (action === "leave" && user.id !== team.leader_id) {
    await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("profile_id", user.id);

    await supabase
      .from("registrations")
      .delete()
      .eq("event_id", team.event_id)
      .eq("profile_id", user.id);

    return NextResponse.json({
      success: true,
      message: "You have left the team.",
    });
  }

  // Leader removing a specific member
  if (memberProfileId) {
    if (team.leader_id !== user.id && memberProfileId !== user.id) {
      return NextResponse.json(
        { error: "Permission denied." },
        { status: 403 },
      );
    }

    if (memberProfileId === team.leader_id) {
      return NextResponse.json(
        { error: "Leader cannot be removed. Disband the team instead." },
        { status: 400 },
      );
    }

    await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("profile_id", memberProfileId);

    await supabase
      .from("registrations")
      .delete()
      .eq("event_id", team.event_id)
      .eq("profile_id", memberProfileId);

    return NextResponse.json({
      success: true,
      message: "Member removed from team.",
    });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
