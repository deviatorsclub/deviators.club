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

    const hasPresidentRole = (userRoles || []).some(
      (r: any) => r.tag === "president" || r.tag === "club-official",
    );

    const usernameLower = (userProfile?.username || "").toLowerCase();
    const emailLower = (user.email || "").toLowerCase();
    const isPresidentIdentity =
      usernameLower === "akshitbhandaricodes" ||
      usernameLower === "aarushi" ||
      usernameLower === "deviatorsclub" ||
      emailLower.includes("akshitbhandaricodes") ||
      emailLower.includes("arushik");

    const isPresident = hasPresidentRole || isPresidentIdentity;

    // 4. Check if user is a Team Leader for Debug Decrypt 3.0
    const { data: leaderTeams } = await adminDb
      .from("teams")
      .select("id, name, event_id")
      .eq("leader_id", user.id);

    const { data: event } = await adminDb
      .from("events")
      .select("id")
      .or("slug.eq.debug-decrypt-3.0,slug.eq.round-1")
      .maybeSingle();

    const leaderTeam =
      (leaderTeams || []).find((t: any) => !event || t.event_id === event.id) ||
      leaderTeams?.[0];
    const isLeader = Boolean(leaderTeam);

    // Access check: only Team Leaders or Presidents can access
    if (!isPresident && !isLeader) {
      return {
        user: null,
        errorStatus: 403,
        errorMessage:
          "Forbidden: Round 1 is exclusively for registered Team Leaders (or Club Presidents).",
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
        isLeader,
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
