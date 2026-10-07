export type EventDetailsData = {
  slug: string;
  title: string;
  subtitle: string;
  mainTagline: string;
  subTagline: string;
  bannerUrl: string;
  logoUrl: string;
  location: string;
  venueDetails: string;
  mode: string;
  startsAt: string;
  endsAt: string;
  timeRange: string;
  regClosesAt: string;
  minTeamSize: number;
  maxTeamSize: number;
  fee: string;
  categories: string[];
  overview: string;
  progressiveModel: string;
  stages: {
    title: string;
    stageType: string;
    desc: string;
    objective: string;
  }[];
  highlights: string[];
  announcements: {
    id: string;
    title: string;
    content: string;
    postedAt: string;
    author: string;
    tag: string;
  }[];
  timeline: {
    stage: string;
    time: string;
    desc: string;
    active?: boolean;
  }[];
  prizes: {
    rank: string;
    title: string;
    reward: string;
    desc: string;
    tone: string;
  }[];
  specialPrizes: string[];
  rules: string[];
  faqs: { q: string; a: string }[];
  sponsors: {
    name: string;
    tier: string;
    offering: string;
    logoUrl?: string;
    website: string;
  }[];
  closingQuote: {
    heading: string;
    subheading: string;
    ctaText: string;
  };
};

