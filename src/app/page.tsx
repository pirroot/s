import { Hero } from "@/components/site/hero";
import { SiteHeader } from "@/components/site/header";
import { Values } from "@/components/site/values";
import { ProductsShowcase } from "@/components/site/products-showcase";
import { Scene } from "@/components/site/scene";
import { Atelier } from "@/components/site/atelier";
import { Footer } from "@/components/site/footer";
import { ProtectionGuard } from "@/components/site/protection-guard";
import { SITE, PRODUCTS } from "@/data/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}#org`,
      name: SITE.legalName,
      url: SITE.url,
      logo: `${SITE.url}/og.jpg`,
      description: SITE.description,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}#site`,
      url: SITE.url,
      name: "Batolite",
      publisher: { "@id": `${SITE.url}#org` },
      inLanguage: "en",
    },
    {
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
          brand: { "@id": `${SITE.url}#org` },
        },
      })),
    },
  ],
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <ProtectionGuard />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Values />
        <ProductsShowcase />
        <Scene />
        <Atelier />
      </main>
      <Footer />
    </div>
  );
}
