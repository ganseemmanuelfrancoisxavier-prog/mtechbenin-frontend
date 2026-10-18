const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Clé d'accès admin ─────────────────────────────────────────────────────────
// Priorité : variable d'env NEXT_PUBLIC_ADMIN_API_KEY (doit correspondre à
// ADMIN_API_KEY côté backend) → sinon cookie admin-token (rétrocompatibilité)
function getAdminKey() {
  if (process.env.NEXT_PUBLIC_ADMIN_API_KEY) {
    return process.env.NEXT_PUBLIC_ADMIN_API_KEY;
  }
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)admin-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Construit une query string propre (ignore les valeurs undefined/null) ─────
function buildQuery(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : "";
}

// ── Fetch centralisé avec header admin auto ───────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const adminKey = getAdminKey();
  const headers = {
    "Content-Type": "application/json",
    ...(adminKey ? { "x-admin-key": adminKey } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    // On conserve le corps de la réponse sur l'erreur (ex : `produits` renvoyé
    // par un 409) — sans ça, seul le message serait exploitable par l'appelant.
    const err = new Error(data.error || "Erreur serveur");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  // Vérifie le mot de passe contre le backend (bcrypt côté serveur)
  login: (password) =>
    apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
};

// ── Commandes ─────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data) =>
    apiFetch("/api/orders", { method: "POST", body: JSON.stringify(data) }),
  getByRef: (reference) => apiFetch(`/api/orders/${reference}`),
  // Plafond serveur : 250 max (`limit` au-delà est ramené à 250 sans erreur)
  getAll: (params = {}) => apiFetch(`/api/orders${buildQuery(params)}`),
  updateStatus: (ref, status) =>
    apiFetch(`/api/orders/${ref}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ── Coupons ───────────────────────────────────────────────────────────────────
export const couponsApi = {
  validate: (code, cartTotal) =>
    apiFetch("/api/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, cartTotal }),
    }),
  getAll: () => apiFetch("/api/coupons"),
  create: (data) =>
    apiFetch("/api/coupons", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  toggle: (id) => apiFetch(`/api/coupons/${id}/toggle`, { method: "PATCH" }),
  delete: (id) => apiFetch(`/api/coupons/${id}`, { method: "DELETE" }),
};

// ── Produits ──────────────────────────────────────────────────────────────────
export const productsApi = {
  // Plafond serveur : 500 max, recherche : 50 max
  getAll: (params = {}) => apiFetch(`/api/products${buildQuery(params)}`),
  search: (q, limit = 10) =>
    apiFetch(`/api/products/search${buildQuery({ q, limit: Math.min(limit, 50) })}`),
  getBySlug: (slug) => apiFetch(`/api/products/${slug}`),
  create: (data) =>
    apiFetch("/api/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id) => apiFetch(`/api/products/${id}`, { method: "DELETE" }),
};

// ── Variantes produit (admin) ─────────────────────────────────────────────────
export const variantsApi = {
  getAll: (productId) =>
    apiFetch(`/api/products/${productId}/variants`),
  createType: (productId, data) =>
    apiFetch(`/api/products/${productId}/variants/types`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  // Rattache une caractéristique de la bibliothèque partagée (+ valeurs
  // choisies) à un produit en une seule opération.
  attachFromLibrary: (productId, data) =>
    apiFetch(`/api/products/${productId}/variants/from-library`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateType: (productId, typeId, data) =>
    apiFetch(`/api/products/${productId}/variants/types/${typeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteType: (productId, typeId) =>
    apiFetch(`/api/products/${productId}/variants/types/${typeId}`, {
      method: "DELETE",
    }),
  createOption: (productId, typeId, data) =>
    apiFetch(`/api/products/${productId}/variants/types/${typeId}/options`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateOption: (productId, optionId, data) =>
    apiFetch(`/api/products/${productId}/variants/options/${optionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteOption: (productId, optionId) =>
    apiFetch(`/api/products/${productId}/variants/options/${optionId}`, {
      method: "DELETE",
    }),
};

// ── Catégories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: (params = {}) => apiFetch(`/api/categories${buildQuery(params)}`),
  // Endpoint admin : retourne toutes les catégories (actives + inactives)
  getAllAdmin: () => apiFetch("/api/categories/all"),
  create: (data) =>
    apiFetch("/api/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id) => apiFetch(`/api/categories/${id}`, { method: "DELETE" }),
};

// ── Avis ──────────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getBySlug: (slug) => apiFetch(`/api/reviews/${slug}`),
  getFeatured: (params = {}) => apiFetch(`/api/reviews/featured${buildQuery(params)}`),
  // Liste publique paginée et filtrable — alimente la page /avis
  getPublic: (params = {}) => apiFetch(`/api/reviews${buildQuery(params)}`),
  // Envoi d'une photo jointe à un avis. Endpoint public, mais strictement
  // bridé côté serveur (images seules, 5 Mo, débit limité par IP).
  uploadPhoto: (image) =>
    apiFetch("/api/reviews/photos", {
      method: "POST",
      body: JSON.stringify({ image }),
    }),
  getPending: () => apiFetch("/api/reviews/admin/pending"),
  getApproved: () => apiFetch("/api/reviews/admin/approved"),
  create: (data) =>
    apiFetch("/api/reviews", { method: "POST", body: JSON.stringify(data) }),
  approve: (id) =>
    apiFetch(`/api/reviews/admin/${id}/approve`, { method: "PATCH" }),
  featured: (id) =>
    apiFetch(`/api/reviews/admin/${id}/featured`, { method: "PATCH" }),
  delete: (id) => apiFetch(`/api/reviews/admin/${id}`, { method: "DELETE" }),
};

// ── Hero ──────────────────────────────────────────────────────────────────────
export const heroApi = {
  getActive: () => apiFetch("/api/hero"),
  getAll: () => apiFetch("/api/hero/all"),
  create: (data) =>
    apiFetch("/api/hero", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/hero/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  toggle: (id) => apiFetch(`/api/hero/${id}/toggle`, { method: "PATCH" }),
  delete: (id) => apiFetch(`/api/hero/${id}`, { method: "DELETE" }),
};

// ── Publicité ─────────────────────────────────────────────────────────────────
export const adsApi = {
  getActive: () => apiFetch("/api/ads"),
  getAll: () => apiFetch("/api/ads/all"),
  create: (data) =>
    apiFetch("/api/ads", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/ads/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  toggle: (id) => apiFetch(`/api/ads/${id}/toggle`, { method: "PATCH" }),
  delete: (id) => apiFetch(`/api/ads/${id}`, { method: "DELETE" }),
};

// ── Clients satisfaits ────────────────────────────────────────────────────────
export const clientMediaApi = {
  getActive: () => apiFetch("/api/client-media"),
  getAll: () => apiFetch("/api/client-media/all"),
  create: (data) =>
    apiFetch("/api/client-media", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/api/client-media/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  toggle: (id) =>
    apiFetch(`/api/client-media/${id}/toggle`, { method: "PATCH" }),
  delete: (id) =>
    apiFetch(`/api/client-media/${id}`, { method: "DELETE" }),
};

// ── Clients ───────────────────────────────────────────────────────────────────
export const clientsApi = {
  getAll: (params = {}) => apiFetch(`/api/clients${buildQuery(params)}`),
  getByPhone: (whatsapp) =>
    apiFetch(`/api/clients/${encodeURIComponent(whatsapp)}`),
};

// ── Abonnements ───────────────────────────────────────────────────────────────
// Suffixe de suppression forcée.
//
// Le serveur refuse par défaut toute suppression qui laisserait de l'historique
// client derrière elle ; `?force=1` lève ce refus et détruit cet historique.
// Un drapeau plutôt qu'une route séparée : les deux chemins doivent rester la
// même suppression, sans quoi ils divergeraient à la première correction.
const suffixeForce = (force) => (force ? "?force=1" : "");

export const subscriptionsApi = {
  getAll: () => apiFetch("/api/subscriptions"),
  createOrder: (data) =>
    apiFetch("/api/subscriptions/order", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAdminDashboard: () => apiFetch("/api/subscriptions/admin/dashboard"),
  getAdminOrders: (params = {}) =>
    apiFetch(`/api/subscriptions/admin/orders${buildQuery(params)}`),
  createService: (data) =>
    apiFetch("/api/subscriptions/admin/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateService: (id, data) =>
    apiFetch(`/api/subscriptions/admin/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteService: (id) =>
    apiFetch(`/api/subscriptions/admin/services/${id}`, { method: "DELETE" }),
  createPlan: (svcId, data) =>
    apiFetch(`/api/subscriptions/admin/services/${svcId}/plans`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePlan: (id, data) =>
    apiFetch(`/api/subscriptions/admin/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  // `force` lève le refus du serveur et emporte l'historique attaché à la
  // formule. Le panel ne l'envoie qu'après un second geste explicite de
  // l'admin, une fois le refus affiché — voir AdminAbonnements.
  deletePlan: (id, { force = false } = {}) =>
    apiFetch(`/api/subscriptions/admin/plans/${id}${suffixeForce(force)}`, {
      method: "DELETE",
    }),
  getFamilyAccounts: (planId) =>
    apiFetch(`/api/subscriptions/admin/plans/${planId}/accounts`),
  addFamilyAccount: (planId, data) =>
    apiFetch(`/api/subscriptions/admin/plans/${planId}/accounts`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateFamilyAccount: (id, data) =>
    apiFetch(`/api/subscriptions/admin/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  // Rattache un profil à l'acheteur qui l'utilise. `orderId: null` le libère.
  setFamilyAccountClient: (id, orderId) =>
    apiFetch(`/api/subscriptions/admin/accounts/${id}/client`, {
      method: "PATCH",
      body: JSON.stringify({ orderId }),
    }),
  deleteFamilyAccount: (id, { force = false } = {}) =>
    apiFetch(`/api/subscriptions/admin/accounts/${id}${suffixeForce(force)}`, {
      method: "DELETE",
    }),
  getLinkClients: (planId) =>
    apiFetch(`/api/subscriptions/admin/plans/${planId}/link-clients`),
  addLinkClient: (planId, data) =>
    apiFetch(`/api/subscriptions/admin/plans/${planId}/link-clients`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendLink: (id, link) =>
    apiFetch(`/api/subscriptions/admin/link-clients/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ link }),
    }),
  getPoolLinks: (planId) =>
    apiFetch(`/api/subscriptions/admin/plans/${planId}/pool-links`),
  addPoolLink: (planId, link) =>
    apiFetch(`/api/subscriptions/admin/plans/${planId}/pool-links`, {
      method: "POST",
      body: JSON.stringify({ link }),
    }),
  deletePoolLink: (id) =>
    apiFetch(`/api/subscriptions/admin/pool-links/${id}`, { method: "DELETE" }),
  setExpiry: (orderId, expiresAt) =>
    apiFetch(`/api/subscriptions/admin/orders/${orderId}/expiry`, {
      method: "PATCH",
      body: JSON.stringify({ expiresAt }),
    }),
};

// ── Comptes streaming, profils et occupations ────────────────────────────────
export const comptesApi = {
  list: (serviceId) => apiFetch(`/api/subscriptions/admin/services/${serviceId}/comptes`),
  create: (serviceId, data) =>
    apiFetch(`/api/subscriptions/admin/services/${serviceId}/comptes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/api/subscriptions/admin/comptes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  addProfil: (id, data) =>
    apiFetch(`/api/subscriptions/admin/comptes/${id}/profils`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProfil: (id, data) =>
    apiFetch(`/api/subscriptions/admin/profils/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  occupations: (profilId) =>
    apiFetch(`/api/subscriptions/admin/profils/${profilId}/occupations`),
  liberer: (occupationId) =>
    apiFetch(`/api/subscriptions/admin/occupations/${occupationId}/liberer`, { method: "POST" }),
  deplacer: (occupationId, profileIdCible) =>
    apiFetch(`/api/subscriptions/admin/occupations/${occupationId}/deplacer`, {
      method: "POST",
      body: JSON.stringify({ profileIdCible }),
    }),
  // Commandes payées de ce service qui n'occupent aucun profil — la liste de
  // travail pour placer les clients à la main.
  commandesLibres: (serviceId) =>
    apiFetch(`/api/subscriptions/admin/services/${serviceId}/commandes-libres`),
  placer: (profilId, data) =>
    apiFetch(`/api/subscriptions/admin/profils/${profilId}/occupations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateOccupation: (occupationId, data) =>
    apiFetch(`/api/subscriptions/admin/occupations/${occupationId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id, { force = false } = {}) =>
    apiFetch(`/api/subscriptions/admin/comptes/${id}${suffixeForce(force)}`, {
      method: "DELETE",
    }),
  removeProfil: (id, { force = false } = {}) =>
    apiFetch(`/api/subscriptions/admin/profils/${id}${suffixeForce(force)}`, {
      method: "DELETE",
    }),
  // Enregistre un client qui a reçu ses identifiants HORS du site (refonte OTP
  // du 13/10/2026) : sans cela, le bot ne le connaît pas et envoie ses codes
  // au seul client enregistré sur le compte.
  clientHorsSite: (profilId, data) =>
    apiFetch(`/api/subscriptions/admin/profils/${profilId}/clients-hors-site`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  // Journal des mails traités par le bot OTP : d'où vient chaque code, et ce
  // qui en a été fait.
  journalCodes: (limite = 150) =>
    apiFetch(`/api/subscriptions/admin/otp/journal?limite=${limite}`),
  // Renvoie les identifiants au client qui occupe ce profil. Le seul chemin
  // d'envoi était jusqu'ici le paiement lui-même.
  envoyerIdentifiants: (occupationId) =>
    apiFetch(`/api/subscriptions/admin/occupations/${occupationId}/envoyer-identifiants`, {
      method: "POST",
    }),
};

// ── Paramètres ────────────────────────────────────────────────────────────────
export const settingsApi = {
  getPublic: () => apiFetch("/api/settings/public"),
  getAll: () => apiFetch("/api/settings"),
  update: (data) =>
    apiFetch("/api/settings", { method: "POST", body: JSON.stringify(data) }),
};

// ── FAQ ───────────────────────────────────────────────────────────────────────
export const faqApi = {
  getPublished: () => apiFetch("/api/faq"),
  getAll: () => apiFetch("/api/faq/admin"),
  create: (data) =>
    apiFetch("/api/faq/admin", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/faq/admin/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/api/faq/admin/${id}`, { method: "DELETE" }),
  reorder: (ids) =>
    apiFetch("/api/faq/admin/reorder", { method: "POST", body: JSON.stringify({ ids }) }),
};

// ── Pages légales ─────────────────────────────────────────────────────────────
export const legalApi = {
  getPage: (slug) => apiFetch(`/api/legal/${slug}`),
  getAll: () => apiFetch("/api/legal/admin"),
  upsert: (slug, data) =>
    apiFetch(`/api/legal/admin/${slug}`, { method: "PUT", body: JSON.stringify(data) }),
};

// ── Messages de contact ───────────────────────────────────────────────────────
export const contactsApi = {
  create: (data) =>
    apiFetch("/api/contacts", { method: "POST", body: JSON.stringify(data) }),
  getAll: (params = {}) => apiFetch(`/api/contacts/admin${buildQuery(params)}`),
  updateStatus: (id, status) =>
    apiFetch(`/api/contacts/admin/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/api/contacts/admin/${id}`, { method: "DELETE" }),
};

// ── Upload Cloudinary ─────────────────────────────────────────────────────────
export const uploadApi = {
  upload: (base64, folder = "mtechbenin/products") =>
    apiFetch("/api/upload", {
      method: "POST",
      body: JSON.stringify({ image: base64, folder }),
    }),
  delete: (publicId, resourceType = "image") =>
    apiFetch("/api/upload", {
      method: "DELETE",
      body: JSON.stringify({ publicId, resourceType }),
    }),
};

// ── Caractéristiques produit ──────────────────────────────────────────────────
export const characteristicsApi = {
  getAll: () => apiFetch("/api/characteristics"),
  create: (data) =>
    apiFetch("/api/characteristics", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/characteristics/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id) => apiFetch(`/api/characteristics/${id}`, { method: "DELETE" }),
  addValue: (id, data) =>
    apiFetch(`/api/characteristics/${id}/values`, { method: "POST", body: JSON.stringify(data) }),
  updateValue: (valueId, data) =>
    apiFetch(`/api/characteristics/values/${valueId}`, { method: "PATCH", body: JSON.stringify(data) }),
  removeValue: (valueId) =>
    apiFetch(`/api/characteristics/values/${valueId}`, { method: "DELETE" }),
};

// ── Demande de code de vérification (public) ─────────────────────────────────
export const demandeCodeApi = {
  demander: (whatsapp) =>
    apiFetch("/api/subscriptions/demande-code", {
      method: "POST",
      body: JSON.stringify({ whatsapp }),
    }),
};

// ── Journal des demandes de code (admin) ─────────────────────────────────────
export const demandesApi = {
  list: (limit = 100) =>
    apiFetch(`/api/subscriptions/admin/demandes${buildQuery({ limit })}`),
};

// ── Agrégats d'administration ─────────────────────────────────────────────────
// Compter dans Postgres au lieu de rapatrier pour compter ici. Le tableau de
// bord téléchargeait 141 Ko toutes les 30 s, les badges 73 Ko toutes les 2 min,
// uniquement pour en tirer des totaux — de quoi épuiser à lui seul le quota
// Supabase (13 Go par mois pour un onglet laissé ouvert, quota : 5 Go).
export const statsApi = {
  dashboard: () => apiFetch("/api/stats/dashboard"),
  badges: () => apiFetch("/api/stats/badges"),
};

export default apiFetch;

// ── Réparation d'appareils ────────────────────────────────────────────────────
//
// Le catalogue est hiérarchique : espace (figé) → famille → modèle →
// réparation → option de qualité, qui seule porte le prix.
//
// Aucune fonction d'écriture n'envoie de montant : le serveur recalcule le
// total à partir des seuls identifiants d'options, et ignore en silence tout
// champ de prix qui traînerait dans le corps. Ne cherchez pas à « optimiser »
// en envoyant le total affiché — il serait ignoré, et le jour où il ne le
// serait plus, le prix se choisirait depuis la console du navigateur.
export const reparationApi = {
  // Public — catalogue
  familles: (espace) =>
    apiFetch(`/api/repairs/familles?espace=${encodeURIComponent(espace)}`),
  modelesDeFamille: (slug) =>
    apiFetch(`/api/repairs/familles/${encodeURIComponent(slug)}/modeles`),
  modele: (slug) => apiFetch(`/api/repairs/modeles/${encodeURIComponent(slug)}`),
  recherche: (espace, q) =>
    apiFetch(
      `/api/repairs/recherche?espace=${encodeURIComponent(espace)}&q=${encodeURIComponent(q)}`,
    ),

  // Public — écriture
  devisWhatsapp: (data) =>
    apiFetch("/api/repairs/devis/whatsapp", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  creerCommande: (data) =>
    apiFetch("/api/repairs/commandes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  creerDiagnostic: (data) =>
    apiFetch("/api/repairs/diagnostics", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  suivi: (reference) =>
    apiFetch(`/api/repairs/suivi/${encodeURIComponent(reference)}`),
};

// Administration du catalogue et des demandes de réparation.
export const reparationAdminApi = {
  catalogue: (espace) =>
    apiFetch(`/api/repairs/admin/catalogue?espace=${encodeURIComponent(espace)}`),

  creerFamille: (data) =>
    apiFetch("/api/repairs/admin/familles", { method: "POST", body: JSON.stringify(data) }),
  modifierFamille: (id, data) =>
    apiFetch(`/api/repairs/admin/familles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  supprimerFamille: (id) =>
    apiFetch(`/api/repairs/admin/familles/${id}`, { method: "DELETE" }),

  creerModele: (data) =>
    apiFetch("/api/repairs/admin/modeles", { method: "POST", body: JSON.stringify(data) }),
  modifierModele: (id, data) =>
    apiFetch(`/api/repairs/admin/modeles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  supprimerModele: (id) =>
    apiFetch(`/api/repairs/admin/modeles/${id}`, { method: "DELETE" }),

  creerReparation: (data) =>
    apiFetch("/api/repairs/admin/reparations", { method: "POST", body: JSON.stringify(data) }),
  modifierReparation: (id, data) =>
    apiFetch(`/api/repairs/admin/reparations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  supprimerReparation: (id) =>
    apiFetch(`/api/repairs/admin/reparations/${id}`, { method: "DELETE" }),
  // Copie une réparation et ses options vers d'autres modèles. C'est une COPIE :
  // chaque modèle garde ensuite sa ligne, modifiable seule.
  dupliquerReparation: (id, modelIds) =>
    apiFetch(`/api/repairs/admin/reparations/${id}/dupliquer`, {
      method: "POST",
      body: JSON.stringify({ modelIds }),
    }),

  creerOption: (data) =>
    apiFetch("/api/repairs/admin/options", { method: "POST", body: JSON.stringify(data) }),
  modifierOption: (id, data) =>
    apiFetch(`/api/repairs/admin/options/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  supprimerOption: (id) =>
    apiFetch(`/api/repairs/admin/options/${id}`, { method: "DELETE" }),

  // Demandes. ATTENTION : la réponse porte la liste sous la clé `demandes`,
  // pas `commandes` — malgré le nom de la route.
  demandes: (params = {}) =>
    apiFetch(`/api/repairs/admin/commandes${buildQuery(params)}`),
  changerStatut: (id, status) =>
    apiFetch(`/api/repairs/admin/commandes/${id}/statut`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  dateRetour: (id, returnDate) =>
    apiFetch(`/api/repairs/admin/commandes/${id}/date-retour`, {
      method: "PATCH",
      body: JSON.stringify({ returnDate }),
    }),
  ajouterLigne: (id, data) =>
    apiFetch(`/api/repairs/admin/commandes/${id}/lignes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  ouvrirReparation: (id) =>
    apiFetch(`/api/repairs/admin/commandes/${id}/reparation`, { method: "POST" }),
  annuler: (id, cancelledRetained) =>
    apiFetch(`/api/repairs/admin/commandes/${id}/annuler`, {
      method: "POST",
      body: JSON.stringify(cancelledRetained === undefined ? {} : { cancelledRetained }),
    }),
};
