import { Metadata } from "next";

export const metaDataBase: Metadata = {
  title: {
    default: "Deviators Club | Code. Create. Deviate.",
    template: "%s | Deviators Club",
  },
  description:
    "Deviators Club empowers coders and innovators to learn, build, and lead with workshops, hackathons, and collaborative tech projects. Join our community of passionate developers, entrepreneurs, and tech enthusiasts to explore cutting-edge technologies and transform groundbreaking ideas into reality.",
  keywords:
    "Deviators Club, Code Create Deviate, tech community, innovation hub, developer community, programming club, tech events, hackathons, coding workshops, DCE, Dronacharya College of Engineering, Dronacharya, deviators dronacharya, dce coding club, collaborative tech projects, entrepreneurship, technology education, software development, web development training",
  authors: [{ name: "Deviators Club" }],
  creator: "Deviators Club",
  publisher: "Deviators Club",
  metadataBase: new URL("https://www.deviators.club"),
  alternates: {
    canonical: "https://www.deviators.club",
  },
  openGraph: {
    title: "Deviators Club | Code. Create. Deviate.",
    description:
      "Deviators Club empowers coders and innovators to learn, build, and lead. Join our community for workshops, hackathons, and collaborative tech projects. Transform ideas into reality!",
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
    locale: "en_US",
    type: "website",
    countryName: "India",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deviators Club | Code. Create. Deviate.",
    description:
      "Deviators Club empowers coders and innovators with workshops, hackathons & collaborative tech projects. Join our community and transform ideas into reality!",
    images: ["/og-image.png"],
    creator: "@deviatorsclub",
    site: "@deviatorsclub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Technology",
  classification: "Technology Organization",
  other: {
    "google-site-verification": process.env.GOOGLE_SITE_VERIFICATION || "",
  },
};
