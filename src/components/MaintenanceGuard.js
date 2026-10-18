"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useSettingsStore from "@/store/settingsStore";
import { MAINTENANCE } from "@/lib/maintenance";

export default function MaintenanceGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const { maintenanceMode, fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Charge les paramètres depuis l'API au montage
    fetchSettings();
  }, []);

  useEffect(() => {
    setReady(true);
    const isAdmin = pathname.startsWith("/admin");
    const isMaintenance = pathname === "/maintenance";

    // La maintenance forcée par le code fait autorité, et elle est déjà
    // appliquée par le middleware — il n'y a rien à rediriger ici.
    //
    // Ce garde doit surtout s'abstenir de la CONTREDIRE : il lit
    // `maintenanceMode` depuis l'API, qui vaut `false` quand le backend ne
    // répond pas. Sans cette sortie, il renverrait le visiteur de
    // `/maintenance` vers `/` pendant que le middleware le renvoie en sens
    // inverse — une boucle de redirection, exactement le jour où le site est
    // déjà en panne.
    if (MAINTENANCE) return;

    if (maintenanceMode && !isAdmin && !isMaintenance) {
      router.replace("/maintenance");
    } else if (!maintenanceMode && isMaintenance) {
      router.replace("/");
    }
  }, [maintenanceMode, pathname]);

  // Le rendu est retenu jusqu'au montage pour éviter qu'un écran de boutique
  // n'apparaisse une fraction de seconde avant la bascule en maintenance.
  //
  // Mais quand la maintenance est FORCÉE, ce garde n'a plus rien à décider —
  // le middleware a déjà tranché avant même le rendu — et retenir la page
  // reviendrait à servir un document vide, rempli seulement une fois le
  // JavaScript chargé. Sur la seule page censée fonctionner un jour de panne,
  // c'est le contraire de ce qu'on veut : elle doit s'afficher immédiatement,
  // même sans JavaScript.
  if (!MAINTENANCE && !ready) return null;

  return <>{children}</>;
}
