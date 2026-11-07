import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/header";
import { ProductsRow } from "@/components/site/products-row";
import { Footer } from "@/components/site/footer";
import { ProtectionGuard } from "@/components/site/protection-guard";
import { Breadcrumb, Eyebrow } from "@/components/site/primitives";
import { SITE, PRODUCTS } from "@/data/site";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "The Batolite collection — five pieces, two families: quiet wall cylinders and sculpted pendants, in one monochrome language. Browse the catalogue row and open any piece.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "The Collection — Batolite",
    description: "Five pieces, two families of light — browse the full Batolite catalogue.",
    url: "/products",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Batolite Collection",
  itemListElement: PRODUCTS.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE.url}/products/${p.slug}`,
    item: {
      "@type": "Product",
      name: p.name,
      description: p.blurb,
      brand: { "@type": "Brand", name: SITE.legalName },
    },
  })),
};

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <ProtectionGuard />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <section
          aria-label="The collection"
          className="mx-auto max-w-[1400px] px-5 pb-2 pt-14 md:px-10 md:pt-20"
        >
          <Breadcrumb items={[{ label: "Batolite", href: "/" }, { label: "Products" }]} />
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>The catalogue</Eyebrow>
              <h1 className="mt-5 font-extralight leading-[1.02] tracking-tight text-neutral-900">
                <span className="block text-5xl md:text-7xl">The</span>
                <span className="block text-5xl md:text-7xl">
                  Collection<em className="font-serif font-light italic">.</em>
                </span>
              </h1>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-neutral-500 md:pb-3 md:text-sm">
              Five pieces, two families — spun pendants and quiet wall cylinders in one
              monochrome language. Drag the row, or open any piece for its photographs.
            </p>
          </div>
        </section>
        <div className="pt-10 md:pt-14">
          <ProductsRow />
        </div>
      </main>
      <Footer />
    </div>
  );
}
