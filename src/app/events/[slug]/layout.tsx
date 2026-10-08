import type { Metadata } from "next";
import { getEventDetails } from "@/data/eventDetails";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventDetails(slug);
  const siteUrl = "https://www.deviators.club";
  const ogImage = `${siteUrl}/dev%20posters%20new%201.png`;

  const title = `${event.title} — ${event.subtitle || event.mainTagline} | Deviators Club`;
  const description = `${event.subTagline}. 13 Oct Online Shortlisting · 15 Oct DCE Gurugram Finale. Open to all students.`;

  return {
    title,
    description,
    openGraph: {
      title: `${event.title} — Deviators Club`,
      description,
      url: `${siteUrl}/events/${slug}`,
      siteName: "Deviators Club",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${event.title} Official Poster`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} — Deviators Club`,
      description,
      images: [ogImage],
    },
  };
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
