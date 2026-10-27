"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { categoriesApi } from "@/lib/api";
import AdminProduits from "@/components/admin/AdminProduits";

const PHONE_CATEGORY = {
  name: "Smartphones et tablettes",
  label: "Smartphones et tablettes",
  slug: "smartphone-tablette",
  icon: "📱",
  sortOrder: 6,
  active: true,
};

export default function AdminSmartphoneDevices() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function ensurePhoneCategory() {
      try {
        const { categories = [] } = await categoriesApi.getAllAdmin();
        const category = categories.find((item) => item.slug === PHONE_CATEGORY.slug);
        if (!category) {
          await categoriesApi.create(PHONE_CATEGORY);
        } else if (!category.active) {
          await categoriesApi.update(category.id, { active: true });
        }
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Impossible de préparer la catégorie des smartphones.");
        }
      }
    }
    ensurePhoneCategory();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
  }
  if (!ready) {
    return <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-sm text-apple-mid"><Smartphone className="mr-2 inline h-4 w-4" />Préparation de l’espace smartphones…</div>;
  }
  return <AdminProduits smartphoneOnly />;
}
