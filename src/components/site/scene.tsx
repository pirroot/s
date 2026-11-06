import { ProtectedImage } from "./protected-image";
import { Reveal } from "./reveal";

/**
 * 02 — In situ: the client's own render, every Batolite fitting lit,
 * shown full-bleed. The still frame of the interactive showroom above.
 */
export function Scene() {
  return (
    <section id="scene" aria-label="The fittings in situ" className="bg-neutral-950 text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/40" style={{ marginRight: "-0.35em" }}>
                02 — In situ
              </p>
              <h2 className="mt-5 text-4xl font-extralight leading-[1.05] tracking-tight md:text-6xl">
                One room, seven
                <br />
                Batolite <em className="font-serif font-light italic">pieces.</em>
              </h2>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-white/50 md:pb-2 md:text-sm">
              Four Tubes graze the kitchen wall, a pair of Flutes pools light over the island,
              Eclipse floats above the table — the exact fittings you switched in the showroom,
              rendered at full light.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <figure className="mt-12 md:mt-16">
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
              <ProtectedImage
                id="d-allon"
                alt="The Batolite reference apartment fully lit — four Tube wall cylinders, a pair of Flute pendants over the island and the Eclipse disc above the living table"
                className="aspect-[16/10] w-full sm:aspect-[16/9] lg:aspect-[1.9]"
                placeholderClassName="bg-neutral-900"
              />
            </div>
            <figcaption className="mt-4 flex flex-col gap-2 text-[11px] uppercase tracking-[0.22em] text-white/35 md:flex-row md:items-center md:justify-between">
              <span>The reference apartment — every fitting on.</span>
              <span aria-hidden className="hidden h-px flex-1 bg-white/10 md:mx-6 md:block" />
              <span>Batolite · Tube / Flute / Eclipse</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
