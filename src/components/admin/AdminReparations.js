"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Layers,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle,
  Copy,
  RefreshCw,
  Wrench,
  Stethoscope,
  CalendarClock,
  ArrowRight,
  Smartphone,
  Bot,
  Laptop,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { reparationAdminApi } from "@/lib/api";

// Les trois espaces sont figés côté serveur (`ESPACES` dans
// repairs.controller.js) : ce ne sont pas des catégories que l'admin peut
// créer ou renommer, juste un sélecteur pour parcourir l'arbre.
const ESPACES = [
  { value: "APPLE", label: "Apple", Icon: Smartphone },
  { value: "ANDROID", label: "Androïd", Icon: Bot },
  { value: "PC", label: "PC portable", Icon: Laptop },
];

// L'ORDRE de ce tableau EST la règle de progression (miroir de `STATUTS` dans
// statuts.js, côté serveur) : on ne peut avancer que vers l'entrée suivante.
// `ANNULEE` en est volontairement absente — elle a son propre bouton et sa
// propre route, jamais une case dans cette progression.
const STATUTS_ORDRE = [
  "EN_ATTENTE",
  "PAYEE",
  "A_RECUPERER",
  "RECUPEREE",
  "EN_ATELIER",
  "REPAREE",
  "A_RENDRE",
  "RENDUE",
];

const STATUT_LABELS = {
  EN_ATTENTE: "En attente de paiement",
  PAYEE: "Payée",
  A_RECUPERER: "À récupérer",
  RECUPEREE: "Récupérée",
  EN_ATELIER: "En atelier",
  REPAREE: "Réparée",
  A_RENDRE: "À rendre",
  RENDUE: "Rendue",
  ANNULEE: "Annulée",
};

const STATUT_STYLE = {
  EN_ATTENTE: { bg: "bg-orange-50", text: "text-orange-500" },
  PAYEE: { bg: "bg-blue-50", text: "text-blue-600" },
  A_RECUPERER: { bg: "bg-purple-50", text: "text-purple-600" },
  RECUPEREE: { bg: "bg-cyan-50", text: "text-cyan-600" },
  EN_ATELIER: { bg: "bg-amber-50", text: "text-amber-600" },
  REPAREE: { bg: "bg-teal-50", text: "text-teal-600" },
  A_RENDRE: { bg: "bg-indigo-50", text: "text-indigo-600" },
  RENDUE: { bg: "bg-green-50", text: "text-green-600" },
  ANNULEE: { bg: "bg-red-50", text: "text-cta" },
};

const LIMIT_DEMANDES = 20;

