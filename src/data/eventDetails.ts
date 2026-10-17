export type EventDetailsData = {
  slug: string;
  title: string;
  subtitle: string;
  mainTagline: string;
  subTagline: string;
  bannerUrl: string;
  posterUrl?: string;
  portraitPosterUrl?: string;
  bannerAspectRatio?: string;
  posterAspectRatio?: string;
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
  coordinators?: {
    role: string;
    name: string;
    email: string;
    phone: string;
  }[];
  evaluationCriteria?: {
    criterion: string;
    focus: string;
  }[];
  websiteRequirements?: {
    area: string;
    expectation: string;
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
  bannerUrl: "/debug_decrypt_banner_1.png",
  posterUrl: "/debug_decrypt_poster.png",
  bannerAspectRatio: "aspect-[2345/670]",
  posterAspectRatio: "aspect-[1916/821]",
  logoUrl: "/debug_logo.png",
  location: "Dronacharya College of Engineering",
  venueDetails:
    "Computer Labs & Seminar Hall, Dronacharya College of Engineering",
  mode: "Offline",
  startsAt: "2026-10-15T08:00:00+05:30",
  endsAt: "2026-10-15T19:00:00+05:30",
  timeRange: "8:00 AM – 7:00 PM",
  regClosesAt: "2026-10-13T15:00:00+05:30",
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
      title: "Online Shortlisting Round — MCQ",
      stageType: "Online Qualification Round · 13 Oct (7:00 PM – 7:45 PM)",
      desc: "The competition kicks off with an online MCQ-based qualification round on 13th October from 7:00 PM to 7:45 PM. The questions cover fundamental Data Structures, Logical Reasoning, and Programming concepts, giving freshers and experienced coders an equal opportunity to qualify.",
      objective:
        "Online qualification sprint (7:00 PM – 7:45 PM) to test programming fundamentals and shortlist teams for the on-campus finale.",
    },
    {
      title: "Algorithmic Challenge",
      stageType: "Competitive Round 1 · 15 Oct (On-Campus)",
      desc: "Shortlisted teams move into the first major competitive round at the campus. The difficulty increases significantly as participants solve algorithmic and problem-solving questions requiring efficient application of Data Structures and Algorithms within the given time.",
      objective:
        "Evaluate algorithmic thinking, implementation skills, efficiency and problem-solving ability.",
    },
    {
      title: "Final Challenge",
      stageType: "Championship Round · 15 Oct (On-Campus)",
      desc: "The final round raises both the difficulty and the stakes. Finalists face advanced algorithmic challenges requiring deeper analytical thinking, optimized approaches and effective implementation under strict time constraints.",
      objective:
        "Determine the top-performing teams and crown the winners of The Ultimate Algorithm Challenge.",
    },
  ],
  highlights: [
    "Online Shortlisting Round on 13 Oct (7:00 PM – 7:45 PM)",
    "Grand On-Campus Finale on 15 Oct at DCE Gurugram",
    "Open to students from all academic years",
    "Team-based competition with 2–3 members",
    "Accessible MCQ qualification round with freshers track",
    "Progressive difficulty from fundamentals to advanced algorithms",
    "₹18,000 total cash prize pool",
    "Certificates for all participants & exclusive Deviators swag",
  ],
  announcements: [
    {
      id: "ann-1",
      title: "Online Shortlisting Round on 13th Oct (7:00–7:45 PM)",
      content:
        "The online qualification round takes place on 13th October from 7:00 PM to 7:45 PM online. Make sure your team registration is complete before the cutoff at 3:00 PM on 13th October.",
      postedAt: "Oct 08, 2026",
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
      stage: "Registration Deadline (Strict Cutoff)",
      time: "13 Oct 2026 · 3:00 PM",
      desc: "Registrations strictly close at 3:00 PM on 13th October. Squad rosters cannot be modified afterwards.",
      active: true,
    },
    {
      stage: "Online Shortlisting Round — MCQ",
      time: "13 Oct 2026 · 7:00 PM – 7:45 PM (Online)",
      desc: "Online qualification round testing fundamental Data Structures and Programming concepts. Conducted online from 7:00 PM to 7:45 PM.",
      active: true,
    },
    {
      stage: "Shortlist Announcement",
      time: "14 Oct 2026",
      desc: "Official announcement of shortlisted teams qualifying for the on-campus finale at DCE Gurugram.",
    },
    {
      stage: "Finalists Registration & Check-in",
      time: "15 Oct 2026 · 8:00 AM – 9:00 AM",
      desc: "Shortlisted participants report at the venue, complete verification and prepare for the competition.",
    },
    {
      stage: "Algorithmic Challenge (On-Campus Round 1)",
      time: "15 Oct 2026 · 10:00 AM – 1:00 PM",
      desc: "Qualified teams compete in algorithmic and problem-solving challenges requiring efficient implementation and strong DSA fundamentals.",
    },
    {
      stage: "Break & Networking",
      time: "15 Oct 2026 · 1:00 PM – 2:00 PM",
      desc: "Lunch break, mentor interactions and sponsor presentations.",
    },
    {
      stage: "Final Challenge (Championship Round)",
      time: "15 Oct 2026 · 2:00 PM – 5:00 PM",
      desc: "The highest difficulty round of the competition, designed to test analytical thinking, optimization and implementation under pressure.",
    },
    {
      stage: "Winners Announcement & Prize Distribution",
      time: "15 Oct 2026 · 5:30 PM – 7:00 PM",
      desc: "Winner announcements, ₹18,000 cash prize distribution, and the official closing of DEBUG DECRYPT 3.0.",
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
      logoUrl: "/sponsors/codecrafters.png",
      offering:
        "Advanced systems challenges, developer mastery sandbox, and engineering resources.",
      website: "https://codecrafters.io/",
    },
  ],
  closingQuote: {
    heading: "The Challenge Starts With The Basics.",
    subheading:
      "The difficulty rises. The stakes get higher. Are you ready for the ultimate algorithm challenge?",
    ctaText: "DEBUG DECRYPT 3.0",
  },
};

