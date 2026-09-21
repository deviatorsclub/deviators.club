"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  DemoEvent,
  DemoMember,
  DemoProfile,
  DemoRegistration,
  ProfileTag,
} from "./demo";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  pronouns: string;
  location: string;
  branch: string;
  year: string;
  avatar_url: string;
  provider: string;
  github_url: string;
  linkedin_url: string;
  website: string;
  onboarded: boolean;
  created_at: string;
};

type EventRow = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  venue: string;
  mode: string;
  starts_at: string;
  ends_at: string;
  reg_closes_at: string;
  max_team_size: number;
  is_team_event: boolean;
  seats: number;
};

function toProfile(email: string, row: ProfileRow): DemoProfile {
  return {
    email,
    displayName: row.display_name,
    username: row.username,
    bio: row.bio,
    pronouns: row.pronouns,
    location: row.location,
    branch: row.branch,
    year: row.year,
    avatarUrl: row.avatar_url,
    provider: (row.provider as DemoProfile["provider"]) ?? "email",
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    website: row.website,
    onboarded: row.onboarded,
    memberSince: row.created_at ?? "",
  };
}

function toEvent(row: EventRow, seatsTaken: number): DemoEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    venue: row.venue,
    mode: row.mode,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    regClosesAt: row.reg_closes_at,
    maxTeamSize: row.max_team_size,
    isTeamEvent: row.is_team_event,
    seats: row.seats,
    seatsTaken,
  };
}

export async function fetchProfile(
  userId: string,
  email: string,
): Promise<DemoProfile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return toProfile(email, data as ProfileRow);
}

export async function fetchProfileTags(userId: string): Promise<ProfileTag[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profile_roles")
    .select("tag,roles(label,tone)")
    .eq("profile_id", userId);
  return (data ?? []).map((r) => {
    const role = r.roles as unknown as {
      label: string;
      tone: string;
    } | null;
    return {
      tag: r.tag as string,
      label: role?.label ?? (r.tag as string),
      tone: role?.tone ?? "bg-white/[0.06] text-white/70 border-white/10",
    };
  });
}

/** Every member gets the 'member' tag on signup (allowed by RLS policy). */
export async function claimMemberTag(userId: string) {
  const supabase = createClient();
  await supabase
    .from("profile_roles")
    .insert({ profile_id: userId, tag: "member" });
}
type DbErrorShape = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

/**
 * Translate a raw Supabase/Postgres error into a plain sentence for the UI.
 * Raw messages like "invalid regular expression: invalid character range"
 * must never reach the screen.
 */
function toSentence(raw: unknown, fallback: string): string {
  const err = (raw ?? {}) as DbErrorShape;
  console.error("[db]", JSON.stringify(err), err);
  const code = err.code ?? "";
  const message = err.message ?? "";

  if (!code && !message) {
    return "Couldn't reach the database. Check your connection and try again.";
  }
  if (code === "23505" || /duplicate key|already exists/i.test(message)) {
    if (/username/i.test(message)) {
      return "That username is taken — try another one.";
    }
    return "This is already saved — nothing new to add.";
  }
  if (code === "23514" || /check constraint|violates check/i.test(message)) {
    if (/username/i.test(message)) {
      return "Usernames must be 3–30 characters: lowercase letters, numbers, - and _ only.";
    }
    if (/branch/i.test(message)) {
      return "Please pick a branch from the given options.";
    }
    if (/year/i.test(message)) {
      return "Please pick a year from the given options.";
    }
    return "One of the fields has a value we can't save — please review and retry.";
  }
  if (code === "2201B" || /invalid regular expression/i.test(message)) {
    return "A field contains characters we can't save — use letters, numbers, - and _ only.";
  }
  if (
    code === "42501" ||
    /row-level security|permission denied/i.test(message)
  ) {
    return "You don't have permission for that. Log out and back in, then retry.";
  }
  if (code === "PGRST204" || /schema cache/i.test(message)) {
    return "The database is out of sync — run the latest schema and try again.";
  }
  return fallback;
}

export async function upsertProfile(
  userId: string,
  email: string,
  p: DemoProfile,
) {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username: p.username,
      display_name: p.displayName,
      bio: p.bio,
      pronouns: p.pronouns,
      location: p.location,
      branch: p.branch,
      year: p.year,
      avatar_url: p.avatarUrl,
      provider: p.provider,
      github_url: p.githubUrl,
      linkedin_url: p.linkedinUrl,
      website: p.website,
      onboarded: p.onboarded,
    },
    { onConflict: "id" },
  );
  if (!error) return { error: null };
  return {
    error: toSentence(error, "Couldn't save your profile. Please try again."),
  };
}

