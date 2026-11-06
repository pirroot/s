import Link from "next/link";
import { Reveal } from "./reveal";

/**
 * Shared classic primitives — the little UI that used to be copy-pasted
 * between sections now lives here once: Eyebrow, SectionHead, ArrowLink,
 * PillLink, Breadcrumb. Tone flips the hairline family for dark sections.
 */

type Tone = "dark" | "light";

const toneText: Record<Tone, string> = {
  dark: "text-neutral-400",
  light: "text-white/40",
};
const toneBody: Record<Tone, string> = {
  dark: "text-neutral-500",
  light: "text-white/55",
};

/** Small-caps eyebrow — the numbered section label. */
export function Eyebrow({
  children,
  tone = "dark",
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={`text-[10px] uppercase tracking-[0.35em] ${toneText[tone]} ${className}`}
      style={{ marginRight: "-0.35em" }}
    >
      {children}
    </p>
  );
}

/** Display heading — huge, extralight, tight, optional serif-italic accent. */
export function Display({
  children,
  as: Tag = "h2",
  tone = "dark",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  tone?: Tone;
  size?: "md" | "lg";
  className?: string;
}) {
  const color = tone === "dark" ? "text-neutral-900" : "text-white";
  const sizing = size === "lg" ? "text-5xl md:text-7xl" : "text-4xl md:text-6xl";
  return (
    <Tag className={`mt-5 font-extralight leading-[1.05] tracking-tight ${sizing} ${color} ${className}`}>
      {children}
    </Tag>
  );
}

/** Section head: eyebrow + display on the left, optional lede on the right. */
export function SectionHead({
  eyebrow,
  title,
  lede,
  tone = "dark",
  className = "",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Reveal className={`flex flex-col gap-8 md:flex-row md:items-end md:justify-between ${className}`}>
      <div>
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        <Display tone={tone}>{title}</Display>
      </div>
      {lede ? (
        <p className={`max-w-sm text-[13px] leading-relaxed md:pb-2 md:text-sm ${toneBody[tone]}`}>{lede}</p>
      ) : null}
    </Reveal>
  );
}

/** Text link with the hairline underline and a gliding arrow. */
export function ArrowLink({
  href,
  children,
  tone = "dark",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const color = tone === "dark" ? "text-neutral-900" : "text-white";
  const line = tone === "dark" ? "border-neutral-900/25 group-hover:border-neutral-900" : "border-white/25 group-hover:border-white";
  const external = href.startsWith("mailto:") || href.startsWith("http");
  const inner = (
    <>
      <span className={`border-b pb-1 transition-colors ${line}`}>{children}</span>
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </>
  );
  const cls = `group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] ${color} ${className}`;
  return external ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/** Rounded hairline pill — the classic CTA. */
export function PillLink({
  href,
  children,
  tone = "dark",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const cls =
    tone === "dark"
      ? "border-neutral-300 text-neutral-900 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
      : "border-white/25 text-white/85 hover:bg-white hover:text-black hover:border-white";
  const external = href.startsWith("mailto:") || href.startsWith("http");
  const all = `inline-flex items-center rounded-full border px-7 py-3.5 text-[10px] font-medium uppercase tracking-[0.3em] transition-colors ${cls} ${className}`;
  return external ? (
    <a href={href} className={all}>
      {children}
    </a>
  ) : (
    <Link href={href} className={all}>
      {children}
    </Link>
  );
}

/** Small-caps breadcrumb row. */
export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-neutral-400">
      {items.map((it, i) => (
        <span key={it.label} className="flex items-center gap-2">
          {i > 0 ? (
            <span aria-hidden className="text-neutral-300">
              /
            </span>
          ) : null}
          {it.href ? (
            <Link href={it.href} className="transition-colors hover:text-neutral-900">
              {it.label}
            </Link>
          ) : (
            <span className="text-neutral-500">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
