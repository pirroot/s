import { Reveal } from "./reveal";

/**
 * 03 — The Atelier: classic editorial spread — a serif pull-quote beside
 * the studio story, with a hairline numbers row underneath.
 */
export function Atelier() {
  return (
    <section id="atelier" aria-label="The atelier" className="bg-white text-neutral-900">
      <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-400" style={{ marginRight: "-0.35em" }}>
                03 — The Atelier
              </p>
              <blockquote className="mt-8 border-l border-neutral-900/20 pl-6 md:pl-8">
                <p className="font-serif text-3xl font-light italic leading-[1.2] text-neutral-900 md:text-[2.6rem] md:leading-[1.15]">
                  &ldquo;We don&rsquo;t decorate rooms. We compose their light.&rdquo;
                </p>
              </blockquote>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={100}>
              <p className="max-w-xl text-[15px] leading-[1.9] text-neutral-600 md:text-base">
                Every Batolite piece begins as a drawing of light, not of a lamp — a study of where
                the glow should land and what it should leave in shadow. From that study the fixture
                follows: cylinders spun in metal, cones cast in concrete, a disc ground to a
                razor-thin edge. Nothing is added that does not serve the light.
              </p>
              <p className="mt-6 max-w-xl text-[15px] leading-[1.9] text-neutral-600 md:text-base">
                The palette stays deliberately monochrome — chalk, graphite, raw concrete — so each
                piece reads as quiet architecture by day and steps forward after dark, when a warm
                2700&nbsp;K source takes over. Every fitting is made to order in the atelier and
                bench-tested before it leaves.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <dl className="mt-12 grid grid-cols-2 gap-y-8 border-t border-neutral-200 pt-10 md:grid-cols-4">
                {[
                  ["03", "Families of light"],
                  ["05", "Pieces, one language"],
                  ["2700 K", "Warm dim source"],
                  ["CRI 90+", "Colour honesty"],
                ].map(([v, k]) => (
                  <div key={k} className="flex flex-col gap-1.5">
                    <dt className="font-serif text-3xl font-light md:text-4xl">{v}</dt>
                    <dd className="text-[10px] uppercase tracking-[0.26em] text-neutral-400" style={{ marginRight: "-0.26em" }}>
                      {k}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
