import {
  Home01Icon,
  UserIcon,
  UserGroupIcon,
  Book03Icon,
  Image01Icon,
  Mail01Icon,
  DashboardSquare01Icon,
  Login01Icon,
} from "@hugeicons/core-free-icons";

const navItems = [
  {
    name: "Home",
    link: "/#home",
    icon: Home01Icon,
  },
  {
    name: "About",
    link: "/#about",
    icon: UserIcon,
  },
  {
    name: "Team",
    link: "/team",
    icon: UserGroupIcon,
  },
  {
    name: "Learn",
    link: "/learn",
    icon: Book03Icon,
  },
  {
    name: "Gallery",
    link: "/gallery",
    icon: Image01Icon,
  },
  {
    name: "Contact",
    link: "/#contact",
    icon: Mail01Icon,
  },
  {
    name: "Dashboard",
    link: "/dashboard",
    icon: DashboardSquare01Icon,
  },
  {
    name: "Login",
    link: "/login",
    icon: Login01Icon,
    auth: "logged-out" as const,
  },
];

export default navItems;
