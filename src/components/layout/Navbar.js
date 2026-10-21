"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart,
  Search,
  X,
  Menu,
  ArrowRight,
  Home,
  LayoutGrid,
  PackageSearch,
  Wrench,
  Tv,
  Headphones,
  CircleHelp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import useCartStore from "@/store/cartStore";
import useCategoryStore from "@/store/categoryStore";
import useSettingsStore from "@/store/settingsStore";
import CartDrawer from "@/components/shop/CartDrawer";
import { categories as staticCategories } from "@/lib/categories";
import useScrollThreshold from "@/hooks/useScrollThreshold";

const menuActions = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Tous nos produits", href: "/catalogue", icon: LayoutGrid },
  { label: "Suivre ma commande", href: "/suivi", icon: PackageSearch },
  { label: "Service de réparation", href: "/reparation", icon: Wrench },
  { label: "Abonnements", href: "/abonnements", icon: Tv },
  { label: "Mon panier", href: "/panier", icon: ShoppingCart },
  { label: "Contacter le support", href: "/contact", icon: Headphones },
  { label: "Aide & FAQ", href: "/faq", icon: CircleHelp },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrolled = useScrollThreshold(8);
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const searchInputRef = useRef(null);
  const menuPanelRef = useRef(null);
  const menuButtonRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();

  const items = useCartStore((state) => state.items);
  const { getActiveCategories, fetchCategories } = useCategoryStore();
  const { shopName } = useSettingsStore();

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchQuery("");
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = menuPanelRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled])',
    );
    menuPanelRef.current?.focus();

    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const elements = menuPanelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled])',
      );
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", trapFocus);
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSearchQuery("");
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const totalItems = mounted
    ? items.reduce((total, item) => total + (item.quantity || 0), 0)
    : 0;

  const navCategories = mounted
    ? [
        ...getActiveCategories().map((category) => ({
          name: category.label || category.name,
          href: `/catalogue/${category.slug}`,
        })),
        { name: "Abonnements", href: "/abonnements" },
        { name: "Réparation", href: "/reparation" },
        { name: "Suivi commande", href: "/suivi" },
      ]
    : [
        ...staticCategories
          .filter((category) => category.active)
          .map((category) => ({
            name: category.label,
            href: `/catalogue/${category.slug}`,
          })),
        { name: "Abonnements", href: "/abonnements" },
        { name: "Réparation", href: "/reparation" },
        { name: "Suivi commande", href: "/suivi" },
      ];

  const menuCategories = navCategories.filter(
    (category) =>
      !["/abonnements", "/reparation", "/suivi"].includes(category.href),
  );

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleToggleMenu = () => {
    setMenuOpen((previous) => !previous);
    setSearchQuery("");
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      searchInputRef.current?.focus();
      return;
    }

    setMenuOpen(false);
    router.push(`/recherche?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-black/[0.06] bg-white/90 shadow-sm backdrop-blur-2xl"
            : "border-transparent bg-white/80 backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex h-[56px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            aria-label="Accueil MTECHBENIN"
            onClick={() => {
              setMenuOpen(false);

            }}
            className="shrink-0"
          >
            <span className="text-[17px] font-bold tracking-[-0.7px] text-neutral-950 sm:text-[19px]">
              {mounted && shopName ? shopName : "MTECHBENIN"}
            </span>
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-0.5 lg:flex"
          >
            {navCategories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className={`rounded-full px-3 py-2 text-[12px] transition-colors xl:px-3.5 xl:text-[13px] ${
                  isActive(category.href)
                    ? "bg-black/[0.06] font-semibold text-neutral-950"
                    : "font-medium text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-950"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setCartOpen(true);
                setMenuOpen(false);

              }}
              aria-label={`Ouvrir le panier, ${totalItems} article(s)`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-black/[0.05] hover:text-neutral-950"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />

              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    }}
                    className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white"
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={handleToggleMenu}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation-panel"
              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-black/[0.05] lg:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? "close-menu" : "open-menu"}
                  initial={{ opacity: 0, rotate: -15, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 15, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  {menuOpen ? (
                    <X className="h-5 w-5" strokeWidth={1.8} />
                  ) : (
                    <Menu className="h-5 w-5" strokeWidth={1.8} />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              id="mobile-navigation-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 top-[56px] z-50 overflow-y-auto bg-black/35 backdrop-blur-[2px] lg:hidden"
            >
              <button type="button" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 h-full w-full" />
              <div role="dialog" aria-modal="true" aria-label="Menu de navigation" ref={menuPanelRef} tabIndex={-1} className="relative ml-auto max-h-full w-full max-w-lg overflow-y-auto border-t border-black/[0.06] bg-white/95 px-4 pb-6 pt-5 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:px-6">
                <div className="mb-5 px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Découvrir
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
                    {mounted && shopName ? shopName : "MTECHBENIN"}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Technologie. Accessoires. Services.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="relative mb-5">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
                    strokeWidth={1.8}
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Rechercher un produit..."
                    aria-label="Rechercher un produit depuis le menu"
                    autoComplete="off"
                    className="h-[52px] w-full rounded-2xl border border-neutral-200 bg-neutral-100/80 pl-12 pr-12 text-base text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-black/[0.04]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Effacer la recherche"
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-950"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </form>

                <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Accès rapide
                </p>
                <div className="mb-6 grid grid-cols-2 gap-2">
                  {menuActions.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex min-h-14 items-center gap-2.5 rounded-2xl border px-3 py-3 text-[13px] transition-colors ${
                        isActive(href)
                          ? "border-neutral-300 bg-neutral-100 font-semibold text-neutral-950"
                          : "border-neutral-200/70 bg-white font-medium text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.8} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>

                <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Catégories
                </p>
                <div className="space-y-2">
                  {menuCategories.map((category, index) => {
                    const active = isActive(category.href);

                    return (
                      <motion.div
                        key={category.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: Math.min(index * 0.025, 0.2),
                          duration: 0.2,
                        }}
                      >
                        <Link
                          href={category.href}
                          onClick={() => setMenuOpen(false)}
                          className={`group flex items-center justify-between rounded-2xl border px-4 py-3.5 text-sm transition-all ${
                            active
                              ? "border-neutral-300 bg-neutral-100 font-semibold text-neutral-950"
                              : "border-neutral-200/70 bg-white font-medium text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                          }`}
                        >
                          <span>{category.name}</span>
                          <ArrowRight
                            className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-hover:translate-x-1"
                            strokeWidth={1.7}
                          />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="mt-6 text-center text-xs text-neutral-400">
                  Une expérience simple, élégante et pensée pour vous.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Espace sous la barre fixe */}
      <div aria-hidden="true" className="h-[56px]" />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}
