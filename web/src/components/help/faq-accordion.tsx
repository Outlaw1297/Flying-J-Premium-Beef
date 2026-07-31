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
          <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-charcoal">
            {category.title}
          </h2>
          <p className="mt-1 text-sm text-charcoal/60">{category.description}</p>
          <div className="mt-5 divide-y divide-charcoal/10 border-y border-charcoal/12">
            {category.items.map((item) => {
              const open = openId === item.id;
              const panelId = `faq-panel-${item.id}`;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full items-start justify-between gap-5 py-5 text-left"
                  >
                    <span className="font-display text-lg font-semibold text-charcoal">
                      {item.question}
                    </span>
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-charcoal/12 text-lg text-copper transition-transform ${
                        open ? "rotate-45" : ""
                      }`}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  <div
                    id={panelId}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl pb-5 pr-10 text-sm leading-7 text-charcoal/65">
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
