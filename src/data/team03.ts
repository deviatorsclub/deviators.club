import RenuImg from "@/assets/team03/renumaam_chiefcoordinator.png";
import AkshitImg from "@/assets/team03/akshit_president1.png";
import AarushiImg from "@/assets/team03/aarushi_president2.jpeg";
import DhruviImg from "@/assets/team03/Dhruvi_weblead.jpeg";
import AyushImg from "@/assets/team03/ayush_dsalead.jpeg";
import ManasImg from "@/assets/team03/manas_aimllead.png";
import AnishImg from "@/assets/team03/anish_sociallead.jpeg";
import { StaticImageData } from "next/image";

export type TeamMemberData = {
  name: string;
  roles: string[];
  intro: string;
  urls: {
    github?: string;
    linkedin: string;
    twitter?: string;
    portfolio?: string;
    leetcode?: string;
  };
  image: StaticImageData | string;
  keywords: string[];
  username: string;
  branch?: string;
  year?: string;
  tagTone?: string;
  hasNoProfile?: boolean;
};

const team03: TeamMemberData[] = [
  {
    name: "Prof. Renu Narwal",
    roles: ["Chief Coordinator"],
    intro:
      "Guiding club initiatives, fostering student leadership, and providing faculty mentorship across all technological domains.",
    urls: {
      linkedin: "https://www.linkedin.com/in/renu-narwal-42b2352a5/",
    },
    image: RenuImg,
    keywords: ["Chief Coordinator", "Faculty", "Leadership", "Mentor"],
    username: "renunarwal",
    branch: "CSE",
    year: "Faculty",
    tagTone: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    hasNoProfile: true,
  },
  {
    name: "Akshit Bhandari",
    roles: ["President"],
    intro:
      "Leading community vision, architecting platforms, and cultivating an unyielding builder culture.",
    urls: {
      github: "https://github.com/AkshitBhandariCodes",
      linkedin: "https://linkedin.com/in/akshitbhandaricodes",
      portfolio: "https://akshitbhandari.codes",
    },
    image: AkshitImg,
    keywords: ["President", "Leadership"],
    username: "akshitbhandaricodes",
    branch: "CSE",
    year: "3rd Year",
    tagTone: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  },
  {
    name: "Aarushi",
    roles: ["President"],
    intro:
      "Spearheading club initiatives, strategic partnerships, and fostering cross-domain technical growth.",
    urls: {
      linkedin: "https://www.linkedin.com",
      github: "https://github.com",
    },
    image: AarushiImg,
    keywords: ["President", "Leadership"],
    username: "aarushi",
    branch: "CSE",
    year: "3rd Year",
    tagTone: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  },
  {
    name: "Dhruvi",
    roles: ["Web Lead"],
    intro:
      "Engineering responsive web systems, modern user interfaces, and leading web development workshops.",
    urls: {
      github: "https://github.com",
      linkedin: "https://www.linkedin.com",
    },
    image: DhruviImg,
    keywords: ["Web Lead", "Frontend", "Engineering"],
    username: "dhruviii78",
    branch: "CSE",
    year: "2nd Year",
    tagTone: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  {
    name: "Ayush Yadav",
    roles: ["DSA Lead"],
    intro:
      "Championing algorithmic thinking, competitive programming mastery, and problem-solving bootcamps.",
    urls: {
      linkedin: "https://www.linkedin.com",
      github: "https://github.com",
      leetcode: "https://leetcode.com",
    },
    image: AyushImg,
    keywords: ["DSA Lead", "Algorithms", "Competitive Programming"],
    username: "ayush",
    branch: "CSE",
    year: "3rd Year",
    tagTone: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  {
    name: "Manas Negi",
    roles: ["AIML Lead"],
    intro:
      "Building autonomous systems, deep learning pipelines, and driving AI-native developer tooling.",
    urls: {
      github: "https://github.com",
      linkedin: "https://www.linkedin.com",
    },
    image: ManasImg,
    keywords: ["AIML Lead", "AI/ML", "Intelligence"],
    username: "manas_negi",
    branch: "AIML",
    year: "3rd Year",
    tagTone: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  {
    name: "Anish Juyal",
    roles: ["Social & Event Management Lead"],
    intro:
      "Orchestrating high-impact hackathons, lab sessions, digital campaigns, and community operations.",
    urls: {
      linkedin: "https://www.linkedin.com",
      github: "https://github.com",
    },
    image: AnishImg,
    keywords: ["Social & Event Management Lead", "Operations", "Media"],
    username: "aam_papad",
    branch: "CSE",
    year: "3rd Year",
    tagTone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
];

export default team03;
