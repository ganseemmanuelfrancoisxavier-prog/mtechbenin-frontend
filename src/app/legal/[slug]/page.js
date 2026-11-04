import { notFound } from "next/navigation";
import LegalLayout from "@/components/layout/LegalLayout";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const apiUrl = process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || "https://mtechbenin-backend-xp3i.onrender.com";
    const response = await fetch(`${apiUrl}/api/legal/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) return { title: "Page légale | MTECHBENIN" };
    const { page } = await response.json();
    return { title: page?.title ? `${page.title} | MTECHBENIN` : "Page légale | MTECHBENIN" };
  } catch {
    return { title: "Page légale | MTECHBENIN" };
  }
}

export default async function PublicLegalPage({ params }) {
  const { slug } = await params;
  try {
    const apiUrl = process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || "https://mtechbenin-backend-xp3i.onrender.com";
    const response = await fetch(`${apiUrl}/api/legal/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) notFound();
    const { page } = await response.json();
    if (!page?.content || !page.content.replace(/<[^>]*>/g, "").trim()) notFound();
    return <LegalLayout title={page.title} lastUpdated={page.updatedAt} htmlContent={page.content} />;
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_NOT_FOUND")) throw error;
    notFound();
  }
}
