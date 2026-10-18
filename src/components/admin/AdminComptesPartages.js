"use client";

import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { comptesApi, demandesApi } from "@/lib/api";

// Panneau « Comptes partagés » d'un service de catégorie famille : un compte
// streaming, ses profils, et les clients qui occupent chaque profil.
//
// Extrait d'`AdminAbonnements`, qui dépassait 3 200 lignes. La frontière est
// nette : ce composant ne connaît qu'un service, et tout ce qu'il manipule
// (comptes, profils, occupations, journal des demandes) lui appartient — rien
// de cet état n'était lu ailleurs dans le fichier d'origine.
//
// `service` : le service affiché, de catégorie famille. L'appelant garde la
// décision de nous monter ou non ; ce composant ne teste pas la catégorie.
export default function AdminComptesPartages({ service }) {
  // Nouvelle hiérarchie compte → profils → occupants (partage de profils
  // family, tâche 6 côté backend). Indépendante des formules : un compte
  // streaming appartient au service, pas à une formule précise.
  const [comptes, setComptes] = useState([]);
  // Vrai pendant qu'un fetch de comptes est en vol. Sert à distinguer un
  // chargement en cours d'un service réellement sans compte partagé (sans
  // ça, « Aucun compte partagé » clignoterait avant chaque réponse).
  const [comptesLoading, setComptesLoading] = useState(false);
  // Compteur de requêtes : incrémenté à chaque lancement de fetch, comparé à
  // sa valeur capturée au retour. Un changement de service ou de catégorie
  // pendant qu'une requête est en vol l'incrémente de nouveau ; la réponse
  // tardive de la requête abandonnée est alors reconnue comme périmée et
  // ignorée, plutôt que d'écraser les comptes du service affiché entre-temps.
  const comptesRequestRef = useRef(0);
  // Historique des occupations closes, indexé par profilId. Chargé à la
  // demande seulement — le charger pour tous les profils au montage
  // gonflerait la réponse pour une information consultée seulement en cas
  // de litige.
  const [historique, setHistorique] = useState({});

  // Formulaire d'ouverture d'un nouveau compte streaming pour le service
  // affiché. Inline, comme le reste de la section « Comptes partagés » — pas
  // de modale ici, elle n'en utilise déjà pour aucune de ses actions.
  const [nouveauCompteForm, setNouveauCompteForm] = useState({
    email: "",
    password: "",
    maxFluxSimultanes: "4",
  });
  const [nouveauCompteSaving, setNouveauCompteSaving] = useState(false);
  const [nouveauCompteError, setNouveauCompteError] = useState("");

  // Formulaire d'ajout d'un profil, indexé par compte.id : plusieurs comptes
  // peuvent être affichés en même temps, chacun garde son propre brouillon.
  const [nouveauProfilForms, setNouveauProfilForms] = useState({});
  const [nouveauProfilSaving, setNouveauProfilSaving] = useState(null);
  const [nouveauProfilErrors, setNouveauProfilErrors] = useState({});

  // Journal des demandes de code (tâche 6) : null tant qu'on ne l'a pas
  // ouvert — chargé à la demande, pas au montage.
  const [demandes, setDemandes] = useState(null);

  // Edition d'un compte streaming (adresse, mot de passe, plafond de flux).
  // La route existait deja cote backend et `comptesApi.update` etait meme
  // defini ici — rien ne l'appelait : changer le mot de passe d'un compte
  // Netflix depuis le panel etait impossible.
  const [compteEnEdition, setCompteEnEdition] = useState(null);
  const [compteForm, setCompteForm] = useState({
    email: "",
    password: "",
    maxFluxSimultanes: "",
  });
  const [compteSaving, setCompteSaving] = useState(false);
  const [compteErrors, setCompteErrors] = useState({});

  // Correction d'une occupation. Le numero WhatsApp est ce qui decide a qui
  // part le code de verification : une faute de frappe rend le client
  // injoignable, et le seul recours etait de liberer la place.
  const [occupationEnEdition, setOccupationEnEdition] = useState(null);
  const [occupationForm, setOccupationForm] = useState({
    occupantName: "",
    occupantWhatsapp: "",
    endsAt: "",
  });
  const [occupationSaving, setOccupationSaving] = useState(false);
  const [occupationErrors, setOccupationErrors] = useState({});

  // Placement manuel : le profil dont le selecteur est ouvert, et les
  // commandes payees sans occupation. Chargees a l'ouverture, pas au montage —
  // c'est une liste de rattrapage, pas une donnee de tous les jours.
  const [placementProfil, setPlacementProfil] = useState(null);
  const [commandesLibres, setCommandesLibres] = useState([]);
  const [commandesLoading, setCommandesLoading] = useState(false);
  const [placementSaving, setPlacementSaving] = useState(false);
  const [placementErrors, setPlacementErrors] = useState({});
  // Client hors site : saisie par profil, comme les autres formulaires.
  const [horsSiteForms, setHorsSiteForms] = useState({});
  const [horsSiteSaving, setHorsSiteSaving] = useState(false);

  const [suppressionEnCours, setSuppressionEnCours] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(null);

  const nouveauProfilForm = (compteId) =>
    nouveauProfilForms[compteId] || { profile: "", profilePassword: "" };

  // ── Recharge les comptes partagés du service ouvert ───────────────────────
  // Extraite (plutôt que gardée inline dans l'effet) pour pouvoir être
  // rappelée après chaque action : réglage de capacité, libération,
  // déplacement. Sans ce rappel systématique l'écran mentirait jusqu'au
  // prochain rafraîchissement manuel.
  //
  // Ne vide PAS `comptes` elle-même : cette fonction est aussi rappelée après
  // une action sur le service actuellement affiché, où vider avant de
  // recharger provoquerait un clignotement inutile. Le vidage synchrone au
  // changement de service se fait dans l'effet ci-dessous, avant l'appel.
  const rechargerComptes = async () => {
    const requestId = ++comptesRequestRef.current;
    if (!service || service.category !== "family") {
      setComptes([]);
      setComptesLoading(false);
      return;
    }
    setComptesLoading(true);
    try {
      const { comptes: liste } = await comptesApi.list(service.id);
      // Une requête plus récente a été lancée entre-temps (nouveau service,
      // catégorie changée) : cette réponse est périmée, l'ignorer évite
      // d'écraser les comptes du service désormais affiché avec ceux de
      // l'ancien.
      if (comptesRequestRef.current !== requestId) return;
      setComptes(liste || []);
    } catch (err) {
      if (comptesRequestRef.current !== requestId) return;
      console.error("Erreur chargement comptes", err.message);
    }
    if (comptesRequestRef.current === requestId) setComptesLoading(false);
  };

  // Charge les comptes du service au montage de sa fiche (et à chaque
  // changement de service ou de catégorie).
  useEffect(() => {
    // Vidage SYNCHRONE, avant même de lancer le fetch. Sans cette ligne,
    // passer d'un service famille à un autre service famille laissait les
    // comptes (et leurs occ.id / profil.id) de l'ancien service affichés
    // jusqu'à la réponse du nouveau fetch : `service` pointait déjà vers le
    // nouveau service pendant que les boutons « Libérer » / le sélecteur de
    // déplacement restaient câblés sur les identifiants de l'ancien. Vider
    // ici, dans le même effet qui réagit au changement d'id/catégorie,
    // garantit qu'aucun rendu n'associe le service B à des données du
    // service A.
    setComptes([]);
    setHistorique({});
    rechargerComptes();
  }, [service?.id, service?.category]);

  // Charge l'historique (occupations closes) d'un profil à la demande, et le
  // masque au second clic. Ne rien précharger au montage : cette information
  // n'est consultée qu'en cas de litige, inutile de gonfler la réponse pour
  // tous les profils.
  const voirHistorique = async (profilId) => {
    if (historique[profilId]) {
      setHistorique((h) => ({ ...h, [profilId]: null }));
      return;
    }
    try {
      const { occupations } = await comptesApi.occupations(profilId);
      setHistorique((h) => ({
        ...h,
        [profilId]: occupations.filter((o) => !o.active),
      }));
    } catch (err) {
      console.error("Erreur chargement historique", err.message);
    }
  };

  // Ouvre un nouveau compte streaming (le compte physique — adresse, mot de
  // passe, plafond de flux) pour le service actuellement affiché.
  const handleCreerCompte = async () => {
    if (!service || !nouveauCompteForm.email || !nouveauCompteForm.password) return;
    setNouveauCompteSaving(true);
    setNouveauCompteError("");
    try {
      await comptesApi.create(service.id, {
        email: nouveauCompteForm.email,
        password: nouveauCompteForm.password,
        maxFluxSimultanes: Number(nouveauCompteForm.maxFluxSimultanes) || 4,
      });
      await rechargerComptes();
      setNouveauCompteForm({ email: "", password: "", maxFluxSimultanes: "4" });
    } catch (err) {
      // Même convention que la capacité, le déplacement et la libération :
      // le message du serveur s'affiche tel quel, il est déjà écrit pour ça.
      setNouveauCompteError(err.message);
    }
    setNouveauCompteSaving(false);
  };

  // Ajoute un profil (ex. « LONDRE ») à un compte streaming existant.
  const handleAjouterProfil = async (compteId) => {
    const brouillon = nouveauProfilForm(compteId);
    if (!brouillon.profile) return;
    setNouveauProfilSaving(compteId);
    setNouveauProfilErrors((p) => ({ ...p, [compteId]: "" }));
    try {
      await comptesApi.addProfil(compteId, {
        profile: brouillon.profile,
        profilePassword: brouillon.profilePassword || null,
      });
      await rechargerComptes();
      setNouveauProfilForms((p) => ({
        ...p,
        [compteId]: { profile: "", profilePassword: "" },
      }));
    } catch (err) {
      setNouveauProfilErrors((p) => ({ ...p, [compteId]: err.message }));
    }
    setNouveauProfilSaving(null);
  };

  // `<input type="date">` n'accepte que « AAAA-MM-JJ ». On decoupe l'ISO
  // plutot que de passer par `toLocaleDateString`, dont le resultat depend du
  // fuseau du navigateur : la date affichee doit etre celle enregistree.
  const jourISO = (valeur) => (valeur ? String(valeur).slice(0, 10) : "");

  const ouvrirEditionCompte = (compte) => {
    if (compteEnEdition === compte.id) {
      setCompteEnEdition(null);
      return;
    }
    setCompteEnEdition(compte.id);
    // Le mot de passe n'est jamais renvoye par l'API (`COMPTE_SELECT_SUR` ne
    // le contient pas) : le champ part vide, et un champ vide ne change rien.
    setCompteForm({
      email: compte.email,
      password: "",
      maxFluxSimultanes: String(compte.maxFluxSimultanes),
    });
    setCompteErrors((p) => ({ ...p, [compte.id]: "" }));
  };

  const handleModifierCompte = async (compteId) => {
    setCompteSaving(true);
    setCompteErrors((p) => ({ ...p, [compteId]: "" }));
    try {
      const data = { email: compteForm.email };
      if (compteForm.password) data.password = compteForm.password;
      if (compteForm.maxFluxSimultanes !== "") {
        data.maxFluxSimultanes = Number(compteForm.maxFluxSimultanes);
      }
      await comptesApi.update(compteId, data);
      await rechargerComptes();
      setCompteEnEdition(null);
    } catch (err) {
      setCompteErrors((p) => ({ ...p, [compteId]: err.message }));
    }
    setCompteSaving(false);
  };

  // Le serveur refuse toute suppression laissant de l'histoire derriere elle,
  // et son message dit ce qui bloque et combien. On l'affiche tel quel : c'est
  // la seule information qui permette a l'admin de savoir quoi faire ensuite.
  //
  // Ce refus n'est plus definitif : l'admin peut le lever. Mais le forcage est
  // un SECOND geste, pris apres avoir lu ce qui bloque — jamais le premier.
  // Sans quoi une suppression de routine emporterait un historique client sans
  // que personne ait eu a le voir passer.
  //
  // Seul un 409 (« il y a de l'histoire derriere ») ouvre ce second geste. Une
  // panne serveur ou une coupure reseau proposerait sinon de « forcer » une
  // suppression qui n'a meme pas ete evaluee.
  const supprimerAvecForcagePossible = async ({
    id,
    supprimer,
    avertissement,
  }) => {
    setSuppressionEnCours(id);
    try {
      await supprimer(false);
      await rechargerComptes();
    } catch (err) {
      if (err.status === 409 && confirm(`${err.message}\n\n${avertissement}`)) {
        try {
          await supprimer(true);
          await rechargerComptes();
        } catch (err2) {
          alert(err2.message);
        }
      } else {
        alert(err.message);
      }
    }
    setSuppressionEnCours(null);
  };

  const handleSupprimerCompte = async (compte) => {
    if (
      !confirm(
        `Supprimer le compte ${compte.email} et ses ${compte.profils.length} profil(s) ?`,
      )
    )
      return;
    await supprimerAvecForcagePossible({
      id: compte.id,
      supprimer: (force) => comptesApi.remove(compte.id, { force }),
      avertissement:
        "Supprimer quand meme ? L'historique de ce compte (clients places, " +
        "demandes de code) sera efface definitivement.",
    });
  };

  const handleSupprimerProfil = async (profil) => {
    if (!confirm(`Supprimer le profil « ${profil.profile} » ?`)) return;
    await supprimerAvecForcagePossible({
      id: profil.id,
      supprimer: (force) => comptesApi.removeProfil(profil.id, { force }),
      avertissement:
        "Supprimer quand meme ? Les clients passes par ce profil et leurs " +
        "demandes de code seront effaces definitivement.",
    });
  };

  // Ouvre le selecteur de placement et charge les commandes payees que rien
  // n'occupe. Rechargees a chaque ouverture : entre deux clics, une commande a
  // pu etre placee ailleurs, et proposer une liste perimee ferait echouer
  // l'ecriture au dernier moment.
  const ouvrirPlacement = async (profilId) => {
    if (placementProfil === profilId) {
      setPlacementProfil(null);
      return;
    }
    setPlacementProfil(profilId);
    setPlacementErrors((p) => ({ ...p, [profilId]: "" }));
    setCommandesLoading(true);
    try {
      const { commandes } = await comptesApi.commandesLibres(service.id);
      setCommandesLibres(commandes || []);
    } catch (err) {
      setCommandesLibres([]);
      setPlacementErrors((p) => ({ ...p, [profilId]: err.message }));
    }
    setCommandesLoading(false);
  };

  const handlePlacer = async (profilId, orderId) => {
    if (!orderId) return;
    setPlacementSaving(true);
    setPlacementErrors((p) => ({ ...p, [profilId]: "" }));
    try {
      await comptesApi.placer(profilId, { orderId });
      await rechargerComptes();
      setPlacementProfil(null);
    } catch (err) {
      setPlacementErrors((p) => ({ ...p, [profilId]: err.message }));
    }
    setPlacementSaving(false);
  };

  // Client qui a recu ses identifiants HORS du site. Sans enregistrement, le
  // bot ne le connait pas et envoie ses codes au seul client enregistre sur le
  // compte — l'origine de « c'est toujours le meme qui recoit » (13/10/2026).
  const champHorsSite = (profilId, champ, valeur) =>
    setHorsSiteForms((f) => ({ ...f, [profilId]: { ...(f[profilId] || {}), [champ]: valeur } }));

  const handleHorsSite = async (profilId) => {
    const saisie = horsSiteForms[profilId] || {};
    setHorsSiteSaving(true);
    setPlacementErrors((p) => ({ ...p, [profilId]: "" }));
    try {
      await comptesApi.clientHorsSite(profilId, saisie);
      setHorsSiteForms((f) => ({ ...f, [profilId]: {} }));
      await rechargerComptes();
      setPlacementProfil(null);
    } catch (err) {
      setPlacementErrors((p) => ({ ...p, [profilId]: err.message }));
    }
    setHorsSiteSaving(false);
  };

  // Renvoi manuel des identifiants. Confirmation demandee : le message part
  // vraiment chez le client, et le nom affiche est celui de l'occupation — le
  // destinataire reel, pas l'acheteur, sur une commande cadeau.
  const handleEnvoyerIdentifiants = async (occ) => {
    if (!confirm(`Envoyer les identifiants a ${occ.occupantName} (${occ.occupantWhatsapp}) ?`))
      return;
    setEnvoiEnCours(occ.id);
    try {
      const r = await comptesApi.envoyerIdentifiants(occ.id);
      // Le serveur dit ce qui est REELLEMENT parti, canal par canal : annoncer
      // un succes global alors que WhatsApp a echoue ferait croire le client
      // servi.
      alert(r.message || "Identifiants envoyes.");
    } catch (err) {
      alert(err.message);
    }
    setEnvoiEnCours(null);
  };

  const ouvrirEditionOccupation = (occ) => {
    if (occupationEnEdition === occ.id) {
      setOccupationEnEdition(null);
      return;
    }
    setOccupationEnEdition(occ.id);
    setOccupationForm({
      occupantName: occ.occupantName || "",
      occupantWhatsapp: occ.occupantWhatsapp || "",
      endsAt: jourISO(occ.endsAt),
    });
    setOccupationErrors((p) => ({ ...p, [occ.id]: "" }));
  };

  const handleModifierOccupation = async (occupationId) => {
    setOccupationSaving(true);
    setOccupationErrors((p) => ({ ...p, [occupationId]: "" }));
    try {
      await comptesApi.updateOccupation(occupationId, {
        occupantName: occupationForm.occupantName,
        occupantWhatsapp: occupationForm.occupantWhatsapp,
        // Vider le champ retire la date de fin : l'occupation reste alors
        // active sans echeance, ce que le backend accepte explicitement.
        endsAt: occupationForm.endsAt || null,
      });
      await rechargerComptes();
      setOccupationEnEdition(null);
    } catch (err) {
      setOccupationErrors((p) => ({ ...p, [occupationId]: err.message }));
    }
    setOccupationSaving(false);
  };

  return (
    <div>
          <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
            Comptes partagés (profils multi-occupants)
          </p>

          {/* Ouvrir un nouveau compte streaming — inline, comme le reste de
              cette section. C'est le compte physique (adresse, mot de passe,
              plafond de flux) ; ses profils s'ajoutent ensuite un par un
              ci-dessous, sur chaque carte de compte. */}
          <div className="bg-black/[0.03] rounded-2xl p-4 space-y-2 mb-3">
            <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
              Ouvrir un nouveau compte
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={nouveauCompteForm.email}
                onChange={(e) =>
                  setNouveauCompteForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Adresse e-mail"
                className="bg-white rounded-lg px-2 py-1.5 text-[12px] border border-black/[0.07] focus:outline-none focus:border-black/20"
              />
              <input
                type="text"
                value={nouveauCompteForm.password}
                onChange={(e) =>
                  setNouveauCompteForm((p) => ({ ...p, password: e.target.value }))
                }
                placeholder="Mot de passe"
                className="bg-white rounded-lg px-2 py-1.5 text-[12px] border border-black/[0.07] focus:outline-none focus:border-black/20"
              />
              <input
                type="number"
                min={1}
                value={nouveauCompteForm.maxFluxSimultanes}
                onChange={(e) =>
                  setNouveauCompteForm((p) => ({
                    ...p,
                    maxFluxSimultanes: e.target.value,
                  }))
                }
                placeholder="Flux simultanés"
                className="bg-white rounded-lg px-2 py-1.5 text-[12px] border border-black/[0.07] focus:outline-none focus:border-black/20"
              />
            </div>
            {nouveauCompteError && (
              <p className="text-[11px] text-red-500">{nouveauCompteError}</p>
            )}
            <button
              onClick={handleCreerCompte}
              disabled={
                nouveauCompteSaving ||
                !nouveauCompteForm.email ||
                !nouveauCompteForm.password
              }
              className="flex items-center gap-1 text-[11px] font-medium text-apple-black hover:opacity-70 transition disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              {nouveauCompteSaving ? "Création…" : "Créer le compte"}
            </button>
          </div>

          {comptesLoading && comptes.length === 0 ? (
            // Le placeholder de chargement ne doit apparaître
            // que lorsqu'il n'y a rien à montrer (changement de
            // service, `comptes` vient d'être purgé). Après une
            // action sur le service déjà affiché, `comptes`
            // contient encore la liste précédente pendant le
            // rechargement : cette condition la laisse à
            // l'écran au lieu de la remplacer par « Chargement… »
            // à chaque réglage de capacité, déplacement ou
            // libération.
            <div className="text-center py-4 rounded-xl border border-dashed border-black/[0.10]">
              <p className="text-apple-mid text-[11px]">
                Chargement…
              </p>
            </div>
          ) : comptes.length === 0 ? (
            <div className="text-center py-4 rounded-xl border border-dashed border-black/[0.10]">
              <p className="text-apple-mid text-[11px]">
                Aucun compte partagé
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comptes.map((compte) => (
                <div
                  key={compte.id}
                  className="bg-black/[0.03] rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-apple-black">
                        {compte.email}
                      </p>
                      <p className="text-[11px] text-apple-mid">
                        {compte.occupantsActifs}/
                        {compte.maxFluxSimultanes} flux utilisés
                        {compte.margeDeFlux <= 0 && (
                          <span className="ml-2 text-amber-500">
                            — plafond atteint
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => ouvrirEditionCompte(compte)}
                        className="text-[11px] text-apple-mid hover:text-apple-black transition"
                      >
                        {compteEnEdition === compte.id ? "Annuler" : "Modifier"}
                      </button>
                      <button
                        onClick={() => handleSupprimerCompte(compte)}
                        disabled={suppressionEnCours === compte.id}
                        className="text-[11px] text-apple-mid hover:text-red-500 transition disabled:opacity-40"
                      >
                        {suppressionEnCours === compte.id
                          ? "Suppression…"
                          : "Supprimer"}
                      </button>
                    </div>
                  </div>

                  {/* Modifier le compte — inline, comme tout le reste de cette
                      section. Le mot de passe part vide : l'API ne le renvoie
                      jamais, et un champ laisse vide ne le change pas. */}
                  {compteEnEdition === compte.id && (
                    <div className="bg-white rounded-xl p-3 space-y-2">
                      <input
                        value={compteForm.email}
                        onChange={(e) =>
                          setCompteForm((f) => ({ ...f, email: e.target.value }))
                        }
                        placeholder="Adresse e-mail"
                        className="w-full text-[12px] bg-black/[0.03] rounded-lg px-3 py-2 border border-black/[0.07] focus:outline-none"
                      />
                      <input
                        value={compteForm.password}
                        onChange={(e) =>
                          setCompteForm((f) => ({
                            ...f,
                            password: e.target.value,
                          }))
                        }
                        placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
                        className="w-full text-[12px] bg-black/[0.03] rounded-lg px-3 py-2 border border-black/[0.07] focus:outline-none"
                      />
                      <input
                        type="number"
                        min={1}
                        value={compteForm.maxFluxSimultanes}
                        onChange={(e) =>
                          setCompteForm((f) => ({
                            ...f,
                            maxFluxSimultanes: e.target.value,
                          }))
                        }
                        placeholder="Flux simultanés"
                        className="w-full text-[12px] bg-black/[0.03] rounded-lg px-3 py-2 border border-black/[0.07] focus:outline-none"
                      />
                      {compteErrors[compte.id] && (
                        <p className="text-[11px] text-red-500">
                          {compteErrors[compte.id]}
                        </p>
                      )}
                      <button
                        onClick={() => handleModifierCompte(compte.id)}
                        disabled={compteSaving || !compteForm.email.trim()}
                        className="text-[11px] font-medium text-apple-black hover:opacity-60 transition disabled:opacity-40"
                      >
                        {compteSaving ? "Enregistrement…" : "Enregistrer"}
                      </button>
                    </div>
                  )}

                  {/* Ajouter un profil à ce compte — formulaire inline, comme le
                      reste de la section (réglage de capacité, déplacement,
                      libération sont déjà inline, sans modale). */}
                  <div className="bg-white rounded-xl p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                      Ajouter un profil
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={nouveauProfilForm(compte.id).profile}
                        onChange={(e) =>
                          setNouveauProfilForms((p) => ({
                            ...p,
                            [compte.id]: {
                              ...nouveauProfilForm(compte.id),
                              profile: e.target.value,
                            },
                          }))
                        }
                        placeholder="Nom (ex: LONDRE)"
                        className="bg-black/[0.03] rounded-lg px-2 py-1.5 text-[12px] border border-black/[0.07] focus:outline-none focus:border-black/20"
                      />
                      <input
                        value={nouveauProfilForm(compte.id).profilePassword}
                        onChange={(e) =>
                          setNouveauProfilForms((p) => ({
                            ...p,
                            [compte.id]: {
                              ...nouveauProfilForm(compte.id),
                              profilePassword: e.target.value,
                            },
                          }))
                        }
                        placeholder="Code du profil"
                        className="bg-black/[0.03] rounded-lg px-2 py-1.5 text-[12px] border border-black/[0.07] focus:outline-none focus:border-black/20"
                      />
                    </div>
                    {nouveauProfilErrors[compte.id] && (
                      <p className="text-[11px] text-red-500">
                        {nouveauProfilErrors[compte.id]}
                      </p>
                    )}
                    <button
                      onClick={() => handleAjouterProfil(compte.id)}
                      disabled={
                        nouveauProfilSaving === compte.id ||
                        !nouveauProfilForm(compte.id).profile
                      }
                      className="flex items-center gap-1 text-[11px] font-medium text-apple-black hover:opacity-70 transition disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {nouveauProfilSaving === compte.id
                        ? "Ajout…"
                        : "Ajouter le profil"}
                    </button>
                  </div>

                  {(compte.profils ?? []).map((profil) => (
                    <div
                      key={profil.id}
                      className="bg-white rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        {/* La formule decide qui peut occuper ce profil : un
                            acheteur Standard ne prend une place que sur un
                            profil Standard. Sans elle a l'ecran, impossible de
                            verifier la repartition de ses places, ni de
                            comprendre un placement refuse. */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[12px] font-medium">
                            {profil.profile}
                          </p>
                          {profil.plan ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.05] text-apple-mid">
                              {profil.plan.label}
                            </span>
                          ) : (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700"
                              title="Sans formule, ce profil est ignoré par l'attribution automatique : aucun acheteur ne peut y être placé."
                            >
                              aucune formule — inutilisable
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Lecture seule : la capacité vient de la formule. */}
                          <p className="text-[11px] text-apple-mid">
                            {profil.occupantsActifs}/{profil.capacite} places
                          </p>
                          <button
                            onClick={() => handleSupprimerProfil(profil)}
                            disabled={suppressionEnCours === profil.id}
                            className="text-[11px] text-apple-mid hover:text-red-500 transition disabled:opacity-40"
                          >
                            {suppressionEnCours === profil.id ? "…" : "Supprimer"}
                          </button>
                        </div>
                      </div>

                      {profil.occupations.length === 0 ? (
                        <p className="text-[11px] text-apple-mid">
                          Aucun occupant
                        </p>
                      ) : (
                        profil.occupations.map((occ) => (
                          <div
                            key={occ.id}
                            className="py-1 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px]">
                                {occ.occupantName} —{" "}
                                {occ.occupantWhatsapp}
                              </span>
                              <span className="text-[11px] text-apple-mid">
                                {occ.endsAt
                                  ? `jusqu'au ${new Date(occ.endsAt).toLocaleDateString("fr-FR")}`
                                  : "sans date de fin"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                defaultValue=""
                                onChange={async (e) => {
                                  const profileIdCible =
                                    e.target.value;
                                  if (!profileIdCible) return;
                                  try {
                                    await comptesApi.deplacer(
                                      occ.id,
                                      profileIdCible,
                                    );
                                    await rechargerComptes();
                                  } catch (err) {
                                    alert(err.message);
                                  }
                                  e.target.value = "";
                                }}
                                className="text-[11px] bg-black/[0.03] rounded-lg px-2 py-1 border border-black/[0.07]"
                              >
                                <option value="">
                                  Déplacer vers…
                                </option>
                                {compte.profils
                                  .filter(
                                    (p) =>
                                      p.id !== profil.id &&
                                      p.placesRestantes > 0,
                                  )
                                  .map((p) => (
                                    <option
                                      key={p.id}
                                      value={p.id}
                                    >
                                      {p.profile} (
                                      {p.placesRestantes} libre
                                      {p.placesRestantes > 1
                                        ? "s"
                                        : ""}
                                      )
                                    </option>
                                  ))}
                              </select>

                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      `Libérer la place de ${occ.occupantName} ?`,
                                    )
                                  )
                                    return;
                                  try {
                                    await comptesApi.liberer(
                                      occ.id,
                                    );
                                    await rechargerComptes();
                                  } catch (err) {
                                    // Même traitement que le
                                    // réglage de capacité et le
                                    // déplacement : le serveur
                                    // peut refuser (occupation
                                    // déjà libérée ailleurs,
                                    // identifiant périmé) et
                                    // l'admin doit le voir, sinon
                                    // il croit l'action réussie.
                                    alert(err.message);
                                  }
                                }}
                                className="text-[11px] text-apple-mid hover:text-red-500 transition"
                              >
                                Libérer
                              </button>

                              <button
                                onClick={() => ouvrirEditionOccupation(occ)}
                                className="text-[11px] text-apple-mid hover:text-apple-black transition"
                              >
                                {occupationEnEdition === occ.id
                                  ? "Annuler"
                                  : "Modifier"}
                              </button>

                              <button
                                onClick={() => handleEnvoyerIdentifiants(occ)}
                                disabled={envoiEnCours === occ.id}
                                className="text-[11px] text-apple-mid hover:text-apple-black transition disabled:opacity-40"
                              >
                                {envoiEnCours === occ.id
                                  ? "Envoi…"
                                  : "Envoyer les identifiants"}
                              </button>
                            </div>

                            {/* Corriger une saisie — pas déplacer ni clôturer :
                                le profil, le début et la libération ne sont pas
                                modifiables ici, ils appartiennent à
                                l'historique. Le numéro compte plus que le
                                reste : c'est lui qui décide à qui part le
                                code. */}
                            {occupationEnEdition === occ.id && (
                              <div className="bg-black/[0.03] rounded-lg p-2 space-y-2">
                                <input
                                  value={occupationForm.occupantName}
                                  onChange={(e) =>
                                    setOccupationForm((f) => ({
                                      ...f,
                                      occupantName: e.target.value,
                                    }))
                                  }
                                  placeholder="Nom de l'occupant"
                                  className="w-full text-[11px] bg-white rounded-lg px-2 py-1 border border-black/[0.07] focus:outline-none"
                                />
                                <input
                                  value={occupationForm.occupantWhatsapp}
                                  onChange={(e) =>
                                    setOccupationForm((f) => ({
                                      ...f,
                                      occupantWhatsapp: e.target.value,
                                    }))
                                  }
                                  placeholder="Numéro WhatsApp"
                                  className="w-full text-[11px] bg-white rounded-lg px-2 py-1 border border-black/[0.07] focus:outline-none"
                                />
                                <input
                                  type="date"
                                  value={occupationForm.endsAt}
                                  onChange={(e) =>
                                    setOccupationForm((f) => ({
                                      ...f,
                                      endsAt: e.target.value,
                                    }))
                                  }
                                  className="w-full text-[11px] bg-white rounded-lg px-2 py-1 border border-black/[0.07] focus:outline-none"
                                />
                                <p className="text-[11px] text-apple-mid">
                                  Date vide : l&apos;occupation reste active sans
                                  échéance.
                                </p>
                                {occupationErrors[occ.id] && (
                                  <p className="text-[11px] text-red-500">
                                    {occupationErrors[occ.id]}
                                  </p>
                                )}
                                <button
                                  onClick={() =>
                                    handleModifierOccupation(occ.id)
                                  }
                                  disabled={
                                    occupationSaving ||
                                    !occupationForm.occupantName.trim() ||
                                    !occupationForm.occupantWhatsapp.trim()
                                  }
                                  className="text-[11px] font-medium text-apple-black hover:opacity-60 transition disabled:opacity-40"
                                >
                                  {occupationSaving
                                    ? "Enregistrement…"
                                    : "Enregistrer"}
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {/* Placer un client à la main. Jusqu'ici une occupation
                          ne naissait que d'un paiement : un client ayant payé
                          avant l'existence du partage de profils n'avait aucun
                          chemin vers un profil. */}
                      <button
                        onClick={() => ouvrirPlacement(profil.id)}
                        disabled={profil.placesRestantes <= 0}
                        title={
                          profil.placesRestantes <= 0
                            ? "Profil complet — libérez une place d'abord"
                            : undefined
                        }
                        className="text-[11px] text-apple-mid hover:text-apple-black transition mt-2 mr-3 disabled:opacity-40 disabled:hover:text-apple-mid"
                      >
                        {placementProfil === profil.id
                          ? "Annuler le placement"
                          : profil.placesRestantes <= 0
                            ? "Profil complet"
                            : `Placer un client (${profil.placesRestantes} libre${profil.placesRestantes > 1 ? "s" : ""})`}
                      </button>

                      {placementProfil === profil.id && (
                        <div className="mt-2 bg-black/[0.03] rounded-lg p-2 space-y-2">
                          {commandesLoading ? (
                            <p className="text-[11px] text-apple-mid">
                              Chargement des commandes…
                            </p>
                          ) : commandesLibres.length === 0 ? (
                            <p className="text-[11px] text-apple-mid">
                              Aucune commande payée en attente de place pour ce
                              service.
                            </p>
                          ) : (
                            <select
                              defaultValue=""
                              disabled={placementSaving}
                              onChange={(e) => {
                                // Remise a zero AVANT l'appel, comme le
                                // selecteur de deplacement : sans elle, un
                                // refus du serveur laisse la commande
                                // selectionnee, et la rechoisir n'emet plus
                                // aucun evenement `change` — l'admin doit
                                // passer par une autre ligne pour reessayer.
                                const orderId = e.target.value;
                                e.target.value = "";
                                handlePlacer(profil.id, orderId);
                              }}
                              className="w-full text-[11px] bg-white rounded-lg px-2 py-1 border border-black/[0.07] disabled:opacity-40"
                            >
                              <option value="">
                                {placementSaving
                                  ? "Placement en cours…"
                                  : "Choisir une commande…"}
                              </option>
                              {commandesLibres.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.isGift && c.giftName
                                    ? `${c.giftName} (cadeau de ${c.clientName})`
                                    : c.clientName}{" "}
                                  — {c.plan?.label || "formule inconnue"}
                                  {/* « sans date de fin » est vrai pour un
                                      abonnement a vie comme pour une commande
                                      dont l'expiration n'a jamais pu etre
                                      calculee — l'une est normale, l'autre est
                                      un defaut. Les confondre ici les rend
                                      indetectables toutes les deux. */}
                                  {c.plan?.aVie
                                    ? " — à vie"
                                    : c.expiresAt
                                      ? ` — jusqu'au ${new Date(c.expiresAt).toLocaleDateString("fr-FR")}`
                                      : " — sans date de fin"}
                                </option>
                              ))}
                            </select>
                          )}
                          {/* Client qui n'a jamais commandé sur le site :
                              une commande HORS-SITE est créée avec lui. */}
                          <div className="pt-2 mt-1 border-t border-black/[0.06] space-y-1.5">
                            <p className="text-[11px] font-medium text-apple-black">
                              Ou enregistrer un client hors site
                            </p>
                            <p className="text-[10px] text-apple-mid leading-snug">
                              Il a reçu ces identifiants sans commander sur le site ?
                              Enregistrez-le : sans cela, ses codes partent chez un autre client.
                            </p>
                            {[
                              ["nom", "Nom du client", "text"],
                              ["whatsapp", "WhatsApp (avec indicatif)", "tel"],
                              ...(profil.plan?.aVie ? [] : [["finLe", "Fin de l'abonnement", "date"]]),
                              ["montant", "Montant payé en FCFA (facultatif)", "number"],
                              ["email", "E-mail (facultatif)", "email"],
                            ].map(([champ, libelle, type]) => (
                              <input
                                key={champ}
                                type={type}
                                min={type === "number" ? 0 : undefined}
                                placeholder={libelle}
                                aria-label={libelle}
                                value={horsSiteForms[profil.id]?.[champ] || ""}
                                onChange={(e) => champHorsSite(profil.id, champ, e.target.value)}
                                disabled={horsSiteSaving}
                                className="w-full text-[11px] bg-white rounded-lg px-2 py-1 border border-black/[0.07] disabled:opacity-40"
                              />
                            ))}
                            <button
                              onClick={() => handleHorsSite(profil.id)}
                              disabled={horsSiteSaving}
                              className="w-full text-[11px] font-medium bg-apple-black text-white rounded-lg px-2 py-1.5 disabled:opacity-40"
                            >
                              {horsSiteSaving ? "Enregistrement…" : "Enregistrer ce client"}
                            </button>
                          </div>
                          {placementErrors[profil.id] && (
                            <p className="text-[11px] text-red-500">
                              {placementErrors[profil.id]}
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => voirHistorique(profil.id)}
                        className="text-[11px] text-apple-mid hover:text-apple-black transition mt-2"
                      >
                        {historique[profil.id]
                          ? "Masquer l'historique"
                          : "Historique"}
                      </button>

                      {historique[profil.id] && (
                        <div className="mt-2 space-y-1">
                          {historique[profil.id].length === 0 ? (
                            <p className="text-[11px] text-apple-mid">
                              Aucune occupation passée
                            </p>
                          ) : (
                            historique[profil.id].map((o) => (
                              <p
                                key={o.id}
                                className="text-[11px] text-apple-mid"
                              >
                                {o.occupantName} — du{" "}
                                {new Date(
                                  o.startedAt,
                                ).toLocaleDateString("fr-FR")}
                                {" au "}
                                {o.releasedAt || o.endsAt
                                  ? new Date(
                                      o.releasedAt || o.endsAt,
                                    ).toLocaleDateString("fr-FR")
                                  : "date inconnue"}
                              </p>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Journal des demandes de code — chargé à la demande,
              sur clic, pas au montage : c'est une information
              consultée seulement en cas de litige. */}
          <div className="mt-6">
            <button
              onClick={async () => {
                if (demandes) { setDemandes(null); return; }
                try {
                  const { demandes: d } = await demandesApi.list(50);
                  setDemandes(d);
                } catch (err) {
                  alert(err.message);
                }
              }}
              className="text-[12px] text-apple-mid hover:text-apple-black transition"
            >
              {demandes ? "Masquer le journal des demandes" : "Journal des demandes de code"}
            </button>

            {demandes && (
              <div className="mt-3 space-y-1.5">
                {demandes.length === 0 ? (
                  <p className="text-[11px] text-apple-mid">Aucune demande enregistrée</p>
                ) : (
                  demandes.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02]"
                    >
                      <div>
                        <p className="text-[12px] text-apple-black">
                          {d.occupant || "—"} — {d.occupantWhatsapp || "—"}
                        </p>
                        <p className="text-[11px] text-apple-mid">
                          {d.service || "—"} · profil {d.profil || "—"} · par {d.canal}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-apple-mid">
                          {new Date(d.requestedAt).toLocaleString("fr-FR")}
                        </p>
                        {/* Quatre états, pas trois, et c'est
                            `otpLogId` qui les sépare. `servedAt`
                            est posé DEUX fois pour deux raisons
                            opposées : quand un code est parti (et
                            alors `otpLogId` le référence), et
                            quand une demande plus récente remplace
                            celle-ci — le geste le plus banal du
                            client, redemander parce qu'il n'a rien
                            reçu. Lire `servedAt` seul faisait donc
                            affirmer « code envoyé » à chaque
                            renouvellement, c'est-à-dire mentir sur
                            le seul point qui compte dans un
                            litige. */}
                        <p className="text-[11px]">
                          {d.ouverte ? (
                            <span className="text-green-600">en attente</span>
                          ) : d.servedAt && d.otpLogId ? (
                            <span className="text-apple-mid">code envoyé</span>
                          ) : d.servedAt ? (
                            <span className="text-apple-mid">remplacée</span>
                          ) : (
                            <span className="text-amber-500">expirée</span>
                          )}
                        </p>
                        {/* « Quel code » : la spec le demandait,
                            l'API le rend déjà, rien ne l'affichait. */}
                        {d.otpLogId && (
                          <p
                            className="text-[11px] text-apple-mid font-mono"
                            title={d.otpLogId}
                          >
                            réf. {String(d.otpLogId).slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
    </div>
  );
}
