import { NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export interface AuthorizedCandidateUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  isPresident: boolean;
  isLeader: boolean;
  teamId?: string;
  teamName?: string;
  role: "President" | "Team Leader";
}

export async function verifyRound1Auth(req: NextRequest): Promise<{
  user: AuthorizedCandidateUser | null;
  errorStatus?: number;
  errorMessage?: string;
}> {
  try {
    const adminDb = getAdminClient();
    let user: any = null;

    // 1. Bearer Token Check
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data, error } = await adminDb.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    }

    // 2. Cookie Session Fallback
    if (!user) {
      try {
        const serverSupabase = await createServerClient();
        const { data } = await serverSupabase.auth.getUser();
        user = data?.user || null;
      } catch {}
    }

    if (!user) {
      return {
        user: null,
        errorStatus: 401,
        errorMessage:
          "Unauthorized: Please log in to your Deviators Club account.",
      };
    }

    // 3. Profile & Role Validation
    const { data: userProfile } = await adminDb
      .from("profiles")
      .select("id, username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const { data: userRoles } = await adminDb
      .from("profile_roles")
      .select("tag")
      .eq("profile_id", user.id);

    const hasExecutiveRole = (userRoles || []).some((r: any) => {
      const tag = (r.tag || "").toLowerCase().trim();
      return (
        tag === "president" ||
        tag === "club-president" ||
        tag === "faculty-coordinator" ||
        tag === "chief-coordinator" ||
        tag.includes("faculty")
      );
    });

    const usernameLower = (userProfile?.username || "").toLowerCase().trim();
    const emailLower = (user.email || "").toLowerCase().trim();
    const isExecutiveIdentity =
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
      emailLower.includes("anishjuyal6");

    const isPresident = hasExecutiveRole || isExecutiveIdentity;

    // 4. Strict check: Must be the CURRENT active Team Leader for Debug Decrypt 3.0
    const { data: event } = await adminDb
      .from("events")
      .select("id")
      .or("slug.eq.debug-decrypt-3.0,slug.eq.round-1")
      .maybeSingle();

    // Query teams where user is CURRENTLY leader
    const { data: leaderTeams } = await adminDb
      .from("teams")
      .select("id, name, leader_id, event_id")
      .eq("leader_id", user.id);

    const leaderTeam =
      (leaderTeams || []).find((t: any) => !event || t.event_id === event.id) ||
      leaderTeams?.[0];
    const isCurrentLeader = Boolean(
      leaderTeam && leaderTeam.leader_id === user.id,
    );

    // Access check: only CURRENT Team Leaders or Presidents can access
    if (!isPresident && !isCurrentLeader) {
      try {
        const { data: memberships } = await adminDb
          .from("team_members")
          .select("team_id")
          .eq("profile_id", user.id)
          .eq("status", "accepted")
          .limit(1);

        if (memberships && memberships.length > 0) {
          const { data: tRow } = await adminDb
            .from("teams")
            .select("name, leader_id")
            .eq("id", memberships[0].team_id)
            .maybeSingle();

          let leaderHandle = "your Team Leader";
          if (tRow?.leader_id) {
            const { data: lProfile } = await adminDb
              .from("profiles")
              .select("username, display_name")
              .eq("id", tRow.leader_id)
              .maybeSingle();
            if (lProfile?.username) {
              leaderHandle = `@${lProfile.username} (${lProfile.display_name || lProfile.username})`;
            }
          }

          return {
            user: null,
            errorStatus: 403,
            errorMessage: `Forbidden: Round 1 can only be taken by the CURRENT active Team Leader. You are a member of team "${tRow?.name || "your squad"}", but leadership is currently assigned to ${leaderHandle}. Only the active team leader can attempt or submit Round 1. If you need to take it, the current leader must transfer leadership to you.`,
          };
        }
      } catch {}

      return {
        user: null,
        errorStatus: 403,
        errorMessage:
          "Forbidden: Round 1 is exclusively for CURRENT active Team Leaders of Debug Decrypt 3.0 (or Club Executives).",
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email || "",
        username: userProfile?.username || "",
        displayName:
          userProfile?.display_name || userProfile?.username || "Candidate",
        isPresident,
        isLeader: isCurrentLeader,
        teamId: leaderTeam?.id,
        teamName:
          leaderTeam?.name ||
          (isPresident ? "Deviators Club Executive" : "Individual Participant"),
        role: isPresident ? "President" : "Team Leader",
      },
    };
  } catch (err: any) {
    console.error("[verifyRound1Auth error]", err);
    return {
      user: null,
      errorStatus: 500,
      errorMessage: "Authentication service error.",
    };
  }
}

// Backwards compatibility alias
export const verifyPresidentAuth = verifyRound1Auth;
export type AuthorizedPresidentUser = AuthorizedCandidateUser;
