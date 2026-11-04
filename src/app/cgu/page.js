import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = {
  title: "Conditions générales d’utilisation (CGU) | MTECH BENIN",
};

export default async function CGUPage() {
  let page = null;
  try {
    const apiUrl = process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || "https://mtechbenin-backend-xp3i.onrender.com";
    const res = await fetch(`${apiUrl}/api/legal/cgu`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.page) page = data.page;
    }
  } catch {}

  return (
    <LegalLayout
      title={page?.title || "Conditions générales d’utilisation (CGU)"}
      lastUpdated={page?.updatedAt || null}
      htmlContent={page?.content ?? ""}
    />
  );
}