export const webLumina2026Data: EventDetailsData = {
  slug: "web-lumina-2026",
  title: "WEB LUMINA 2026",
  subtitle: "Website Designing and Interactive Experience Challenge",
  mainTagline: "WEBSITE DESIGNING & INTERACTIVE EXPERIENCE CHALLENGE",
  subTagline:
    "Visual Appeal · Thoughtful UX · Creative Interactivity · Functional Implementation",
  bannerUrl: "/web_lumina_banner.png",
  posterUrl: "/web_lumina_poster.png",
  portraitPosterUrl: "/web_lumina_poster_portrait.png",
  bannerAspectRatio: "aspect-[16/7] sm:aspect-[21/9] lg:aspect-[2345/760]",
  posterAspectRatio: "aspect-[16/9]",
  logoUrl: "/web_lumina_logo.png",
  location: "Dronacharya College of Engineering",
  venueDetails:
    "Dronacharya College of Engineering, Gurugram · Organized under Deviators Club",
  mode: "Offline",
  startsAt: "2026-10-24T09:00:00+05:30",
  endsAt: "2026-10-24T17:00:00+05:30",
  timeRange: "Schedule to be announced",
  regClosesAt: "2026-10-23T23:59:59+05:30",
  minTeamSize: 2,
  maxTeamSize: 4,
  fee: "Free",
  categories: [
    "Web Designing",
    "UI/UX Design",
    "Creative Interactivity",
    "Frontend Development",
    "3D & Motion",
    "AI-Assisted Development",
  ],
  overview:
    "Web Lumina is a team-based website designing challenge focused on visual appeal, thoughtful user experience, creative interactivity and functional implementation. Participants are encouraged to build polished websites featuring balanced colors, readable typography, smooth animations, useful interactions and, where appropriate, 3D elements. The aim is not to add the maximum number of effects, but to create a website that looks appealing, works reliably and is enjoyable to use.",
  progressiveModel:
    "Web Lumina 2026 will be conducted as a single, one-stop website designing challenge. There will be no separate qualification rounds or shortlisting stages. All eligible registered teams will participate in the same challenge and present their work for evaluation.",
  stages: [
    {
      title: "Challenge Briefing",
      stageType: "Kickoff · Stage 1",
      desc: "Organizers communicate the website theme or task, challenge duration, permitted resources and submission instructions.",
      objective:
        "Understand the challenge requirements, design constraints, and evaluation guidelines.",
    },
    {
      title: "Design and Development",
      stageType: "Build Sprint · Stage 2",
      desc: "Teams plan, design and implement their website during the challenge, including any intended animations, interactivity or 3D elements. AI-assisted tools are allowed for ideation, code generation, debugging, design research, and component refinement.",
      objective:
        "Build a responsive, polished, functional website with thoughtful UX, clean layout, and purposeful interactivity.",
    },
    {
      title: "Final Submission and Demonstration",
      stageType: "Defense & Evaluation · Stage 3",
      desc: "Teams submit their work as instructed and demonstrate the website, explain design decisions, and discuss their AI-assisted development process.",
      objective:
        "Present a working live prototype, demonstrate responsive behavior, and justify technical & design choices to the judges.",
    },
  ],
  highlights: [
    "Single, one-stop website designing challenge (no elimination rounds)",
    "Teams of 2 to 4 members with one designated team leader",
    "Freedom to use any web technology, framework, or development tool",
    "AI-assisted tools allowed for ideation, code generation, debugging & refinement",
    "Emphasis on visual polish, purposeful micro-interactions & responsive layouts",
    "3D objects, parallax, or immersive effects encouraged",
    "Live demonstration & defense before expert judges",
    "Organized under Deviators Club at Dronacharya College of Engineering",
  ],
  announcements: [
    {
      id: "wl-ann-1",
      title: "Registrations Officially Open for Web Lumina 2026!",
      content:
        "Form your squad of 2 to 4 members and register now! Teams can use any suitable web framework or tool. Event date, venue, and final schedule will be communicated separately.",
      postedAt: "Oct 16, 2026",
      author: "Deviators Organizing Committee",
      tag: "Registrations Open",
    },
    {
      id: "wl-ann-2",
      title: "AI Tools Guidelines: Prompting & Component Refinement",
      content:
        "AI tools are permitted for ideation, code generation, and debugging. Judges will evaluate how effectively teams customize, adapt, and understand AI outputs. Pure one-prompt clones without understanding will score poorly.",
      postedAt: "Oct 16, 2026",
      author: "Technical Committee",
      tag: "AI Guidelines",
    },
    {
      id: "wl-ann-3",
      title: "Hardware & Setup Requirement",
      content:
        "All participants must bring their own laptops, chargers, and mobile hotspot/internet connections. Ensure your development environment is set up beforehand.",
      postedAt: "Oct 16, 2026",
      author: "Event Coordination",
      tag: "Notice",
    },
  ],
  timeline: [
    {
      stage: "Squad Registration & Team Formation",
      time: "Open Now",
      desc: "Register your team of 2 to 4 members with a designated leader on the Deviators Club portal.",
      active: true,
    },
    {
      stage: "Event Briefing & Theme Reveal",
      time: "Kickoff (To be announced)",
      desc: "Organizers communicate the website theme, challenge duration, permitted resources, and submission instructions.",
    },
    {
      stage: "Design & Implementation Sprint",
      time: "Challenge Hours",
      desc: "Teams plan, design, and code their websites with interactive animations, responsive layouts, or 3D elements.",
    },
    {
      stage: "Project Submission Deadline",
      time: "Sprint Cutoff",
      desc: "Teams submit their working prototype, repository links, or recordings within the announced deadline.",
    },
    {
      stage: "Final Submission & Live Demonstration",
      time: "Evaluation Phase",
      desc: "Teams demonstrate their live website, explain design decisions, and discuss their AI-assisted development process with the judges.",
    },
    {
      stage: "Results & Recognition Ceremony",
      time: "Closing Ceremony",
      desc: "Judges announce the top teams and present awards for design excellence, interactivity, and originality.",
    },
  ],
  prizes: [
    {
      rank: "Winner",
      title: "Best Overall Experience & Design",
      reward: "Trophy & Certificate of Excellence",
      desc: "Awarded to the team delivering the most polished visual design, seamless UX, and robust technical implementation.",
      tone: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    },
    {
      rank: "Runner Up",
      title: "First Runner-Up",
      reward: "Trophy & Certificate of Merit",
      desc: "Awarded to the team showcasing exceptional design aesthetics, creativity, and clean responsiveness.",
      tone: "border-slate-300/40 bg-slate-400/10 text-slate-200",
    },
    {
      rank: "Special Mention",
      title: "Creative Interactivity & 3D",
      reward: "Certificate of Commendation",
      desc: "Recognizing outstanding creativity in micro-interactions, animations, 3D elements, or motion design.",
      tone: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300",
    },
  ],
  specialPrizes: [
    "Certificates of Participation for all registered attendees demonstrating a valid submission.",
    "Excellence in AI Prompt Engineering & Customization recognition.",
    "Deviators Club community badges and exclusive membership opportunities.",
  ],
  rules: [
    "Only registered participants may compete.",
    "A team must consist of 2 to 4 members, with one designated team leader.",
    "Participants must register using their full name and college roll number. A participant cannot join more than one team.",
    "All participants must bring their own laptops, chargers and internet connections. Organizers are not responsible for device, network or power-related problems.",
    "Teams must report at the announced venue and time. Late arrival may lead to disqualification.",
    "Participants must behave professionally and respect other teams, judges and organizers.",
    "Offensive, harmful or inappropriate website content is not permitted.",
    "Plagiarism, false claims of authorship and misrepresentation of work are prohibited.",
    "The organizers and judges will make the final decision on disputes and rule violations.",
    "AI-assisted tools are allowed for ideation, code generation, debugging, design research, component creation and refinement. AI usage is not automatically penalized.",
    "Judges will consider how effectively a team guides, evaluates, adapts and understands AI-generated output.",
    "One-prompt website generation without meaningful customization or understanding will score poorly under AI usage, originality and technical quality.",
    "Teams should be prepared to show relevant prompts or prompt history, identify AI-assisted components and explain their own contributions.",
    "Teams may use any suitable web technology, framework or development tool.",
    "Present a working website or prototype within the announced submission deadline and be ready to make small changes to selected components when requested by judges.",
  ],
  faqs: [
    {
      q: "What is the team size for Web Lumina 2026?",
      a: "Each team must consist of a minimum of 2 and a maximum of 4 members, with one designated team leader.",
    },
    {
      q: "Can I use AI tools like ChatGPT, Claude, v0, or GitHub Copilot?",
      a: "Yes! AI-assisted tools are allowed for ideation, code generation, debugging, design research, and component refinement. However, judges evaluate your technical understanding, prompting iteration, and manual improvements. One-prompt clones without understanding will score poorly.",
    },
    {
      q: "What web frameworks or tech stack are allowed?",
      a: "Teams may use any suitable web technology, framework, or development tool (e.g., React, Next.js, Vue, Svelte, HTML/CSS/JS, Three.js, Tailwind, etc.).",
    },
    {
      q: "Are there multiple rounds or shortlisting stages?",
      a: "No. Web Lumina 2026 is conducted as a single, one-stop website designing challenge. There are no separate qualification rounds or shortlisting stages. All registered teams participate in the challenge and present for evaluation.",
    },
    {
      q: "Is 3D mandatory?",
      a: "3D objects, parallax, and immersive effects are encouraged, but optional. They must serve the overall design and not cause unnecessary lag or disruptive effects.",
    },
    {
      q: "When and where is the event taking place?",
      a: "Web Lumina 2026 will be hosted offline at Dronacharya College of Engineering on 24 October 2026. Registration closes on 23 October 2026.",
    },
    {
      q: "What hardware must participants bring?",
      a: "All participants must bring their own laptops, chargers, and mobile internet connections. Organizers are not responsible for device, network, or power-related issues.",
    },
    {
      q: "How does team building work?",
      a: "The designated team leader registers the team and can add/invite 1 to 3 teammates (total squad size 2 to 4). Teammates receive invitations and can accept in their Deviators Club dashboard or directly on the event page.",
    },
  ],
  websiteRequirements: [
    {
      area: "Visual design",
      expectation:
        "Clean layout, harmonious colors, readable typography, consistent spacing and strong visual hierarchy.",
    },
    {
      area: "Interactivity",
      expectation:
        "Working navigation, meaningful hover states, micro-interactions, scroll effects and smooth transitions.",
    },
    {
      area: "3D and motion",
      expectation:
        "3D objects, parallax or immersive effects are encouraged, but optional; they must serve the overall design.",
    },
    {
      area: "Usability",
      expectation:
        "Easy navigation, readable content and responsive layouts for different screen sizes.",
    },
    {
      area: "Functionality",
      expectation:
        "Buttons, forms, links and other showcased features should work as demonstrated.",
    },
    {
      area: "Performance",
      expectation:
        "Animations and assets should be optimized; avoid unnecessary lag or disruptive effects.",
    },
  ],
  evaluationCriteria: [
    {
      criterion: "Visual Design and Aesthetics",
      focus:
        "Color harmony, typography, spacing, layout, consistency and overall visual polish.",
    },
    {
      criterion: "Interactivity and 3D Experience",
      focus:
        "Purposeful animations, micro-interactions, creative transitions and effective use of 3D where relevant.",
    },
    {
      criterion: "AI Usage and Prompt Engineering",
      focus:
        "Prompting approach, iteration, component customization, understanding and transparency.",
    },
    {
      criterion: "User Experience and Responsiveness",
      focus:
        "Ease of navigation, usability, accessibility and adaptation to different screen sizes.",
    },
    {
      criterion: "Functionality and Technical Quality",
      focus:
        "Working features, smooth performance, code quality and reliability.",
    },
    {
      criterion: "Originality and Presentation",
      focus:
        "Distinctive ideas, design ownership and clarity of the final demonstration.",
    },
  ],
  coordinators: [
    {
      role: "Chief Coordinator",
      name: "Prof. Renu Narwal",
      email: "renu@ggnindia.dronacharya.info",
      phone: "7011584311",
    },
    {
      role: "Coordinator",
      name: "Prof. Kunal Wadhwa",
      email: "kunal.wadhwa@ggnindia.dronacharya.info",
      phone: "8700017378",
    },
    {
      role: "Coordinator",
      name: "Prof. Seema Yadav",
      email: "seema@ggnindia.dronacharya.info",
      phone: "6388394805",
    },
    {
      role: "Student Coordinator",
      name: "Akshit Bhandari",
      email: "akshitbhandaricodes@gmail.com",
      phone: "7982540588",
    },
    {
      role: "Student Coordinator",
      name: "Aarushi Prajapati",
      email: "arushik327@gmail.com",
      phone: "9310424400",
    },
  ],
  sponsors: [
    {
      name: "Deviators Club",
      tier: "Organizing Body",
      offering:
        "Empowering campus builders, developers, and tech innovators at Dronacharya College of Engineering.",
      website: "https://www.deviators.club",
    },
  ],
  closingQuote: {
    heading: "Code. Design. Innovate.",
    subheading:
      "Craft websites that mesmerize, perform, and inspire. Ready to showcase your digital craft at Web Lumina 2026?",
    ctaText: "WEB LUMINA 2026",
  },
};

export const demoEventsData: Record<string, EventDetailsData> = {
  "web-lumina-2026": webLumina2026Data,
  "web-lumina": webLumina2026Data,
  "debug-decrypt-3.0": debugDecrypt3Data,
  "debug-decrypt-3": debugDecrypt3Data,
  "craftcon-2k26": debugDecrypt3Data,
};

export function getEventDetails(slug: string): EventDetailsData {
  if (
    slug === "debug-decrypt-3.0" ||
    slug === "debug-decrypt-3" ||
    slug === "craftcon-2k26"
  ) {
    return debugDecrypt3Data;
  }
  return demoEventsData[slug] || webLumina2026Data;
}
