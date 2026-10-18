import Link from "next/link";
import { Smartphone, Tablet, Laptop, FileText, ArrowRight } from "lucide-react";

// Composant SERVEUR : cet écran n'a ni état ni gestionnaire d'événement, et le
// survol est purement CSS. Un `"use client"` y aurait embarqué la page dans le
// paquet JavaScript du navigateur sans rien apporter.

// Écran d'entrée du service de réparation.
//
// Quatre tuiles, mais elles ne sont PAS de même nature : les trois premières
// ouvrent un catalogue, la quatrième est une page de contenu. La distinction
// est portée par le visuel (fond sombre contre fond clair) plutôt que par un
// titre de section : le client la comprend sans qu'on la lui explique.
//
// Les trois espaces sont figés côté serveur (`enum RepairSpace`), et ils le
// sont ici aussi. Les ajouter en base ne suffirait pas à les faire apparaître —
// c'est voulu : l'administrateur gère le CONTENU de chaque espace, pas la liste
// des espaces.
//
// `pret` dit si l'écran de destination existe DÉJÀ. Tant qu'il vaut `false`, la
// tuile ne mène nulle part et l'annonce : un lien vers une page inexistante
// envoie le client sur une erreur 404, ce qui est pire que de ne rien proposer.
// Chaque écran construit fera passer sa tuile à `true`.
const ESPACES = [
  {
    slug: "apple",
    pret: true,
    nom: "Apple",
    // « iPhone » seul écarterait le client venu pour son iPad ou son MacBook :
    // il chercherait une quatrième tuile qui n'existe pas, et repartirait.
    detail: "iPhone · iPad · Mac",
    Icone: Smartphone,
    fond: "from-[#0A0A0A] via-[#1a1a2e] to-[#0f3460]",
  },
  {
    slug: "android",
    pret: true,
    nom: "Androïd",
    detail: "Samsung · Xiaomi · Tecno…",
    Icone: Tablet,
    fond: "from-[#0f2027] via-[#203a43] to-[#2c5364]",
  },
  {
    slug: "pc",
    pret: true,
    nom: "PC portable",
    detail: "Dell · HP · Lenovo · Asus…",
    Icone: Laptop,
    fond: "from-[#141E30] via-[#243B55] to-[#2b5876]",
  },
];

export default function ReparationHub() {
  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl md:text-5xl text-apple-black tracking-tight mb-2">
          Réparation
        </h1>
        <p className="text-apple-mid text-[14px] md:text-[15px] max-w-xl">
          Choisissez votre appareil, sélectionnez la réparation, et découvrez le
          prix immédiatement. Un livreur passe récupérer votre appareil.
        </p>
      </div>

      {/* Grille 2 × 2 sur mobile, les quatre sur une ligne à partir de `md`.
          Le 2 × 2 vient de la maquette du propriétaire ; l'alignement sur une
          ligne évite deux tuiles démesurées et beaucoup de vide sur un écran
          d'ordinateur. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {ESPACES.map(({ slug, nom, detail, Icone, fond, pret }) => {
          const contenu = (
            <>
              <div className={`absolute inset-0 bg-gradient-to-br ${fond}`} />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/[0.05] rounded-full" />
              <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-white/[0.03] rounded-full" />

              <div className="relative h-full flex flex-col justify-between p-4 md:p-5">
                <div className="flex items-start justify-between gap-2">
                  <Icone
                    className="w-7 h-7 md:w-8 md:h-8 text-white/90"
                    strokeWidth={1.6}
                  />
                  {!pret && (
                    <span className="text-white/70 text-[9px] md:text-[10px] font-semibold uppercase tracking-widest bg-white/10 rounded-full px-2 py-0.5 whitespace-nowrap">
                      Bientôt
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-display font-black text-white text-lg md:text-2xl tracking-tight leading-none">
                    {nom}
                  </p>
                  <p className="text-white/55 text-[11px] md:text-[12px] mt-1.5 leading-snug">
                    {detail}
                  </p>
                </div>
              </div>
            </>
          );

          const forme =
            "group relative rounded-3xl overflow-hidden aspect-[3/4] md:aspect-[4/5] transition-all duration-300";

          // Une tuile pas encore prête reste visible — le client voit ce qui
          // arrive — mais n'est ni cliquable ni annoncée comme un lien aux
          // lecteurs d'écran.
          return pret ? (
            <Link
              key={slug}
              href={`/reparation/${slug}`}
              className={`${forme} hover:-translate-y-1 hover:shadow-xl`}
            >
              {contenu}
            </Link>
          ) : (
            <div key={slug} className={`${forme} opacity-75 cursor-default`}>
              {contenu}
            </div>
          );
        })}

        {/* La quatrième tuile ne mène à aucun catalogue : fond clair, pour
            qu'on ne la confonde pas avec un appareil réparable. */}
        <Link
          href="/reparation/conditions"
          className="group relative rounded-3xl overflow-hidden aspect-[3/4] md:aspect-[4/5] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          style={{
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          <div className="relative h-full flex flex-col justify-between p-4 md:p-5">
            <FileText
              className="w-7 h-7 md:w-8 md:h-8 text-apple-mid"
              strokeWidth={1.6}
            />
            <div>
              <p className="font-display font-black text-apple-black text-[15px] md:text-lg tracking-tight leading-tight">
                Conditions générales de réparation
              </p>
              <span className="inline-flex items-center gap-1 text-apple-mid text-[11px] md:text-[12px] mt-1.5 group-hover:gap-2 transition-all">
                Lire <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Le client qui ignore la panne n'a rien à chercher dans le catalogue :
          on le sort du parcours dès l'entrée plutôt qu'au bout de trois écrans.
          Le choix de l'appareil reste nécessaire, d'où le passage par un
          espace. */}
      <div
        className="mt-6 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{
          background: "rgba(0,0,0,0.02)",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div>
          <p className="font-semibold text-apple-black text-[14px]">
            Vous ne savez pas ce qui ne va pas ?
          </p>
          <p className="text-apple-mid text-[12px] mt-0.5">
            Décrivez la panne, nous récupérons l&apos;appareil et nous
            l&apos;analysons.
          </p>
        </div>
        <span className="text-apple-mid text-[12px] whitespace-nowrap">
          Choisissez d&apos;abord votre appareil ci-dessus
        </span>
      </div>
    </div>
  );
}
