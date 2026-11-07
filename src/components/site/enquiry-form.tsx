"use client";

import { useState } from "react";
import { SITE } from "@/data/site";

/**
 * The enquiry form — classic hairline fields. No backend needed in phase 2:
 * submitting composes a mailto: to the studio with the enquiry pre-filled.
 * (Phase 3 swaps this for the API route; the shape stays.)
 */

type Props = {
  /** pre-select a product in the "interested in" line */
  defaultProduct?: string;
};

const FIELDS = "w-full border-b border-neutral-300 bg-transparent py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900";

export function EnquiryForm({ defaultProduct = "" }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState(defaultProduct);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Batolite enquiry${product ? ` — ${product}` : ""}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      product ? `Interested in: ${product}` : null,
      "",
      message,
    ]
      .filter((l) => l !== null)
      .join("\n");
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form onSubmit={submit} className="mt-10 flex flex-col gap-7">
      <div className="grid gap-7 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">Name</span>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={FIELDS}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            className={FIELDS}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">Interested in</span>
        <input
          type="text"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="A piece, a project, a catalogue — optional"
          className={FIELDS}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">Message</span>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about the space — size, mood, timeline."
          className={`${FIELDS} resize-none`}
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-5">
        <button
          type="submit"
          className="inline-flex items-center rounded-full border border-neutral-900 bg-neutral-900 px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.3em] text-white transition-colors hover:bg-white hover:text-neutral-900"
        >
          Send the enquiry
        </button>
        <p
          aria-live="polite"
          className={`text-[11px] tracking-wide text-neutral-400 transition-opacity duration-500 ${
            sent ? "opacity-100" : "opacity-0"
          }`}
        >
          Your mail app is opening with the enquiry pre-filled — press send there.
        </p>
      </div>
    </form>
  );
}
