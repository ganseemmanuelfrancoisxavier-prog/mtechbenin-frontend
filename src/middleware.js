import { NextResponse } from "next/server";
import { MAINTENANCE, cheminOuvertPendantMaintenance } from "@/lib/maintenance";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── Maintenance ───────────────────────────────────────────────────────────
  //
  // Traitée AVANT l'authentification admin, et dans le middleware plutôt que
  // dans un composant : la redirection se décide côté serveur, avant que la
  // moindre page de boutique ne soit rendue. Le garde client
  // (`MaintenanceGuard`) laissait s'afficher un écran de boutique complet le
  // temps d'interroger l'API — et n'affichait rien du tout quand l'API ne
  // répondait pas.
  if (MAINTENANCE && !cheminOuvertPendantMaintenance(pathname)) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // On protège uniquement les routes /admin
  // sauf /admin/login qui est la page de connexion
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const isAuth = request.cookies.get("mtechbenin_admin_auth");

    if (!isAuth) {
      // Redirige vers login avec l'URL d'origine en paramètre
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Le filtre ne couvrait que `/admin` : il devait désormais voir TOUTES les
  // pages pour pouvoir les rediriger. Sont exclus les fichiers servis tels
  // quels — sans cette exclusion, le CSS, les polices et les images de la page
  // de maintenance seraient eux-mêmes redirigés vers elle, et l'écran
  // s'afficherait nu.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/|images/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|webm|woff|woff2|ttf|txt|xml|json)$).*)",
  ],
};
