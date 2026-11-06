import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ProtectionGuard } from "@/components/site/protection-guard";
import { ProtectedImage } from "@/components/site/protected-image";
import { ArrowLink, Breadcrumb, PillLink } from "@/components/site/primitives";
import { PRODUCTS, SITE, productBySlug, productNeighbours } from "@/data/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.blurb} ${p.tagline} — ${p.family.toLowerCase()} by Batolite. ${p.specs
      .map((s) => s.value)
      .join(" · ")}`,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: `${p.name} — Batolite`,
      description: p.blurb,
      url: `/products/${p.slug}`,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) notFound();
  const { prev, next } = productNeighbours(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.blurb,
    brand: { "@type": "Brand", name: SITE.legalName },
    category: p.family,
    additionalProperty: p.specs.map((s) => ({
      "@type": "PropertyValue",
      name: s.label,
      value: s.value,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <ProtectionGuard />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        {/* ------- masthead ------- */}
        <section className="mx-auto max-w-[1400px] px-5 pt-14 md:px-10 md:pt-20">
          <Breadcrumb
            items={[
              { label: "Batolite", href: "/" },
              { label: "Products", href: "/products" },
              { label: p.name },
            ]}
          />
          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="font-extralight leading-[1.02] tracking-tight text-neutral-900">
              <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-400">
                {p.index} — {p.family}
              </span>
              <span className="mt-3 block text-5xl md:text-7xl">
                {p.name.split(" — ")[0]}
                {p.name.includes(" — ") ? (
                  <span className="text-neutral-400"> — {p.name.split(" — ")[1]}</span>
                ) : (
                  <em className="font-serif font-light italic">.</em>
                )}
              </span>
            </h1>
            <p className="max-w-sm font-serif text-xl font-light italic text-neutral-700 md:pb-2 md:text-2xl">
              {p.tagline}
            </p>
          </div>
        </section>

        {/* ------- gallery + info ------- */}
        <section className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-5 pb-20 pt-12 md:px-10 md:pb-28 md:pt-16 lg:grid-cols-12 lg:gap-10">
          {/* photographs */}
          <div className="flex flex-col gap-10 lg:col-span-7">
            <figure>
              <ProtectedImage
                id={p.cover}
                alt={`${p.name} — studio photograph`}
                priority
                className="aspect-[3/4] w-full overflow-hidden rounded-lg ring-1 ring-neutral-900/10"
                placeholderClassName="bg-neutral-100"
              />
              <figcaption className="mt-3 text-[10px] uppercase tracking-[0.24em] text-neutral-400">
                {p.index} · Studio portrait
              </figcaption>
            </figure>

            {p.gallery.map((shot) => (
              <figure key={shot.mediaId}>
                <ProtectedImage
                  id={shot.mediaId}
                  alt={`${p.name} — ${shot.caption}`}
                  className={`w-full overflow-hidden rounded-lg ring-1 ring-neutral-900/10 ${
                    shot.mediaId.startsWith("g-eclipse-b") || shot.mediaId === "g-wide"
                      ? "aspect-[16/10]"
                      : "aspect-[3/4] sm:aspect-[4/3]"
                  }`}
                  placeholderClassName="bg-neutral-100"
                />
                <figcaption className="mt-3 flex items-center gap-4 text-[10px] uppercase tracking-[0.24em] text-neutral-400">
                  <span>{shot.caption}</span>
                  <span aria-hidden className="h-px flex-1 bg-neutral-200" />
                </figcaption>
              </figure>
            ))}
          </div>

          {/* sticky info column */}
          <aside className="lg:col-span-5">
            <div className="flex flex-col gap-10 lg:sticky lg:top-24">
              <div className="flex flex-col gap-5">
                {p.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className={`text-[15px] leading-[1.9] text-neutral-600 ${i === 0 ? "text-neutral-700" : ""}`}
                  >
                    {para}
                  </p>
                ))}
              </div>

              <dl className="border-t border-neutral-200">
                {p.specs.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-baseline justify-between gap-6 border-b border-neutral-200 py-3.5"
                  >
                    <dt className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">{s.label}</dt>
                    <dd className="text-[13px] font-light text-neutral-800">{s.value}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-6 border-b border-neutral-200 py-3.5">
                  <dt className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">Finish</dt>
                  <dd className="text-[13px] font-light text-neutral-800">{p.finish}</dd>
                </div>
              </dl>

              <div className="flex flex-col items-start gap-4">
                <PillLink
                  href={`mailto:${SITE.email}?subject=${encodeURIComponent(`Enquiry — ${p.name}`)}`}
                >
                  Enquire about {p.name.split(" — ")[0]}
                </PillLink>
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Quotations, finishes and lead times — the studio replies within two working
                  days.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* ------- prev / next band ------- */}
        <nav
          aria-label="More products"
          className="border-t border-neutral-200 bg-white"
        >
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y divide-neutral-200 px-5 md:grid-cols-2 md:divide-x md:divide-y-0 md:px-10">
            <Link
              href={`/products/${prev.slug}`}
              className="group flex flex-col gap-1.5 py-10 pr-6 transition-colors md:py-14"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                ← Previous — {prev.index}
              </span>
              <span className="text-2xl font-extralight tracking-tight text-neutral-900 transition-transform duration-300 group-hover:-translate-x-1 md:text-3xl">
                {prev.name}
              </span>
            </Link>
            <Link
              href={`/products/${next.slug}`}
              className="group flex flex-col items-start gap-1.5 py-10 pl-6 text-right transition-colors md:items-end md:py-14"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                Next — {next.index} →
              </span>
              <span className="text-2xl font-extralight tracking-tight text-neutral-900 transition-transform duration-300 group-hover:translate-x-1 md:text-3xl">
                {next.name}
              </span>
            </Link>
          </div>
        </nav>

        <div className="mx-auto flex max-w-[1400px] justify-center px-5 pb-16 md:pb-20">
          <ArrowLink href="/products">Back to the collection</ArrowLink>
        </div>
      </main>
      <Footer />
    </div>
  );
}
