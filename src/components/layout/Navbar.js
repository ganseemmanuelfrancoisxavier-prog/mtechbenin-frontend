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
  LayoutGrid,
  PackageSearch,
  Headphones,
  Wrench,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import useCartStore from "@/store/cartStore";
import useCategoryStore from "@/store/categoryStore";
import useSettingsStore from "@/store/settingsStore";
import CartDrawer from "@/components/shop/CartDrawer";
import { categories as staticCategories } from "@/lib/categories";
import useScrollThreshold from "@/hooks/useScrollThreshold";

const menuActions = [
  { label: "Tous nos produits", href: "/catalogue", icon: LayoutGrid },
  { label: "Suivre ma commande", href: "/suivi", icon: PackageSearch },
  {
    label: "Service de réparation",
    description: "MTECHBENIN répare et entretient vos appareils.",
    href: "/reparation",
    icon: Wrench,
  },
  { label: "Contacter un support", href: "/contact", icon: Headphones },
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


      </header>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            key="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <motion.button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 h-full w-full bg-neutral-950/20 backdrop-blur-[2px]"
            />

            <motion.div
              id="mobile-navigation-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Accès rapides"
              ref={menuPanelRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.78, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.82, y: -8 }}
              transition={{ type: "spring", stiffness: 420, damping: 29, mass: 0.8 }}
              onClick={(event) => event.stopPropagation()}
              className="absolute right-4 top-[64px] w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-visible rounded-[26px] border border-white/80 bg-white/95 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.22),0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:right-6"
            >
              <span aria-hidden="true" className="absolute -top-2 right-5 h-4 w-4 rotate-45 rounded-tl-sm border-l border-t border-white/80 bg-white" />
              <div className="relative overflow-hidden rounded-[20px]">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-neutral-100/80 blur-3xl" />
                <div className="relative px-3 pb-2 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">MTECHBENIN</p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">Accès rapides</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      aria-label="Fermer le menu"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-950"
                    >
                      <X className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="relative px-1 pb-2 pt-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    strokeWidth={1.8}
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Rechercher un produit..."
                    aria-label="Rechercher un produit"
                    autoComplete="off"
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-base text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-black/[0.04]"
                  />
                </form>

                <nav aria-label="Accès rapides" className="relative space-y-1 p-1">
                  {menuActions.map(({ label, description, href, icon: Icon }, index) => (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 + index * 0.055, duration: 0.22 }}
                    >
                      <Link
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={`group flex min-h-[60px] items-center gap-3 rounded-2xl border border-transparent px-3 transition-colors hover:border-neutral-200 hover:bg-neutral-50 ${
                          isActive(href) ? "bg-neutral-50 font-semibold text-neutral-950" : "font-medium text-neutral-700"
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition-colors group-hover:bg-neutral-200">
                          <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
                        </span>
                        <span className="flex-1 py-2">
                          <span className="block text-sm">{label}</span>
                          {description && (
                            <span className="mt-0.5 block text-xs font-normal leading-snug text-neutral-500">
                              {description}
                            </span>
                          )}
                        </span>
                        <ArrowRight className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Espace sous la barre fixe */}
      <div aria-hidden="true" className="h-[56px]" />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}
