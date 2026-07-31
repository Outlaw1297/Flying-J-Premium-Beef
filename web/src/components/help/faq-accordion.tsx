"use client";

import { useState } from "react";
import type { FaqCategory } from "@/lib/faq";

export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  const [openId, setOpenId] = useState<string | null>(
    categories[0]?.items[0]?.id ?? null,
  );

  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category.id} id={category.id}>
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            {category.title}
          </h2>
          <p className="mt-1 text-sm text-charcoal/60">{category.description}</p>
          <div className="mt-4 divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-white shadow-sm">
            {category.items.map((item) => {
              const open = openId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-medium text-charcoal">
                      {item.question}
                    </span>
                    <span
                      className={`mt-0.5 shrink-0 text-copper transition-transform ${
                        open ? "rotate-45" : ""
                      }`}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm leading-relaxed text-charcoal/70">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
