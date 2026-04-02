"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    label: "Journal",
    href: "/journal",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? "1.5" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? "text-brown" : "text-muted"}
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        {!active && <line x1="8" y1="7" x2="16" y2="7" />}
        {!active && <line x1="8" y1="11" x2="14" y2="11" />}
      </svg>
    ),
  },
  {
    label: "Insights",
    href: "/insights",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? "2.2" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? "text-brown" : "text-muted"}
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Bible",
    href: "/bible",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? "1.5" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? "text-brown" : "text-muted"}
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        {!active && <line x1="9" y1="7" x2="15" y2="7" />}
        {!active && <line x1="9" y1="11" x2="13" y2="11" />}
        {!active && <line x1="9" y1="15" x2="15" y2="15" />}
      </svg>
    ),
  },
  {
    label: "Plans",
    href: "/plans",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? "2.2" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? "text-brown" : "text-muted"}
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: "Community",
    href: "/community",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? "1.5" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? "text-brown" : "text-muted"}
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Me",
    href: "/me",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? "1.5" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? "text-brown" : "text-muted"}
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-brown/8 bg-cream/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto w-full">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 relative pt-1"
            >
              <div className="relative">
                {tab.icon(isActive)}
              </div>
              <span
                className={`text-[10px] tracking-tight ${
                  isActive
                    ? "text-brown font-semibold"
                    : "text-muted"
                }`}
              >
                {tab.label}
              </span>
              {/* Active indicator bar - cleaner than a dot */}
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-brown rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
