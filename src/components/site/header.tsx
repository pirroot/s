"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./wordmark";

/**
 * The one site header — sticky, white, hairline. Serves every page:
 * Products / About / Contact. Subtle ink-underline marks the active page.
 */

const LINKS = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/about#contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5 text-neutral-900 md:h-16 md:px-10">
        <Link href="/" aria-label="Batolite — home" className="transition-opacity hover:opacity-70">
          <Wordmark
            textClassName="text-[11px] font-medium tracking-[0.36em] md:text-[13px] md:tracking-[0.42em]"
          />
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4 md:gap-9">
          {LINKS.map((l) => {
            const active =
              l.href === "/about#contact"
                ? false
                : pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative text-[9px] font-medium uppercase tracking-[0.22em] transition-colors hover:text-black md:text-[11px] md:tracking-[0.28em] ${
                  active ? "text-neutral-900" : "text-neutral-500"
                }`}
              >
                {l.label}
                <span
                  aria-hidden
                  className={`absolute -bottom-1.5 left-0 h-px w-full origin-left bg-neutral-900 transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
