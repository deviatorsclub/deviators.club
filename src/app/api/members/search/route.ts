import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export type SearchMemberResult = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  branch: string;
  year: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawQ = (searchParams.get("q") || "").trim();
  const selfId = searchParams.get("selfId") || "";

  if (!rawQ || rawQ.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const supabase = getAdminClient();
  const qClean = rawQ.replace(/^@/, "").toLowerCase();
  const isEmailQuery =
    rawQ.includes("@") || rawQ.includes(".") || rawQ.length >= 3;

  try {
    const resultsMap = new Map<string, SearchMemberResult>();

    // 1. Prefix and substring search on profiles (username & display_name)
    const { data: profileMatches, error: pErr } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, branch, year")
      .eq("onboarded", true)
      .or(`username.ilike.${qClean}%,display_name.ilike.%${qClean}%`)
      .limit(8);

    if (!pErr && profileMatches) {
      for (const p of profileMatches) {
        if (p.id !== selfId) {
          resultsMap.set(p.id, {
            id: p.id,
            username: p.username,
            displayName: p.display_name || p.username,
            email: "",
            avatarUrl: p.avatar_url || "",
            branch: p.branch || "CSE",
            year: p.year || "3rd Year",
          });
        }
      }
    }

    // 2. Email matching via auth admin (for users searching by college or personal email)
    if (isEmailQuery && process.env.SERVICE_ROLE_KEY) {
      const { data: authUsers } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 50,
      });

      if (authUsers?.users) {
        const matchedUsers = authUsers.users.filter(
          (u) =>
            u.id !== selfId &&
            u.email &&
            u.email.toLowerCase().includes(rawQ.toLowerCase()),
        );

        if (matchedUsers.length > 0) {
          const userIds = matchedUsers.map((u) => u.id);
          const { data: matchedProfiles } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url, branch, year")
            .in("id", userIds)
            .eq("onboarded", true);

          if (matchedProfiles) {
            for (const mp of matchedProfiles) {
              const authUser = matchedUsers.find((u) => u.id === mp.id);
              resultsMap.set(mp.id, {
                id: mp.id,
                username: mp.username,
                displayName: mp.display_name || mp.username,
                email: authUser?.email || "",
                avatarUrl: mp.avatar_url || "",
                branch: mp.branch || "CSE",
                year: mp.year || "3rd Year",
              });
            }
          }
        }
      }
    }

    const results = Array.from(resultsMap.values()).slice(0, 8);
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("[search api error]:", error);
    return NextResponse.json(
      { results: [], error: error.message },
      { status: 500 },
    );
  }
}
