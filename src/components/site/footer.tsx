import Link from "next/link";
import { Wordmark } from "./wordmark";
import { SITE } from "@/data/site";

/** The site footer — quiet, hairline, with the page links and the studio line. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white text-neutral-900">
      <div className="mx-auto max-w-[1400px] px-5 py-14 md:px-10 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-neutral-500">
              Sculpted light for contemporary spaces — made to order in the atelier, bench-tested
              before it leaves.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {[
              { href: "/products", label: "Products" },
              { href: "/about", label: "About" },
              { href: "/about#contact", label: "Contact" },
              { href: `mailto:${SITE.email}`, label: SITE.email },
            ].map((l) =>
              l.href.startsWith("mailto:") ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  {l.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-neutral-200 pt-6 text-[10px] uppercase tracking-[0.22em] text-neutral-400 md:flex-row md:items-center md:justify-between">
          <p>
            © {SITE.year} {SITE.legalName}. All rights reserved.
          </p>
          <p>Visuals are protected — catalogue on request.</p>
        </div>
      </div>
    </footer>
  );
}
