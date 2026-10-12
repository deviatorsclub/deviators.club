export interface FacultyInvitation {
  slug: string;
  name: string;
  honorific: "Ma'am" | "Sir";
  formalTitle: string;
  salutation: string;
  envelopeName: string;
  pageTitle: string;
  department: string;
  designation: string;
  institution: string;
  vipPassCode: string;
  avatarUrl?: string | null;
  initials: string;
  personalMessage: string;
  surpriseNote: string;
  eventDateText: string;
  eventTimeText: string;
  eventVenueText: string;
}

export const FACULTY_INVITATIONS: Record<string, FacultyInvitation> = {
  "ashima-mehta": {
    slug: "ashima-mehta",
    name: "Prof. Ashima Mehta",
    honorific: "Ma'am",
    formalTitle: "Prof. Ashima Mehta Ma'am",
    salutation: "Dear Prof. Ashima Mehta Ma'am,",
    envelopeName: "For Prof. Ashima Mehta Ma'am",
    pageTitle: "An Invitation for Prof. Ashima Mehta Ma'am • Debug Decrypt 3.0",
    department: "Department of Computer Science & Engineering",
    designation: "Head of Department & Professor",
    institution: "Dronacharya College of Engineering",
    vipPassCode: "VIP-DD3-FACULTY-01",
    avatarUrl: null, // Will be populated with image URL
    initials: "AM",
    personalMessage:
      "Some of our best ideas started with a question you encouraged us to ask. We would be deeply honored and delighted to have you grace Debug Decrypt 3.0 — a celebration of curiosity, algorithms, and the spirit of innovation at Deviators Club.",
    surpriseNote:
      "For every question you welcomed, every milestone you inspired, and every student you believed in — thank you. Tonight, a little of that courage becomes code. ♡",
    eventDateText: "13 & 15 October 2026",
    eventTimeText: "7:00 PM IST (Prelims) · 10:00 AM IST (Grand Finale)",
    eventVenueText: "Online Arena & Campus Auditorium, DCE",
  },
  "isha-malhotra": {
    slug: "isha-malhotra",
    name: "Prof. Isha Malhotra",
    honorific: "Ma'am",
    formalTitle: "Prof. Isha Malhotra Ma'am",
    salutation: "Dear Prof. Isha Malhotra Ma'am,",
    envelopeName: "For Prof. Isha Malhotra Ma'am",
    pageTitle: "An Invitation for Prof. Isha Malhotra Ma'am • Debug Decrypt 3.0",
    department: "Department of Computer Science & Engineering",
    designation: "Professor & Academic Mentor",
    institution: "Dronacharya College of Engineering",
    vipPassCode: "VIP-DD3-FACULTY-02",
    avatarUrl: null,
    initials: "IM",
    personalMessage:
      "Your unwavering encouragement fuels our pursuit of excellence. We warmly invite you to join us as our Guest of Honor at Debug Decrypt 3.0 to witness our students take on challenging computational problems.",
    surpriseNote:
      "Your guidance has always shown us that no problem is too hard to solve. Thank you for always standing behind us! ♡",
    eventDateText: "13 & 15 October 2026",
    eventTimeText: "7:00 PM IST (Prelims) · 10:00 AM IST (Grand Finale)",
    eventVenueText: "Online Arena & Campus Auditorium, DCE",
  },
  "yashwardhan-soni": {
    slug: "yashwardhan-soni",
    name: "Prof. Yashwardhan Soni",
    honorific: "Sir",
    formalTitle: "Prof. Yashwardhan Soni Sir",
    salutation: "Dear Prof. Yashwardhan Soni Sir,",
    envelopeName: "For Prof. Yashwardhan Soni Sir",
    pageTitle: "An Invitation for Prof. Yashwardhan Soni Sir • Debug Decrypt 3.0",
    department: "Department of Computer Science & Engineering",
    designation: "Associate Professor & Tech Mentor",
    institution: "Dronacharya College of Engineering",
    vipPassCode: "VIP-DD3-FACULTY-03",
    avatarUrl: null,
    initials: "YS",
    personalMessage:
      "Your technical insights and passion for computing have continually inspired our community. We would be privileged to have you with us at Debug Decrypt 3.0 as we challenge the brightest minds across departments.",
    surpriseNote:
      "Thank you for teaching us to think critically and debug deeper. Your mentorship makes every breakthrough possible! ♡",
    eventDateText: "13 & 15 October 2026",
    eventTimeText: "7:00 PM IST (Prelims) · 10:00 AM IST (Grand Finale)",
    eventVenueText: "Online Arena & Campus Auditorium, DCE",
  },
  "pooja": {
    slug: "pooja",
    name: "Prof. Pooja",
    honorific: "Ma'am",
    formalTitle: "Prof. Pooja Ma'am",
    salutation: "Dear Prof. Pooja Ma'am,",
    envelopeName: "For Prof. Pooja Ma'am",
    pageTitle: "An Invitation for Prof. Pooja Ma'am • Debug Decrypt 3.0",
    department: "Department of Computer Science & Engineering",
    designation: "Assistant Professor & Faculty Coordinator",
    institution: "Dronacharya College of Engineering",
    vipPassCode: "VIP-DD3-FACULTY-04",
    avatarUrl: null,
    initials: "PM",
    personalMessage:
      "Your support and encouragement inspire our students every day. We are delighted to invite you to Debug Decrypt 3.0 to celebrate innovation, teamwork, and code with the Deviators Club.",
    surpriseNote:
      "Thank you for always fostering curiosity in every student you mentor. We are honored to celebrate this moment with you! ♡",
    eventDateText: "13 & 15 October 2026",
    eventTimeText: "7:00 PM IST (Prelims) · 10:00 AM IST (Grand Finale)",
    eventVenueText: "Online Arena & Campus Auditorium, DCE",
  },
  "monika": {
    slug: "monika",
    name: "Prof. Monika",
    honorific: "Ma'am",
    formalTitle: "Prof. Monika Ma'am",
    salutation: "Dear Prof. Monika Ma'am,",
    envelopeName: "For Prof. Monika Ma'am",
    pageTitle: "An Invitation for Prof. Monika Ma'am • Debug Decrypt 3.0",
    department: "Department of Computer Science & Engineering",
    designation: "Assistant Professor & Faculty Mentor",
    institution: "Dronacharya College of Engineering",
    vipPassCode: "VIP-DD3-FACULTY-05",
    avatarUrl: null,
    initials: "MM",
    personalMessage:
      "Your dedicated mentorship has been a pillar for our learners. We would love for you to join us at Debug Decrypt 3.0 and witness the passion and skill of our participants.",
    surpriseNote:
      "For every student you motivated to aim higher, thank you from all of us at Deviators Club. ♡",
    eventDateText: "13 & 15 October 2026",
    eventTimeText: "7:00 PM IST (Prelims) · 10:00 AM IST (Grand Finale)",
    eventVenueText: "Online Arena & Campus Auditorium, DCE",
  },
  "neha": {
    slug: "neha",
    name: "Prof. Neha",
    honorific: "Ma'am",
    formalTitle: "Prof. Neha Ma'am",
    salutation: "Dear Prof. Neha Ma'am,",
    envelopeName: "For Prof. Neha Ma'am",
    pageTitle: "An Invitation for Prof. Neha Ma'am • Debug Decrypt 3.0",
    department: "Department of Computer Science & Engineering",
    designation: "Assistant Professor & Faculty Mentor",
    institution: "Dronacharya College of Engineering",
    vipPassCode: "VIP-DD3-FACULTY-06",
    avatarUrl: null,
    initials: "NM",
    personalMessage:
      "We warmly invite you to Debug Decrypt 3.0. Your presence will inspire our students as they take on intense rounds of debugging and problem-solving.",
    surpriseNote:
      "Thank you for your continuous support, kindness, and enthusiasm for student initiatives! ♡",
    eventDateText: "13 & 15 October 2026",
    eventTimeText: "7:00 PM IST (Prelims) · 10:00 AM IST (Grand Finale)",
    eventVenueText: "Online Arena & Campus Auditorium, DCE",
  },
  "ashwani": {
    slug: "ashwani",
    name: "Prof. Ashwani",
    honorific: "Sir",
    formalTitle: "Prof. Ashwani Sir",
    salutation: "Dear Prof. Ashwani Sir,",
    envelopeName: "For Prof. Ashwani Sir",
    pageTitle: "An Invitation for Prof. Ashwani Sir • Debug Decrypt 3.0",
    department: "Department of Computer Science & Engineering",
    designation: "Assistant Professor & Tech Mentor",
    institution: "Dronacharya College of Engineering",
    vipPassCode: "VIP-DD3-FACULTY-07",
    avatarUrl: null,
    initials: "AS",
    personalMessage:
      "We cordially invite you to join us as our Honored Guest at Debug Decrypt 3.0. Your encouragement means the world to our engineering and coding enthusiasts.",
    surpriseNote:
      "Thank you for constantly inspiring us to build, innovate, and persevere through tough challenges. ♡",
    eventDateText: "13 & 15 October 2026",
    eventTimeText: "7:00 PM IST (Prelims) · 10:00 AM IST (Grand Finale)",
    eventVenueText: "Online Arena & Campus Auditorium, DCE",
  },
};

