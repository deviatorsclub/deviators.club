import { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import TeamPreviewSection from "@/components/home/TeamPreview";
import ImageCarousel from "@/components/home/ImageCarousel";
import events from "@/data/event";
import GroupPicture from "@/assets/group_pic.webp";

export const metadata: Metadata = {
  title: "Deviators Club - Code. Create. Deviate.",
  description:
    "Deviators Club empowers coders and innovators to learn, build, and lead with workshops, hackathons, and collaborative tech projects. Join our passionate community of developers and tech enthusiasts to transform ideas into reality!",
  keywords:
    "Deviators Club, Code Create Deviate, tech community, hackathons, coding workshops, collaborative tech projects, programming club, innovation hub, developer community, tech empowerment",
  alternates: {
    canonical: "https://www.deviators.club",
  },
  openGraph: {
    title: "Deviators Club - Code. Create. Deviate.",
    description:
      "Deviators Club empowers coders and innovators to learn, build, and lead. Join our community for workshops, hackathons, and collaborative tech projects.",
    images: ["/og-image.png"],
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
