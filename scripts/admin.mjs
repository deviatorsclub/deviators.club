// Club admin CLI — talks to Supabase with the SERVICE ROLE key (bypasses RLS).
// Local-only tool. SERVICE_ROLE_KEY lives in .env.local (gitignored) and must
// NEVER be exposed client-side or committed.
//
// Usage (from repo root):
//   node scripts/admin.mjs list-events
//   node scripts/admin.mjs delete-event <slug>
//   node scripts/admin.mjs grant-role <tag> <username>
//   node scripts/admin.mjs revoke-role <tag> <username>
//   node scripts/admin.mjs list-roles

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const env = {};
  try {
    const text = readFileSync(resolve(".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    // no .env.local
  }
  return env;
}

const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SERVICE_ROLE_KEY in .env.local.\n" +
      "Get the service_role key from Supabase → Project Settings → API.",
  );
  process.exit(1);
}

async function api(path, options = {}) {
  const res = await fetch(`${URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    console.error(`Request failed (${res.status}):`, body);
    process.exit(1);
  }
  return body;
}

async function profileId(username) {
  const rows = await api(
    `/profiles?select=id,username&username=eq.${encodeURIComponent(username)}`,
  );
  if (!rows || rows.length === 0) {
    console.error(`No profile found for @${username}. They must sign up first.`);
    process.exit(1);
  }
  return rows[0].id;
}

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case "list-events": {
    const rows = await api("/events?select=slug,title,is_published&order=starts_at");
    console.table(rows);
    break;
  }
  case "delete-event": {
    const [slug] = args;
    if (!slug) {
      console.error("Usage: node scripts/admin.mjs delete-event <slug>");
      process.exit(1);
    }
    await api(`/events?slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE" });
    console.log(`Deleted event '${slug}' (plus its teams/registrations via cascade).`);
    break;
  }
  case "grant-role": {
    const [tag, username] = args;
    if (!tag || !username) {
      console.error("Usage: node scripts/admin.mjs grant-role <tag> <username>");
      process.exit(1);
    }
    const roles = await api(`/roles?select=tag&tag=eq.${encodeURIComponent(tag)}`);
    if (!roles || roles.length === 0) {
      console.error(`Role '${tag}' doesn't exist. Run supabase/seed.sql first.`);
      process.exit(1);
    }
    const id = await profileId(username);
    await api("/profile_roles?on_conflict=profile_id,tag", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ profile_id: id, tag }),
    });
    console.log(`Granted '${tag}' to @${username}.`);
    break;
  }
  case "revoke-role": {
    const [tag, username] = args;
    if (!tag || !username) {
      console.error("Usage: node scripts/admin.mjs revoke-role <tag> <username>");
      process.exit(1);
    }
    const id = await profileId(username);
    await api(
      `/profile_roles?profile_id=eq.${id}&tag=eq.${encodeURIComponent(tag)}`,
      { method: "DELETE" },
    );
    console.log(`Revoked '${tag}' from @${username}.`);
    break;
  }
  case "list-roles": {
    const rows = await api("/roles?select=tag,label&order=tag");
    console.table(rows);
    break;
  }
  default:
    console.error(
      "Usage: node scripts/admin.mjs <list-events|delete-event|grant-role|revoke-role|list-roles>",
    );
    process.exit(1);
}
