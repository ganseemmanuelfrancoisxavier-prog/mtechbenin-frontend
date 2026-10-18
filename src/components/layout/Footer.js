"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSettingsStore from "@/store/settingsStore";
import useCategoryStore from "@/store/categoryStore";
import { categories as staticCategories } from "@/lib/categories";

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  const { getActiveCategories, fetchCategories } = useCategoryStore();
  const {
    shopName,
    shopSlogan,
    shopEmail,
    shopWhatsapp,
    shopAddress,
    shopFacebook,
    shopInstagram,
    shopTiktok,
  } = useSettingsStore();

  useEffect(() => {
    setMounted(true);
    fetchCategories(); // ← charge les catégories depuis l'API
  }, []);

  const activeCategories = mounted
    ? getActiveCategories()
    : staticCategories.filter((c) => c.active);

  const socials = [
    { label: "Facebook", href: mounted ? shopFacebook : "#" },
    { label: "Instagram", href: mounted ? shopInstagram : "#" },
    { label: "TikTok", href: mounted ? shopTiktok : "#" },
  ];

  const shopLinks = [
    { label: "Tous les produits", href: "/catalogue" },
    ...activeCategories.map((c) => ({
      label: c.label || c.name,
      href: `/catalogue/${c.slug}`,
    })),
    { label: "Abonnements", href: "/abonnements" },
  ];

  return (
    <footer className="bg-apple-gray border-t border-black/5 pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Colonne 1 — Infos boutique */}
        <div className="col-span-2 md:col-span-1">
          <span className="font-display font-black text-lg text-apple-black">
            {mounted ? shopName : "MTECHBENIN"}
          </span>
          <p className="mt-3 text-sm text-apple-mid leading-relaxed max-w-xs">
            {mounted
              ? shopSlogan
              : "Votre boutique tech de confiance au Bénin."}
          </p>
          <div className="flex gap-4 mt-5">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-apple-mid hover:text-apple-black transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
          {mounted && (
            <div className="mt-4 space-y-1.5">
              {shopWhatsapp && (
                <a
                  href={`https://wa.me/${shopWhatsapp.replace(/\s/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[12px] text-apple-mid hover:text-apple-black transition-colors"
                >
                  {shopWhatsapp}
                </a>
              )}
              {shopEmail && (
                <a
                  href={`mailto:${shopEmail}`}
                  className="flex items-center gap-1.5 text-[12px] text-apple-mid hover:text-apple-black transition-colors"
                >
                  {shopEmail}
                </a>
              )}
              {shopAddress && (
                <p className="flex items-center gap-1.5 text-[12px] text-apple-mid">
                  {shopAddress}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Colonnes liens */}
        {[
          { title: "Boutique", links: shopLinks },
          {
            title: "Légal",
            links: [
              { label: "Conditions d'utilisation", href: "/cgv" },
              { label: "Confidentialité", href: "/politique-confidentialite" },
              { label: "Retours & Échanges", href: "/retours" },
              { label: "Livraison", href: "/livraison" },
            ],
          },
          {
            title: "Support",
            links: [
              { label: "Nous contacter", href: "/contact" },
              { label: "FAQ", href: "/faq" },
              {
                label: "WhatsApp",
                href: `https://wa.me/${mounted ? shopWhatsapp?.replace(/\s/g, "") : ""}`,
              },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-apple-black font-semibold text-sm mb-4">
              {col.title}
            </h4>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href || "#"}
                    className="text-sm text-apple-mid hover:text-apple-black transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-5 mt-12 pt-6 border-t border-black/10 flex items-center justify-center">
        <p className="text-xs text-apple-mid">
          © 2026 {mounted ? shopName : "MTECHBENIN"}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