export const debugDecrypt3Data: EventDetailsData = {
  slug: "debug-decrypt-3.0",
  title: "DEBUG DECRYPT 3.0",
  subtitle: "The Ultimate Algorithm Challenge",
  mainTagline: "THE ULTIMATE ALGORITHM CHALLENGE",
  subTagline: "Think. Debug. Optimize. Conquer.",
  bannerUrl:
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=80",
  logoUrl: "/debug_logo.png",
  location: "Dronacharya College of Engineering, Farukh Nagar, Gurugram",
  venueDetails:
    "Main Auditorium & Computing Centers, Dronacharya College of Engineering, Farukh Nagar, Gurugram",
  mode: "Offline",
  startsAt: "2026-10-15T08:00:00+05:30",
  endsAt: "2026-10-15T19:00:00+05:30",
  timeRange: "8:00 AM – 7:00 PM",
  regClosesAt: "2026-10-12T23:59:59+05:30",
  minTeamSize: 2,
  maxTeamSize: 3,
  fee: "Free",
  categories: [
    "Competitive Programming",
    "Data Structures & Algorithms",
    "Debugging",
    "Problem Solving",
  ],
  overview:
    "DEBUG DECRYPT 3.0 — The Ultimate Algorithm Challenge is a multi-stage competitive programming and problem-solving event built to test your skills in Data Structures, Algorithms, Logical Reasoning, Debugging and Efficient Problem Solving. Whether you're a first-year student exploring competitive programming or an experienced problem solver looking for a challenge, DEBUG DECRYPT 3.0 gives you the stage to test how far your skills can go.",
  progressiveModel:
    "The competition follows a progressive difficulty model. It begins with an accessible qualification round based on programming fundamentals and gradually advances into challenging algorithmic problems that demand efficient thinking, optimized solutions and strong implementation skills.",
  stages: [
    {
      title: "Online Shortlisting — MCQ",
      stageType: "Qualification Round",
      desc: "The competition starts with an MCQ-based qualification round covering fundamental Data Structures and Programming concepts. The questions focus primarily on concepts commonly introduced during the first year of undergraduate study, giving freshers an equal opportunity to qualify.",
      objective:
        "Test programming fundamentals and shortlist teams for the competitive rounds.",
    },
    {
      title: "Algorithmic Challenge",
      stageType: "Competitive Round 1",
      desc: "Shortlisted teams move into the first major competitive round. The difficulty increases significantly as participants solve algorithmic and problem-solving questions requiring efficient application of Data Structures and Algorithms within the given time.",
      objective:
        "Evaluate algorithmic thinking, implementation skills, efficiency and problem-solving ability.",
    },
    {
      title: "Final Challenge",
      stageType: "Championship Round",
      desc: "The final round raises both the difficulty and the stakes. Finalists face advanced algorithmic challenges requiring deeper analytical thinking, optimized approaches and effective implementation under strict time constraints.",
      objective:
        "Determine the top-performing teams and crown the winners of The Ultimate Algorithm Challenge.",
    },
  ],
  highlights: [
    "Full-day competitive algorithmic challenge",
    "Open to students from all academic years",
    "Team-based competition with 2–3 members",
    "Accessible MCQ qualification round",
    "Progressive difficulty from fundamentals to advanced algorithms",
    "Dedicated opportunities for first-year students",
    "₹18,000 total cash prize pool",
    "Sponsor integrations and special sponsor-led challenges",
    "Additional sponsor prizes and tracks may be introduced",
  ],
  announcements: [
    {
      id: "ann-1",
      title: "Registrations Opening Soon",
      content:
        "Registrations for DEBUG DECRYPT 3.0 will open soon. Form your team of 2–3 members and get ready to put your programming and problem-solving skills to the test.",
      postedAt: "Oct 07, 2026",
      author: "Deviators Organizing Committee",
      tag: "Important",
    },
    {
      id: "ann-2",
      title: "₹18,000 Cash Prize Pool",
      content:
        "Compete for a total cash prize pool of ₹18,000. 1st Place: ₹10,000 | 2nd Place: ₹5,000 | 3rd Place: ₹3,000. Special sponsor-led prizes and tracks may also be announced.",
      postedAt: "Oct 06, 2026",
      author: "Prize Committee",
      tag: "Prizes",
    },
    {
      id: "ann-3",
      title: "Freshers, This Challenge Is For You Too",
      content:
        "First-year students are encouraged to participate. The qualification round focuses on fundamental programming and Data Structures concepts, ensuring freshers have a fair opportunity to qualify and compete.",
      postedAt: "Oct 05, 2026",
      author: "Academic Outreach",
      tag: "Freshers",
    },
  ],
  timeline: [
    {
      stage: "Portal Registration Closes (Strict Cutoff)",
      time: "12 Oct 2026 · 11:59 PM",
      desc: "Registrations strictly close 3 days prior to the event. Team rosters cannot be modified afterwards.",
      active: true,
    },
    {
      stage: "Registration & Participant Check-in",
      time: "8:00 AM – 9:00 AM",
      desc: "Participants report at the venue, complete verification and prepare for the competition.",
    },
    {
      stage: "Online Shortlisting Round — MCQ",
      time: "9:15 AM – 10:15 AM",
      desc: "A qualification round testing fundamental programming and Data Structures concepts.",
    },
    {
      stage: "Shortlisting Results",
      time: "10:30 AM",
      desc: "Teams qualifying for the next stage will be announced.",
    },
    {
      stage: "Algorithmic Challenge",
      time: "11:00 AM – 2:00 PM",
      desc: "Qualified teams compete in algorithmic and problem-solving challenges requiring efficient implementation and strong DSA fundamentals.",
    },
    {
      stage: "Break",
      time: "2:00 PM – 3:00 PM",
      desc: "A short break before the final stage begins.",
    },
    {
      stage: "Final Challenge",
      time: "3:00 PM – 6:00 PM",
      desc: "The highest difficulty round of the competition, designed to test analytical thinking, optimization and implementation under pressure.",
    },
    {
      stage: "Winners Announcement & Closing",
      time: "6:00 PM – 7:00 PM",
      desc: "Winner announcements, prize distribution and the official closing of DEBUG DECRYPT 3.0. Sponsor activities and special sponsor-led challenges may take place at suitable intervals throughout the event.",
    },
  ],
  prizes: [
    {
      rank: "1st Prize",
      title: "Champion Team",
      reward: "₹10,000",
      desc: "Awarded to the highest-performing team of DEBUG DECRYPT 3.0.",
      tone: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    },
    {
      rank: "2nd Prize",
      title: "First Runner Up",
      reward: "₹5,000",
      desc: "Awarded to the team finishing second in the final competition.",
      tone: "border-slate-300/40 bg-slate-400/10 text-slate-200",
    },
    {
      rank: "3rd Prize",
      title: "Second Runner Up",
      reward: "₹3,000",
      desc: "Awarded to the third-place team.",
      tone: "border-amber-700/40 bg-amber-800/10 text-amber-400",
    },
  ],
  specialPrizes: [
    "Additional sponsor-supported prizes and special tracks may be introduced during the event.",
    "Dedicated opportunities for first-year students may also be available, giving freshers additional ways to earn recognition for their performance.",
  ],
  rules: [
    "The competition is open to students from all academic years.",
    "Participants must compete in teams of 2 to 3 members.",
    "All registered teams must complete the qualification round to advance further.",
    "The qualification round will primarily test fundamental Programming and Data Structures concepts.",
    "Teams will be shortlisted based on their performance in the qualification round.",
    "Shortlisted teams will proceed to the Algorithmic Challenge.",
    "The difficulty level will progressively increase across subsequent rounds.",
    "Finalists will compete in advanced algorithmic challenges requiring efficient and optimized solutions.",
    "Participants must complete challenges within the specified time limits.",
    "Teams are expected to maintain fair competition and follow all instructions provided by the organizers.",
    "Sponsor-led challenges, tracks or prizes may be introduced during the competition.",
    "Special opportunities may be provided for first-year students.",
    "Further event-specific instructions may be communicated to registered participants before or during the competition.",
  ],
  faqs: [
    {
      q: "Who can participate?",
      a: "Students from all academic years are eligible to participate.",
    },
    {
      q: "What is the team size?",
      a: "Each team must consist of a minimum of 2 and a maximum of 3 members.",
    },
    {
      q: "Is the event suitable for first-year students?",
      a: "Yes. The qualification round primarily covers fundamental Programming and Data Structures concepts commonly taught during the first year of undergraduate study.",
    },
    {
      q: "What topics will be tested?",
      a: "Participants will be tested across Data Structures, Algorithms, Logical Reasoning, Debugging and Efficient Problem Solving.",
    },
    {
      q: "How many rounds are there?",
      a: "The competition has three competitive stages: 1. Online Shortlisting — MCQ, 2. Algorithmic Challenge, 3. Final Challenge.",
    },
    {
      q: "When is the event?",
      a: "DEBUG DECRYPT 3.0 is scheduled for 15 October 2026, running from 8:00 AM to 7:00 PM.",
    },
    {
      q: "What is the total prize pool?",
      a: "The total cash prize pool is ₹18,000 (1st Prize: ₹10,000, 2nd Prize: ₹5,000, 3rd Prize: ₹3,000).",
    },
    {
      q: "Will there be prizes for first-year students?",
      a: "Special sponsor-supported tracks or prizes for first-year students may be introduced.",
    },
    {
      q: "Are registrations open?",
      a: "Registrations are opening soon.",
    },
    {
      q: "Is this only a coding competition?",
      a: "The event goes beyond simply writing code. It evaluates algorithmic thinking, logical reasoning, debugging, optimization and your ability to implement efficient solutions under time constraints.",
    },
  ],
  sponsors: [
    {
      name: "Unstop",
      tier: "Official Platform Partner",
      offering:
        "Powering student tech challenges, registrations, and national ecosystem outreach.",
      website: "https://unstop.com",
    },
    {
      name: "CodeCrafters",
      tier: "Challenge & Tooling Partner",
      offering:
        "Advanced systems challenges, developer mastery sandbox, and engineering resources.",
      website: "https://codecrafters.io",
    },
  ],
  closingQuote: {
    heading: "The Challenge Starts With The Basics.",
    subheading:
      "The difficulty rises. The stakes get higher. Are you ready for the ultimate algorithm challenge?",
    ctaText: "DEBUG DECRYPT 3.0",
  },
};

export const demoEventsData: Record<string, EventDetailsData> = {
  "debug-decrypt-3.0": debugDecrypt3Data,
  "debug-decrypt-3": debugDecrypt3Data,
  "craftcon-2k26": debugDecrypt3Data,
};

export function getEventDetails(slug: string): EventDetailsData {
  return demoEventsData[slug] || debugDecrypt3Data;
}
