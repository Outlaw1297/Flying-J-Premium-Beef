"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "@/components/ui/brand-icons";

type Cut = {
  id: string;
  name: string;
  short: string;
  methods: string[];
  products: string;
  href: string;
  position: string;
};

const CUTS: Cut[] = [
  {
    id: "chuck",
    name: "Chuck",
    short: "Rich, hardworking shoulder cuts with deep beef flavor.",
    methods: ["Slow roast", "Braise", "Grind"],
    products: "Chuck roasts, stew beef, ground beef",
    href: "/shop?category=roasts",
    position: "left-[19%] top-[39%]",
  },
  {
    id: "rib",
    name: "Rib",
    short: "Tender, beautifully marbled cuts made for a hot grill.",
    methods: ["Grill", "Cast iron", "Reverse sear"],
    products: "Ribeye steaks and rib roasts",
    href: "/shop?category=steaks",
    position: "left-[36%] top-[36%]",
  },
  {
    id: "loin",
    name: "Loin",
    short: "The most tender section, prized for quick-cooking steaks.",
    methods: ["Grill", "Broil", "Pan sear"],
    products: "Strip, tenderloin, T-bone, sirloin",
    href: "/shop?category=steaks",
    position: "left-[54%] top-[36%]",
  },
  {
    id: "round",
    name: "Round",
    short: "Lean rear-leg cuts that reward careful slicing and slow heat.",
    methods: ["Roast", "Braise", "Jerky"],
    products: "Round roasts and steaks",
    href: "/shop?category=roasts",
    position: "left-[72%] top-[42%]",
  },
  {
    id: "brisket",
    name: "Brisket",
    short: "Bold-flavored breast meat that turns tender with time.",
    methods: ["Smoke", "Braise", "Low roast"],
    products: "Whole and split brisket",
    href: "/shop?category=roasts",
    position: "left-[25%] top-[63%]",
  },
  {
    id: "plate",
    name: "Plate",
    short: "Flavorful belly cuts with generous marbling.",
    methods: ["Braise", "Grill", "Smoke"],
    products: "Short ribs and skirt steak",
    href: "/shop?category=steaks",
    position: "left-[45%] top-[63%]",
  },
  {
    id: "flank",
    name: "Flank",
    short: "Lean, long-grained cuts that love marinades and high heat.",
    methods: ["Grill", "Broil", "Stir-fry"],
    products: "Flank steak",
    href: "/shop?category=steaks",
    position: "left-[61%] top-[65%]",
  },
  {
    id: "shank",
    name: "Shank",
    short: "Collagen-rich leg cuts made for stock and long braises.",
    methods: ["Braise", "Soup", "Stock"],
    products: "Cross-cut shank and soup bones",
    href: "/shop",
    position: "left-[77%] top-[69%]",
  },
];

export function CutGuide() {
  const [activeId, setActiveId] = useState(CUTS[1].id);
  const active = CUTS.find((cut) => cut.id === activeId) ?? CUTS[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.45fr_.55fr] lg:items-stretch">
      <div className="relative min-h-[26rem] overflow-hidden rounded-[2rem] border border-charcoal/10 bg-white p-4 premium-shadow sm:min-h-[34rem] sm:p-8">
        <div className="absolute inset-x-6 top-5 flex items-center justify-between text-[0.6rem] font-bold uppercase tracking-[0.16em] text-charcoal/38 sm:inset-x-10 sm:top-8">
          <span>Front</span>
          <span>Tap a section</span>
          <span>Rear</span>
        </div>

        <svg
          viewBox="0 0 900 480"
          role="img"
          aria-label="Side view illustration of a beef animal with selectable cut regions"
          className="absolute inset-x-[4%] top-[15%] h-[72%] w-[92%] text-forest"
        >
          <path
            d="M135 176c28-65 100-108 205-118 102-10 230-3 330 18 67 14 112 48 127 98l35 8c15 4 24 17 21 31-3 12-14 20-27 20h-34c-11 54-49 82-112 91l-14 89h-45l-5-82H303l-8 82h-44l-9-89c-62-8-110-28-136-61-27-34-21-66 29-107Z"
            fill="currentColor"
            opacity=".1"
            stroke="currentColor"
            strokeWidth="5"
          />
          <path
            d="M135 176 86 141l14 66M207 132c37 33 50 87 35 160M345 71c-9 81-3 163 17 251M486 67c5 84 2 167-9 255M627 76c11 87 12 166 4 243M750 118c-17 39-23 83-17 134M245 226h488"
            stroke="currentColor"
            strokeWidth="3"
            opacity=".28"
          />
          <circle cx="797" cy="161" r="6" fill="currentColor" opacity=".55" />
          <path
            d="M804 137c18-31 38-38 58-20M791 132c-10-31-28-42-48-29"
            stroke="currentColor"
            strokeWidth="4"
            opacity=".5"
          />
        </svg>

        {CUTS.map((cut) => {
          const selected = cut.id === active.id;
          return (
            <button
              key={cut.id}
              type="button"
              onClick={() => setActiveId(cut.id)}
              onMouseEnter={() => setActiveId(cut.id)}
              onFocus={() => setActiveId(cut.id)}
              aria-pressed={selected}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] transition-all sm:px-3 sm:py-2 sm:text-[0.65rem] ${cut.position} ${
                selected
                  ? "z-10 scale-110 border-copper bg-copper text-white shadow-lg"
                  : "border-forest/20 bg-cream/90 text-forest hover:border-copper hover:text-copper"
              }`}
            >
              {cut.name}
            </button>
          );
        })}
      </div>

      <aside
        aria-live="polite"
        className="flex flex-col justify-between rounded-[2rem] bg-forest p-7 text-cream sm:p-9"
      >
        <div>
          <p className="eyebrow text-copper">Selected cut</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em]">
            {active.name}
          </h2>
          <p className="mt-5 text-sm leading-7 text-cream/66">{active.short}</p>

          <div className="mt-8 border-t border-cream/12 pt-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cream/40">
              Best cooking methods
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {active.methods.map((method) => (
                <span
                  key={method}
                  className="rounded-full border border-cream/15 bg-cream/5 px-3 py-1.5 text-xs text-cream/75"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cream/40">
              Look for
            </p>
            <p className="mt-2 text-sm leading-6 text-cream/75">
              {active.products}
            </p>
          </div>
        </div>

        <Link
          href={active.href}
          className="mt-10 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-copper px-5 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#a8632e]"
        >
          Shop this cut <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </aside>
    </div>
  );
}
