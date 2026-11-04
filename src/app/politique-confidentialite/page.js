import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = { title: "Politique de Confidentialité | MTECHBENIN" };

export default async function PolitiqueConfidentialitePage() {
  let page = null;
  try {
    const apiUrl = process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || "https://mtechbenin-backend-xp3i.onrender.com";
    const res = await fetch(`${apiUrl}/api/legal/politique-confidentialite`, { cache: "no-store" });
    if (res.ok) { const d = await res.json(); if (d.page) page = d.page; }
  } catch {}

  return (
    <LegalLayout
      title={page?.title || "Politique de Confidentialité"}
      lastUpdated={page?.updatedAt || null}
      htmlContent={page?.content ?? ""}
    />
  );
}
