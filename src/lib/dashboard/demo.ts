"use client";

export type DemoProfile = {
  email: string;
  displayName: string;
  username: string;
  bio: string;
  pronouns: string;
  location: string;
  branch: string;
  year: string;
  avatarUrl: string;
  provider: "github" | "google" | "email";
  githubUrl: string;
  linkedinUrl: string;
  website: string;
  onboarded: boolean;
};

export type DemoEvent = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  venue: string;
  mode: string;
  startsAt: string;
  endsAt: string;
  regClosesAt: string;
  maxTeamSize: number;
  isTeamEvent: boolean;
  seats: number;
  seatsTaken: number;
};

export type DemoRegistration = {
  eventId: string;
  teamName: string | null;
  teamMembers: string[];
  phone: string;
  collegeId: string;
  year: string;
  registeredAt: string;
};

export type DemoMember = {
  username: string;
  displayName: string;
  year: string;
};

export type ProfileTag = {
  tag: string;
  label: string;
  tone: string;
};

export const PRONOUN_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "prefer not to say",
];

export const YEAR_OPTIONS = ["Fresher", "2nd Year", "3rd Year", "4th Year"];

export const BRANCH_OPTIONS = ["CSE", "AIML", "ECE", "IoT", "ECS", "ME/RA"];

const RESERVED_USERNAMES = ["admin", "deviators", "support", "root", "club"];

export function normalizeUsername(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);
}

/** Local fallback for the DB unique constraint on profiles.username. */
export function isUsernameTaken(username: string, exclude?: string) {
  const u = username.trim().toLowerCase();
  if (!u) return false;
  if (exclude && u === exclude.trim().toLowerCase()) return false;
  return RESERVED_USERNAMES.includes(u);
}

export function defaultDemoProfile(
  provider: DemoProfile["provider"] = "email",
): DemoProfile {
  return {
    email: "",
    displayName: "",
    username: "",
    bio: "",
    pronouns: "",
    location: "",
    branch: "CSE",
    year: "Fresher",
    avatarUrl: "",
    provider,
    githubUrl: "",
    linkedinUrl: "",
    website: "",
    onboarded: false,
  };
}
