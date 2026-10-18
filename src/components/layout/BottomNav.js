"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Tv, Cog } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/abonnements", icon: Tv, label: "Abonnements" },
  { href: "/catalogue", icon: Grid, label: "Produits" },
  // Réparation occupe la place du panier, à la demande du propriétaire.
  // Le panier reste à un geste : la barre du haut en porte l'icône, avec son
  // compteur, et elle est visible sur mobile — sans quoi le retirer d'ici
  // aurait éloigné le chemin d'achat le plus court d'une boutique.
  // `Cog` plutôt que la clé à molette : la roue dentée se lit mieux en 20 px
  // que des mâchoires fines, et céder la place du panier imposait un repère
  // immédiat. Choisie sur la roue des réglages, en version mécanique.
  { href: "/reparation", icon: Cog, label: "Réparation" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Masquer sur les pages admin
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Fond glass */}
      <div className="bg-white/85 backdrop-blur-2xl border-t border-black/[0.06] px-2 pb-[env(safe-area-inset-bottom,8px)]">
        <div className="flex items-center justify-around py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 min-w-0 flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all duration-200"
              >
                <Icon
                  className={`w-[22px] h-[22px] transition-all duration-200 ${
                    isActive ? "text-apple-black scale-110" : "text-apple-mid"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />

                <span
                  className={`text-[10px] font-medium transition-all duration-200 max-w-full truncate ${
                    isActive
                      ? "text-apple-black font-semibold"
                      : "text-apple-mid"
                  }`}
                >
                  {item.label}
                </span>

                {/* Point actif */}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-apple-black rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
