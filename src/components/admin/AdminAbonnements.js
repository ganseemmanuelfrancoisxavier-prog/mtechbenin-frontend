"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  X,
  Check,
  Tv,
  Music,
  Play,
  Globe,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Video,
  Layers,
  Eye,
  EyeOff,
  ChevronDown,
  AlertCircle,
  Lock,
  Link as LinkIcon,
  Users,
  Wrench,
  Clock,
  Send,
  RefreshCw,
  CalendarClock,
  ShoppingBag,
} from "lucide-react";
import { formatPrice, libelleDuree } from "@/lib/format";
import { subscriptionsApi } from "@/lib/api";
import AdminComptesPartages from "./AdminComptesPartages";
import MediaUploader from "@/components/admin/MediaUploader";

const serviceIcons = {
  netflix: Tv,
  spotify: Music,
  "apple-music": Music,
  "disney-plus": Play,
  "youtube-premium": Play,
  canva: Globe,
  chatgpt: Globe,
  crunchyroll: Play,
};
const serviceColors = {
  netflix: "#E50914",
  spotify: "#1DB954",
  "apple-music": "#FC3C44",
  "disney-plus": "#113CCF",
  "youtube-premium": "#FF0000",
  canva: "#00C4CC",
  chatgpt: "#10A37F",
  crunchyroll: "#FF6600",
};

// `description` est une liste d'avantages, une entrée par puce affichée au
// client. On démarre sur une ligne vide pour que le champ soit immédiatement
// utilisable sans avoir à cliquer sur « + » d'abord.
const emptyPlanForm = {
  label: "",
  duration: "",
  // Une formule sans echeance : le client garde son acces indefiniment. Faux
  // par defaut — c'est le cas rare, et cocher doit rester un geste.
  aVie: false,
  price: "",
  capaciteProfil: "1",
  description: [""],
};

// Bornes reprises du serveur (`subscriptions.controller.js`) : les faire
// respecter ici évite un aller-retour pour un refus qu'on peut prévoir.
const MAX_LIGNES_DESCRIPTION = 8;
const MAX_LONGUEUR_LIGNE = 120;
const emptyServiceForm = { name: "", tagline: "", category: "family" };
const emptyAccountForm = {
  email: "",
  password: "",
  profile: "",
  profilePassword: "",
  // Pas de `capacite` ici, et c'est délibéré : le formulaire entier est envoyé
  // tel quel au serveur, qui REFUSE désormais ce champ — la capacité se règle
  // sur la formule. La laisser dans l'état ferait échouer tout enregistrement
  // de profil, avec un message parlant de capacité alors qu'on modifiait un
  // mot de passe.
};

const mediaTypes = [
  { value: "gradient", label: "Dégradé", Icon: Layers },
  { value: "image", label: "Image", Icon: ImageIcon },
  { value: "video", label: "Vidéo", Icon: Video },
];

