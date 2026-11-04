import { notFound } from "next/navigation";
import LegalLayout from "@/components/layout/LegalLayout";

export const dynamic = "force-dynamic";

function getApiOrigins() {
  const configured = [process.env.API_SERVER_URL, process.env.NEXT_PUBLIC_API_URL];
  const origins = configured.flatMap((value) => {
    if (!value) return [];
    try { return [new URL(value).origin]; } catch { return []; }
  });
  return [...new Set([...origins, "https://mtechbenin-backend-xp3i.onrender.com"])];
}

async function fetchLegalPage(slug) {
  for (const origin of getApiOrigins()) {
    try {
      const response = await fetch(
        `${origin}/api/legal/${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );
      if (!response.ok) continue;
      const data = await response.json();
      if (data.page?.content) return data.page;
    } catch {}
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await fetchLegalPage(slug);
  return { title: page?.title ? `${page.title} | MTECHBENIN` : "Page légale | MTECHBENIN" };
}

export default async function PublicLegalPage({ params }) {
  const { slug } = await params;
  const page = await fetchLegalPage(slug);
  if (!page) notFound();
  return <LegalLayout title={page.title} lastUpdated={page.updatedAt} htmlContent={page.content} />;
}
