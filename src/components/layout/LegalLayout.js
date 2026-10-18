import ShopLayout from "@/components/layout/ShopLayout";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";

// Injecte des IDs sur h2/h3 et extrait les entrées de sommaire
function processContent(html) {
  const headings = [];
  const processed = html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (_, tag, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const id = text
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 60);
    if (id) headings.push({ id, text, level: tag === "h2" ? 2 : 3 });
    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });
  return { processed, headings };
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function LegalLayout({ title, lastUpdated, children, htmlContent }) {
  const { processed, headings } = htmlContent
    ? processContent(htmlContent)
    : { processed: null, headings: [] };

  const showToc = headings.length >= 3;
  const formattedDate = formatDate(lastUpdated);

  return (
    <ShopLayout>
      <div className={`mx-auto px-5 py-12 ${showToc ? "max-w-6xl" : "max-w-3xl"}`}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] text-apple-mid mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-apple-black font-medium">{title}</span>
        </nav>

        <div className={`flex gap-14 ${showToc ? "items-start" : ""}`}>
          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-10">
              <h1 className="font-display font-black text-3xl md:text-4xl text-apple-black mb-4 tracking-tight">
                {title}
              </h1>
              {formattedDate && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-apple-gray text-apple-mid text-[11px] font-medium">
                  <Clock className="w-3 h-3" />
                  Mis à jour le {formattedDate}
                </span>
              )}
            </div>

            {/* Contenu */}
            {processed ? (
              <div
                className="legal-content"
                dangerouslySetInnerHTML={{ __html: processed }}
              />
            ) : (
              <div className="legal-content">{children}</div>
            )}
          </div>

          {/* Table des matières — desktop uniquement, ≥3 sections */}
          {showToc && (
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="sticky top-24">
                <p className="text-[10px] font-semibold text-apple-mid uppercase tracking-widest mb-4">
                  Sommaire
                </p>
                <nav className="space-y-1">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`block text-[12px] leading-snug py-1.5 transition-colors hover:text-primary ${
                        h.level === 3 ? "pl-3 text-apple-mid/70" : "text-apple-mid font-medium"
                      }`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}
