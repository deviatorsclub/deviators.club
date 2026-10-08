import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, isValidPhone, normalizeRollNo } from "@/lib/utils";

// Helper to extract bearer token from Authorization header
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

// POST: Accept or Decline a team invitation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const token = extractToken(req);
  const supabase = getAdminClient(token);
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

  // If declining: remove invite and any pending registration row
  if (action === "decline") {
    await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("profile_id", user.id);

    // Also remove registration row created during leader invite so user can register anew or join other teams
    await supabase
      .from("registrations")
      .delete()
      .eq("event_id", event.id)
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

  const cleanUserPhone = normalizePhone(phone);
  const cleanUserRoll = normalizeRollNo(collegeId);

  if (phone && !isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit mobile number." },
      { status: 400 },
    );
  }

  if (collegeId && (!cleanUserRoll || cleanUserRoll.length < 2)) {
    return NextResponse.json(
      { error: "Please enter a valid college roll number / ID." },
      { status: 400 },
    );
  }

  // Check duplicate phone or roll number in squad
  if (cleanUserPhone || cleanUserRoll) {
    const { data: squadRegs } = await supabase
      .from("registrations")
      .select("profile_id, phone, college_id")
      .eq("event_id", event.id)
      .eq("team_id", teamId);

    if (squadRegs) {
      for (const sr of squadRegs) {
        if (sr.profile_id !== user.id) {
          if (cleanUserPhone && normalizePhone(sr.phone) === cleanUserPhone) {
            return NextResponse.json(
              {
                error: `Duplicate phone number (${cleanUserPhone}) detected in squad. Each member must provide their own distinct phone number.`,
              },
              { status: 400 },
            );
          }
          if (
            cleanUserRoll &&
            normalizeRollNo(sr.college_id) === cleanUserRoll
          ) {
            return NextResponse.json(
              {
                error: `Duplicate roll number (${cleanUserRoll}) detected in squad. Each member must have their own unique college roll number.`,
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // Check duplicate phone or roll number in event registrations
    const { data: allRegs } = await supabase
      .from("registrations")
      .select("profile_id, phone, college_id")
      .eq("event_id", event.id);

    if (allRegs) {
      for (const reg of allRegs) {
        if (reg.profile_id !== user.id) {
          if (cleanUserPhone && normalizePhone(reg.phone) === cleanUserPhone) {
            return NextResponse.json(
              {
                error: `The phone number ${cleanUserPhone} is already registered by another participant for this event. Duplicate phone numbers are not allowed.`,
              },
              { status: 400 },
            );
          }
          if (
            cleanUserRoll &&
            normalizeRollNo(reg.college_id) === cleanUserRoll
          ) {
            return NextResponse.json(
              {
                error: `The roll number ${cleanUserRoll} is already registered by another participant for this event. Duplicate roll numbers are not allowed.`,
              },
              { status: 400 },
            );
          }
        }
      }
    }
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
      phone: cleanUserPhone || phone,
      college_id: cleanUserRoll || collegeId,
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
