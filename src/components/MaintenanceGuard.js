"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import useSettingsStore from "@/store/settingsStore";
import { MAINTENANCE } from "@/lib/maintenance";

export default function MaintenanceGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { maintenanceMode, fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Charger les paramètres en arrière-plan : leur réponse ne doit jamais
    // retarder l'affichage initial de la boutique.
    void fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const isAdmin = pathname.startsWith("/admin");
    const isMaintenance = pathname === "/maintenance";

    // La maintenance forcée par le code fait autorité, et elle est déjà
    // appliquée par le middleware — il n'y a rien à rediriger ici.
    if (MAINTENANCE) return;

    if (maintenanceMode && !isAdmin && !isMaintenance) {
      router.replace("/maintenance");
    } else if (!maintenanceMode && isMaintenance) {
      router.replace("/");
    }
  }, [maintenanceMode, pathname, router]);

  // Rendre le site immédiatement. La vérification des paramètres et, si
  // nécessaire, la redirection de maintenance s'effectuent ensuite.
  return <>{children}</>;
}