const accountStatusConfig = {
  disponible: {
    label: "Disponible",
    bg: "bg-green-50",
    text: "text-green-600",
  },
  réservé: { label: "Réservé", bg: "bg-orange-50", text: "text-orange-500" },
  envoyé: { label: "Envoyé", bg: "bg-red-50", text: "text-cta" },
};
const linkStatusConfig = {
  en_attente: {
    label: "En attente",
    bg: "bg-orange-50",
    text: "text-orange-500",
  },
  envoyé: { label: "Lien envoyé", bg: "bg-green-50", text: "text-green-600" },
};
const orderStatusConfig = {
  CONFIRMED: { label: "Confirmée", bg: "bg-green-50", text: "text-green-600" },
  PENDING: { label: "En attente", bg: "bg-orange-50", text: "text-orange-500" },
};
const serviceStatusConfig = {
  active: {
    label: "Actif",
    icon: Check,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  coming_soon: {
    label: "Bientôt dispo",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
};

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
// Le Bénin est à UTC+1 toute l'année. Le serveur juge « expire demain » sur ce
// décalage fixe (voir workers/subscriptionExpiry.js), jamais sur le fuseau de
// la machine. On applique ici la même règle : sinon un panel ouvert depuis un
// autre fuseau afficherait une date décalée d'un jour par rapport à celle sur
// laquelle le rappel partira réellement.
const DECALAGE_BENIN_MS = 1 * 3600 * 1000;

function jourBenin(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + DECALAGE_BENIN_MS).toISOString().slice(0, 10);
}

// Valeur "YYYY-MM-DD" attendue par un <input type="date">.
function toDateInputValue(iso) {
  return jourBenin(iso);
}

// "JJ/MM/AAAA" pour l'affichage, à partir du même jour béninois — pour que le
// texte lu et la valeur du champ ne puissent jamais se contredire.
function formatJourBenin(iso) {
  const jour = jourBenin(iso);
  if (!jour) return "—";
  const [annee, mois, j] = jour.split("-");
  return `${j}/${mois}/${annee}`;
}
function buildWhatsappMessage(clientName, serviceName, link) {
  return encodeURIComponent(
    `Bonjour ${clientName} 👋\n\nVotre accès *${serviceName}* est prêt ✅\n\n🔗 Lien d'accès : ${link}\n\nMerci pour votre confiance 🙏\n— MTECHBENIN`,
  );
}

export default function AdminAbonnements() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("tous");
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("formules");

  // ── Vue principale : services ou commandes d'abonnement ───────────────────
  const [viewMode, setViewMode] = useState("services");
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [expiryDrafts, setExpiryDrafts] = useState({});
  const [expiryErrors, setExpiryErrors] = useState({});
  const [expirySavingId, setExpirySavingId] = useState(null);
  const [clearExpiryConfirm, setClearExpiryConfirm] = useState(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [planErreur, setPlanErreur] = useState(null);
  const [savedPlan, setSavedPlan] = useState(false);
  const [deletePlanConfirm, setDeletePlanConfirm] = useState(null);
  const [deletePlanError, setDeletePlanError] = useState("");
  // Passe à vrai quand le serveur a REFUSÉ (409) : c'est ce refus, et lui seul,
  // qui fait apparaître « Supprimer quand même ». Une panne (500) ou une
  // coupure réseau ne doit pas proposer de forcer — l'admin détruirait de
  // l'historique client en croyant réessayer.
  const [deletePlanForcable, setDeletePlanForcable] = useState(false);
  const [deleteServiceError, setDeleteServiceError] = useState("");
  const [deleteServiceSaving, setDeleteServiceSaving] = useState(false);
  const [deletePlanSaving, setDeletePlanSaving] = useState(false);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [savedService, setSavedService] = useState(false);
  const [deleteServiceConfirm, setDeleteServiceConfirm] = useState(null);

  const [mediaForm, setMediaForm] = useState({ type: "gradient", url: "" });
  const [mediaSaved, setMediaSaved] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountPlanId, setAccountPlanId] = useState(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(null);
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [deleteAccountForcable, setDeleteAccountForcable] = useState(false);
  const [deleteAccountSaving, setDeleteAccountSaving] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientLink, setClientLink] = useState("");
  const [linkSaved, setLinkSaved] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: "",
    whatsapp: "",
    email: "",
    planId: null,
  });

  const [statusMessages, setStatusMessages] = useState({});
  const [statusSaved, setStatusSaved] = useState(false);

  const [poolLinkDrafts, setPoolLinkDrafts] = useState({});
  const [poolLinkErreurs, setPoolLinkErreurs] = useState({});
  // Indexé par formule (planId), comme poolLinkDrafts/poolLinkErreurs : un
  // scalaire unique partagerait l'état "en cours" entre toutes les formules
  // d'un même service, ce qui réactiverait le bouton d'une formule pendant
  // qu'une autre est encore en vol et permettrait un double envoi.
  const [poolLinkEnCours, setPoolLinkEnCours] = useState({});
  // Supprimer un lien de la réserve est une action destructrice et
  // irréversible, comme la suppression d'une formule, d'un service ou d'un
  // compte famille : elle passe donc par la même confirmation qu'elles.
  // Contient { planId, id } le temps de la confirmation.
  const [deletePoolLinkConfirm, setDeletePoolLinkConfirm] = useState(null);

  // Rattachement d'un profil à son acheteur : identifiant du profil en cours
  // d'enregistrement, et messages de refus du serveur indexés par profil.
  const [accountClientSaving, setAccountClientSaving] = useState(null);
  const [accountClientErrors, setAccountClientErrors] = useState({});


  // ── Charge tout depuis l'API ──────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [data, ordersRes] = await Promise.all([
        subscriptionsApi.getAdminDashboard(),
        subscriptionsApi.getAdminOrders({ limit: 500 }),
      ]);
      setApiData(data);
      setOrders(ordersRes.orders || []);
    } catch (err) {
      console.error("Erreur chargement abonnements", err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ── Met à jour selected quand apiData change ──────────────────────────────
  useEffect(() => {
    if (!selected || !apiData?.services) return;
    const fresh = apiData.services.find((s) => s.slug === selected.slug);
    if (fresh) setSelected(buildService(fresh));
  }, [apiData]);

  // ── Met à jour mediaForm et statusMessages quand selected change ──────────
  useEffect(() => {
    if (!selected) return;
    setMediaForm({
      type: selected.mediaType || "gradient",
      url: selected.mediaUrl || "",
    });
    setStatusMessages({
      maintenance:
        selected.maintenanceMessage ||
        "Ce service est temporairement en maintenance.",
      coming_soon:
        selected.comingSoonMessage || "Ce service sera bientôt disponible.",
    });
  }, [selected?.slug]);


  // ── Construit un service normalisé depuis l'API ───────────────────────────
  const buildService = (svc) => ({
    id: svc.id,
    slug: svc.slug,
    name: svc.name,
    tagline: svc.tagline || "",
    icon: svc.slug,
    plans: svc.plans || [],
    color: serviceColors[svc.slug] || "#1D1D1F",
    active: svc.available,
    serviceStatus: svc.serviceStatus || "active",
    maintenanceMessage: svc.maintenanceMessage || "",
    comingSoonMessage: svc.comingSoonMessage || "",
    category: svc.category || "family",
    // `!== false` et non `|| true` : un service dont le transfert est coupe
    // porte `false`, et `false || true` vaut `true` — l'interrupteur se serait
    // rallume tout seul a chaque chargement du panel.
    transfertOtp: svc.transfertOtp !== false,
    totalPlaces: svc.totalPlaces || 0,
    mediaType: svc.mediaType || "gradient",
    mediaUrl: svc.mediaUrl || "",
  });

  const services = apiData?.services?.map(buildService) || [];

  const filtered = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "tous" ||
      (filterStatus === "actif" && s.active) ||
      (filterStatus === "inactif" && !s.active);
    return matchSearch && matchStatus;
  });

  const stats = {
    active: services.filter((s) => s.active).length,
    maintenance: services.filter((s) => s.serviceStatus === "maintenance")
      .length,
    comingSoon: services.filter((s) => s.serviceStatus === "coming_soon")
      .length,
    familyDispo: services
      .filter((s) => s.category === "family")
      .reduce(
        (acc, s) =>
          acc +
          s.plans.reduce(
            (a, p) =>
              a +
              (p.accounts?.filter((ac) => ac.status === "disponible").length ||
                0),
            0,
          ),
        0,
      ),
    linkDispo: services
      .filter((s) => s.category === "link_access")
      .reduce(
        (acc, s) =>
          acc +
          s.plans.reduce(
            (a, p) =>
              a + (p.poolLinks?.filter((l) => l.status === "disponible").length || 0),
            0,
          ),
        0,
      ),
  };

  const getServiceDispo = (service) => {
    if (service.category === "family") {
      const total = service.plans.reduce(
        (a, p) => a + (p.accounts?.length || 0),
        0,
      );
      const dispo = service.plans.reduce(
        (a, p) =>
          a +
          (p.accounts?.filter((ac) => ac.status === "disponible").length || 0),
        0,
      );
      return { total, dispo, isFull: total > 0 && dispo === 0 };
    } else {
      // Le stock des formules link_access se compte désormais sur les liens
      // réels du pool (poolLinks) de chaque formule du service ; totalPlaces
      // ne sert plus de ce côté.
      const total = service.plans.reduce(
        (a, p) => a + (p.poolLinks?.length || 0),
        0,
      );
      const dispo = service.plans.reduce(
        (a, p) =>
          a +
          (p.poolLinks?.filter((l) => l.status === "disponible").length || 0),
        0,
      );
      return { total, dispo, isFull: total > 0 && dispo === 0 };
    }
  };

  const getPlanDispo = (plan, category) => {
    if (category === "family") {
      const total = plan.accounts?.length || 0;
      const dispo =
        plan.accounts?.filter((a) => a.status === "disponible").length || 0;
      const sent =
        plan.accounts?.filter((a) => a.status === "envoyé").length || 0;
      return { total, dispo, sent, isFull: total > 0 && dispo === 0 };
    } else {
      const total = plan.poolLinks?.length || 0;
      const dispo =
        plan.poolLinks?.filter((l) => l.status === "disponible").length || 0;
      const sent =
        plan.poolLinks?.filter((l) => l.status === "envoyé").length || 0;
      return { total, dispo, sent, isFull: total > 0 && dispo === 0 };
    }
  };

  const currentCategory = selected?.category || "family";

  // ── Commandes d'abonnement (toutes formules confondues) ───────────────────
  const filteredOrders = orders.filter((o) =>
    o.clientName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.clientWhatsapp?.includes(orderSearch) ||
    o.service?.name?.toLowerCase().includes(orderSearch.toLowerCase()),
  );
  // Une commande a vie n'a PAS de date, et c'est voulu. La compter parmi les
  // « dates manquantes » afficherait une alerte que rien ne peut eteindre, et
  // l'admin qui la suivrait mettrait fin a l'abonnement en croyant corriger un
  // oubli — le panel serait alors le seul chemin vers cette erreur.
  const ordersMissingExpiry = orders.filter(
    (o) => o.status === "CONFIRMED" && !o.expiresAt && !o.plan?.aVie,
  ).length;

  const handleSaveExpiry = async (order) => {
    const draft = expiryDrafts[order.id];
    if (!draft) return; // un champ vide ne doit jamais effacer via "Enregistrer"
    setExpirySavingId(order.id);
    setExpiryErrors((prev) => ({ ...prev, [order.id]: null }));
    try {
      const d = new Date(draft);
      if (Number.isNaN(d.getTime())) {
        setExpiryErrors((prev) => ({ ...prev, [order.id]: "Date invalide" }));
        setExpirySavingId(null);
        return;
      }
      await subscriptionsApi.setExpiry(order.id, d.toISOString());
      await loadAll();
      setExpiryDrafts((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } catch (err) {
      setExpiryErrors((prev) => ({
        ...prev,
        [order.id]: err.message || "Enregistrement impossible",
      }));
    }
    setExpirySavingId(null);
  };

  const handleClearExpiry = async (orderId) => {
    setExpirySavingId(orderId);
    setExpiryErrors((prev) => ({ ...prev, [orderId]: null }));
    try {
      await subscriptionsApi.setExpiry(orderId, null);
      await loadAll();
      setExpiryDrafts((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } catch (err) {
      setExpiryErrors((prev) => ({
        ...prev,
        [orderId]: err.message || "Effacement impossible",
      }));
    }
    setExpirySavingId(null);
    setClearExpiryConfirm(null);
  };

  // ── Handlers — tous via API ───────────────────────────────────────────────

  const handleToggleService = async (svc) => {
    try {
      await subscriptionsApi.updateService(svc.id, { available: !svc.active });
      await loadAll();
    } catch (err) {
      console.error("Erreur toggleService", err.message);
    }
  };

  const handleApplyMedia = async () => {
    if (!selected) return;
    try {
      await subscriptionsApi.updateService(selected.id, {
        mediaType: mediaForm.type,
        mediaUrl: mediaForm.url || null,
      });
      await loadAll();
      setMediaSaved(true);
      setTimeout(() => setMediaSaved(false), 1500);
    } catch (err) {
      console.error("Erreur applyMedia", err.message);
    }
  };

  const handleSaveStatus = async () => {
    if (!selected) return;
    try {
      await subscriptionsApi.updateService(selected.id, {
        serviceStatus: selected.serviceStatus,
        maintenanceMessage: statusMessages.maintenance,
        comingSoonMessage: statusMessages.coming_soon,
      });
      await loadAll();
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 1500);
    } catch (err) {
      console.error("Erreur saveStatus", err.message);
    }
  };

  const handleSetStatus = async (status) => {
    if (!selected) return;
    try {
      await subscriptionsApi.updateService(selected.id, {
        serviceStatus: status,
      });
      setSelected((prev) => (prev ? { ...prev, serviceStatus: status } : prev));
      await loadAll();
    } catch (err) {
      console.error("Erreur setStatus", err.message);
    }
  };

  // Un service dont le transfert est coupe ne relaie AUCUN code de
  // verification a ses clients. A regler service par service : la categorie
  // (famille / link access) ne dit rien de la propriete des codes.
  const handleSetTransfertOtp = async (actif) => {
    if (!selected) return;
    try {
      await subscriptionsApi.updateService(selected.id, { transfertOtp: actif });
      setSelected((prev) => (prev ? { ...prev, transfertOtp: actif } : prev));
      await loadAll();
    } catch (err) {
      console.error("Erreur setTransfertOtp", err.message);
    }
  };

  const handleSetCategory = async (category) => {
    if (!selected) return;
    try {
      await subscriptionsApi.updateService(selected.id, { category });
      setSelected((prev) => (prev ? { ...prev, category } : prev));
      await loadAll();
    } catch (err) {
      console.error("Erreur setCategory", err.message);
    }
  };

  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm(emptyPlanForm);
    setShowPlanModal(true);
  };
  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      label: plan.label,
      duration: plan.duration,
      aVie: !!plan.aVie,
      price: plan.price,
      capaciteProfil: String(plan.capaciteProfil ?? 1),
      // Une formule sans description ouvre sur une ligne vide plutôt que sur
      // rien : l'admin voit tout de suite où écrire.
      description: plan.description?.length ? [...plan.description] : [""],
    });
    setPlanErreur(null);
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.label || !planForm.price) return;
    // Une duree est obligatoire, sauf si la formule est a vie. Le serveur le
    // refuse aussi, mais l'arreter ici evite un aller-retour pour une case que
    // l'admin voit a l'ecran.
    if (!planForm.aVie && !planForm.duration) {
      setPlanErreur("Indiquez une durée en mois, ou cochez « à vie »");
      return;
    }
    setPlanErreur(null);
    const data = {
      label: planForm.label,
      // Sur une formule a vie la duree est ignoree cote serveur, qui la ramene
      // a 1. On l'envoie quand meme : la colonne est obligatoire en base, et
      // decocher « a vie » plus tard doit retrouver une valeur exploitable.
      duration: planForm.aVie ? 1 : Number(planForm.duration),
      aVie: !!planForm.aVie,
      price: Number(planForm.price),
      // Combien de personnes partagent UN profil de cette formule. Le serveur
      // repercute la valeur sur tous les profils existants — et refuse si l'un
      // d'eux compte deja plus d'occupants que cela.
      capaciteProfil: Math.max(1, Number(planForm.capaciteProfil) || 1),
      // Les lignes laissées vides ne partent pas : cliquer sur « + » sans
      // rien écrire ne doit pas créer une puce vide chez le client.
      description: planForm.description.map((l) => l.trim()).filter(Boolean),
    };
    try {
      if (editingPlan) await subscriptionsApi.updatePlan(editingPlan.id, data);
      else await subscriptionsApi.createPlan(selected.id, data);
      await loadAll();
      setSavedPlan(true);
      setTimeout(() => {
        setSavedPlan(false);
        setShowPlanModal(false);
      }, 900);
    } catch (err) {
      // Ne jamais laisser croire à un enregistrement qui n'a pas eu lieu.
      setPlanErreur(err.message || "Enregistrement impossible");
    }
  };

  const modifierLigneDescription = (index, valeur) =>
    setPlanForm((p) => ({
      ...p,
      description: p.description.map((l, i) => (i === index ? valeur : l)),
    }));

  const ajouterLigneDescription = () =>
    setPlanForm((p) =>
      p.description.length >= MAX_LIGNES_DESCRIPTION
        ? p
        : { ...p, description: [...p.description, ""] },
    );

  const retirerLigneDescription = (index) =>
    setPlanForm((p) => {
      const restantes = p.description.filter((_, i) => i !== index);
      // On garde toujours une ligne à l'écran : un formulaire sans aucun
      // champ ne laisserait plus aucun moyen d'en ajouter un.
      return { ...p, description: restantes.length ? restantes : [""] };
    });

  // Le serveur refuse la suppression d'une formule qui a des clients derrière
  // elle, et son message dit lesquels et combien. Ce refus était jusqu'ici
  // envoyé dans `console.error` et la modale se fermait quand même : l'admin
  // voyait une suppression réussie et retrouvait la formule au rechargement.
  const fermerSuppressionFormule = () => {
    setDeletePlanConfirm(null);
    setDeletePlanError("");
    setDeletePlanForcable(false);
  };

  // Deux gestes, jamais un seul : le premier clic tente la suppression sûre, et
  // n'obtient le bouton de forçage qu'après avoir lu ce que le serveur refuse
  // et pourquoi. Proposer les deux d'emblée reviendrait à faire du forçage le
  // chemin normal — et une formule vendue emporte de vraies commandes.
  const handleDeletePlan = async (planId, force = false) => {
    setDeletePlanSaving(true);
    setDeletePlanError("");
    try {
      await subscriptionsApi.deletePlan(planId, { force });
      await loadAll();
      fermerSuppressionFormule();
    } catch (err) {
      setDeletePlanError(err.message);
      setDeletePlanForcable(err.status === 409);
    }
    setDeletePlanSaving(false);
  };

  const openAddAccount = (planId) => {
    setAccountPlanId(planId);
    setEditingAccount(null);
    setAccountForm(emptyAccountForm);
    setShowAccountPassword(false);
    setShowProfilePassword(false);
    setShowAccountModal(true);
  };
  const openEditAccount = (planId, account) => {
    setAccountPlanId(planId);
    setEditingAccount(account);
    setAccountForm({
      email: account.email,
      password: account.password,
      profile: account.profile,
      profilePassword: account.profilePassword || "",
    });
    setShowAccountPassword(false);
    setShowProfilePassword(false);
    setShowAccountModal(true);
  };

  const handleSaveAccount = async () => {
    if (!accountForm.email || !accountForm.password || !accountForm.profile)
      return;
    try {
      if (editingAccount)
        await subscriptionsApi.updateFamilyAccount(
          editingAccount.id,
          accountForm,
        );
      else await subscriptionsApi.addFamilyAccount(accountPlanId, accountForm);
      await loadAll();
      setSavedPlan(true);
      setTimeout(() => {
        setSavedPlan(false);
        setShowAccountModal(false);
      }, 900);
    } catch (err) {
      console.error("Erreur saveAccount", err.message);
    }
  };

  const fermerSuppressionCompte = () => {
    setDeleteAccountConfirm(null);
    setDeleteAccountError("");
    setDeleteAccountForcable(false);
  };

  // Troisieme modale du fichier a avoir avale le refus du serveur dans
  // `console.error` en se fermant quand meme. Le serveur refuse desormais une
  // suppression qui laisserait de l'historique derriere elle, et son message
  // dit ce qui bloque : le cacher rendrait ce refus indechiffrable.
  const handleDeleteAccount = async (accountId, force = false) => {
    setDeleteAccountSaving(true);
    setDeleteAccountError("");
    try {
      await subscriptionsApi.deleteFamilyAccount(accountId, { force });
      await loadAll();
      fermerSuppressionCompte();
    } catch (err) {
      setDeleteAccountError(err.message);
      setDeleteAccountForcable(err.status === 409);
    }
    setDeleteAccountSaving(false);
  };

  const handleChangeAccountStatus = async (accountId, newStatus) => {
    try {
      await subscriptionsApi.updateFamilyAccount(accountId, {
        status: newStatus,
      });
      await loadAll();
    } catch (err) {
      console.error("Erreur changeAccountStatus", err.message);
    }
  };

  // Rattache un profil à l'acheteur qui l'utilise, ou le libère si la valeur
  // choisie est vide. Le serveur refuse une commande déjà posée sur un autre
  // profil : son message est affiché sous la ligne concernée, sinon l'admin
  // croirait son choix enregistré.
  const handleAssignAccountClient = async (accountId, orderId) => {
    setAccountClientSaving(accountId);
    setAccountClientErrors((p) => ({ ...p, [accountId]: null }));
    try {
      await subscriptionsApi.setFamilyAccountClient(accountId, orderId || null);
      await loadAll();
    } catch (err) {
      setAccountClientErrors((p) => ({ ...p, [accountId]: err.message }));
    }
    setAccountClientSaving(null);
  };


  const handleAddPoolLink = async (planId) => {
    const brouillon = (poolLinkDrafts[planId] || "").trim();
    if (!brouillon) return;
    setPoolLinkEnCours((p) => ({ ...p, [planId]: true }));
    setPoolLinkErreurs((p) => ({ ...p, [planId]: null }));
    try {
      await subscriptionsApi.addPoolLink(planId, brouillon);
      await loadAll();
      setPoolLinkDrafts((p) => ({ ...p, [planId]: "" }));
    } catch (err) {
      // Ne jamais laisser croire à un ajout qui n'a pas eu lieu.
      setPoolLinkErreurs((p) => ({ ...p, [planId]: err.message || "Ajout impossible" }));
    }
    setPoolLinkEnCours((p) => ({ ...p, [planId]: false }));
  };

  const handleDeletePoolLink = async (planId, linkId) => {
    setPoolLinkEnCours((p) => ({ ...p, [planId]: true }));
    setPoolLinkErreurs((p) => ({ ...p, [planId]: null }));
    try {
      await subscriptionsApi.deletePoolLink(linkId);
      await loadAll();
    } catch (err) {
      setPoolLinkErreurs((p) => ({ ...p, [planId]: err.message || "Suppression impossible" }));
    }
    setPoolLinkEnCours((p) => ({ ...p, [planId]: false }));
    setDeletePoolLinkConfirm(null);
  };

  const openAddLinkClient = (planId) => {
    setNewClientForm({ name: "", whatsapp: "", email: "", planId });
    setShowAddClientModal(true);
  };

  const handleSaveLinkClient = async () => {
    if (
      !newClientForm.name ||
      (!newClientForm.whatsapp && !newClientForm.email)
    )
      return;
    try {
      await subscriptionsApi.addLinkClient(newClientForm.planId, {
        name: newClientForm.name,
        whatsapp: newClientForm.whatsapp,
        email: newClientForm.email,
      });
      await loadAll();
    } catch (err) {
      console.error("Erreur saveLinkClient", err.message);
    }
    setShowAddClientModal(false);
    setNewClientForm({ name: "", whatsapp: "", email: "", planId: null });
  };

  const openEditLink = (planId, client) => {
    setEditingClient(client);
    setClientLink(client.link || "");
    setShowLinkModal(true);
  };

  const handleSaveLink = async () => {
    try {
      await subscriptionsApi.sendLink(editingClient.id, clientLink);
      await loadAll();
      setLinkSaved(true);
      setTimeout(() => {
        setLinkSaved(false);
        setShowLinkModal(false);
      }, 900);
    } catch (err) {
      console.error("Erreur saveLink", err.message);
    }
  };

  const handleAddService = async () => {
    if (!serviceForm.name) return;
    try {
      await subscriptionsApi.createService({
        slug: generateSlug(serviceForm.name),
        name: serviceForm.name,
        tagline: serviceForm.tagline || "",
        category: serviceForm.category,
        available: true,
      });
      await loadAll();
      setSavedService(true);
      setTimeout(() => {
        setSavedService(false);
        setShowServiceModal(false);
        setServiceForm(emptyServiceForm);
      }, 1000);
    } catch (err) {
      console.error("Erreur addService", err.message);
    }
  };

  const fermerDesactivationService = () => {
    setDeleteServiceConfirm(null);
    setDeleteServiceError("");
  };

  // Meme defaut que la suppression d'une formule : le refus partait dans
  // `console.error`, la modale se fermait, et le service etait desselectionne
  // — l'admin croyait l'action reussie sans qu'aucun ecran ne le contredise.
  const handleDeleteService = async (serviceId, slug) => {
    setDeleteServiceSaving(true);
    setDeleteServiceError("");
    try {
      await subscriptionsApi.deleteService(serviceId);
      await loadAll();
      if (selected?.id === serviceId) setSelected(null);
      setDeleteServiceConfirm(null);
    } catch (err) {
      setDeleteServiceError(err.message);
    }
    setDeleteServiceSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Abonnements
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            {loading
              ? "Chargement..."
              : viewMode === "services"
                ? `${services.length} services · ${stats.active} actifs`
                : `${orders.length} commandes · ${ordersMissingExpiry} sans date d'expiration`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-1.5 text-[12px] text-apple-mid hover:text-apple-black transition px-3 py-2.5 rounded-xl bg-black/[0.03] border border-black/[0.06] disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Actualiser
          </button>
          {viewMode === "services" && (
            <button
              onClick={() => setShowServiceModal(true)}
              className="flex items-center gap-2 bg-apple-black hover:bg-neutral-800 text-white font-semibold px-4 py-2.5 rounded-2xl transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Ajouter un service
            </button>
          )}
        </div>
      </div>

      {/* Bascule Services / Commandes */}
      <div className="flex gap-1">
        {[
          { key: "services", label: "Services", Icon: Layers },
          { key: "commandes", label: "Commandes", Icon: ShoppingBag },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${viewMode === tab.key ? "bg-apple-black text-white" : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"}`}
          >
            <tab.Icon className="w-3.5 h-3.5" /> {tab.label}
            {tab.key === "commandes" && ordersMissingExpiry > 0 && (
              <span className="ml-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-cta text-white text-[10px] font-bold">
                {ordersMissingExpiry}
              </span>
            )}
          </button>
        ))}
      </div>

      {viewMode === "services" && (
      <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Services actifs",
            value: stats.active,
            Icon: Check,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Maintenance",
            value: stats.maintenance,
            Icon: Wrench,
            color: "text-orange-500",
            bg: "bg-orange-50",
          },
          {
            label: "Bientôt dispo",
            value: stats.comingSoon,
            Icon: Clock,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Places Famille",
            value: stats.familyDispo,
            Icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Places Link dispo",
            value: stats.linkDispo,
            Icon: LinkIcon,
            color: "text-cyan-600",
            bg: "bg-cyan-50",
          },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="glass-card rounded-3xl p-5">
            <div
              className={`w-9 h-9 ${bg} rounded-2xl flex items-center justify-center mb-3`}
            >
              <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.8} />
            </div>
            <p className="font-display font-black text-xl text-apple-black">
              {value}
            </p>
            <p className="text-apple-mid text-[12px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="glass-card rounded-3xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid"
            strokeWidth={1.8}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un service..."
            className="w-full bg-black/[0.03] rounded-2xl pl-10 pr-4 py-2.5 text-[13px] border border-black/[0.06] focus:outline-none focus:border-black/15 transition"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-black/[0.03] border border-black/[0.06] rounded-2xl px-4 py-2.5 pr-9 text-[13px] focus:outline-none text-apple-black"
          >
            <option value="tous">Tous</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid pointer-events-none" />
        </div>
      </div>

      {/* Grille services */}
      {loading && services.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-black/20 border-t-black/70 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-apple-mid text-[13px]">
            Chargement des services...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((service) => {
            const Icon = serviceIcons[service.slug] || Globe;
            const dispo = getServiceDispo(service);
            const ssc =
              serviceStatusConfig[service.serviceStatus] ||
              serviceStatusConfig.active;
            const StatusIcon = ssc.icon;
            return (
              <div
                key={service.slug}
                onClick={() => {
                  setSelected(service);
                  setActiveTab("formules");
                }}
                className={`glass-card rounded-3xl p-5 cursor-pointer hover:scale-[1.02] transition-all relative ${!service.active ? "opacity-50" : ""}`}
              >
                {dispo.isFull && service.active && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cta animate-pulse" />
                )}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: service.color + "22" }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: service.color }}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${ssc.bg} ${ssc.color}`}
                    >
                      <StatusIcon className="w-2.5 h-2.5" /> {ssc.label}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${service.category === "family" ? "bg-purple-50 text-purple-600" : "bg-cyan-50 text-cyan-600"}`}
                    >
                      {service.category === "family"
                        ? "Famille"
                        : "Link Access"}
                    </span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-apple-black text-[14px] mb-0.5">
                  {service.name}
                </h3>
                <p className="text-apple-mid text-[12px] mb-2">
                  {service.plans.length} formule
                  {service.plans.length > 1 ? "s" : ""}
                  {service.plans.length === 0 && (
                    <span className="text-cta ml-1">— Aucune</span>
                  )}
                </p>
                <div className="mb-3">
                  {dispo.total > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-apple-mid">Places</span>
                        <span
                          className={`font-semibold ${dispo.isFull ? "text-cta" : dispo.dispo <= 2 ? "text-orange-500" : "text-apple-black"}`}
                        >
                          {dispo.dispo} dispo / {dispo.total}
                          {dispo.isFull && " — Complet"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${dispo.isFull ? "bg-cta" : dispo.dispo <= 2 ? "bg-orange-400" : "bg-apple-black"}`}
                          style={{
                            width: `${Math.min(((dispo.total - dispo.dispo) / dispo.total) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-apple-mid/50">
                      Aucune place configurée
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 pt-4 border-t border-black/[0.05]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleService(service);
                    }}
                    className="flex-1 flex items-center justify-center py-2 rounded-xl text-[11px] font-medium transition-all hover:bg-black/[0.04]"
                  >
                    {service.active ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Désactiver
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Activer
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteServiceConfirm({
                        id: service.id,
                        slug: service.slug,
                      });
                    }}
                    title="Désactiver ce service"
                    className="p-2 rounded-xl hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {viewMode === "commandes" && (
      <>
      {/* Recherche commandes */}
      <div className="glass-card rounded-3xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid"
            strokeWidth={1.8}
          />
          <input
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Rechercher un client, un numéro, un service..."
            className="w-full bg-black/[0.03] rounded-2xl pl-10 pr-4 py-2.5 text-[13px] border border-black/[0.06] focus:outline-none focus:border-black/15 transition"
          />
        </div>
      </div>

      {/* Liste des commandes d'abonnement */}
      {loading && orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-black/20 border-t-black/70 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-apple-mid text-[13px]">
            Chargement des commandes...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-black/[0.02] border border-dashed border-black/[0.10]">
          <p className="text-apple-mid text-[13px]">Aucune commande</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const osc =
              orderStatusConfig[order.status] || orderStatusConfig.PENDING;
            const currentValue = toDateInputValue(order.expiresAt);
            const draft = expiryDrafts[order.id] ?? currentValue;
            const hasDraftChange = draft !== "" && draft !== currentValue;
            const saving = expirySavingId === order.id;
            return (
              <div key={order.id} className="glass-card rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-apple-black text-[13px]">
                      {order.clientName}
                      {order.isGift && (
                        <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                          Cadeau
                        </span>
                      )}
                    </p>
                    <p className="text-apple-mid text-[11px] mt-0.5">
                      {order.service?.name || "—"}
                      {order.plan?.label ? ` · ${order.plan.label}` : ""}
                    </p>
                    <p className="text-apple-mid text-[11px] font-mono mt-0.5">
                      📱 {order.clientWhatsapp}
                      {order.clientEmail ? ` · ✉️ ${order.clientEmail}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${osc.bg} ${osc.text}`}
                    >
                      {osc.label}
                    </span>
                    <span className="font-display font-bold text-[13px] text-apple-black">
                      {formatPrice(order.amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-black/[0.05] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-shrink-0">
                    {order.plan?.aVie ? (
                      <p className="text-[12px] text-apple-black flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-apple-mid" />
                        <strong>À vie</strong>
                        <span className="text-apple-mid">— aucune échéance</span>
                      </p>
                    ) : order.expiresAt ? (
                      <p className="text-[12px] text-apple-black flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-apple-mid" />
                        Expire le{" "}
                        <strong>{formatJourBenin(order.expiresAt)}</strong>
                      </p>
                    ) : (
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                        style={{
                          background: "rgba(227,6,19,0.07)",
                          border: "1px solid rgba(227,6,19,0.15)",
                        }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-cta flex-shrink-0" />
                        <p className="text-[11px] text-cta font-semibold">
                          Date d&apos;expiration à renseigner — aucun rappel ne
                          sera envoyé
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Le reglage de date n'a rien a regler sur un abonnement a
                      vie, et le serveur le refuse desormais (409). L'afficher
                      offrirait le seul geste capable d'y mettre fin, sous
                      l'apparence d'une correction de routine. Le terme se
                      change sur la FORMULE, pas commande par commande. */}
                  {!order.plan?.aVie && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="date"
                        value={draft}
                        onChange={(e) =>
                          setExpiryDrafts((prev) => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                        className="bg-black/[0.03] rounded-xl px-3 py-2 text-[12px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                      />
                      <button
                        onClick={() => handleSaveExpiry(order)}
                        disabled={!hasDraftChange || saving}
                        className="px-3 py-2 rounded-xl bg-apple-black hover:bg-neutral-800 text-white text-[11px] font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {saving ? "..." : "Enregistrer"}
                      </button>
                      {order.expiresAt && (
                        <button
                          onClick={() => setClearExpiryConfirm(order.id)}
                          disabled={saving}
                          className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-[11px] font-semibold transition disabled:opacity-40"
                        >
                          Effacer la date
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {expiryErrors[order.id] && (
                  <p className="text-[11px] text-cta font-medium mt-2">
                    {expiryErrors[order.id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Panel détail service */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-white w-full sm:w-[600px] h-[94vh] sm:h-auto sm:max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = serviceIcons[selected.slug] || Globe;
                  const color = serviceColors[selected.slug] || "#1D1D1F";
                  return (
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: color + "22" }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="font-display font-bold text-[15px] text-apple-black">
                    {selected.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selected.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
                    >
                      {selected.active ? "Actif" : "Inactif"}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${currentCategory === "family" ? "bg-purple-50 text-purple-600" : "bg-cyan-50 text-cyan-600"}`}
                    >
                      {currentCategory === "family" ? "Famille" : "Link Access"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>

            <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
              {[
                { key: "formules", label: "Formules" },
                { key: "statut", label: "Statut" },
                { key: "media", label: "Média" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${activeTab === tab.key ? "bg-apple-black text-white" : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* TAB STATUT */}
              {activeTab === "statut" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-2xl">
                    <div>
                      <p className="font-medium text-apple-black text-sm">
                        Service visible
                      </p>
                      <p className="text-apple-mid text-xs mt-0.5">
                        Affiché sur le site public
                      </p>
                    </div>
                    <div
                      onClick={() => handleToggleService(selected)}
                      className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${selected.active ? "bg-apple-black" : "bg-apple-mid/40"}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${selected.active ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
                      Catégorie
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          value: "family",
                          label: "Abonnement Famille",
                          desc: "Comptes partagés avec profils",
                          Icon: Users,
                        },
                        {
                          value: "link_access",
                          label: "Link Access",
                          desc: "Lien d'accès envoyé au client",
                          Icon: LinkIcon,
                        },
                      ].map(({ value, label, desc, Icon: CatIcon }) => (
                        <button
                          key={value}
                          onClick={() => handleSetCategory(value)}
                          className={`flex flex-col items-start p-4 rounded-2xl text-left transition-all border-2 ${currentCategory === value ? "border-apple-black bg-black/[0.03]" : "border-transparent bg-black/[0.02] hover:bg-black/[0.04]"}`}
                        >
                          <CatIcon
                            className="w-5 h-5 mb-2 text-apple-black"
                            strokeWidth={1.6}
                          />
                          <p className="font-semibold text-apple-black text-[12px]">
                            {label}
                          </p>
                          <p className="text-apple-mid text-[10px] mt-0.5">
                            {desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transfert des codes de verification.
                      Place sous la categorie, et volontairement SEPARE d'elle :
                      c'est exactement la confusion qui a cause l'incident du
                      05/09/2026, ou le routage deduisait le comportement OTP de
                      la categorie. Un service « famille » peut n'avoir aucun
                      code a relayer. */}
                  <div>
                    <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
                      Codes de vérification
                    </p>
                    <div
                      className="flex items-center justify-between rounded-2xl px-4 py-3.5"
                      style={{
                        background: "rgba(0,0,0,0.02)",
                        border: "1px solid rgba(0,0,0,0.07)",
                      }}
                    >
                      <div className="pr-4">
                        <p className="text-[13px] font-semibold text-apple-black">
                          Transmettre les codes aux clients
                        </p>
                        <p className="text-[11px] text-apple-mid/80 mt-0.5 leading-relaxed">
                          {selected.transfertOtp
                            ? "Les codes reçus sur la boîte de ce service sont relayés au client concerné."
                            : "Aucun code n'est relayé pour ce service. À garder ainsi quand les codes reçus appartiennent à votre propre compte."}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!selected.transfertOtp}
                        aria-label="Transmettre les codes de vérification aux clients"
                        onClick={() => handleSetTransfertOtp(!selected.transfertOtp)}
                        className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer flex-shrink-0 ${selected.transfertOtp ? "bg-apple-black" : "bg-apple-mid/40"}`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${selected.transfertOtp ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
                      État du service
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(serviceStatusConfig).map(([key, cfg]) => {
                        const StatusIcon = cfg.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => handleSetStatus(key)}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[11px] font-semibold transition-all border-2 ${selected.serviceStatus === key ? "border-apple-black bg-black/[0.04]" : "border-transparent bg-black/[0.02] hover:bg-black/[0.04]"}`}
                          >
                            <StatusIcon
                              className={`w-4 h-4 ${cfg.color}`}
                              strokeWidth={1.8}
                            />
                            <span className="text-apple-black">
                              {cfg.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {[
                    { key: "maintenance", label: "Message maintenance" },
                    { key: "coming_soon", label: "Message bientôt disponible" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                        {label}
                      </label>
                      <textarea
                        value={statusMessages[key] || ""}
                        onChange={(e) =>
                          setStatusMessages((p) => ({
                            ...p,
                            [key]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition resize-none"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleSaveStatus}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[13px] transition-all ${statusSaved ? "bg-green-500 text-white" : "bg-apple-black hover:bg-neutral-800 text-white"}`}
                  >
                    {statusSaved ? (
                      <>
                        <Check className="w-4 h-4" /> Sauvegardé !
                      </>
                    ) : (
                      "Enregistrer les paramètres"
                    )}
                  </button>
                </div>
              )}

              {/* TAB MÉDIA */}
              {activeTab === "media" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {mediaTypes.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        onClick={() =>
                          setMediaForm((p) => ({ ...p, type: value }))
                        }
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[12px] font-medium transition-all ${mediaForm.type === value ? "bg-apple-black text-white" : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"}`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.6} /> {label}
                      </button>
                    ))}
                  </div>
                  {mediaForm.type !== "gradient" && (
                    <MediaUploader
                      value={mediaForm.url}
                      onChange={(url, type) =>
                        setMediaForm((p) => ({ ...p, url, type: type || p.type }))
                      }
                      folder="mtechbenin/subscriptions"
                      accept={
                        mediaForm.type === "video" ? "video/*" : "image/*"
                      }
                      label={
                        mediaForm.type === "image"
                          ? "Image du service"
                          : "Vidéo du service"
                      }
                    />
                  )}
                  <button
                    onClick={handleApplyMedia}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold transition-all ${mediaSaved ? "bg-green-500 text-white" : "bg-apple-black hover:bg-neutral-800 text-white"}`}
                  >
                    {mediaSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Appliqué !
                      </>
                    ) : (
                      "Appliquer le média"
                    )}
                  </button>
                </div>
              )}

              {/* TAB FORMULES */}
              {activeTab === "formules" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                      Formules
                    </p>
                    <button
                      onClick={openAddPlan}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-apple-black hover:text-apple-mid transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </button>
                  </div>
                  {selected.plans.length === 0 && (
                    <div className="text-center py-8 rounded-2xl bg-black/[0.02] border border-dashed border-black/[0.10]">
                      <p className="text-apple-mid text-[13px]">
                        Aucune formule
                      </p>
                      <button
                        onClick={openAddPlan}
                        className="text-apple-black text-[12px] font-semibold mt-2 hover:underline"
                      >
                        + Créer
                      </button>
                    </div>
                  )}
                  {selected.plans.map((plan) => {
                    const d = getPlanDispo(plan, currentCategory);
                    return (
                      <div
                        key={plan.id}
                        className="bg-black/[0.03] rounded-2xl p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-apple-black text-[13px]">
                              {plan.label}
                            </p>
                            <p className="font-display font-black text-[17px] text-apple-black">
                              {formatPrice(plan.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditPlan(plan)}
                              className="p-2 rounded-xl hover:bg-white transition text-apple-mid hover:text-apple-black"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletePlanConfirm(plan.id)}
                              className="p-2 rounded-xl hover:bg-white transition text-apple-mid hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* La durée ne se voyait qu'en ouvrant le formulaire.
                              Une formule à vie était donc indistinguable d'une
                              formule mensuelle dans cette liste. */}
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-lg border ${plan.aVie ? "bg-apple-black text-white border-apple-black" : "bg-white border-black/[0.06] text-apple-mid"}`}
                          >
                            {libelleDuree(plan)}
                          </span>
                          <span className="text-[11px] bg-white px-2.5 py-1 rounded-lg border border-black/[0.06]">
                            Total : <strong>{d.total}</strong>
                          </span>
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-lg border ${d.dispo === 0 && d.total > 0 ? "bg-red-50 border-red-100 text-cta" : "bg-green-50 border-green-100 text-green-600"}`}
                          >
                            Dispo : <strong>{d.dispo}</strong>
                          </span>
                          <span className="text-[11px] bg-black/[0.04] px-2.5 py-1 rounded-lg border border-black/[0.06] text-apple-mid">
                            Envoyés : <strong>{d.sent}</strong>
                          </span>
                        </div>
                        {d.isFull && (
                          <div
                            className="flex items-center gap-2 p-2.5 rounded-xl"
                            style={{
                              background: "rgba(227,6,19,0.07)",
                              border: "1px solid rgba(227,6,19,0.15)",
                            }}
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-cta flex-shrink-0" />
                            <p className="text-[11px] text-cta font-medium">
                              Tous les slots sont occupés
                            </p>
                          </div>
                        )}

                        {/* FAMILLE */}
                        {currentCategory === "family" && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                                Comptes famille
                              </p>
                              <button
                                onClick={() => openAddAccount(plan.id)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-apple-black hover:text-apple-mid transition"
                              >
                                <Plus className="w-3 h-3" /> Ajouter
                              </button>
                            </div>
                            {!plan.accounts || plan.accounts.length === 0 ? (
                              <div className="text-center py-4 rounded-xl border border-dashed border-black/[0.10]">
                                <p className="text-apple-mid text-[11px]">
                                  Aucun compte renseigné
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {plan.accounts.map((account) => {
                                  const sc =
                                    accountStatusConfig[account.status] ||
                                    accountStatusConfig.disponible;
                                  // Commandes rattachables à ce profil : celles
                                  // de la même formule et réellement payées.
                                  // Une commande en attente de paiement n'a pas
                                  // à occuper un profil.
                                  const commandesFormule = orders.filter(
                                    (o) =>
                                      o.planId === plan.id &&
                                      o.status === "CONFIRMED",
                                  );
                                  // Le client déjà rattaché doit figurer dans
                                  // la liste même si ce filtre l'exclut — une
                                  // commande remboursée, par exemple. Sinon le
                                  // sélecteur, ne trouvant pas sa valeur,
                                  // retomberait sur « aucun client » et
                                  // contredirait la ligne juste au-dessus.
                                  if (
                                    account.client &&
                                    !commandesFormule.some(
                                      (o) => o.id === account.client.id,
                                    )
                                  )
                                    commandesFormule.unshift(account.client);
                                  const enCours =
                                    accountClientSaving === account.id;
                                  const erreurClient =
                                    accountClientErrors[account.id];
                                  return (
                                    <div
                                      key={account.id}
                                      className="p-3 rounded-xl bg-white border border-black/[0.05]"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[11px] font-mono text-apple-black truncate">
                                            {account.email}
                                          </p>
                                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <p className="text-[10px] text-apple-mid">
                                              Profil :{" "}
                                              <span className="font-semibold text-apple-black">
                                                {account.profile}
                                              </span>
                                            </p>
                                            {account.profilePassword && (
                                              <p className="text-[10px] text-apple-mid flex items-center gap-1">
                                                <Lock className="w-2.5 h-2.5" />{" "}
                                                Code :{" "}
                                                <span className="font-semibold text-apple-black font-mono">
                                                  {account.profilePassword}
                                                </span>
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <select
                                            value={account.status}
                                            onChange={(e) =>
                                              handleChangeAccountStatus(
                                                account.id,
                                                e.target.value,
                                              )
                                            }
                                            className={`text-[10px] font-semibold px-2 py-1 rounded-lg appearance-none cursor-pointer border-0 focus:outline-none ${sc.bg} ${sc.text}`}
                                          >
                                            <option value="disponible">
                                              Disponible
                                            </option>
                                            <option value="réservé">
                                              Réservé
                                            </option>
                                            <option value="envoyé">
                                              Envoyé
                                            </option>
                                          </select>
                                          <button
                                            onClick={() =>
                                              openEditAccount(plan.id, account)
                                            }
                                            className="p-1.5 rounded-lg hover:bg-blue-50 transition text-apple-mid hover:text-blue-600"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </button>
                                          {account.status === "disponible" && (
                                            <button
                                              onClick={() =>
                                                setDeleteAccountConfirm(
                                                  account.id,
                                                )
                                              }
                                              className="p-1.5 rounded-lg hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Qui utilise ce profil. Sans cette
                                          ligne, le panel affichait le profil
                                          et son code mais jamais son client :
                                          il était impossible de savoir à qui
                                          appartenait « PARIS » ou « TOKYO ». */}
                                      <div className="mt-2.5 pt-2.5 border-t border-black/[0.05]">
                                        {account.client ? (
                                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                            <Users className="w-3 h-3 text-apple-mid flex-shrink-0" />
                                            <span className="text-[11px] font-semibold text-apple-black">
                                              {account.client.clientName}
                                            </span>
                                            <span className="text-[10px] font-mono text-apple-mid">
                                              {account.client.clientWhatsapp}
                                            </span>
                                            {plan.aVie ? (
                                              <span className="text-[10px] text-apple-mid">
                                                · à vie
                                              </span>
                                            ) : (
                                              account.client.expiresAt && (
                                                <span className="text-[10px] text-apple-mid">
                                                  · expire le{" "}
                                                  {formatJourBenin(
                                                    account.client.expiresAt,
                                                  )}
                                                </span>
                                              )
                                            )}
                                          </div>
                                        ) : (
                                          <p className="text-[10px] text-apple-mid mb-1.5">
                                            Aucun client rattaché
                                          </p>
                                        )}
                                        <select
                                          value={account.client?.id || ""}
                                          disabled={enCours}
                                          onChange={(e) =>
                                            handleAssignAccountClient(
                                              account.id,
                                              e.target.value,
                                            )
                                          }
                                          className="w-full text-[11px] bg-black/[0.03] rounded-lg px-2 py-1.5 border border-black/[0.07] focus:outline-none focus:border-black/20 transition disabled:opacity-40"
                                        >
                                          <option value="">
                                            — Aucun client (profil libre) —
                                          </option>
                                          {commandesFormule.map((o) => (
                                            <option key={o.id} value={o.id}>
                                              {o.clientName} ·{" "}
                                              {o.clientWhatsapp} ·{" "}
                                              {formatJourBenin(o.createdAt)}
                                            </option>
                                          ))}
                                        </select>
                                        {commandesFormule.length === 0 && (
                                          <p className="text-[10px] text-apple-mid mt-1">
                                            Aucune commande payée sur cette
                                            formule
                                          </p>
                                        )}
                                        {erreurClient && (
                                          <p className="text-[10px] text-cta font-medium mt-1">
                                            {erreurClient}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* LINK ACCESS */}
                        {currentCategory === "link_access" && (
                          <div>
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                                  Liens en réserve
                                </p>
                                <span className="text-[11px] text-apple-mid">
                                  {plan.poolLinks?.filter((l) => l.status === "disponible").length || 0} dispo
                                  {" / "}
                                  {plan.poolLinks?.length || 0}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  value={poolLinkDrafts[plan.id] || ""}
                                  onChange={(e) =>
                                    setPoolLinkDrafts((p) => ({ ...p, [plan.id]: e.target.value }))
                                  }
                                  placeholder="https://exemple.com/invitation"
                                  className="flex-1 bg-black/[0.03] rounded-xl px-4 py-2.5 text-[12px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddPoolLink(plan.id)}
                                  disabled={!(poolLinkDrafts[plan.id] || "").trim() || !!poolLinkEnCours[plan.id]}
                                  className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-apple-black text-white text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                  <Plus className="w-3 h-3" /> Ajouter
                                </button>
                              </div>

                              {poolLinkErreurs[plan.id] && (
                                <p className="flex items-center gap-1.5 text-[11px] text-red-500 mb-2">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                  {poolLinkErreurs[plan.id]}
                                </p>
                              )}

                              {!plan.poolLinks || plan.poolLinks.length === 0 ? (
                                <div className="text-center py-4 rounded-xl border border-dashed border-black/[0.10]">
                                  <p className="text-apple-mid text-[11px]">
                                    Aucun lien en réserve — les paiements resteront en attente de votre envoi
                                    manuel
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {plan.poolLinks.map((l) => {
                                    const dispo = l.status === "disponible";
                                    return (
                                      <div
                                        key={l.id}
                                        className="p-3 rounded-xl bg-white border border-black/[0.05] flex items-center justify-between gap-2"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[11px] font-mono text-apple-black truncate">
                                            {l.link}
                                          </p>
                                          <p className="text-[10px] text-apple-mid mt-0.5">
                                            {dispo ? "Disponible" : "Attribué à un client"}
                                          </p>
                                        </div>
                                        {dispo ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setDeletePoolLinkConfirm({
                                                planId: plan.id,
                                                id: l.id,
                                              })
                                            }
                                            aria-label="Supprimer ce lien"
                                            title="Supprimer ce lien"
                                            className="p-2 rounded-xl text-apple-mid hover:text-red-500 hover:bg-red-500/[0.06] transition flex-shrink-0"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        ) : (
                                          <Lock className="w-3.5 h-3.5 text-apple-mid/50 flex-shrink-0" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                                Clients ayant payé
                              </p>
                              <button
                                onClick={() => openAddLinkClient(plan.id)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-apple-black hover:text-apple-mid transition"
                              >
                                <Plus className="w-3 h-3" /> Ajouter client
                              </button>
                            </div>
                            {!plan.linkClients ||
                            plan.linkClients.length === 0 ? (
                              <div className="text-center py-4 rounded-xl border border-dashed border-black/[0.10]">
                                <p className="text-apple-mid text-[11px]">
                                  Aucun client enregistré
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {plan.linkClients.map((client) => {
                                  const lsc =
                                    linkStatusConfig[client.status] ||
                                    linkStatusConfig.en_attente;
                                  const canSend =
                                    client.link && client.link.trim() !== "";
                                  const waMsg = buildWhatsappMessage(
                                    client.name,
                                    selected.name,
                                    client.link,
                                  );
                                  return (
                                    <div
                                      key={client.id}
                                      className="p-3 rounded-xl bg-white border border-black/[0.05]"
                                    >
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[12px] font-semibold text-apple-black">
                                            {client.name}
                                          </p>
                                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            {client.whatsapp && (
                                              <p className="text-[10px] text-apple-mid font-mono">
                                                📱 {client.whatsapp}
                                              </p>
                                            )}
                                            {client.email && (
                                              <p className="text-[10px] text-apple-mid font-mono">
                                                ✉️ {client.email}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <span
                                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${lsc.bg} ${lsc.text}`}
                                        >
                                          {lsc.label}
                                        </span>
                                      </div>
                                      {client.link ? (
                                        <p className="text-[10px] font-mono text-apple-mid bg-black/[0.03] px-2.5 py-1.5 rounded-lg truncate mb-2">
                                          🔗 {client.link}
                                        </p>
                                      ) : (
                                        <p className="text-[10px] text-orange-500 mb-2">
                                          ⚠ Lien non renseigné
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() =>
                                            openEditLink(plan.id, client)
                                          }
                                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-black/[0.04] hover:bg-black/[0.07] text-apple-black transition"
                                        >
                                          <Pencil className="w-3 h-3" />{" "}
                                          {client.link
                                            ? "Modifier lien"
                                            : "Renseigner lien"}
                                        </button>
                                        {client.status === "en_attente" &&
                                          canSend &&
                                          client.whatsapp && (
                                            <a
                                              href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}?text=${waMsg}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-green-500 hover:bg-green-600 text-white transition"
                                            >
                                              <Send className="w-3 h-3" />{" "}
                                              WhatsApp
                                            </a>
                                          )}
                                        {client.status === "envoyé" && (
                                          <button
                                            onClick={() =>
                                              openEditLink(plan.id, client)
                                            }
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-black/[0.04] hover:bg-black/[0.07] text-apple-mid transition"
                                          >
                                            <RefreshCw className="w-3 h-3" />{" "}
                                            Renvoyer
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Comptes partagés : compte → profils → occupants. Un compte
                      streaming appartient au service, pas à une formule précise :
                      cette section n'est donc pas répétée dans la boucle des
                      formules ci-dessus. */}
                  {currentCategory === "family" && (
                    <AdminComptesPartages service={selected} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal nouveau service */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowServiceModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                Nouveau service
              </h2>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: "name", label: "Nom *", placeholder: "Ex: Prime Video" },
                {
                  key: "tagline",
                  label: "Tagline",
                  placeholder: "Description courte",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    {label}
                  </label>
                  <input
                    value={serviceForm[key]}
                    onChange={(e) =>
                      setServiceForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2 block">
                  Catégorie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "family", label: "Famille", Icon: Users },
                    {
                      value: "link_access",
                      label: "Link Access",
                      Icon: LinkIcon,
                    },
                  ].map(({ value, label, Icon: CatIcon }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setServiceForm((p) => ({ ...p, category: value }))
                      }
                      className={`flex items-center gap-2 p-3 rounded-2xl text-[12px] font-semibold transition-all border-2 ${serviceForm.category === value ? "border-apple-black bg-black/[0.04]" : "border-transparent bg-black/[0.02] hover:bg-black/[0.04]"}`}
                    >
                      <CatIcon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddService}
                disabled={!serviceForm.name}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all ${savedService ? "bg-green-500 text-white" : "bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"}`}
              >
                {savedService ? (
                  <>
                    <Check className="w-4 h-4" /> Créé !
                  </>
                ) : (
                  "Créer le service"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formule */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPlanModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {editingPlan ? "Modifier" : "Ajouter une formule"}
              </h2>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Label *
                </label>
                <input
                  value={planForm.label}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, label: e.target.value }))
                  }
                  placeholder="Ex: 1 mois"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Durée
                  </label>
                  {/* Le champ des mois DISPARAIT quand « à vie » est coché,
                      plutot que d'etre grise a cote. Un nombre de mois affiche
                      sur une formule sans echeance est une contradiction que
                      l'admin doit resoudre mentalement a chaque ouverture du
                      formulaire — et il n'a aucun effet. */}
                  {planForm.aVie ? (
                    <div className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] text-apple-mid">
                      Sans échéance
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      value={planForm.duration}
                      onChange={(e) =>
                        setPlanForm((p) => ({ ...p, duration: e.target.value }))
                      }
                      placeholder="1"
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                    />
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={planForm.price}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, price: e.target.value }))
                    }
                    placeholder="3500"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
              </div>

              {/* Formule sans échéance.
                  Placé SOUS le champ des mois, pas à côté : c'est lui qui
                  décide lequel des deux s'affiche, et le lire après avoir vu
                  ce qu'il remplace est plus clair que l'inverse. */}
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{
                  background: "rgba(0,0,0,0.03)",
                  border: "1px solid rgba(0,0,0,0.07)",
                }}
              >
                <div className="pr-4">
                  <p className="text-[13px] font-semibold text-apple-black">
                    Abonnement à vie
                  </p>
                  <p className="text-[11px] text-apple-mid/80 mt-0.5 leading-relaxed">
                    Le client garde son accès sans limite de temps : aucune
                    date d&apos;expiration, aucun rappel, et la formule ne
                    s&apos;achète qu&apos;en un seul exemplaire.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={planForm.aVie}
                  aria-label="Abonnement à vie"
                  onClick={() =>
                    setPlanForm((p) => ({ ...p, aVie: !p.aVie }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer flex-shrink-0 ${planForm.aVie ? "bg-apple-black" : "bg-apple-mid/40"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${planForm.aVie ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Personnes par profil
                </label>
                <p className="text-[11px] text-apple-mid/70 mb-2">
                  Combien de clients partagent un même profil. 1 = un profil par
                  client. Tous les profils de cette formule suivent cette
                  valeur : elle ne se règle plus profil par profil.
                </p>
                <input
                  type="number"
                  min="1"
                  value={planForm.capaciteProfil}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, capaciteProfil: e.target.value }))
                  }
                  placeholder="1"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Description
                </label>
                <p className="text-[11px] text-apple-mid/70 mb-2">
                  Une ligne par avantage. Chacune apparaît sous forme de puce
                  sur la fiche du service, visible par le client.
                </p>
                <div className="space-y-2">
                  {planForm.description.map((ligne, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="w-1.5 h-1.5 rounded-full bg-apple-mid/40 flex-shrink-0"
                      />
                      <input
                        value={ligne}
                        maxLength={MAX_LONGUEUR_LIGNE}
                        onChange={(e) =>
                          modifierLigneDescription(i, e.target.value)
                        }
                        placeholder="Ex : 4 écrans 4K Ultra HD"
                        className="flex-1 bg-black/[0.03] rounded-xl px-4 py-2.5 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => retirerLigneDescription(i)}
                        aria-label={`Supprimer la ligne ${i + 1}`}
                        title="Supprimer cette ligne"
                        className="p-2 rounded-xl text-apple-mid hover:text-red-500 hover:bg-red-500/[0.06] transition flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {planForm.description.length < MAX_LIGNES_DESCRIPTION ? (
                  <button
                    type="button"
                    onClick={ajouterLigneDescription}
                    className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-apple-black hover:opacity-70 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
                  </button>
                ) : (
                  <p className="mt-2 text-[11px] text-apple-mid/70">
                    {MAX_LIGNES_DESCRIPTION} lignes au maximum.
                  </p>
                )}
              </div>

              {planErreur && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {planErreur}
                </p>
              )}

              <button
                onClick={handleSavePlan}
                disabled={!planForm.label || !planForm.price}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all ${savedPlan ? "bg-green-500 text-white" : "bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"}`}
              >
                {savedPlan ? (
                  <>
                    <Check className="w-4 h-4" /> Sauvegardé !
                  </>
                ) : editingPlan ? (
                  "Modifier"
                ) : (
                  "Ajouter"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal compte famille */}
      {showAccountModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAccountModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {editingAccount ? "Modifier" : "Ajouter un compte"}
              </h2>
              <button
                onClick={() => setShowAccountModal(false)}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Email du compte *
                </label>
                <input
                  value={accountForm.email}
                  onChange={(e) =>
                    setAccountForm((p) => ({ ...p, email: e.target.value }))
                  }
                  type="email"
                  placeholder="netflixfamily@gmail.com"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showAccountPassword ? "text" : "password"}
                    value={accountForm.password}
                    onChange={(e) =>
                      setAccountForm((p) => ({
                        ...p,
                        password: e.target.value,
                      }))
                    }
                    placeholder="••••••••"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 pr-12 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountPassword(!showAccountPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-apple-mid hover:text-apple-black transition"
                  >
                    {showAccountPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-black/[0.06]" />
                <span className="text-[11px] text-apple-mid font-medium">
                  Profil attribué
                </span>
                <div className="flex-1 h-px bg-black/[0.06]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Nom du profil *
                </label>
                <input
                  value={accountForm.profile}
                  onChange={(e) =>
                    setAccountForm((p) => ({ ...p, profile: e.target.value }))
                  }
                  placeholder="Kevin, Marie..."
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Code profil{" "}
                  <span className="text-apple-mid/50 normal-case font-normal">
                    — optionnel
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showProfilePassword ? "text" : "password"}
                    value={accountForm.profilePassword}
                    onChange={(e) =>
                      setAccountForm((p) => ({
                        ...p,
                        profilePassword: e.target.value,
                      }))
                    }
                    placeholder="1234, 5678..."
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 pr-12 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePassword(!showProfilePassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-apple-mid hover:text-apple-black transition"
                  >
                    {showProfilePassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-black/[0.03] px-4 py-3">
                <p className="text-[11px] text-apple-mid">
                  Le nombre de personnes par profil se règle désormais sur la
                  <span className="font-semibold text-apple-black"> formule</span>,
                  pas ici : tous ses profils en héritent. Le régler profil par
                  profil laissait deux profils vendus sous la même formule
                  accueillir 1 et 3 personnes, sans que le client le sache.
                </p>
              </div>

              <button
                onClick={handleSaveAccount}
                disabled={
                  !accountForm.email ||
                  !accountForm.password ||
                  !accountForm.profile
                }
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all ${savedPlan ? "bg-green-500 text-white" : "bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"}`}
              >
                {savedPlan ? (
                  <>
                    <Check className="w-4 h-4" /> Sauvegardé !
                  </>
                ) : editingAccount ? (
                  "Modifier"
                ) : (
                  "Ajouter le compte"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal lien */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLinkModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                Lien d&apos;accès
              </h2>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editingClient && (
                <div className="p-3 bg-black/[0.03] rounded-2xl">
                  <p className="font-semibold text-apple-black text-[13px]">
                    {editingClient.name}
                  </p>
                  <p className="text-apple-mid text-[11px] mt-0.5">
                    {editingClient.whatsapp}
                    {editingClient.email && ` · ${editingClient.email}`}
                  </p>
                </div>
              )}
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Lien d&apos;accès
                </label>
                <input
                  value={clientLink}
                  onChange={(e) => setClientLink(e.target.value)}
                  placeholder="https://..."
                  type="url"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition font-mono"
                />
                <p className="text-[11px] text-apple-mid mt-1.5">
                  💡 Ce lien sera envoyé au client via WhatsApp.
                </p>
              </div>
              <button
                onClick={handleSaveLink}
                disabled={!clientLink}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all ${linkSaved ? "bg-green-500 text-white" : "bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"}`}
              >
                {linkSaved ? (
                  <>
                    <Check className="w-4 h-4" /> Sauvegardé !
                  </>
                ) : (
                  "Enregistrer & Envoyer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajouter client link */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddClientModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                Nouveau client
              </h2>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                {
                  key: "name",
                  label: "Nom *",
                  placeholder: "Jean Kouassi",
                  type: "text",
                },
                {
                  key: "whatsapp",
                  label: "WhatsApp",
                  placeholder: "+229 97 XX XX XX",
                  type: "text",
                },
                {
                  key: "email",
                  label: "Email",
                  placeholder: "client@gmail.com",
                  type: "email",
                },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={newClientForm[key]}
                    onChange={(e) =>
                      setNewClientForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                    className={`w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition ${key !== "name" ? "font-mono" : ""}`}
                  />
                </div>
              ))}
              <p className="text-[11px] text-apple-mid">
                💡 Au moins WhatsApp ou Email requis.
              </p>
              <button
                onClick={handleSaveLinkClient}
                disabled={
                  !newClientForm.name ||
                  (!newClientForm.whatsapp && !newClientForm.email)
                }
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Enregistrer le client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals suppression */}
      {deletePlanConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={fermerSuppressionFormule}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">
              Supprimer cette formule ?
            </h3>
            {/* L'ancien texte annonçait « Tous les comptes associés seront
                supprimés » — c'est faux, et ça l'était déjà : la suppression
                est refusée dès qu'un client a acheté cette formule, et les
                profils hérités sont détachés, pas détruits. */}
            <p className="text-apple-mid text-sm mb-6">
              Refusé si un client a déjà acheté cette formule — vous pourrez
              alors forcer. Sinon, les liens jamais distribués partent avec elle.
            </p>
            {deletePlanError && (
              <p className="text-sm text-red-500 mb-4">{deletePlanError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={fermerSuppressionFormule}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                {deletePlanError ? "Fermer" : "Annuler"}
              </button>
              <button
                onClick={() => handleDeletePlan(deletePlanConfirm)}
                disabled={deletePlanSaving || deletePlanForcable}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                {deletePlanSaving ? "Suppression…" : "Supprimer"}
              </button>
            </div>
            {/* N'apparaît qu'après un refus, et dit ce qu'il détruit avant
                d'être cliqué : une fois pressé, les commandes et les clients
                placés sous cette formule n'existent plus nulle part. */}
            {deletePlanForcable && (
              <div className="mt-4 pt-4 border-t border-black/[0.06]">
                <p className="text-[11px] text-apple-mid mb-3 leading-relaxed">
                  Forcer efface aussi les commandes, les clients placés et les
                  clients de liens de cette formule. Les paiements sont
                  conservés, les profils sont détachés. C&apos;est irréversible.
                </p>
                <button
                  onClick={() => handleDeletePlan(deletePlanConfirm, true)}
                  disabled={deletePlanSaving}
                  className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-40"
                >
                  {deletePlanSaving ? "Suppression…" : "Supprimer quand même"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteServiceConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={fermerDesactivationService}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">
              Désactiver ce service ?
            </h3>
            {/* Cette action n'a JAMAIS supprimé quoi que ce soit : la route
                pose `available: false`. Le texte annonçait pourtant « Toutes
                les données seront supprimées » — un admin pouvait donc croire
                avoir détruit ses comptes, ou croire le service parti alors
                qu'il n'était que masqué. */}
            <p className="text-apple-mid text-sm mb-6">
              Le service disparaît de la boutique. Ses formules, comptes et
              commandes sont conservés, et il peut être réactivé.
            </p>
            {deleteServiceError && (
              <p className="text-sm text-red-500 mb-4">{deleteServiceError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={fermerDesactivationService}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                {deleteServiceError ? "Fermer" : "Annuler"}
              </button>
              <button
                onClick={() =>
                  handleDeleteService(
                    deleteServiceConfirm.id,
                    deleteServiceConfirm.slug,
                  )
                }
                disabled={deleteServiceSaving}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                {deleteServiceSaving ? "Désactivation…" : "Désactiver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteAccountConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={fermerSuppressionCompte}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">
              Supprimer ce compte ?
            </h3>
            <p className="text-apple-mid text-sm mb-6">
              Refusé si ce compte a déjà hébergé quelqu&apos;un : son historique
              est ce qui permet de trancher un litige. Vous pourrez forcer.
            </p>
            {deleteAccountError && (
              <p className="text-sm text-red-500 mb-4">{deleteAccountError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={fermerSuppressionCompte}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                {deleteAccountError ? "Fermer" : "Annuler"}
              </button>
              <button
                onClick={() => handleDeleteAccount(deleteAccountConfirm)}
                disabled={deleteAccountSaving || deleteAccountForcable}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                {deleteAccountSaving ? "Suppression…" : "Supprimer"}
              </button>
            </div>
            {deleteAccountForcable && (
              <div className="mt-4 pt-4 border-t border-black/[0.06]">
                <p className="text-[11px] text-apple-mid mb-3 leading-relaxed">
                  Forcer efface l&apos;historique de ce profil : les clients qui
                  y sont passés, et leurs demandes de code. C&apos;est
                  irréversible.
                </p>
                <button
                  onClick={() => handleDeleteAccount(deleteAccountConfirm, true)}
                  disabled={deleteAccountSaving}
                  className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-40"
                >
                  {deleteAccountSaving ? "Suppression…" : "Supprimer quand même"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {deletePoolLinkConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletePoolLinkConfirm(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">
              Retirer ce lien de la réserve ?
            </h3>
            <p className="text-apple-mid text-sm mb-6">
              Cette action est irréversible. Ce lien ne sera plus attribué
              automatiquement aux prochains paiements.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePoolLinkConfirm(null)}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  handleDeletePoolLink(
                    deletePoolLinkConfirm.planId,
                    deletePoolLinkConfirm.id,
                  )
                }
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {clearExpiryConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setClearExpiryConfirm(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">
              Effacer la date d&apos;expiration ?
            </h3>
            <p className="text-apple-mid text-sm mb-6">
              Cette commande repassera à l&apos;état « à renseigner » et ne
              recevra plus de rappel tant qu&apos;une nouvelle date n&apos;aura
              pas été saisie.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setClearExpiryConfirm(null)}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => handleClearExpiry(clearExpiryConfirm)}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm"
              >
                Effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
