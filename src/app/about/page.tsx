import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ProtectionGuard } from "@/components/site/protection-guard";
import { ProtectedImage } from "@/components/site/protected-image";
import { Reveal } from "@/components/site/reveal";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Breadcrumb, Display, Eyebrow, SectionHead } from "@/components/site/primitives";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "About & Contact",
  description:
    "Batolite is a lighting atelier composing monochrome light — meet the studio, its principles, and write to us about your space. Quotations and catalogue requests answered within two working days.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About & Contact — Batolite",
    description: "The house of sculpted light — the studio, the principles, and how to reach us.",
    url: "/about",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Batolite",
  url: `${SITE.url}/about`,
  publisher: { "@type": "Organization", name: SITE.legalName, email: SITE.email },
};

const PRINCIPLES = [
  {
    n: "01",
    title: "Light first",
    body: "Every piece begins as a study of where the glow should land — the fixture follows the light, never the other way around.",
  },
  {
    n: "02",
    title: "One monochrome language",
    body: "Chalk, graphite, raw concrete. The palette stays quiet so a room can speak — and the warm 2700 K source can take over after dark.",
  },
  {
    n: "03",
    title: "Made to order",
    body: "Each fitting is produced in the atelier, bench-tested, and packed by the people who built it. Nothing sits in a warehouse.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <ProtectionGuard />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        {/* ------- masthead + story ------- */}
        <section className="mx-auto max-w-[1400px] px-5 pt-14 md:px-10 md:pt-20">
          <Breadcrumb items={[{ label: "Batolite", href: "/" }, { label: "About" }]} />
          <div className="mt-8">
            <Eyebrow>The studio</Eyebrow>
            <Display as="h1" size="lg">
              The house of sculpted
              <br />
              <em className="font-serif font-light italic">light.</em>
            </Display>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 pb-20 pt-12 md:px-10 md:pb-28 md:pt-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <ProtectedImage
                id="d-allon"
                alt="The Batolite reference apartment fully lit — the studio's own reference space"
                className="aspect-[4/3] w-full overflow-hidden rounded-lg ring-1 ring-neutral-900/10"
                placeholderClassName="bg-neutral-100"
              />
              <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-neutral-400">
                The reference apartment — every fitting on.
              </p>
            </Reveal>
          </div>
          <div className="flex flex-col justify-center lg:col-span-6 lg:pl-8">
            <Reveal>
              <p className="max-w-xl text-[15px] leading-[1.9] text-neutral-600 md:text-base">
                Batolite is a small lighting atelier. We design few pieces, and we design them
                slowly — cylinders spun in metal, cones cast in concrete, a disc ground to a
                razor-thin edge. The reference apartment above is our test room: every switch
                group you played with on the homepage is our own work, live in a real space.
              </p>
              <p className="mt-6 max-w-xl text-[15px] leading-[1.9] text-neutral-600 md:text-base">
                We work with homeowners, interior architects and developers who want light that
                behaves like part of the architecture — quiet by day, composed after dark.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ------- principles ------- */}
        <section className="border-y border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
            <SectionHead
              eyebrow="Principles"
              title={
                <>
                  Three rules the studio{" "}
                  <em className="font-serif font-light italic">keeps.</em>
                </>
              }
            />
            <div className="mt-12">
              {PRINCIPLES.map((p, i) => (
                <Reveal key={p.n} delay={i * 60}>
                  <div
                    className={`grid grid-cols-1 gap-4 border-t border-neutral-200 py-8 md:grid-cols-12 md:items-baseline ${
                      i === PRINCIPLES.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <p className="font-serif text-3xl font-light text-neutral-300 md:col-span-2 md:text-4xl">
                      {p.n}
                    </p>
                    <h3 className="text-xl font-extralight tracking-tight text-neutral-900 md:col-span-4 md:text-2xl">
                      {p.title}
                    </h3>
                    <p className="max-w-xl text-[13px] leading-relaxed text-neutral-500 md:col-span-6">
                      {p.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------- contact ------- */}
        <section id="contact" aria-label="Contact the studio" className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Eyebrow>Contact</Eyebrow>
              <Display as="h2">
                Let&rsquo;s light your next{" "}
                <em className="font-serif font-light italic">space.</em>
              </Display>
              <p className="mt-6 max-w-md text-[13px] leading-relaxed text-neutral-500 md:text-sm">
                For quotations, the product catalogue and project pricing, write to the studio —
                or use the form; it opens your mail app with everything pre-filled. We reply
                within two working days.
              </p>
              <dl className="mt-10 flex flex-col gap-5">
                {[
                  ["Email", SITE.email, `mailto:${SITE.email}`],
                  ["Studio hours", "Sun – Thu · 9:00 – 18:00", null],
                  ["Catalogue", "On request — PDF, print quality", null],
                ].map(([k, v, href]) => (
                  <div key={k} className="border-b border-neutral-200 pb-4">
                    <dt className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">{k}</dt>
                    <dd className="mt-1.5 text-[15px] font-light text-neutral-800">
                      {href ? (
                        <a href={href} className="border-b border-neutral-900/20 transition-colors hover:border-neutral-900">
                          {v}
                        </a>
                      ) : (
                        v
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lg:col-span-7">
              <Reveal>
                <EnquiryForm />
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
