"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/* ─── Icon shapes ─────────────────────────────────────────── */

type IconName = "home" | "games" | "portfolio" | "leaderboard" | "user";

function PixelIcon({ name }: { name: IconName }) {
  const cls = "w-5 h-5 block";

  const paths: Record<IconName, string> = {
    home:
      "M4 11h2v9h12v-9h2v-2h-2v-2h-2v-2h-2v-2h-4v2H8v2H6v2H4v2Zm6 7v-5h4v5h-4Z",
    games:
      "M5 9h14v2h2v7h-2v2h-4v-2h-6v2H5v-2H3v-7h2V9Zm2 4v2h2v2h2v-2h2v-2h-2v-2H9v2H7Zm10-1v2h2v-2h-2Zm-2 3v2h2v-2h-2Z",
    portfolio:
      "M3 6h7v2h11v12H3V6Zm2 4v8h14v-8H5Zm2-6h5v2H7V4Z",
    leaderboard:
      "M7 3h2v4h4V3h2v4h3v2h-3v5h3v2h-3v5h-2v-5H9v5H7v-5H4v-2h3V9H4V7h3V3Zm2 6v5h4V9H9Z",
    user:
      "M9 4h6v2h2v6h-2v2H9v-2H7V6h2V4Zm0 12h6v1h2v1h2v3H5v-3h2v-1h2v-1Z",
  };

  return (
    <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
      <path fill="currentColor" d={paths[name]} />
    </svg>
  );
}

/* ─── Nav items config ────────────────────────────────────── */

type NavItem =
  | { kind: "link";   icon: IconName; label: string; href: string }
  | { kind: "action"; icon: IconName; label: string }
  | { kind: "main";   icon: IconName; label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { kind: "link",   icon: "home",        label: "HOME",  href: "/" },
  { kind: "action", icon: "games",       label: "GAMES"             },
  { kind: "main",   icon: "portfolio",   label: "MAIN",  href: "https://portfolio.dseikou.co.za/" },
  { kind: "link",   icon: "leaderboard", label: "RANKS", href: "/leaderboard" },
  { kind: "link",   icon: "user",        label: "FILE",    href: "/profile" },
];

/* ─── Component ───────────────────────────────────────────── */

export default function AppNav() {
  const pathname = usePathname();
  const router   = useRouter();

  function goToGames() {
    if (pathname !== "/") {
      router.push("/#games");
      return;
    }
    document.getElementById("games")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-xl -translate-x-1/2"
      aria-label="Main navigation"
    >
      <div className="pixel-dock">
        {NAV_ITEMS.map((item) => {
          /* ── External main button ── */
          if (item.kind === "main") {
            return (
              <a
                key={item.label}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className="pixel-nav-main"
                target="_blank"
                rel="noopener noreferrer"
              >
                <PixelIcon name={item.icon} />
                <span>{item.label}</span>
              </a>
            );
          }

          /* ── Scroll action (Games) ── */
          if (item.kind === "action") {
            return (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                title={item.label}
                onClick={goToGames}
                className="pixel-nav-icon"
              >
                <PixelIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            );
          }

          /* ── Internal link ── */
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`pixel-nav-icon${isActive ? " pixel-nav-active" : ""}`}
            >
              <PixelIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}