import Link from "next/link";
import { ProtectedImage } from "./protected-image";
import type { Product } from "@/data/site";

/**
 * The one product card, two variants:
 *  - "showcase": the homepage card — studio portrait, hover raises the
 *    details row with a More-details link.
 *  - "catalogue": the /products row card — a touch wider, always-visible
 *    blurb, whole card links to the detail page.
 * No more copy-pasted little UI between sections.
 */

type Props = {
  product: Product;
  variant: "showcase" | "catalogue";
  priority?: boolean;
};

export function ProductCard({ product, variant, priority = false }: Props) {
  const isShowcase = variant === "showcase";

  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={`${product.name} — more details`}
      className={`group relative block shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-900/10 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
        isShowcase
          ? "h-[420px] w-[68vw] max-w-[300px] md:h-[480px] md:w-[340px] lg:h-[520px] lg:w-[360px]"
          : "h-[440px] w-[72vw] max-w-[320px] sm:w-[340px] md:h-[500px] md:w-[360px]"
      }`}
    >
      <ProtectedImage
        id={product.cover}
        alt={`${product.name} — ${product.blurb}`}
        priority={priority}
        className="absolute inset-0 h-full w-full"
        placeholderClassName="bg-neutral-100"
      />

      {/* raised details panel — always visible on touch, hover-raised on desktop */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pb-4 pt-16 text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:px-5 ${
          isShowcase
            ? "md:translate-y-[54px] md:opacity-90 md:transition-[transform,opacity] md:group-hover:translate-y-0 md:group-hover:opacity-100"
            : ""
        }`}
      >
        <p className="text-[9px] uppercase tracking-[0.3em] text-white/60" style={{ marginRight: "-0.3em" }}>
          {product.index} — {product.family}
        </p>
        <h3 className="mt-1.5 text-lg font-light tracking-wide whitespace-nowrap md:text-xl">{product.name}</h3>
        <div
          className={`grid transition-all duration-500 ease-out ${
            isShowcase ? "md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr]" : "grid-rows-[1fr]"
          }`}
        >
          <div className="overflow-hidden">
            <p className="max-w-[280px] text-[12px] leading-relaxed text-white/75">{product.blurb}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/90">
              More details
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
