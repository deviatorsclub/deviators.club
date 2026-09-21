import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { eventTitle, teamName } = (await request.json()) as {
    eventTitle?: string;
    teamName?: string | null;
  };
  if (!eventTitle) {
    return NextResponse.json({ error: "Missing event." }, { status: 400 });
  }

  // Client-supplied strings: strip newlines (subject) and escape HTML (body).
  const safeTitle = eventTitle.replace(/[\r\n]/g, "").slice(0, 120);
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const safeTeam = teamName
    ? escapeHtml(teamName.replace(/[\r\n]/g, "").slice(0, 40))
    : null;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RSVP_FROM ?? "Deviators Club <events@deviators.club>",
    to: user.email,
    subject: `You're in: ${safeTitle}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0a0a0a">
        <h2 style="margin:0 0 8px">You're registered for ${escapeHtml(safeTitle)}</h2>
        <p style="margin:0 0 16px;color:#444">
          ${safeTeam ? `Team <strong>${safeTeam}</strong> · ` : ""}Show this email at check-in.
        </p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.deviators.club"}/dashboard"
           style="display:inline-block;background:#0a4fd6;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none">
          Open your dashboard
        </a>
        <p style="margin:16px 0 0;font-size:12px;color:#888">Deviators Club · Code. Create. Deviate.</p>
      </div>
    `,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