export async function isUsernameTakenDb(username: string, selfId?: string) {
  const u = username.trim().toLowerCase();
  if (!u) return false;
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", u)
    .limit(1);
  if (!data || data.length === 0) return false;
  if (selfId && data[0].id === selfId) return false;
  return true;
}

export async function searchMembersDb(
  q: string,
  selfId: string,
): Promise<DemoMember[]> {
  const query = q.trim();
  if (!query) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username,display_name,year")
    .eq("onboarded", true)
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq("id", selfId)
    .limit(5);
  return (data ?? []).map((r) => ({
    username: r.username as string,
    displayName: (r.display_name as string) || (r.username as string),
    year: (r.year as string) || "",
  }));
}

export async function fetchEventsDb(): Promise<DemoEvent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .order("starts_at", { ascending: true });
  if (!data || data.length === 0) return [];
  const counts = await Promise.all(
    data.map((e) =>
      supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", (e as EventRow).id)
        .eq("status", "confirmed"),
    ),
  );
  return data.map((e, i) => toEvent(e as EventRow, counts[i].count ?? 0));
}

export async function fetchRegistrationsDb(
  userId: string,
): Promise<DemoRegistration[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("registrations")
    .select("event_id,phone,college_id,year,created_at,team_id,teams(name)")
    .eq("profile_id", userId)
    .eq("status", "confirmed");
  if (!data) return [];

  const regs: DemoRegistration[] = await Promise.all(
    data.map(async (r) => {
      let teamName: string | null = null;
      let mates: string[] = [];
      const teamId = r.team_id as string | null;
      if (teamId) {
        const team = r.teams as unknown as { name: string } | null;
        teamName = team?.name ?? null;
        const { data: tm } = await supabase
          .from("team_members")
          .select("profiles(username)")
          .eq("team_id", teamId)
          .neq("profile_id", userId)
          .eq("status", "accepted");
        mates = (tm ?? [])
          .map(
            (x) =>
              (x.profiles as unknown as { username: string } | null)
                ?.username ?? "",
          )
          .filter(Boolean);
      }
      return {
        eventId: r.event_id as string,
        teamName,
        teamMembers: mates,
        phone: (r.phone as string) ?? "",
        collegeId: (r.college_id as string) ?? "",
        year: (r.year as string) ?? "",
        registeredAt: (r.created_at as string) ?? new Date().toISOString(),
      };
    }),
  );
  return regs;
}

export async function createRegistrationDb(args: {
  eventId: string;
  userId: string;
  phone: string;
  collegeId: string;
  year: string;
  expectations: string;
  mode: "solo" | "team";
  teamName: string;
  mateUsernames: string[];
}): Promise<{ error: string | null; reg?: DemoRegistration }> {
  const supabase = createClient();
  let teamId: string | null = null;

  if (args.mode === "team") {
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .insert({
        event_id: args.eventId,
        name: args.teamName,
        leader_id: args.userId,
      })
      .select("id")
      .single();
    if (teamErr || !team) {
      return {
        error: toSentence(
          teamErr,
          "Couldn't create your team. Please try again.",
        ),
      };
    }
    teamId = (team as { id: string }).id;

    if (args.mateUsernames.length > 0) {
      const { data: mateProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("username", args.mateUsernames);
      if (mateProfiles && mateProfiles.length > 0) {
        await supabase.from("team_members").insert(
          mateProfiles.map((m) => ({
            team_id: teamId,
            profile_id: (m as { id: string }).id,
            status: "pending",
          })),
        );
      }
    }
    // Leader is implicitly accepted
    await supabase.from("team_members").insert({
      team_id: teamId,
      profile_id: args.userId,
      status: "accepted",
    });
  }

  const { error } = await supabase.from("registrations").upsert(
    {
      event_id: args.eventId,
      profile_id: args.userId,
      team_id: teamId,
      phone: args.phone,
      college_id: args.collegeId,
      year: args.year,
      expectations: args.expectations,
      status: "confirmed",
    },
    { onConflict: "event_id,profile_id" },
  );
  if (error) {
    return {
      error: toSentence(
        error,
        "Couldn't complete your registration. Please try again.",
      ),
    };
  }

  return {
    error: null,
    reg: {
      eventId: args.eventId,
      teamName: args.mode === "team" ? args.teamName : null,
      teamMembers: args.mode === "team" ? args.mateUsernames : [],
      phone: args.phone,
      collegeId: args.collegeId,
      year: args.year,
      registeredAt: new Date().toISOString(),
    },
  };
}

export async function withdrawRegistrationDb(eventId: string, userId: string) {
  const supabase = createClient();
  await supabase
    .from("registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", userId);
}
