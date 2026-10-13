import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function main() {
  const envContent = fs.readFileSync(".env.local", "utf8");
  const env = Object.fromEntries(
    envContent
      .split("\n")
      .filter((l) => l.includes("="))
      .map((l) => {
        const idx = l.indexOf("=");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  );

  const supabase = createClient(
    env["NEXT_PUBLIC_SUPABASE_URL"],
    env["SERVICE_ROLE_KEY"]
  );

  const [
    { data: teamsData },
    { data: membersData },
    { data: profilesData },
    { data: registrationsData },
    { data: r1Data },
  ] = await Promise.all([
    supabase.from("teams").select("*").order("created_at", { ascending: false }),
    supabase.from("team_members").select("*"),
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, branch, section, year"),
    supabase
      .from("event_registrations")
      .select("user_id, phone, college_id, branch, section, year")
      .eq("event_slug", "debug-decrypt-3.0"),
    supabase
      .from("round1_sessions")
      .select("user_id, status, score, max_score, submitted_at, strike_count"),
  ]);

  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map((usersData?.users || []).map((u) => [u.id, u.email || ""]));
  const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));
  const regMap = new Map((registrationsData || []).map((r) => [r.user_id, r]));
  const r1Map = new Map((r1Data || []).map((r) => [r.user_id, r]));

  const membersByTeam = new Map();
  (membersData || []).forEach((m) => {
    if (!membersByTeam.has(m.team_id)) membersByTeam.set(m.team_id, []);
    membersByTeam.get(m.team_id).push(m);
  });

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const headers = [
    "S.No",
    "Team ID",
    "Team Name",
    "Created Date",
    "Total Members",
    "Accepted Members",
    "Pending Invites",
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

  const rows = (teamsData || []).map((t, idx) => {
    const rawMembers = membersByTeam.get(t.id) || [];
    const leaderProf = profileMap.get(t.leader_id);
    const leaderReg = regMap.get(t.leader_id);
    const leaderEmail = emailMap.get(t.leader_id) || "";

    const memberDetails = rawMembers.map((m) => {
      const p = profileMap.get(m.profile_id);
      const r = regMap.get(m.profile_id);
      const email = emailMap.get(m.profile_id) || "";
      return {
        id: m.profile_id,
        isLeader: m.profile_id === t.leader_id,
        status: m.status,
        name: p?.display_name || p?.username || "Member",
        username: p?.username || "",
        email,
        phone: r?.phone || "",
        rollNo: r?.college_id || "",
        branch: r?.branch || p?.branch || "",
        section: r?.section || p?.section || "",
        year: r?.year || p?.year || "",
      };
    });

    const teammates = memberDetails.filter((m) => !m.isLeader);
    const m2 = teammates[0];
    const m3 = teammates[1];

    const allMemberIds = [t.leader_id, ...memberDetails.map((m) => m.id)];
    const r1Session =
      r1Map.get(t.leader_id) ||
      allMemberIds.map((id) => r1Map.get(id)).find(Boolean);

    const r1Status = r1Session ? r1Session.status : "Not Attempted";
    const r1Score =
      r1Session && r1Session.score !== null ? r1Session.score : "N/A";
    const r1Max = r1Session?.max_score ?? 30;
    const r1Sub = r1Session?.submitted_at
      ? new Date(r1Session.submitted_at).toLocaleString("en-IN")
      : "N/A";
    const r1Strikes = r1Session?.strike_count ?? 0;

    const summary = memberDetails
      .map(
        (m) =>
          `${m.name} (@${m.username}, ${m.status}, Roll: ${m.rollNo || "N/A"}, Phone: ${m.phone || "N/A"}, Branch: ${m.branch || "N/A"})`
      )
      .join(" | ");

    return [
      idx + 1,
      escapeCsv(t.id),
      escapeCsv(t.name),
      escapeCsv(new Date(t.created_at).toLocaleString("en-IN")),
      memberDetails.length,
      memberDetails.filter((m) => m.status === "accepted").length,
      memberDetails.filter((m) => m.status === "pending").length,
      escapeCsv(leaderProf?.display_name || leaderProf?.username || "Leader"),
      escapeCsv("@" + (leaderProf?.username || "")),
      escapeCsv(leaderEmail),
      escapeCsv(leaderReg?.phone || ""),
      escapeCsv(leaderReg?.college_id || ""),
      escapeCsv(leaderReg?.branch || leaderProf?.branch || ""),
      escapeCsv(leaderReg?.section || leaderProf?.section || ""),
      escapeCsv(leaderReg?.year || leaderProf?.year || ""),
      escapeCsv(m2?.name || ""),
      escapeCsv(m2 ? "@" + m2.username : ""),
      escapeCsv(m2?.email || ""),
      escapeCsv(m2?.phone || ""),
      escapeCsv(m2?.rollNo || ""),
      escapeCsv(m2?.branch || ""),
      escapeCsv(m2?.section || ""),
      escapeCsv(m2?.status || ""),
      escapeCsv(m3?.name || ""),
      escapeCsv(m3 ? "@" + m3.username : ""),
      escapeCsv(m3?.email || ""),
      escapeCsv(m3?.phone || ""),
      escapeCsv(m3?.rollNo || ""),
      escapeCsv(m3?.branch || ""),
      escapeCsv(m3?.section || ""),
      escapeCsv(m3?.status || ""),
      escapeCsv(r1Status),
      escapeCsv(r1Score),
      escapeCsv(r1Max),
      escapeCsv(r1Sub),
      escapeCsv(r1Strikes),
      escapeCsv(summary),
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const targetPath = path.resolve("./public/debug_decrypt_teams_all.csv");
  fs.writeFileSync(targetPath, csvContent, "utf8");
  console.log("SUCCESS: Exported", rows.length, "teams to", targetPath);
}

main().catch(console.error);