// Prochaine étape manuelle, ou `null` s'il n'y en a pas.
//
// `EN_ATTENTE` n'a PAS de suite manuelle : le passage à `PAYEE` n'existe que
// via le webhook FedaPay (le serveur le refuse explicitement sur cette
// route), et `confirmerReparationApresPaiement` enchaîne aussitôt sur
// `A_RECUPERER` de lui-même. Proposer un bouton qui échouerait à coup sûr
// n'aiderait personne — mieux vaut ne rien montrer que montrer un geste mort.
function prochainStatut(statut) {
  if (statut === "EN_ATTENTE") return null;
  const i = STATUTS_ORDRE.indexOf(statut);
  if (i === -1 || i === STATUTS_ORDRE.length - 1) return null;
  return STATUTS_ORDRE[i + 1];
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Valeur "YYYY-MM-DD" attendue par un <input type="date">.
function toDateInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function AdminReparations() {
  const [ongletPrincipal, setOngletPrincipal] = useState("catalogue"); // "catalogue" | "demandes"

  // ── Catalogue ──────────────────────────────────────────────────────────────
  const [espace, setEspace] = useState("APPLE");
  const [familles, setFamilles] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [expandedFamilles, setExpandedFamilles] = useState(new Set());
  const [expandedModeles, setExpandedModeles] = useState(new Set());
  const [expandedJobs, setExpandedJobs] = useState(new Set());

  const [familleModal, setFamilleModal] = useState(null); // { mode: "add"|"edit", id? }
  const [familleForm, setFamilleForm] = useState({ name: "" });
  const [familleError, setFamilleError] = useState("");
  const [familleSaving, setFamilleSaving] = useState(false);
  const [deleteFamilleConfirm, setDeleteFamilleConfirm] = useState(null);
  const [deleteFamilleError, setDeleteFamilleError] = useState("");
  const [deleteFamilleSaving, setDeleteFamilleSaving] = useState(false);

  const [modeleModal, setModeleModal] = useState(null); // { mode, id?, familyId? }
  const [modeleForm, setModeleForm] = useState({ name: "" });
  const [modeleError, setModeleError] = useState("");
  const [modeleSaving, setModeleSaving] = useState(false);
  const [deleteModeleConfirm, setDeleteModeleConfirm] = useState(null);
  const [deleteModeleError, setDeleteModeleError] = useState("");
  const [deleteModeleSaving, setDeleteModeleSaving] = useState(false);

  const [reparationModal, setReparationModal] = useState(null); // { mode, id?, modelId? }
  const [reparationForm, setReparationForm] = useState({ name: "", delay: "", price: "" });
  const [reparationError, setReparationError] = useState("");
  const [reparationSaving, setReparationSaving] = useState(false);
  const [deleteReparationConfirm, setDeleteReparationConfirm] = useState(null);
  const [deleteReparationError, setDeleteReparationError] = useState("");
  const [deleteReparationSaving, setDeleteReparationSaving] = useState(false);

  // `showLabel` : n'apparaît que si la réparation compte déjà (ou va compter)
  // plus d'une option — c'est le seul moment où la notion de « qualité »
  // devient réelle pour l'admin, cf. spec.
  const [optionModal, setOptionModal] = useState(null); // { mode, id?, jobId?, showLabel }
  const [optionForm, setOptionForm] = useState({ label: "", price: "" });
  const [optionError, setOptionError] = useState("");
  const [optionSaving, setOptionSaving] = useState(false);
  const [deleteOptionConfirm, setDeleteOptionConfirm] = useState(null); // { job, option }
  const [deleteOptionError, setDeleteOptionError] = useState("");
  const [deleteOptionSaving, setDeleteOptionSaving] = useState(false);

  const [dupliquerModal, setDupliquerModal] = useState(null); // { job, sourceModelId }
  const [dupliquerSelection, setDupliquerSelection] = useState(new Set());
  const [dupliquerError, setDupliquerError] = useState("");
  const [dupliquerSaving, setDupliquerSaving] = useState(false);

  // ── Demandes ───────────────────────────────────────────────────────────────
  const [demandes, setDemandes] = useState([]);
  const [demandesTotal, setDemandesTotal] = useState(0);
  const [demandesLoading, setDemandesLoading] = useState(false);
  const [filterKind, setFilterKind] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const [statutSavingId, setStatutSavingId] = useState(null);
  const [statutErrors, setStatutErrors] = useState({});

  const [retourDrafts, setRetourDrafts] = useState({});
  const [retourSavingId, setRetourSavingId] = useState(null);
  const [retourErrors, setRetourErrors] = useState({});

  const [ouvrirSavingId, setOuvrirSavingId] = useState(null);
  const [ouvrirErrors, setOuvrirErrors] = useState({});

  const [annulerConfirm, setAnnulerConfirm] = useState(null); // demande
  const [annulerRetenu, setAnnulerRetenu] = useState("");
  const [annulerError, setAnnulerError] = useState("");
  const [annulerSaving, setAnnulerSaving] = useState(false);

  const [ligneModal, setLigneModal] = useState(null); // id de la demande
  const [ligneForm, setLigneForm] = useState({ jobName: "", optionLabel: "", price: "", delay: "" });
  const [ligneError, setLigneError] = useState("");
  const [ligneSaving, setLigneSaving] = useState(false);

  // Erreur d'écran, pour ce qui se produit HORS d'une modale : un
  // chargement qui échoue, un interrupteur que le serveur refuse. Ces cas
  // partaient dans `console.error` : l'administrateur basculait un
  // interrupteur, rien ne se passait, et rien ne le lui disait.
  const [erreurEcran, setErreurEcran] = useState(null);

  // ── Chargements ────────────────────────────────────────────────────────────
  const loadCatalogue = async (esp) => {
    setCatalogueLoading(true);
    try {
      const data = await reparationAdminApi.catalogue(esp || espace);
      setFamilles(data.familles || []);
      setErreurEcran(null);
    } catch (err) {
      setErreurEcran(err.message || "Chargement du catalogue impossible");
    }
    setCatalogueLoading(false);
  };

  useEffect(() => {
    loadCatalogue(espace);
    // Changer d'espace vide l'arbre affiché : garder les ids dépliés de
    // l'espace précédent n'a aucun sens, aucun ne correspond au nouveau.
    setExpandedFamilles(new Set());
    setExpandedModeles(new Set());
    setExpandedJobs(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espace]);

  const loadDemandes = async () => {
    setDemandesLoading(true);
    try {
      const params = { page, limit: LIMIT_DEMANDES };
      if (filterKind) params.kind = filterKind;
      if (filterStatus) params.status = filterStatus;
      const data = await reparationAdminApi.demandes(params);
      setDemandes(data.demandes || []);
      setDemandesTotal(data.total || 0);
    } catch (err) {
      setErreurEcran(err.message || "Chargement des demandes impossible");
    }
    setDemandesLoading(false);
  };

  useEffect(() => {
    loadDemandes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterKind, filterStatus]);

  const statsCatalogue = useMemo(() => {
    let modeles = 0;
    let jobs = 0;
    for (const f of familles) {
      modeles += f.models?.length || 0;
      for (const m of f.models || []) jobs += m.jobs?.length || 0;
    }
    return { familles: familles.length, modeles, jobs };
  }, [familles]);

  const totalPagesDemandes = Math.max(1, Math.ceil(demandesTotal / LIMIT_DEMANDES));

  // ── Sets dépliés ───────────────────────────────────────────────────────────
  const toggle = (setter) => (id) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleFamilleExpand = toggle(setExpandedFamilles);
  const toggleModeleExpand = toggle(setExpandedModeles);
  const toggleJobExpand = toggle(setExpandedJobs);

  // ── Familles ───────────────────────────────────────────────────────────────
  const ouvrirAjoutFamille = () => {
    setFamilleModal({ mode: "add" });
    setFamilleForm({ name: "" });
    setFamilleError("");
  };
  const ouvrirEditionFamille = (famille) => {
    setFamilleModal({ mode: "edit", id: famille.id });
    setFamilleForm({ name: famille.name });
    setFamilleError("");
  };
  const fermerFamilleModal = () => {
    setFamilleModal(null);
    setFamilleError("");
  };
  const handleSaveFamille = async () => {
    if (!familleForm.name.trim()) {
      setFamilleError("Nom requis");
      return;
    }
    setFamilleSaving(true);
    setFamilleError("");
    try {
      if (familleModal.mode === "edit") {
        await reparationAdminApi.modifierFamille(familleModal.id, { name: familleForm.name.trim() });
      } else {
        await reparationAdminApi.creerFamille({ space: espace, name: familleForm.name.trim() });
      }
      await loadCatalogue();
      fermerFamilleModal();
    } catch (err) {
      setFamilleError(err.message || "Enregistrement impossible");
    }
    setFamilleSaving(false);
  };
  const handleToggleFamille = async (famille) => {
    try {
      await reparationAdminApi.modifierFamille(famille.id, { active: !famille.active });
      await loadCatalogue();
    } catch (err) {
      setErreurEcran(err.message || "Modification de la marque impossible");
    }
  };
  const ouvrirSuppressionFamille = (famille) => {
    setDeleteFamilleConfirm(famille);
    setDeleteFamilleError("");
  };
  const fermerSuppressionFamille = () => {
    setDeleteFamilleConfirm(null);
    setDeleteFamilleError("");
  };
  const handleDeleteFamille = async () => {
    if (!deleteFamilleConfirm) return;
    setDeleteFamilleSaving(true);
    setDeleteFamilleError("");
    try {
      await reparationAdminApi.supprimerFamille(deleteFamilleConfirm.id);
      await loadCatalogue();
      fermerSuppressionFamille();
    } catch (err) {
      setDeleteFamilleError(err.message || "Suppression impossible");
    }
    setDeleteFamilleSaving(false);
  };

  // ── Modèles ────────────────────────────────────────────────────────────────
  const ouvrirAjoutModele = (famille) => {
    setModeleModal({ mode: "add", familyId: famille.id });
    setModeleForm({ name: "" });
    setModeleError("");
  };
  const ouvrirEditionModele = (modele) => {
    setModeleModal({ mode: "edit", id: modele.id });
    setModeleForm({ name: modele.name });
    setModeleError("");
  };
  const fermerModeleModal = () => {
    setModeleModal(null);
    setModeleError("");
  };
  const handleSaveModele = async () => {
    if (!modeleForm.name.trim()) {
      setModeleError("Nom requis");
      return;
    }
    setModeleSaving(true);
    setModeleError("");
    try {
      if (modeleModal.mode === "edit") {
        await reparationAdminApi.modifierModele(modeleModal.id, { name: modeleForm.name.trim() });
      } else {
        await reparationAdminApi.creerModele({ familyId: modeleModal.familyId, name: modeleForm.name.trim() });
      }
      await loadCatalogue();
      fermerModeleModal();
    } catch (err) {
      setModeleError(err.message || "Enregistrement impossible");
    }
    setModeleSaving(false);
  };
  const handleToggleModele = async (modele) => {
    try {
      await reparationAdminApi.modifierModele(modele.id, { active: !modele.active });
      await loadCatalogue();
    } catch (err) {
      setErreurEcran(err.message || "Modification du modèle impossible");
    }
  };
  const ouvrirSuppressionModele = (modele) => {
    setDeleteModeleConfirm(modele);
    setDeleteModeleError("");
  };
  const fermerSuppressionModele = () => {
    setDeleteModeleConfirm(null);
    setDeleteModeleError("");
  };
  const handleDeleteModele = async () => {
    if (!deleteModeleConfirm) return;
    setDeleteModeleSaving(true);
    setDeleteModeleError("");
    try {
      await reparationAdminApi.supprimerModele(deleteModeleConfirm.id);
      await loadCatalogue();
      fermerSuppressionModele();
    } catch (err) {
      setDeleteModeleError(err.message || "Suppression impossible");
    }
    setDeleteModeleSaving(false);
  };

  // ── Réparations ────────────────────────────────────────────────────────────
  const ouvrirAjoutReparation = (modele) => {
    setReparationModal({ mode: "add", modelId: modele.id });
    setReparationForm({ name: "", delay: "", price: "" });
    setReparationError("");
  };
  const ouvrirEditionReparation = (job) => {
    // Le prix ne se règle jamais ici — il vit sur l'option (voir plus bas) —
    // donc le formulaire d'édition d'une réparation ne le propose pas.
    setReparationModal({ mode: "edit", id: job.id });
    setReparationForm({ name: job.name, delay: job.delay || "", price: "" });
    setReparationError("");
  };
  const fermerReparationModal = () => {
    setReparationModal(null);
    setReparationError("");
  };
  const handleSaveReparation = async () => {
    if (!reparationForm.name.trim()) {
      setReparationError("Nom requis");
      return;
    }
    if (reparationModal.mode === "add") {
      const prix = Number(reparationForm.price);
      if (!Number.isInteger(prix) || prix < 0) {
        setReparationError("Le prix doit être un nombre entier positif (FCFA)");
        return;
      }
    }
    setReparationSaving(true);
    setReparationError("");
    try {
      if (reparationModal.mode === "edit") {
        await reparationAdminApi.modifierReparation(reparationModal.id, {
          name: reparationForm.name.trim(),
          delay: reparationForm.delay.trim() || null,
        });
      } else {
        await reparationAdminApi.creerReparation({
          modelId: reparationModal.modelId,
          name: reparationForm.name.trim(),
          delay: reparationForm.delay.trim() || undefined,
          price: Number(reparationForm.price),
        });
      }
      await loadCatalogue();
      fermerReparationModal();
    } catch (err) {
      setReparationError(err.message || "Enregistrement impossible");
    }
    setReparationSaving(false);
  };
  const handleToggleReparation = async (job) => {
    try {
      await reparationAdminApi.modifierReparation(job.id, { active: !job.active });
      await loadCatalogue();
    } catch (err) {
      setErreurEcran(err.message || "Modification de la réparation impossible");
    }
  };
  const ouvrirSuppressionReparation = (job) => {
    setDeleteReparationConfirm(job);
    setDeleteReparationError("");
  };
  const fermerSuppressionReparation = () => {
    setDeleteReparationConfirm(null);
    setDeleteReparationError("");
  };
  const handleDeleteReparation = async () => {
    if (!deleteReparationConfirm) return;
    setDeleteReparationSaving(true);
    setDeleteReparationError("");
    try {
      await reparationAdminApi.supprimerReparation(deleteReparationConfirm.id);
      await loadCatalogue();
      fermerSuppressionReparation();
    } catch (err) {
      setDeleteReparationError(err.message || "Suppression impossible");
    }
    setDeleteReparationSaving(false);
  };

  // ── Options (qualités) ─────────────────────────────────────────────────────
  const ouvrirAjoutOption = (job) => {
    setOptionModal({ mode: "add", jobId: job.id, showLabel: true });
    setOptionForm({ label: "", price: "" });
    setOptionError("");
  };
  const ouvrirEditionOption = (job, option) => {
    // Tant qu'une seule option existe (le « Standard » créé automatiquement),
    // son libellé reste invisible à l'admin : seul le prix compte pour lui.
    setOptionModal({ mode: "edit", id: option.id, showLabel: (job.options?.length || 0) > 1 });
    setOptionForm({ label: option.label, price: String(option.price) });
    setOptionError("");
  };
  const fermerOptionModal = () => {
    setOptionModal(null);
    setOptionError("");
  };
  const handleSaveOption = async () => {
    const prix = Number(optionForm.price);
    if (!Number.isInteger(prix) || prix < 0) {
      setOptionError("Le prix doit être un nombre entier positif (FCFA)");
      return;
    }
    if (optionModal.showLabel && !optionForm.label.trim()) {
      setOptionError("Libellé requis");
      return;
    }
    setOptionSaving(true);
    setOptionError("");
    try {
      if (optionModal.mode === "edit") {
        const data = { price: prix };
        if (optionModal.showLabel) data.label = optionForm.label.trim();
        await reparationAdminApi.modifierOption(optionModal.id, data);
      } else {
        await reparationAdminApi.creerOption({
          jobId: optionModal.jobId,
          label: optionForm.label.trim(),
          price: prix,
        });
      }
      await loadCatalogue();
      fermerOptionModal();
    } catch (err) {
      setOptionError(err.message || "Enregistrement impossible");
    }
    setOptionSaving(false);
  };
  const handleToggleOption = async (option) => {
    try {
      await reparationAdminApi.modifierOption(option.id, { active: !option.active });
      await loadCatalogue();
    } catch (err) {
      setErreurEcran(err.message || "Modification de la qualité impossible");
    }
  };
  const ouvrirSuppressionOption = (job, option) => {
    setDeleteOptionConfirm({ job, option });
    setDeleteOptionError("");
  };
  const fermerSuppressionOption = () => {
    setDeleteOptionConfirm(null);
    setDeleteOptionError("");
  };
  const handleDeleteOption = async () => {
    if (!deleteOptionConfirm) return;
    setDeleteOptionSaving(true);
    setDeleteOptionError("");
    try {
      await reparationAdminApi.supprimerOption(deleteOptionConfirm.option.id);
      await loadCatalogue();
      fermerSuppressionOption();
    } catch (err) {
      setDeleteOptionError(err.message || "Suppression impossible");
    }
    setDeleteOptionSaving(false);
  };

  // ── Copier vers d'autres modèles ───────────────────────────────────────────
  const ouvrirDuplication = (job, sourceModelId) => {
    setDupliquerModal({ job, sourceModelId });
    setDupliquerSelection(new Set());
    setDupliquerError("");
  };
  const fermerDuplication = () => {
    setDupliquerModal(null);
    setDupliquerError("");
  };
  const toggleDupliquerModele = (modelId) => {
    setDupliquerSelection((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  };
  const handleDupliquer = async () => {
    if (dupliquerSelection.size === 0) {
      setDupliquerError("Sélectionnez au moins un modèle");
      return;
    }
    setDupliquerSaving(true);
    setDupliquerError("");
    try {
      await reparationAdminApi.dupliquerReparation(dupliquerModal.job.id, [...dupliquerSelection]);
      await loadCatalogue();
      fermerDuplication();
    } catch (err) {
      setDupliquerError(err.message || "Copie impossible");
    }
    setDupliquerSaving(false);
  };

  // ── Demandes — actions ─────────────────────────────────────────────────────
  const handleAvancerStatut = async (demande) => {
    const suivant = prochainStatut(demande.status);
    if (!suivant) return;
    setStatutSavingId(demande.id);
    setStatutErrors((p) => ({ ...p, [demande.id]: null }));
    try {
      await reparationAdminApi.changerStatut(demande.id, suivant);
      await loadDemandes();
    } catch (err) {
      // Le serveur explique précisément pourquoi un passage est refusé
      // (étape sautée, retour en arrière, statut clos...) — on l'affiche tel
      // quel plutôt que de le remplacer par un message générique.
      setStatutErrors((p) => ({ ...p, [demande.id]: err.message || "Impossible de changer le statut" }));
    }
    setStatutSavingId(null);
  };

  const handleSaveRetour = async (demande) => {
    const draft = retourDrafts[demande.id];
    if (draft === undefined) return;
    setRetourSavingId(demande.id);
    setRetourErrors((p) => ({ ...p, [demande.id]: null }));
    try {
      let iso = null;
      if (draft) {
        const d = new Date(draft);
        if (Number.isNaN(d.getTime())) {
          setRetourErrors((p) => ({ ...p, [demande.id]: "Date invalide" }));
          setRetourSavingId(null);
          return;
        }
        iso = d.toISOString();
      }
      await reparationAdminApi.dateRetour(demande.id, iso);
      await loadDemandes();
      setRetourDrafts((p) => {
        const next = { ...p };
        delete next[demande.id];
        return next;
      });
    } catch (err) {
      setRetourErrors((p) => ({ ...p, [demande.id]: err.message || "Enregistrement impossible" }));
    }
    setRetourSavingId(null);
  };

  const handleOuvrirReparation = async (demande) => {
    setOuvrirSavingId(demande.id);
    setOuvrirErrors((p) => ({ ...p, [demande.id]: null }));
    try {
      await reparationAdminApi.ouvrirReparation(demande.id);
      await loadDemandes();
    } catch (err) {
      setOuvrirErrors((p) => ({ ...p, [demande.id]: err.message || "Ouverture impossible" }));
    }
    setOuvrirSavingId(null);
  };

  const ouvrirAnnulation = (demande) => {
    setAnnulerConfirm(demande);
    setAnnulerRetenu("");
    setAnnulerError("");
  };
  const fermerAnnulation = () => {
    setAnnulerConfirm(null);
    setAnnulerError("");
  };
  const handleAnnuler = async () => {
    if (!annulerConfirm) return;
    let retenu;
    if (annulerRetenu.trim() !== "") {
      retenu = Number(annulerRetenu);
      if (!Number.isInteger(retenu) || retenu < 0) {
        setAnnulerError("Le montant retenu doit être un entier positif (FCFA)");
        return;
      }
    }
    setAnnulerSaving(true);
    setAnnulerError("");
    try {
      await reparationAdminApi.annuler(annulerConfirm.id, retenu);
      await loadDemandes();
      fermerAnnulation();
    } catch (err) {
      setAnnulerError(err.message || "Annulation impossible");
    }
    setAnnulerSaving(false);
  };

  const ouvrirAjoutLigne = (demande) => {
    setLigneModal(demande.id);
    setLigneForm({ jobName: "", optionLabel: "", price: "", delay: "" });
    setLigneError("");
  };
  const fermerAjoutLigne = () => {
    setLigneModal(null);
    setLigneError("");
  };
  const handleAjouterLigne = async () => {
    if (!ligneModal) return;
    if (!ligneForm.jobName.trim() || !ligneForm.optionLabel.trim() || ligneForm.price === "") {
      setLigneError("Nom de la réparation, libellé et prix sont requis");
      return;
    }
    const prix = Number(ligneForm.price);
    if (!Number.isInteger(prix) || prix < 0) {
      setLigneError("Le prix doit être un nombre entier positif (FCFA)");
      return;
    }
    setLigneSaving(true);
    setLigneError("");
    try {
      await reparationAdminApi.ajouterLigne(ligneModal, {
        jobName: ligneForm.jobName.trim(),
        optionLabel: ligneForm.optionLabel.trim(),
        price: prix,
        delay: ligneForm.delay.trim() || undefined,
      });
      await loadDemandes();
      fermerAjoutLigne();
    } catch (err) {
      // Ex: « cette commande a déjà été payée » — le serveur dit pourquoi,
      // on ne reformule pas.
      setLigneError(err.message || "Ajout impossible");
    }
    setLigneSaving(false);
  };

  // ── Rendu d'une réparation (job) et de ses options ─────────────────────────
  function renderJob(job, modele) {
    const optionUnique = job.options?.length === 1 ? job.options[0] : null;
    const expanded = expandedJobs.has(job.id);
    return (
      <div
        key={job.id}
        className={`bg-white rounded-xl p-3 border border-black/[0.05] ${!job.active ? "opacity-50" : ""}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <p className="flex-1 min-w-[100px] font-medium text-apple-black text-[12px]">{job.name}</p>
          {job.delay && (
            <span className="text-[10px] bg-black/[0.04] text-apple-mid px-2 py-0.5 rounded-full">
              {job.delay}
            </span>
          )}
          {optionUnique ? (
            <button
              onClick={() => ouvrirEditionOption(job, optionUnique)}
              className="flex items-center gap-1 font-display font-bold text-[12px] text-apple-black hover:text-apple-mid transition"
            >
              {formatPrice(optionUnique.price)}
              <Pencil className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={() => toggleJobExpand(job.id)}
              className="flex items-center gap-1 text-[11px] font-semibold text-apple-black hover:text-apple-mid transition"
            >
              {job.options?.length || 0} qualité{(job.options?.length || 0) > 1 ? "s" : ""}
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
          <button
            onClick={() => ouvrirDuplication(job, modele.id)}
            title="Copier vers d'autres modèles"
            className="p-1.5 rounded-lg hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleReparation(job)}
            title={job.active ? "Désactiver" : "Activer"}
            className="p-1.5 rounded-lg hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
          >
            {job.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => ouvrirEditionReparation(job)}
            className="p-1.5 rounded-lg hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => ouvrirSuppressionReparation(job)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition text-apple-mid hover:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {!optionUnique && expanded && (
          <div className="mt-2.5 pl-4 space-y-1.5 border-l-2 border-black/[0.06]">
            <button
              onClick={() => ouvrirAjoutOption(job)}
              className="flex items-center gap-1 text-[11px] font-semibold text-apple-black hover:text-apple-mid transition"
            >
              <Plus className="w-3 h-3" /> Ajouter une qualité
            </button>
            {(job.options || []).length === 0 && (
              <p className="text-[11px] text-cta">
                Aucune qualité — sans prix, invisible du catalogue public
              </p>
            )}
            {(job.options || []).map((option) => (
              <div key={option.id} className={`flex items-center gap-2 ${!option.active ? "opacity-50" : ""}`}>
                <p className="flex-1 text-[11px] text-apple-black truncate">{option.label}</p>
                <p className="text-[11px] font-semibold text-apple-black flex-shrink-0">
                  {formatPrice(option.price)}
                </p>
                <button
                  onClick={() => handleToggleOption(option)}
                  className="p-1 rounded-lg hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
                >
                  {option.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => ouvrirEditionOption(job, option)}
                  className="p-1 rounded-lg hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => ouvrirSuppressionOption(job, option)}
                  className="p-1 rounded-lg hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tous les modèles de l'espace courant, hormis celui d'où part la copie —
  // se copier soi-même vers soi-même n'a pas de sens.
  const modelesPourDuplication = familles.flatMap((f) =>
    (f.models || [])
      .filter((m) => m.id !== dupliquerModal?.sourceModelId)
      .map((m) => ({ ...m, familyName: f.name })),
  );

  return (
    <div className="space-y-6">
      {/* Ce que le serveur refuse hors modale s'affiche ici, avec son propre
          message : il dit ce qui bloque, et c'est la seule information qui
          permette de savoir quoi faire ensuite. */}
      {erreurEcran && (
        <div
          className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
          style={{
            background: "rgba(227,6,19,0.05)",
            border: "1px solid rgba(227,6,19,0.15)",
          }}
        >
          <AlertCircle className="w-4 h-4 text-cta flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-cta font-medium flex-1">{erreurEcran}</p>
          <button
            onClick={() => setErreurEcran(null)}
            className="text-cta/70 hover:text-cta transition"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Réparations
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            {ongletPrincipal === "catalogue"
              ? catalogueLoading
                ? "Chargement..."
                : `${statsCatalogue.familles} familles · ${statsCatalogue.modeles} modèles · ${statsCatalogue.jobs} réparations`
              : demandesLoading
                ? "Chargement..."
                : `${demandesTotal} demande${demandesTotal > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => (ongletPrincipal === "catalogue" ? loadCatalogue() : loadDemandes())}
          disabled={catalogueLoading || demandesLoading}
          className="flex items-center gap-1.5 text-[12px] text-apple-mid hover:text-apple-black transition px-3 py-2.5 rounded-xl bg-black/[0.03] border border-black/[0.06] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${catalogueLoading || demandesLoading ? "animate-spin" : ""}`} />{" "}
          Actualiser
        </button>
      </div>

      {/* Bascule Catalogue / Demandes */}
      <div className="flex gap-1">
        {[
          { key: "catalogue", label: "Catalogue", Icon: Layers },
          { key: "demandes", label: "Demandes", Icon: ClipboardList },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setOngletPrincipal(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${ongletPrincipal === tab.key ? "bg-apple-black text-white" : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"}`}
          >
            <tab.Icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════ CATALOGUE ═══════════════════════ */}
      {ongletPrincipal === "catalogue" && (
        <>
          <div className="glass-card rounded-3xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 flex-wrap">
              {ESPACES.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEspace(e.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${espace === e.value ? "bg-apple-black text-white" : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"}`}
                >
                  <e.Icon className="w-3.5 h-3.5" /> {e.label}
                </button>
              ))}
            </div>
            <button
              onClick={ouvrirAjoutFamille}
              className="flex items-center gap-2 bg-apple-black hover:bg-neutral-800 text-white font-semibold px-4 py-2.5 rounded-2xl transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Nouvelle famille
            </button>
          </div>

          {catalogueLoading && familles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-black/20 border-t-black/70 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-apple-mid text-[13px]">Chargement du catalogue...</p>
            </div>
          ) : familles.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-black/[0.02] border border-dashed border-black/[0.10]">
              <p className="text-apple-mid text-[13px]">Aucune famille pour cet espace</p>
              <button onClick={ouvrirAjoutFamille} className="text-apple-black text-[12px] font-semibold mt-2 hover:underline">
                + Créer
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {familles.map((famille) => (
                <div key={famille.id} className={`glass-card rounded-3xl p-4 ${!famille.active ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFamilleExpand(famille.id)}
                      className="p-1 rounded-lg hover:bg-black/[0.05] transition text-apple-mid flex-shrink-0"
                    >
                      {expandedFamilles.has(famille.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <p className="flex-1 font-semibold text-apple-black text-[13px] truncate">{famille.name}</p>
                    <span className="text-[11px] text-apple-mid flex-shrink-0">
                      {famille.models?.length || 0} modèle{(famille.models?.length || 0) > 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => handleToggleFamille(famille)}
                      title={famille.active ? "Désactiver" : "Activer"}
                      className="p-2 rounded-xl hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
                    >
                      {famille.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => ouvrirEditionFamille(famille)}
                      className="p-2 rounded-xl hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => ouvrirSuppressionFamille(famille)}
                      className="p-2 rounded-xl hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {expandedFamilles.has(famille.id) && (
                    <div className="mt-3 pl-6 space-y-2 border-l-2 border-black/[0.05]">
                      <button
                        onClick={() => ouvrirAjoutModele(famille)}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-apple-black hover:text-apple-mid transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ajouter un modèle
                      </button>
                      {(famille.models || []).length === 0 && (
                        <p className="text-apple-mid text-[12px]">Aucun modèle</p>
                      )}
                      {(famille.models || []).map((modele) => (
                        <div
                          key={modele.id}
                          className={`bg-black/[0.03] rounded-2xl p-3 ${!modele.active ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleModeleExpand(modele.id)}
                              className="p-1 rounded-lg hover:bg-white transition text-apple-mid flex-shrink-0"
                            >
                              {expandedModeles.has(modele.id) ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <p className="flex-1 font-medium text-apple-black text-[12px] truncate">{modele.name}</p>
                            <span className="text-[10px] text-apple-mid flex-shrink-0">
                              {modele.jobs?.length || 0} réparation{(modele.jobs?.length || 0) > 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={() => handleToggleModele(modele)}
                              title={modele.active ? "Désactiver" : "Activer"}
                              className="p-1.5 rounded-lg hover:bg-white transition text-apple-mid hover:text-apple-black"
                            >
                              {modele.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => ouvrirEditionModele(modele)}
                              className="p-1.5 rounded-lg hover:bg-white transition text-apple-mid hover:text-apple-black"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => ouvrirSuppressionModele(modele)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {expandedModeles.has(modele.id) && (
                            <div className="mt-2.5 pl-5 space-y-2 border-l-2 border-black/[0.06]">
                              <button
                                onClick={() => ouvrirAjoutReparation(modele)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-apple-black hover:text-apple-mid transition"
                              >
                                <Plus className="w-3 h-3" /> Ajouter une réparation
                              </button>
                              {(modele.jobs || []).length === 0 && (
                                <p className="text-apple-mid text-[11px]">Aucune réparation</p>
                              )}
                              {(modele.jobs || []).map((job) => renderJob(job, modele))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════ DEMANDES ═══════════════════════ */}
      {ongletPrincipal === "demandes" && (
        <>
          <div className="glass-card rounded-3xl p-4 flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filterKind}
                onChange={(e) => {
                  setFilterKind(e.target.value);
                  setPage(1);
                }}
                className="appearance-none bg-black/[0.03] border border-black/[0.06] rounded-2xl px-4 py-2.5 pr-9 text-[13px] focus:outline-none text-apple-black"
              >
                <option value="">Tous les types</option>
                <option value="REPARATION">Réparations</option>
                <option value="DIAGNOSTIC">Diagnostics</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="appearance-none bg-black/[0.03] border border-black/[0.06] rounded-2xl px-4 py-2.5 pr-9 text-[13px] focus:outline-none text-apple-black"
              >
                <option value="">Tous les statuts</option>
                {[...STATUTS_ORDRE, "ANNULEE"].map((s) => (
                  <option key={s} value={s}>
                    {STATUT_LABELS[s]}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid pointer-events-none" />
            </div>
          </div>

          {demandesLoading && demandes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-black/20 border-t-black/70 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-apple-mid text-[13px]">Chargement des demandes...</p>
            </div>
          ) : demandes.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-black/[0.02] border border-dashed border-black/[0.10]">
              <p className="text-apple-mid text-[13px]">Aucune demande</p>
            </div>
          ) : (
            <div className="space-y-3">
              {demandes.map((demande) => {
                const style = STATUT_STYLE[demande.status] || STATUT_STYLE.EN_ATTENTE;
                const suivant = prochainStatut(demande.status);
                const estClose = demande.status === "RENDUE" || demande.status === "ANNULEE";
                const currentRetour = toDateInputValue(demande.returnDate);
                const draftRetour = retourDrafts[demande.id] ?? currentRetour;
                const hasRetourChange = draftRetour !== currentRetour;
                // Diagnostic déjà transformé en réparation : au mieux depuis
                // la page courante — un diagnostic ouvert alors qu'il était
                // filtré ailleurs ne sera pas détecté, ce n'est qu'un confort
                // d'affichage, pas la source de vérité (le serveur, lui,
                // refuse toujours une seconde ouverture).
                const dejaOuverte = demandes.some((d) => d.parentId === demande.id);
                return (
                  <div key={demande.id} className="glass-card rounded-3xl p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-[11px] text-apple-mid">{demande.reference}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${demande.kind === "DIAGNOSTIC" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}
                          >
                            {demande.kind === "DIAGNOSTIC" ? (
                              <Stethoscope className="w-2.5 h-2.5" />
                            ) : (
                              <Wrench className="w-2.5 h-2.5" />
                            )}
                            {demande.kind === "DIAGNOSTIC" ? "Diagnostic" : "Réparation"}
                          </span>
                        </div>
                        <p className="font-semibold text-apple-black text-[13px]">{demande.clientName}</p>
                        <p className="text-apple-mid text-[11px] font-mono mt-0.5">
                          📱 {demande.clientWhatsapp}
                          {demande.clientEmail ? ` · ✉️ ${demande.clientEmail}` : ""}
                        </p>
                        <p className="text-apple-mid text-[11px] mt-0.5">
                          {demande.familyName} {demande.modelName} · {demande.city}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {STATUT_LABELS[demande.status] || demande.status}
                        </span>
                        <span className="font-display font-bold text-[13px] text-apple-black">
                          {formatPrice(demande.total)}
                        </span>
                      </div>
                    </div>

                    {demande.problemDescription && (
                      <p className="text-[11px] text-apple-mid mt-3 bg-black/[0.02] rounded-xl p-2.5">
                        {demande.problemDescription}
                      </p>
                    )}

                    {demande.items?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {demande.items.map((it) => (
                          <p key={it.id} className="text-[11px] text-apple-mid flex items-center justify-between gap-2">
                            <span className="truncate">
                              {it.jobName} — {it.optionLabel}
                              {it.delay ? ` (${it.delay})` : ""}
                              {it.horsCatalogue ? " · hors catalogue" : ""}
                            </span>
                            <span className="font-medium text-apple-black flex-shrink-0">
                              {formatPrice(it.unitPrice)}
                            </span>
                          </p>
                        ))}
                      </div>
                    )}

                    {demande.returnDate && (
                      <p className="text-[11px] text-apple-black mt-2 flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-apple-mid" /> Retour prévu le{" "}
                        <strong>{formatDate(demande.returnDate)}</strong>
                      </p>
                    )}
                    {demande.status === "ANNULEE" && (
                      <p className="text-[11px] text-cta mt-2">
                        Montant retenu : {formatPrice(demande.cancelledRetained || 0)}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-black/[0.05] flex flex-wrap items-center gap-2">
                      {suivant && (
                        <button
                          onClick={() => handleAvancerStatut(demande)}
                          disabled={statutSavingId === demande.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-apple-black hover:bg-neutral-800 text-white text-[11px] font-semibold transition disabled:opacity-40"
                        >
                          <ArrowRight className="w-3 h-3" />{" "}
                          {statutSavingId === demande.id ? "..." : STATUT_LABELS[suivant]}
                        </button>
                      )}

                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={draftRetour}
                          onChange={(e) =>
                            setRetourDrafts((p) => ({ ...p, [demande.id]: e.target.value }))
                          }
                          className="bg-black/[0.03] rounded-xl px-2.5 py-2 text-[11px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                        />
                        <button
                          onClick={() => handleSaveRetour(demande)}
                          disabled={!hasRetourChange || retourSavingId === demande.id}
                          className="px-2.5 py-2 rounded-xl bg-black/[0.05] hover:bg-black/[0.08] text-apple-black text-[11px] font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {retourSavingId === demande.id ? "..." : "Retour"}
                        </button>
                      </div>

                      {!estClose && (
                        <button
                          onClick={() => ouvrirAjoutLigne(demande)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.07] text-apple-black text-[11px] font-semibold transition"
                        >
                          <Plus className="w-3 h-3" /> Ligne
                        </button>
                      )}

                      {demande.kind === "DIAGNOSTIC" && !dejaOuverte && (
                        <button
                          onClick={() => handleOuvrirReparation(demande)}
                          disabled={ouvrirSavingId === demande.id}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-semibold transition disabled:opacity-40"
                        >
                          <Wrench className="w-3 h-3" />{" "}
                          {ouvrirSavingId === demande.id ? "..." : "Ouvrir réparation"}
                        </button>
                      )}

                      {!estClose && (
                        <button
                          onClick={() => ouvrirAnnulation(demande)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-[11px] font-semibold transition"
                        >
                          <X className="w-3 h-3" /> Annuler
                        </button>
                      )}
                    </div>

                    {(statutErrors[demande.id] || retourErrors[demande.id] || ouvrirErrors[demande.id]) && (
                      <div className="mt-2 space-y-1">
                        {statutErrors[demande.id] && (
                          <p className="text-[11px] text-cta font-medium">{statutErrors[demande.id]}</p>
                        )}
                        {retourErrors[demande.id] && (
                          <p className="text-[11px] text-cta font-medium">{retourErrors[demande.id]}</p>
                        )}
                        {ouvrirErrors[demande.id] && (
                          <p className="text-[11px] text-cta font-medium">{ouvrirErrors[demande.id]}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {demandesTotal > LIMIT_DEMANDES && (
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <p className="text-apple-mid text-[12px]">
                Page {page} / {totalPagesDemandes} · {demandesTotal} demandes
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.07] text-apple-black text-[11px] font-semibold transition disabled:opacity-30"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPagesDemandes, p + 1))}
                  disabled={page >= totalPagesDemandes}
                  className="px-3 py-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.07] text-apple-black text-[11px] font-semibold transition disabled:opacity-30"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════ MODALES — CATALOGUE ═══════════════════════ */}

      {familleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerFamilleModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {familleModal.mode === "edit" ? "Modifier la famille" : "Nouvelle famille"}
              </h2>
              <button onClick={fermerFamilleModal} className="p-2 hover:bg-black/[0.05] rounded-xl transition">
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Nom *
                </label>
                <input
                  value={familleForm.name}
                  onChange={(e) => setFamilleForm({ name: e.target.value })}
                  placeholder="Ex: iPhone"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              {familleError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {familleError}
                </p>
              )}
              <button
                onClick={handleSaveFamille}
                disabled={familleSaving}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40"
              >
                {familleSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modeleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerModeleModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {modeleModal.mode === "edit" ? "Modifier le modèle" : "Nouveau modèle"}
              </h2>
              <button onClick={fermerModeleModal} className="p-2 hover:bg-black/[0.05] rounded-xl transition">
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Nom *
                </label>
                <input
                  value={modeleForm.name}
                  onChange={(e) => setModeleForm({ name: e.target.value })}
                  placeholder="Ex: iPhone 15 Pro"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              {modeleError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {modeleError}
                </p>
              )}
              <button
                onClick={handleSaveModele}
                disabled={modeleSaving}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40"
              >
                {modeleSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reparationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerReparationModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {reparationModal.mode === "edit" ? "Modifier la réparation" : "Nouvelle réparation"}
              </h2>
              <button onClick={fermerReparationModal} className="p-2 hover:bg-black/[0.05] rounded-xl transition">
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Nom *
                </label>
                <input
                  value={reparationForm.name}
                  onChange={(e) => setReparationForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Écran"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Délai (optionnel)
                </label>
                <input
                  value={reparationForm.delay}
                  onChange={(e) => setReparationForm((p) => ({ ...p, delay: e.target.value }))}
                  placeholder="Ex: 48h"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              {/* Le prix ne se propose qu'à la création : le serveur crée
                  alors automatiquement une option « Standard » à ce prix.
                  Une fois créée, le prix se règle sur l'option (icône crayon
                  à côté du montant, dans l'arbre). */}
              {reparationModal.mode === "add" && (
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={reparationForm.price}
                    onChange={(e) => setReparationForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="Ex: 25000"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
              )}
              {reparationError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {reparationError}
                </p>
              )}
              <button
                onClick={handleSaveReparation}
                disabled={reparationSaving}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40"
              >
                {reparationSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {optionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerOptionModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {optionModal.mode === "edit" ? "Modifier la qualité" : "Ajouter une qualité"}
              </h2>
              <button onClick={fermerOptionModal} className="p-2 hover:bg-black/[0.05] rounded-xl transition">
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {optionModal.showLabel && (
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Libellé *
                  </label>
                  <input
                    value={optionForm.label}
                    onChange={(e) => setOptionForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Ex: Origine"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
              )}
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Prix (FCFA) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={optionForm.price}
                  onChange={(e) => setOptionForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="Ex: 30000"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              {optionError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {optionError}
                </p>
              )}
              <button
                onClick={handleSaveOption}
                disabled={optionSaving}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40"
              >
                {optionSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {dupliquerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerDuplication} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">Copier vers d&apos;autres modèles</h2>
              <button onClick={fermerDuplication} className="p-2 hover:bg-black/[0.05] rounded-xl transition">
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[12px] text-apple-mid">
                « {dupliquerModal.job.name} » et ses qualités seront copiées, telles quelles, sur chaque
                modèle coché. Chaque copie devient ensuite indépendante — la modifier ici n&apos;affectera
                pas les autres.
              </p>
              {modelesPourDuplication.length === 0 ? (
                <p className="text-[12px] text-apple-mid">Aucun autre modèle dans cet espace</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1 border border-black/[0.06] rounded-2xl p-2">
                  {modelesPourDuplication.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-black/[0.03] transition cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={dupliquerSelection.has(m.id)}
                        onChange={() => toggleDupliquerModele(m.id)}
                        className="w-4 h-4 accent-black"
                      />
                      <span className="text-[12px] text-apple-black">
                        {m.familyName} · {m.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {dupliquerError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {dupliquerError}
                </p>
              )}
              <button
                onClick={handleDupliquer}
                disabled={dupliquerSaving || dupliquerSelection.size === 0}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {dupliquerSaving ? "Copie..." : `Copier vers ${dupliquerSelection.size || ""} modèle(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ MODALES — DEMANDES ═══════════════════════ */}

      {ligneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerAjoutLigne} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">Ligne hors catalogue</h2>
              <button onClick={fermerAjoutLigne} className="p-2 hover:bg-black/[0.05] rounded-xl transition">
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Nom de la réparation *
                </label>
                <input
                  value={ligneForm.jobName}
                  onChange={(e) => setLigneForm((p) => ({ ...p, jobName: e.target.value }))}
                  placeholder="Ex: Nappe caméra"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Libellé *
                </label>
                <input
                  value={ligneForm.optionLabel}
                  onChange={(e) => setLigneForm((p) => ({ ...p, optionLabel: e.target.value }))}
                  placeholder="Ex: Compatible"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={ligneForm.price}
                    onChange={(e) => setLigneForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="Ex: 15000"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Délai (optionnel)
                  </label>
                  <input
                    value={ligneForm.delay}
                    onChange={(e) => setLigneForm((p) => ({ ...p, delay: e.target.value }))}
                    placeholder="Ex: 24h"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
              </div>
              {ligneError && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {ligneError}
                </p>
              )}
              <button
                onClick={handleAjouterLigne}
                disabled={ligneSaving}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40"
              >
                {ligneSaving ? "Ajout..." : "Ajouter la ligne"}
              </button>
            </div>
          </div>
        </div>
      )}

      {annulerConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerAnnulation} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">Annuler cette demande ?</h3>
            <p className="text-apple-mid text-sm mb-4">
              Cette action est définitive. Le remboursement éventuel reste manuel, depuis le tableau de
              bord FedaPay.
            </p>
            <div className="text-left mb-4">
              <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                Montant retenu (FCFA)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={annulerRetenu}
                onChange={(e) => setAnnulerRetenu(e.target.value)}
                placeholder="Laisser vide pour les frais d'enlèvement par défaut"
                className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
              />
            </div>
            {annulerError && <p className="text-sm text-red-500 mb-4">{annulerError}</p>}
            <div className="flex gap-3">
              <button
                onClick={fermerAnnulation}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                {annulerError ? "Fermer" : "Retour"}
              </button>
              <button
                onClick={handleAnnuler}
                disabled={annulerSaving}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                {annulerSaving ? "Annulation..." : "Annuler la demande"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ CONFIRMATIONS DE SUPPRESSION ═══════════════════════ */}

      {deleteFamilleConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerSuppressionFamille} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">Supprimer cette famille ?</h3>
            <p className="text-apple-mid text-sm mb-6">
              Tous ses modèles, réparations et qualités partent avec elle. L&apos;historique des commandes
              déjà passées n&apos;est jamais affecté — les lignes gardent leurs libellés et prix d&apos;origine.
            </p>
            {deleteFamilleError && <p className="text-sm text-red-500 mb-4">{deleteFamilleError}</p>}
            <div className="flex gap-3">
              <button
                onClick={fermerSuppressionFamille}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                {deleteFamilleError ? "Fermer" : "Annuler"}
              </button>
              <button
                onClick={handleDeleteFamille}
                disabled={deleteFamilleSaving}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                {deleteFamilleSaving ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModeleConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerSuppressionModele} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">Supprimer ce modèle ?</h3>
            <p className="text-apple-mid text-sm mb-6">
              Toutes ses réparations et leurs qualités partent avec lui. L&apos;historique des commandes
              n&apos;est jamais affecté.
            </p>
            {deleteModeleError && <p className="text-sm text-red-500 mb-4">{deleteModeleError}</p>}
            <div className="flex gap-3">
              <button
                onClick={fermerSuppressionModele}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                {deleteModeleError ? "Fermer" : "Annuler"}
              </button>
              <button
                onClick={handleDeleteModele}
                disabled={deleteModeleSaving}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                {deleteModeleSaving ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteReparationConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerSuppressionReparation} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">Supprimer cette réparation ?</h3>
            <p className="text-apple-mid text-sm mb-6">
              Ses qualités partent avec elle. L&apos;historique des commandes n&apos;est jamais affecté.
            </p>
            {deleteReparationError && <p className="text-sm text-red-500 mb-4">{deleteReparationError}</p>}
            <div className="flex gap-3">
              <button
                onClick={fermerSuppressionReparation}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                {deleteReparationError ? "Fermer" : "Annuler"}
              </button>
              <button
                onClick={handleDeleteReparation}
                disabled={deleteReparationSaving}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                {deleteReparationSaving ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOptionConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={fermerSuppressionOption} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">Supprimer cette qualité ?</h3>
            <p className="text-apple-mid text-sm mb-6">
              {deleteOptionConfirm.job.options?.length === 1
                ? "C'est la seule qualité de cette réparation : sans elle, la réparation n'a plus de prix et disparaît du catalogue public."
                : "Cette qualité disparaît du catalogue public."}
            </p>
            {deleteOptionError && <p className="text-sm text-red-500 mb-4">{deleteOptionError}</p>}
            <div className="flex gap-3">
              <button
                onClick={fermerSuppressionOption}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                {deleteOptionError ? "Fermer" : "Annuler"}
              </button>
              <button
                onClick={handleDeleteOption}
                disabled={deleteOptionSaving}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                {deleteOptionSaving ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
