import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFacultyInvitation, normalizeFacultySlug } from "@/data/facultyInvitations";
import FacultyInvitationView from "@/components/events/FacultyInvitationView";

type PageProps = {
  params: Promise<{
    invitationSlug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { invitationSlug } = await params;
  const invitation = getFacultyInvitation(invitationSlug);

  const title = `${invitation.pageTitle} | Deviators Club`;
  const description = `A bespoke invitation from the students of Deviators Club & CSE Department for ${invitation.formalTitle} to grace Debug Decrypt 3.0 at Dronacharya College of Engineering.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/dev%20posters%20new%201.png",
          width: 1200,
          height: 630,
          alt: `Invitation for ${invitation.formalTitle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/dev%20posters%20new%201.png"],
    },
  };
}

export default async function FacultyInvitationPage({ params }: PageProps) {
  const { invitationSlug } = await params;

  // If someone visits /events/debug-decrypt-3.0/round-1, Next.js routes to the static round-1 folder,
  // but if it somehow arrives here, guard against it.
  if (invitationSlug === "round-1") {
    notFound();
  }

  const invitation = getFacultyInvitation(invitationSlug);

  return <FacultyInvitationView invitation={invitation} />;
}
