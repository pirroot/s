const ITEMS = [
  { k: "Materials", v: "Spun metal & hand-cast concrete" },
  { k: "Light", v: "Warm 2700 K, CRI 90+" },
  { k: "Finish", v: "One monochrome language" },
  { k: "Production", v: "Made to order, in the atelier" },
] as const;

/** Hairline values strip — the small-cap signature under the hero. */
export function Values() {
  return (
    <section aria-label="Studio principles" className="border-y border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 px-5 md:grid-cols-4 md:px-10">
        {ITEMS.map((it, i) => (
          <div
            key={it.k}
            className={`flex flex-col gap-1.5 py-6 md:py-8 ${i > 0 ? "border-l border-neutral-200 pl-5 md:pl-8" : ""} ${
              i === 2 ? "max-md:border-l-0 max-md:pl-0" : ""
            } ${i === 3 ? "max-md:border-l max-md:pl-5" : ""}`}
          >
            <p className="text-[9px] uppercase tracking-[0.32em] text-neutral-400" style={{ marginRight: "-0.32em" }}>
              {it.k}
            </p>
            <p className="text-[12px] leading-snug text-neutral-700 md:text-[13px]">{it.v}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
