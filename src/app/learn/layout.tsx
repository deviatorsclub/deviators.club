import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn - Tech Resources & Tutorials | Deviators Club",
  description:
    "Explore comprehensive learning resources for web development, cybersecurity, iOS development, and DSA. Free tutorials and projects by Deviators Club.",
  keywords:
    "tech learning resources, web development tutorials, cybersecurity courses, iOS development, DSA practice, coding tutorials, programming resources, developer education",
  alternates: {
    canonical: "https://www.deviators.club/learn",
  },
  openGraph: {
    title: "Learn - Tech Resources & Tutorials | Deviators Club",
    description:
      "Explore comprehensive learning resources for web development, cybersecurity, iOS development, and DSA. Free tutorials and projects by Deviators Club.",
    url: "https://www.deviators.club/learn",
    siteName: "Deviators Club",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Learn - Tech Resources & Tutorials | Deviators Club",
      },
    ],
  },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
