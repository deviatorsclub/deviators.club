import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFacultyInvitation,
  normalizeFacultySlug,
} from "@/data/facultyInvitations";
import FacultyInvitationView from "@/components/events/FacultyInvitationView";

type PageProps = {
  params: Promise<{
    invitationSlug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { invitationSlug } = await params;
  const invitation = getFacultyInvitation(invitationSlug);

  if (!invitation) {
    return {
      title: "Invitation Not Found | Deviators Club",
      description: "The requested faculty invitation was not found.",
    };
  }

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
          url: invitation.avatarUrl || "/dev%20posters%20new%201.png",
          width: 800,
          height: 800,
          alt: `Invitation for ${invitation.formalTitle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [invitation.avatarUrl || "/dev%20posters%20new%201.png"],
    },
  };
}

export default async function FacultyInvitationPage({ params }: PageProps) {
  const { invitationSlug } = await params;

  if (invitationSlug === "round-1") {
    notFound();
  }

  const invitation = getFacultyInvitation(invitationSlug);
  if (!invitation) {
    notFound();
  }

  return <FacultyInvitationView invitation={invitation} />;
}
