// src/app/not-found.js
import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-5">
      <div>
        <p className="font-display font-black text-8xl text-black/[0.06] mb-4">
          404
        </p>
        <h1 className="font-display font-black text-2xl text-apple-black mb-3 tracking-tight">
          Page introuvable
        </h1>
        <p className="text-apple-mid text-[14px] mb-8">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="btn-dark text-sm px-7 py-3.5 inline-flex items-center gap-2"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
