"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSettingsStore from "@/store/settingsStore";
import { legalApi } from "@/lib/api";

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  const [legalPages, setLegalPages] = useState([]);

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
    let active = true;
    legalApi.getPublished().then((data) => {
      if (active) setLegalPages(data.pages || []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const socials = [
    { label: "Facebook", href: mounted ? shopFacebook : "#" },
    { label: "Instagram", href: mounted ? shopInstagram : "#" },
    { label: "TikTok", href: mounted ? shopTiktok : "#" },
  ];


  return (
    <footer className="mt-16 w-full border-t border-white/10 bg-[#080808] pt-14 pb-8 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-10 px-5 md:grid-cols-3 md:gap-10">
        {/* Colonne 1 — Infos boutique */}
        <div className="col-span-2 md:col-span-1">

          <span className="font-display text-lg font-black tracking-tight text-white">
            MTECHBENIN
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
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
                className="text-sm text-white/65 transition-colors hover:text-white"
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
                className="flex items-center gap-1.5 text-[12px] text-white/60 transition-colors hover:text-white"
                >
                  {shopWhatsapp}
                </a>
              )}
              {shopEmail && (
                <a
                  href={`mailto:${shopEmail}`}
                className="flex items-center gap-1.5 text-[12px] text-white/60 transition-colors hover:text-white"
                >
                  {shopEmail}
                </a>
              )}
              {shopAddress && (
                <p className="flex items-center gap-1.5 text-[12px] text-white/60">
                  {shopAddress}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Colonnes liens */}
        {[
          ...(legalPages.length ? [{
            title: "Légal",
            links: legalPages.map((page) => ({ label: page.title, href: `/legal/${page.slug}` })),
          }] : []),
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
            <h4 className="mb-4 text-sm font-semibold text-white">
              {col.title}
            </h4>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href || "#"}
                    className="text-sm text-white/60 transition-colors hover:text-white"
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
      <div className="mx-auto mt-12 flex max-w-7xl items-center justify-center border-t border-white/10 px-5 pt-6">
        <p className="text-xs text-white/50">
          © 2026 {mounted ? shopName : "MTECHBENIN"}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
