import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function getServiceRoleKey(): string {
  if (process.env.SERVICE_ROLE_KEY) return process.env.SERVICE_ROLE_KEY;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY)
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const text = readFileSync(resolve(".env.local"), "utf8");
    const m = text.match(
      /^\s*(?:SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*=\s*(.*)$/m,
    );
    if (m && m[1]) {
      const val = m[1].trim();
      process.env.SERVICE_ROLE_KEY = val;
      return val;
    }
  } catch {}
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = getServiceRoleKey();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
