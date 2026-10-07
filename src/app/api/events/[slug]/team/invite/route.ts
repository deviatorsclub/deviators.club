import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

async function getAuthUser() {
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

// POST: Accept or Decline a team invitation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const supabase = getAdminClient();
  const body = await req.json();
  const {
    teamId,
    action,
    phone = "",
    collegeId = "",
    branch = "",
    section = "",
  } = body;

  if (!teamId || !action || !["accept", "decline"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  // Find event
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, max_team_size")
    .or(`slug.eq.${slug},slug.eq.debug-decrypt-3.0`)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  // Find target team
  const { data: team } = await supabase
    .from("teams")
    .select("id, name, event_id")
    .eq("id", teamId)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  // If declining: remove invite
  if (action === "decline") {
    await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("profile_id", user.id);

    return NextResponse.json({
      success: true,
      message: `Declined invitation to join ${team.name}.`,
    });
  }

  // If accepting:
  // Rule 2 check: People can only join one team at a time!
  // Check if user is already an accepted member in any team for this event
  const { data: existingMemberships } = await supabase
    .from("team_members")
    .select("team_id, status, teams!inner(event_id, name)")
    .eq("profile_id", user.id)
    .eq("status", "accepted")
    .eq("teams.event_id", event.id);

  if (existingMemberships && existingMemberships.length > 0) {
    const currentTeamName =
      (existingMemberships[0].teams as any)?.name || "another team";
    return NextResponse.json(
      {
        error: `You are already part of "${currentTeamName}". You must leave your current team before joining a new one.`,
      },
      { status: 400 },
    );
  }

  // Check if target team is already full
  const { count: currentMemberCount } = await supabase
    .from("team_members")
    .select("profile_id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "accepted");

  const max = event.max_team_size || 3;
  if ((currentMemberCount || 0) >= max) {
    return NextResponse.json(
      { error: `This team already has the maximum ${max} accepted members.` },
      { status: 400 },
    );
  }

  // Update status to accepted
  const { error: updErr } = await supabase
    .from("team_members")
    .update({ status: "accepted" })
    .eq("team_id", teamId)
    .eq("profile_id", user.id);

  if (updErr) {
    return NextResponse.json(
      { error: "Could not accept invitation. Please try again." },
      { status: 500 },
    );
  }

  // Register the user under this team with contact and academic details
  const detailsStr =
    `Branch: ${branch || ""} | Section: ${section || ""}`.trim();
  await supabase.from("registrations").upsert(
    {
      event_id: event.id,
      profile_id: user.id,
      team_id: teamId,
      phone,
      college_id: collegeId,
      expectations: detailsStr,
      status: "confirmed",
    },
    { onConflict: "event_id,profile_id" },
  );

  if (branch) {
    await supabase.from("profiles").update({ branch }).eq("id", user.id);
  }

  return NextResponse.json({
    success: true,
    message: `You have successfully joined "${team.name}"!`,
  });
}
