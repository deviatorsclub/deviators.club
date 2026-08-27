import { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import TeamPreviewSection from "@/components/home/TeamPreview";
import ImageCarousel from "@/components/home/ImageCarousel";
import events from "@/data/event";
import GroupPicture from "@/assets/group_pic.webp";

export const metadata: Metadata = {
  title: "Deviators Club | Code. Create. Deviate.",
  description:
    "Deviators Club empowers coders to learn, build, and lead. Join our passionate community for workshops, hackathons, and collaborative tech projects.",
  keywords:
    "Deviators Club, Code Create Deviate, tech community, hackathons, coding workshops, collaborative tech projects, programming club, innovation hub, developer community, tech empowerment",
  alternates: {
    canonical: "https://www.deviators.club",
  },
  openGraph: {
    title: "Deviators Club | Code. Create. Deviate.",
    description:
      "Deviators Club empowers coders to learn, build, and lead. Join our passionate community for workshops, hackathons, and collaborative tech projects.",
    url: "https://www.deviators.club",
    siteName: "Deviators Club",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Deviators Club | Code. Create. Deviate.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default function Home() {
  const images = [
    GroupPicture,
    ...events.map((event) => event.images[event.index]),
  ];
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <TeamPreviewSection />
      <ImageCarousel images={images} />
    </main>
  );
}
