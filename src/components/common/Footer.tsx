import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import socials from "@/data/socials";
import type { IconType } from "react-icons";

export default function Footer() {
  return (
    <footer id="contact" className="mt-auto pt-16 pb-6 sm:pt-20 sm:pb-8">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Floating glass footer */}
        <div className="glass-card-active rounded-2xl px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-left">
            {/* Left: Branding */}
            <div>
              <Link
                href="/"
                className="font-heading text-xl font-bold text-white sm:text-2xl"
              >
                Deviators Club
              </Link>
              <p className="mt-2 flex items-center justify-center gap-2 text-xs tracking-wider text-white/25 uppercase sm:justify-start">
                &copy; 2026 All rights reserved
              </p>
            </div>

            {/* Middle: Contact Email */}
            <Link
              href="mailto:clubdeviators@gmail.com"
              className="group hover:border-brand/30 hover:bg-brand/10 flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-2 transition-all duration-300 sm:py-2.5"
            >
              <HugeiconsIcon
                icon={Mail01Icon as IconSvgElement}
                size={18}
                className="group-hover:text-brand-light text-white/50 transition-colors"
              />
              <span className="text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                clubdeviators@gmail.com
              </span>
            </Link>

            {/* Right: Social icons */}
            <div className="flex w-full flex-wrap justify-center gap-2 sm:w-auto sm:gap-3">
              {socials.map((social) => {
                const ReactIcon = social.icon as unknown as IconType;
                return (
                  <Link
                    key={social.name}
                    href={social.url}
                    className="group hover:border-brand/30 hover:bg-brand/10 relative flex h-10 w-auto items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 transition-all duration-300 sm:w-10 sm:px-0"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* Tooltip */}
                    <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 scale-90 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white/70 opacity-0 backdrop-blur-md transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 sm:block">
                      {social.name}
                    </span>
                    {social.isHugeIcon ? (
                      <HugeiconsIcon
                        icon={social.icon as IconSvgElement}
                        size={18}
                        className="group-hover:text-brand-light text-white/50 transition-colors"
                      />
                    ) : (
                      <ReactIcon
                        className="group-hover:text-brand-light h-[18px] w-[18px] text-white/50 transition-colors"
                        title={social.name}
                      />
                    )}
                    <span className="ml-2 text-xs font-medium text-white/70 transition-colors group-hover:text-white sm:hidden">
                      {social.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
