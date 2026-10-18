"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import useSettingsStore from "@/store/settingsStore";

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-200 ${open ? "bg-apple-gray/60" : "bg-white border border-black/[0.05] hover:border-black/10"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-medium text-apple-black text-[14px] pr-4 leading-snug">
          {question}
        </span>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${open ? "bg-apple-black text-white" : "bg-apple-gray text-apple-mid"}`}>
          {open ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="w-full h-px bg-black/[0.06] mb-4" />
              <p className="text-apple-mid text-[13px] leading-[1.8]">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqAccordion({ faqs }) {
  const { shopWhatsapp } = useSettingsStore();
  const waNumber = shopWhatsapp.replace(/\D/g, "");

  // Grouper par catégorie, en respectant l'ordre reçu
  const grouped = faqs.reduce((acc, faq) => {
    const cat = faq.category || "Général";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <div className="max-w-3xl mx-auto px-5 py-14">
      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-3">Aide</p>
        <h1 className="font-display font-black text-4xl md:text-5xl text-apple-black mb-4 tracking-tight">
          Questions fréquentes
        </h1>
        <p className="text-apple-mid text-[15px]">
          Vous ne trouvez pas votre réponse ?{" "}
          <Link href="/contact" className="text-primary hover:underline font-medium">
            Contactez-nous
          </Link>
        </p>
      </div>

      {/* Sections par catégorie */}
      {categories.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-apple-mid">Aucune question disponible pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {categories.map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-6 bg-cta rounded-full" />
                <h2 className="font-display font-bold text-[18px] text-apple-black tracking-tight">
                  {cat}
                </h2>
              </div>
              <div className="space-y-2">
                {grouped[cat].map((item) => (
                  <FaqItem key={item.id || item.question} question={item.question} answer={item.answer} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA bas de page */}
      <div className="mt-16 rounded-3xl bg-[#0A0A0A] px-8 py-10 text-center">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Support</p>
        <h3 className="font-display font-black text-2xl text-white mb-2">
          Encore des questions ?
        </h3>
        <p className="text-white/40 text-[14px] mb-7">
          Notre équipe est disponible 7j/7 via WhatsApp
        </p>
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-2xl transition shadow-lg shadow-green-500/25"
        >
          Contacter sur WhatsApp
        </a>
      </div>
    </div>
  );
}