/**
 * Normalizes input slugs such as:
 * - "invitation-ashima-mehta"
 * - "invite-ashima-mehta"
 * - "ashima-mehta"
 * - "prof-ashima-mehta"
 */
export function normalizeFacultySlug(rawSlug: string): string {
  if (!rawSlug) return "";
  let clean = decodeURIComponent(rawSlug).trim().toLowerCase();
  clean = clean.replace(/^(invitation|invite)[-_]/, "");
  clean = clean.replace(/^prof[-_]/, "");
  return clean;
}

/**
 * Retrieves faculty invitation by slug, with dynamic fallback creation
 * for any unlisted faculty so custom invite links work seamlessly.
 */
export function getFacultyInvitation(rawSlug: string): FacultyInvitation {
  const normalized = normalizeFacultySlug(rawSlug);

  if (FACULTY_INVITATIONS[normalized]) {
    return FACULTY_INVITATIONS[normalized];
  }

  // Format a dynamic faculty member if slug doesn't match registry
  const words = normalized
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

  const teacherName = words.length > 0 ? words.join(" ") : "Respected Faculty";
  const initials = words.length > 0 ? words.map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "FC";

  return {
    slug: normalized || "honored-faculty",
    name: `Prof. ${teacherName}`,
    honorific: "Ma'am",
    formalTitle: `Prof. ${teacherName}`,
    salutation: `Dear Prof. ${teacherName},`,
    envelopeName: `For Prof. ${teacherName}`,
    pageTitle: `An Invitation for Prof. ${teacherName} • Debug Decrypt 3.0`,
    department: "Department of Computer Science & Engineering",
    designation: "Honored Faculty Mentor",
    institution: "Dronacharya College of Engineering",
    vipPassCode: `VIP-DD3-${initials}-${Math.floor(100 + Math.random() * 900)}`,
    avatarUrl: null,
    initials,
    personalMessage:
      "Some of our best ideas started with a question you encouraged us to ask. We would be delighted to have you with us at Debug Decrypt 3.0 — a celebration of curiosity, creativity, and the joy of figuring things out together.",
    surpriseNote:
      "For every question you welcomed, every attempt you encouraged, and every student you believed in — thank you. Tonight, a little of that courage becomes code. ♡",
    eventDateText: "13 & 15 October 2026",
    eventTimeText: "7:00 PM IST (Prelims) · 10:00 AM IST (Grand Finale)",
    eventVenueText: "Online Arena & Campus Auditorium, DCE",
  };
}
