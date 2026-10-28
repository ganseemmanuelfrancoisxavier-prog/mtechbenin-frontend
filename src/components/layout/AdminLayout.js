"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAdmin } from "@/lib/auth";
import { authApi, settingsApi, statsApi } from "@/lib/api";
import useSondagePeriodique from "@/hooks/useSondagePeriodique";
import useProductStore from "@/store/productStore";
import {
  LayoutDashboard,
  Package,
  Smartphone,
  ShoppingBag,
  Tv,
  Wrench,
  KeyRound,
  Users,
  Tag,
  Settings,
  SlidersHorizontal,
  Menu,
  ChevronRight,
  LogOut,
  Globe,
  LayoutGrid,
  Image as ImageIcon,
  MessageSquare,
  Inbox,
  HelpCircle,
  FileText,
  X,
  Smile,
  Megaphone,
  QrCode,
} from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/produits", icon: Package, label: "Produits" },
  { href: "/admin/appareils", icon: Smartphone, label: "Smartphones" },
  { href: "/admin/iphone", icon: Smartphone, label: "iPhone" },
  { href: "/admin/caracteristiques", icon: SlidersHorizontal, label: "Caractéristiques" },
  { href: "/admin/categories", icon: LayoutGrid, label: "Catégories" },
  { href: "/admin/commandes", icon: ShoppingBag, label: "Commandes" },
  { href: "/admin/abonnements", icon: Tv, label: "Abonnements" },
  { href: "/admin/whatsapp", icon: QrCode, label: "WhatsApp" },
  { href: "/admin/codes-otp", icon: KeyRound, label: "Journal des codes" },
  { href: "/admin/reparations", icon: Wrench, label: "Réparations" },
  { href: "/admin/clients", icon: Users, label: "Clients" },
  { href: "/admin/avis", icon: MessageSquare, label: "Avis" },
  { href: "/admin/contacts", icon: Inbox, label: "Contacts" },
  { href: "/admin/faq", icon: HelpCircle, label: "FAQ" },
  { href: "/admin/legal", icon: FileText, label: "Pages légales" },
  { href: "/admin/coupons", icon: Tag, label: "Coupons" },
  { href: "/admin/hero", icon: ImageIcon, label: "Hero Médias" },
  { href: "/admin/publicites", icon: Megaphone, label: "Publicités" },
  { href: "/admin/clients-satisfaits", icon: Smile, label: "Clients satisfaits" },
  { href: "/admin/parametres", icon: Settings, label: "Paramètres" },
];

const pageLabels = {
  "/admin": "Dashboard",
  "/admin/produits": "Produits",
  "/admin/appareils": "Smartphones",
  "/admin/iphone": "Catalogue iPhone",
  "/admin/caracteristiques": "Caractéristiques",
  "/admin/categories": "Catégories",
  "/admin/commandes": "Commandes",
  "/admin/abonnements": "Abonnements",
  "/admin/whatsapp": "WhatsApp",
  "/admin/clients": "Clients",
  "/admin/avis": "Avis",
  "/admin/contacts": "Contacts",
  "/admin/faq": "FAQ",
  "/admin/legal": "Pages légales",
  "/admin/coupons": "Coupons",
  "/admin/hero": "Hero Médias",
  "/admin/publicites": "Publicités",
  "/admin/clients-satisfaits": "Clients satisfaits",
  "/admin/parametres": "Paramètres",
};

function AdminSidebar({ shopName, pathname, setSidebarOpen, handleLogout, badges }) {
  const isActive = (item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/[0.08]">
        <Link href="/" className="block" onClick={() => setSidebarOpen(false)}>
          <span className="font-display font-black text-xl text-white tracking-tight">
            {shopName}
          </span>
          <p className="text-white/35 text-[11px] mt-0.5 font-medium tracking-widest uppercase">
            Administration
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const badge = badges[item.href] || 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-150 ${
                active
                  ? "bg-white/[0.12] text-white"
                  : "text-white/55 hover:text-white hover:bg-white/[0.07]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2 : 1.6} />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="bg-cta text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-white/[0.08] space-y-0.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white/55 hover:text-white hover:bg-white/[0.07] transition-all"
        >
          <Globe className="w-4 h-4" strokeWidth={1.6} />
          Voir le site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white/55 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.6} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopName, setShopName] = useState("MTECHBENIN");
  const [badges, setBadges] = useState({});

  // Charge nom boutique
  useEffect(() => {
    settingsApi
      .getPublic()
      .then((data) => {
        if (data.settings?.shopName) setShopName(data.settings.shopName);
      })
      .catch(() => {});
  }, []);

  // Badges : commandes actives + avis en attente
  // Trois nombres, et rien d'autre. Cette barre latérale est montée sur CHAQUE
  // page d'administration : elle rapatriait 250 commandes entières toutes les
  // deux minutes — 73 Ko — pour afficher trois pastilles. Le compte se fait
  // désormais dans Postgres.
  const fetchBadges = useCallback(async () => {
    try {
      const { commandesActives, avisEnAttente, contactsNouveaux } = await statsApi.badges();
      setBadges({
        "/admin/commandes": commandesActives,
        "/admin/avis": avisEnAttente,
        "/admin/contacts": contactsNouveaux,
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Suspendu quand l'onglet passe en arrière-plan — le cas courant d'un
  // panneau ouvert toute la journée.
  useSondagePeriodique(fetchBadges, 2 * 60 * 1000);

  // Reset cache produits public à la sortie de l'admin
  useEffect(() => {
    return () => {
      useProductStore.getState().reset();
    };
  }, []);

  // Ferme le sidebar mobile sur changement de route
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    useProductStore.getState().reset();
    try { await authApi.logout(); } catch {}
    logoutAdmin();
    router.push("/admin/login");
  };

  const currentLabel = pageLabels[pathname] || "Dashboard";

  return (
    <div className="min-h-screen bg-apple-light flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0F0F0F] flex-shrink-0 fixed top-0 bottom-0 left-0 z-40 overflow-hidden">
        <AdminSidebar
          shopName={shopName}
          pathname={pathname}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
          badges={badges}
        />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0F0F0F] flex flex-col overflow-hidden animate-slide-up">
            <AdminSidebar
              shopName={shopName}
              pathname={pathname}
              setSidebarOpen={setSidebarOpen}
              handleLogout={handleLogout}
              badges={badges}
            />
          </aside>
        </div>
      )}

      {/* Zone principale */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-black/[0.06] px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl text-apple-mid hover:text-apple-black hover:bg-black/[0.04] transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-[13px]">
              <span className="text-apple-mid font-medium">Admin</span>
              {pathname !== "/admin" && (
                <>
                  <ChevronRight className="w-3 h-3 text-apple-mid/50" />
                  <span className="font-semibold text-apple-black">{currentLabel}</span>
                </>
              )}
            </div>
          </div>
          {/* Badge total dans le header mobile */}
          <div className="flex items-center gap-2">
            {Object.values(badges).some((b) => b > 0) && (
              <div className="lg:hidden flex items-center gap-1">
                {badges["/admin/commandes"] > 0 && (
                  <Link href="/admin/commandes" className="flex items-center gap-1 text-[11px] font-semibold bg-cta/10 text-cta px-2 py-1 rounded-full">
                    <ShoppingBag className="w-3 h-3" /> {badges["/admin/commandes"]}
                  </Link>
                )}
                {badges["/admin/avis"] > 0 && (
                  <Link href="/admin/avis" className="flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                    <MessageSquare className="w-3 h-3" /> {badges["/admin/avis"]}
                  </Link>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-7">{children}</main>
      </div>
    </div>
  );
}
