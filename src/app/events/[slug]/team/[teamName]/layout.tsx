import type { Metadata } from "next";
import { getEventDetails } from "@/data/eventDetails";
import { getAdminClient } from "@/lib/supabase/admin";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; teamName: string }>;
}): Promise<Metadata> {
  const { slug, teamName: rawTeamName } = await params;
  const cleanTeamName = decodeURIComponent(rawTeamName)
    .replace(/^@/, "")
    .trim();
  const event = getEventDetails(slug);
  const siteUrl = "https://www.deviators.club";
  const ogImage = `${siteUrl}/dev%20posters%20new%201.png`;

  try {
    const supabase = getAdminClient();
    const { data: team } = await supabase
      .from("teams")
      .select("id, name")
      .ilike("name", cleanTeamName)
      .maybeSingle();

    if (!team) {
      return {
        title: `Team Not Found · ${event.title} | Deviators Club`,
        description: `No registered team named @${cleanTeamName} found for ${event.title}.`,
      };
    }

    const title = `Team "${team.name}" — ${event.title} Contender | Deviators Club`;
    const description = `⚡ Meet team "${team.name}" competing in ${event.title} on 15 Oct 2026 at DCE Gurugram! View their official squad roster and contender badge on Deviators Club.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${siteUrl}/events/${slug}/team/@${encodeURIComponent(team.name)}`,
        siteName: "Deviators Club",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `Team "${team.name}" Contender Badge`,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: `Team "${cleanTeamName}" · ${event.title} | Deviators Club`,
      description: `Official Contender Card for team ${cleanTeamName} participating in ${event.title}.`,
    };
  }
}

export default function TeamShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
