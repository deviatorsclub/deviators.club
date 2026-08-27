import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Team - Deviators Club",
  description:
    "Meet the passionate team behind Deviators Club. A diverse group of developers, designers, and tech enthusiasts driving innovation through tech projects.",
  keywords:
    "Deviators Club team, tech community leadership, developer team, programming community, innovation team, tech enthusiasts",
  alternates: {
    canonical: "https://www.deviators.club/team",
  },
  openGraph: {
    title: "Our Team - Deviators Club",
    description:
      "Meet the passionate team behind Deviators Club. Diverse group of developers, designers, and tech enthusiasts driving innovation.",
    url: "https://www.deviators.club/team",
    siteName: "Deviators Club",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Our Team - Deviators Club",
      },
    ],
  },
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
