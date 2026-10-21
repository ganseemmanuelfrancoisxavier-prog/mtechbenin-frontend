"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function CategoryGrid3D({ items }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const reduceMotion = useReducedMotion();

  const selectedItem = items.find((item) => item.slug === selectedCategory);

  return (
    <div
      className="relative mx-auto min-h-[34rem] max-w-3xl"
      style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
    >
      <div
        className={`grid grid-cols-2 gap-4 ${selectedCategory ? "pointer-events-none" : ""}`}
        aria-hidden={selectedCategory ? "true" : undefined}
      >
        {items.map(({ slug, label, Icon }, index) => {
          const isSelected = slug === selectedCategory;
          const column = index % 2;
          const xDirection = column === 0 ? -1 : 1;

          return (
            <motion.button
              key={slug}
              type="button"
              onClick={() => setSelectedCategory(slug)}
              aria-label={`Explorer ${label}`}
              initial={false}
              animate={
                selectedCategory
                  ? reduceMotion
                    ? { opacity: 0, scale: 0.94, x: isSelected ? 0 : xDirection * 30, z: 0, rotateY: 0 }
                    : isSelected
                      ? { opacity: 0, scale: 0.2, x: 0, z: -800, rotateY: 0 }
                      : { opacity: 0, scale: 1.4, x: xDirection * 300, z: 400, rotateY: xDirection * 35 }
                  : { opacity: 1, scale: 1, x: 0, y: 0, z: 0, rotateY: 0 }
              }
              transition={{
                duration: reduceMotion ? 0.2 : 0.9,
                delay: selectedCategory && !reduceMotion ? index * 0.025 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
              tabIndex={selectedCategory ? -1 : 0}
              className="relative z-0 flex min-h-[118px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-black/[0.04] bg-white p-5 text-center shadow-[0_8px_28px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50"
              style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            >
              <span className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04]">
                <Icon className="h-5 w-5 text-apple-black" strokeWidth={1.6} />
              </span>
              <span className="text-[13px] font-semibold leading-tight text-apple-black">
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            key={selectedItem.slug}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, z: -600, scale: 0.82 }}
            animate={{ opacity: 1, z: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, z: -600, scale: 0.82 }}
            transition={{ duration: reduceMotion ? 0.18 : 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-10 flex min-h-[34rem] flex-col rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.14)] sm:p-9"
            style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            aria-labelledby="category-detail-title"
          >
            <button
              type="button"
              autoFocus
              onClick={() => setSelectedCategory(null)}
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-apple-black transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Notre univers
            </button>

            <div className="my-auto flex flex-col items-center py-10 text-center">
              <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-black/[0.04]">
                <selectedItem.Icon className="h-9 w-9 text-apple-black" strokeWidth={1.4} />
              </span>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-apple-mid">
                Découvrir l’univers
              </p>
              <h3
                id="category-detail-title"
                className="font-display text-3xl font-black tracking-tight text-apple-black sm:text-4xl"
              >
                {selectedItem.label}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-apple-mid sm:text-base">
                Parcourez notre sélection et trouvez ce qui vous correspond.
              </p>
              <Link
                href={selectedItem.href}
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Découvrir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
