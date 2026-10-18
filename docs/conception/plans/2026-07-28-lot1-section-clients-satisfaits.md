# Lot 1 — Section « Clients satisfaits » — Plan d'implémentation

**Objectif :** ajouter à l'accueil une section de photos/vidéos de clients
satisfaits, alimentée depuis le panel admin.

**Architecture :** nouveau modèle Prisma `ClientMedia` calqué sur `HeroMedia`,
module backend `clientMedia` suivant le patron `{name}.controller.js` +
`{name}.routes.js`, store Zustand côté front, et deux composants React — une
visionneuse plein écran réutilisable (le lot 2 s'en servira pour les photos
d'avis) et la section mosaïque elle-même.

**Stack :** Node/Express, Prisma 5, PostgreSQL (Supabase), Next.js 14 App
Router, Zustand, Tailwind, lucide-react.

## Contraintes globales

- **Aucune nouvelle dépendance npm.** Mosaïque en CSS `columns`, visionneuse en
  React pur.
- **Langage visuel imposé :** classes `glass-card`, `rounded-3xl`,
  `font-display` pour les titres, couleurs `apple-black` / `apple-mid` / `cta`,
  surtitre en `text-[11px] font-semibold uppercase tracking-widest`.
- **Migrations additives uniquement.** Jamais de `prisma db push` sur la base
  distante : elle contient les données de production (le `db push` propose de
  recréer des colonnes et détruirait des données).
- **Pas de framework de test dans ce projet.** Chaque tâche se vérifie par un
  script Node exécuté contre l'API/la base réelle, ou par un contrôle
  navigateur explicite. Ne pas introduire jest/vitest.
- **Commits en français**, préfixés `feat:` / `fix:` / `docs:`.
- **Textes visibles en français**, ton du site (vouvoiement, sobre).

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `mtechbenin-backend/prisma/schema.prisma` | Modèle `ClientMedia` |
| `mtechbenin-backend/prisma/migrations/20260728120000_add_client_media/migration.sql` | Création de la table |
| `mtechbenin-backend/src/modules/clientMedia/clientMedia.controller.js` | Logique CRUD |
| `mtechbenin-backend/src/modules/clientMedia/clientMedia.routes.js` | Routage + protection admin |
| `mtechbenin-backend/src/app.js` | Montage de la route |
| `mtechbenin-frontend/src/lib/api.js` | `clientMediaApi` |
| `mtechbenin-frontend/src/store/clientMediaStore.js` | État + chargement |
| `mtechbenin-frontend/src/components/shop/MediaLightbox.js` | Visionneuse plein écran **réutilisable** |
| `mtechbenin-frontend/src/components/shop/ClientGallery.js` | Section mosaïque de l'accueil |
| `mtechbenin-frontend/src/app/page.js` | Montage de la section |
| `mtechbenin-frontend/src/components/admin/AdminClientMedia.js` | Écran d'administration |
| `mtechbenin-frontend/src/app/admin/clients-satisfaits/page.js` | Route admin |
| `mtechbenin-frontend/src/components/layout/AdminLayout.js` | Entrée de navigation |

---

### Tâche 1 : Modèle `ClientMedia` et migration

**Fichiers :**
- Modifier : `mtechbenin-backend/prisma/schema.prisma`
- Créer : `mtechbenin-backend/prisma/migrations/20260728120000_add_client_media/migration.sql`

**Interfaces :**
- Produit : table `ClientMedia` avec les colonnes `id`, `type`, `url`,
  `caption`, `active`, `order`, `createdAt`. Les tâches 2 à 6 s'y appuient.

- [ ] **Étape 1 : Ajouter le modèle au schéma**

Dans `schema.prisma`, juste après le modèle `HeroMedia` (vers la ligne 355) :

```prisma
// ── Photos / vidéos de clients satisfaits (accueil) ───────────────────────────
model ClientMedia {
  id        String   @id @default(cuid())
  type      String   @default("image") // "image" | "video"
  url       String
  caption   String?
  active    Boolean  @default(true)
  order     Int      @default(0)
  createdAt DateTime @default(now())

  @@index([active, order])
}
```

- [ ] **Étape 2 : Écrire la migration**

Créer `prisma/migrations/20260728120000_add_client_media/migration.sql` :

```sql
-- CreateTable
CREATE TABLE "ClientMedia" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientMedia_active_order_idx" ON "ClientMedia"("active", "order");
```

- [ ] **Étape 3 : Appliquer et régénérer**

```bash
cd mtechbenin-backend
npx prisma migrate deploy
npx prisma generate
```

Attendu : `The following migration(s) have been applied` puis
`Generated Prisma Client`.

- [ ] **Étape 4 : Vérifier que la table existe et est vide**

```bash
cd mtechbenin-backend
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient({log:[]});
(async()=>{
  console.log('ClientMedia count =', await p.clientMedia.count());
  const idx = await p.\$queryRawUnsafe(\"select indexname from pg_indexes where tablename='ClientMedia'\");
  console.log('index:', idx.map(i=>i.indexname).join(', '));
  await p.\$disconnect();
})();"
```

Attendu : `ClientMedia count = 0` et un index
`ClientMedia_active_order_idx`.

- [ ] **Étape 5 : Vérifier qu'aucune autre migration n'est en attente**

```bash
cd mtechbenin-backend && npx prisma migrate status
```

Attendu : `Database schema is up to date!`

- [ ] **Étape 6 : Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260728120000_add_client_media
git commit -m "feat: modele ClientMedia pour la section clients satisfaits"
```

---

### Tâche 2 : API backend

**Fichiers :**
- Créer : `mtechbenin-backend/src/modules/clientMedia/clientMedia.controller.js`
- Créer : `mtechbenin-backend/src/modules/clientMedia/clientMedia.routes.js`
- Modifier : `mtechbenin-backend/src/app.js`

**Interfaces :**
- Consomme : la table `ClientMedia` de la tâche 1.
- Produit : les routes ci-dessous, consommées par la tâche 3.
  `GET /api/client-media` → `{ medias: ClientMedia[] }` (actifs, triés)
  `GET /api/client-media/all` → `{ medias }` (admin, tous)
  `POST /api/client-media` → `{ media }`
  `PATCH /api/client-media/:id` → `{ media }`
  `PATCH /api/client-media/:id/toggle` → `{ media }`
  `DELETE /api/client-media/:id` → `{ message }`

- [ ] **Étape 1 : Écrire le contrôleur**

Créer `src/modules/clientMedia/clientMedia.controller.js` :

```js
const prisma = require("../../services/prisma");
const logger = require("../../utils/logger");

const ALLOWED_TYPES = ["image", "video"];

// Ne retient que les champs attendus : le corps de requête ne doit jamais
// pouvoir écrire une colonne arbitraire (id, createdAt…).
function sanitize(body = {}) {
  const data = {};
  if (body.url !== undefined) data.url = String(body.url).trim();
  if (body.caption !== undefined) {
    const c = String(body.caption).trim();
    data.caption = c.length ? c.slice(0, 140) : null;
  }
  if (body.type !== undefined) {
    data.type = ALLOWED_TYPES.includes(body.type) ? body.type : "image";
  }
  if (body.active !== undefined) data.active = !!body.active;
  if (body.order !== undefined && Number.isFinite(Number(body.order))) {
    data.order = Number(body.order);
  }
  return data;
}

async function getActiveClientMedia(req, res) {
  try {
    const medias = await prisma.clientMedia.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
    return res.json({ medias });
  } catch (err) {
    logger.error("Erreur getActiveClientMedia", { err: err.message });
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

async function getAllClientMedia(req, res) {
  try {
    const medias = await prisma.clientMedia.findMany({
      orderBy: { order: "asc" },
    });
    return res.json({ medias });
  } catch (err) {
    logger.error("Erreur getAllClientMedia", { err: err.message });
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

async function createClientMedia(req, res) {
  try {
    const data = sanitize(req.body);
    if (!data.url) return res.status(400).json({ error: "Média requis" });

    // Placé en fin de liste par défaut.
    const count = await prisma.clientMedia.count();
    const media = await prisma.clientMedia.create({
      data: { ...data, order: data.order ?? count + 1 },
    });
    return res.status(201).json({ media });
  } catch (err) {
    logger.error("Erreur createClientMedia", { err: err.message });
    return res.status(400).json({ error: err.message });
  }
}

async function updateClientMedia(req, res) {
  try {
    const media = await prisma.clientMedia.update({
      where: { id: req.params.id },
      data: sanitize(req.body),
    });
    return res.json({ media });
  } catch (err) {
    logger.error("Erreur updateClientMedia", { err: err.message });
    return res.status(400).json({ error: err.message });
  }
}

async function toggleClientMedia(req, res) {
  try {
    const existing = await prisma.clientMedia.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Média introuvable" });
    const media = await prisma.clientMedia.update({
      where: { id: req.params.id },
      data: { active: !existing.active },
    });
    return res.json({ media });
  } catch (err) {
    logger.error("Erreur toggleClientMedia", { err: err.message });
    return res.status(400).json({ error: err.message });
  }
}

async function deleteClientMedia(req, res) {
  try {
    await prisma.clientMedia.delete({ where: { id: req.params.id } });
    return res.json({ message: "Média supprimé" });
  } catch (err) {
    logger.error("Erreur deleteClientMedia", { err: err.message });
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getActiveClientMedia,
  getAllClientMedia,
  createClientMedia,
  updateClientMedia,
  toggleClientMedia,
  deleteClientMedia,
};
```

- [ ] **Étape 2 : Écrire les routes**

Créer `src/modules/clientMedia/clientMedia.routes.js` :

```js
const express = require("express");
const router = express.Router();
const {
  getActiveClientMedia,
  getAllClientMedia,
  createClientMedia,
  updateClientMedia,
  toggleClientMedia,
  deleteClientMedia,
} = require("./clientMedia.controller");
const { isAdmin } = require("../../middleware/auth");

// "/all" doit précéder toute route paramétrée pour ne pas être capturé.
router.get("/", getActiveClientMedia);
router.get("/all", isAdmin, getAllClientMedia);
router.post("/", isAdmin, createClientMedia);
router.patch("/:id", isAdmin, updateClientMedia);
router.patch("/:id/toggle", isAdmin, toggleClientMedia);
router.delete("/:id", isAdmin, deleteClientMedia);

module.exports = router;
```

- [ ] **Étape 3 : Monter la route dans `app.js`**

Dans `src/app.js`, à côté des autres `require` de routes (vers la ligne 33) :

```js
const clientMediaRoutes = require("./modules/clientMedia/clientMedia.routes");
```

Puis dans le bloc de montage, après `app.use("/api/hero", heroRoutes);` :

```js
app.use("/api/client-media", clientMediaRoutes);
```

- [ ] **Étape 4 : Vérifier la syntaxe**

```bash
cd mtechbenin-backend
node --check src/modules/clientMedia/clientMedia.controller.js
node --check src/modules/clientMedia/clientMedia.routes.js
node --check src/app.js
```

Attendu : aucune sortie (succès).

- [ ] **Étape 5 : Vérifier le CRUD complet contre la base réelle**

Le contrôleur est testé directement, sans démarrer le serveur (le bot WhatsApp
se lancerait inutilement). On simule `req`/`res`.

```bash
cd mtechbenin-backend
node -e "
const c = require('./src/modules/clientMedia/clientMedia.controller');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: [] });
const mkRes = () => { const r = {}; r.status=(s)=>{r._s=s;return r;}; r.json=(j)=>{r._j=j;return r;}; return r; };
(async () => {
  console.log('T_DEBUT');
  // create
  let res = mkRes();
  await c.createClientMedia({ body:{ url:'https://res.cloudinary.com/demo/image/upload/x.jpg', caption:'Fatou, Cotonou', type:'image' } }, res);
  const id = res._j.media.id;
  console.log('create -> ' + (res._s===201 ? 'OK' : 'KO') + ' order=' + res._j.media.order);

  // champ interdit ignore
  res = mkRes();
  await c.updateClientMedia({ params:{id}, body:{ caption:'Modifiee', id:'PIRATE', createdAt:'2000-01-01' } }, res);
  console.log('update -> caption=' + res._j.media.caption + ' | id inchange = ' + (res._j.media.id===id));

  // type invalide -> retombe sur image
  res = mkRes();
  await c.updateClientMedia({ params:{id}, body:{ type:'exe' } }, res);
  console.log('type invalide -> ' + res._j.media.type + (res._j.media.type==='image' ? '  OK' : '  KO'));

  // toggle
  res = mkRes(); await c.toggleClientMedia({ params:{id} }, res);
  console.log('toggle -> active=' + res._j.media.active);

  // public ne voit pas les inactifs
  res = mkRes(); await c.getActiveClientMedia({}, res);
  console.log('public voit l inactif ? ' + (res._j.medias.some(m=>m.id===id) ? 'OUI (KO)' : 'NON (OK)'));

  // admin les voit
  res = mkRes(); await c.getAllClientMedia({}, res);
  console.log('admin voit tout ? ' + (res._j.medias.some(m=>m.id===id) ? 'OUI (OK)' : 'NON (KO)'));

  // url manquante -> 400
  res = mkRes(); await c.createClientMedia({ body:{ caption:'sans media' } }, res);
  console.log('url manquante -> HTTP ' + res._s + (res._s===400 ? '  OK' : '  KO'));

  // nettoyage
  res = mkRes(); await c.deleteClientMedia({ params:{id} }, res);
  console.log('delete -> ' + res._j.message);
  console.log('reste en base : ' + await p.clientMedia.count());
  console.log('T_FIN');
  await p.\$disconnect();
})();" 2>/dev/null | sed -n '/T_DEBUT/,/T_FIN/p'
```

Attendu : `create -> OK`, l'`id` reste inchangé après tentative d'écrasement,
`type invalide -> image OK`, le public ne voit pas l'inactif, l'admin si,
`url manquante -> HTTP 400 OK`, et `reste en base : 0`.

- [ ] **Étape 6 : Commit**

```bash
git add src/modules/clientMedia src/app.js
git commit -m "feat: API clients satisfaits (CRUD + protection admin)"
```

---

### Tâche 3 : Client API et store frontend

**Fichiers :**
- Modifier : `mtechbenin-frontend/src/lib/api.js`
- Créer : `mtechbenin-frontend/src/store/clientMediaStore.js`

**Interfaces :**
- Consomme : les routes de la tâche 2.
- Produit : `clientMediaApi` (export nommé de `lib/api.js`) et le hook
  `useClientMediaStore` exposant `{ medias, loading, error, fetchMedias(force) }`,
  utilisés par les tâches 5 et 6.

- [ ] **Étape 1 : Ajouter `clientMediaApi`**

Dans `src/lib/api.js`, juste après le bloc `heroApi` (vers la ligne 178) :

```js
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
```

- [ ] **Étape 2 : Écrire le store**

Créer `src/store/clientMediaStore.js`. Volontairement **sans `persist`** :
un média retiré par l'admin doit disparaître du site au rechargement, pas
rester figé dans le `localStorage` du visiteur.

```js
import { create } from "zustand";
import { clientMediaApi } from "@/lib/api";

const useClientMediaStore = create((set, get) => ({
  medias: [],
  loading: false,
  error: null,
  _lastFetch: null,

  fetchMedias: async (force = false) => {
    const now = Date.now();
    if (!force && get()._lastFetch && now - get()._lastFetch < 5 * 60 * 1000) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const data = await clientMediaApi.getActive();
      set({
        medias: Array.isArray(data.medias) ? data.medias : [],
        _lastFetch: now,
        loading: false,
      });
    } catch (err) {
      console.error("Erreur fetchMedias", err.message);
      set({ loading: false, error: err.message || "Erreur de chargement" });
    }
  },
}));

export default useClientMediaStore;
```

- [ ] **Étape 3 : Vérifier la syntaxe**

```bash
cd mtechbenin-frontend
npx eslint src/lib/api.js src/store/clientMediaStore.js --no-eslintrc \
  --parser-options=ecmaVersion:2022,sourceType:module,ecmaFeatures:{jsx:true}
echo "EXIT:$?"
```

Attendu : `EXIT:0`.

- [ ] **Étape 4 : Commit**

```bash
git add src/lib/api.js src/store/clientMediaStore.js
git commit -m "feat: client API et store pour les medias clients"
```

---

### Tâche 4 : Visionneuse plein écran réutilisable

**Fichiers :**
- Créer : `mtechbenin-frontend/src/components/shop/MediaLightbox.js`

**Interfaces :**
- Produit : composant par défaut `MediaLightbox`, avec les props
  `{ items, index, onClose, onNavigate }` où
  `items: { type: "image"|"video", url: string, caption?: string }[]`,
  `index: number`, `onClose: () => void`, `onNavigate: (nextIndex) => void`.
  Utilisé par la tâche 5, et réutilisé tel quel par le lot 2.

- [ ] **Étape 1 : Écrire le composant**

Créer `src/components/shop/MediaLightbox.js` :

```jsx
"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function MediaLightbox({ items, index, onClose, onNavigate }) {
  const current = items?.[index];

  const goPrev = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) onNavigate(index + 1);
  }, [index, items, onNavigate]);

  // Navigation clavier + fermeture par Échap.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    // Bloque le défilement de la page pendant l'ouverture.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, goPrev, goNext]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Média agrandi"
    >
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 transition"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {index > 0 && (
        <button
          onClick={goPrev}
          aria-label="Média précédent"
          className="absolute left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {index < items.length - 1 && (
        <button
          onClick={goNext}
          aria-label="Média suivant"
          className="absolute right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 transition"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}

      <div className="relative z-[1] w-full max-w-4xl px-4">
        <div className="relative w-full" style={{ maxHeight: "80vh" }}>
          {current.type === "video" ? (
            <video
              key={current.url}
              src={current.url}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[80vh] rounded-2xl bg-black"
            />
          ) : (
            <Image
              src={current.url}
              alt={current.caption || "Client satisfait"}
              width={1200}
              height={1600}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
              sizes="(max-width: 768px) 100vw, 900px"
            />
          )}
        </div>

        {current.caption && (
          <p className="text-white/80 text-[13px] text-center mt-4">
            {current.caption}
          </p>
        )}
        {items.length > 1 && (
          <p className="text-white/40 text-[11px] text-center mt-1 font-mono">
            {index + 1} / {items.length}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Étape 2 : Vérifier la syntaxe**

```bash
cd mtechbenin-frontend
npx eslint src/components/shop/MediaLightbox.js --no-eslintrc \
  --parser-options=ecmaVersion:2022,sourceType:module,ecmaFeatures:{jsx:true}
echo "EXIT:$?"
```

Attendu : `EXIT:0`.

- [ ] **Étape 3 : Commit**

```bash
git add src/components/shop/MediaLightbox.js
git commit -m "feat: visionneuse plein ecran reutilisable (clavier + navigation)"
```

---

### Tâche 5 : Section mosaïque sur l'accueil

**Fichiers :**
- Créer : `mtechbenin-frontend/src/components/shop/ClientGallery.js`
- Modifier : `mtechbenin-frontend/src/app/page.js`

**Interfaces :**
- Consomme : `useClientMediaStore` (tâche 3), `MediaLightbox` (tâche 4).
- Produit : composant par défaut `ClientGallery`, sans props.

- [ ] **Étape 1 : Écrire la section**

Créer `src/components/shop/ClientGallery.js` :

```jsx
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Volume2, VolumeX, Play } from "lucide-react";
import useClientMediaStore from "@/store/clientMediaStore";
import MediaLightbox from "./MediaLightbox";

function VideoTile({ media, muted }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (v.paused) v.play().catch(() => {});
  }, [muted]);

  return (
    <video
      ref={videoRef}
      src={media.url}
      autoPlay
      loop
      playsInline
      muted={muted}
      className="w-full h-auto block"
    />
  );
}

export default function ClientGallery() {
  const { medias, fetchMedias } = useClientMediaStore();
  const [mounted, setMounted] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // Le son démarre coupé : les navigateurs bloquent la lecture auto sonore.
  const [soundOnId, setSoundOnId] = useState(null);

  useEffect(() => {
    setMounted(true);
    fetchMedias();
  }, []);

  // Section entièrement masquée tant qu'il n'y a rien à montrer : jamais de
  // titre orphelin au-dessus du vide.
  if (!mounted || medias.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-5 pt-8 pb-16">
      <div className="mb-10">
        <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
          En images
        </p>
        <h2 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
          Nos clients satisfaits
        </h2>
      </div>

      {/* Mosaïque : hauteurs naturelles conservées, sans dépendance externe. */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
        {medias.map((media, i) => {
          const muted = soundOnId !== media.id;
          return (
            <div
              key={media.id}
              className="group relative block w-full mb-3 break-inside-avoid overflow-hidden rounded-3xl glass-card text-left"
            >
              {media.type === "video" ? (
                <VideoTile media={media} muted={muted} />
              ) : (
                <Image
                  src={media.url}
                  alt={media.caption || "Client satisfait MTECHBENIN"}
                  width={600}
                  height={800}
                  className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}

              {/* Bouton plein cadre : ouvre la visionneuse. Frère (pas parent)
                  des contrôles ci-dessous — un <button> ne peut pas en
                  contenir un autre. */}
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                aria-label={media.caption || "Agrandir le média"}
                className="absolute inset-0 z-[5]"
              />

              {media.type === "video" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSoundOnId(muted ? media.id : null);
                  }}
                  aria-label={muted ? "Activer le son" : "Couper le son"}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition"
                  style={{
                    background: "rgba(0,0,0,0.40)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {muted ? (
                    <VolumeX className="w-3.5 h-3.5 text-white/80" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              )}

              {media.type === "video" && (
                <span className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center">
                  <Play className="w-3 h-3 text-white fill-white" />
                </span>
              )}

              {media.caption && (
                <span className="absolute inset-x-0 bottom-0 p-4 pt-10 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                  <span className="block text-white text-[12px] font-medium leading-snug">
                    {media.caption}
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <MediaLightbox
          items={medias}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}
```

- [ ] **Étape 2 : Monter la section sur l'accueil**

Remplacer entièrement `src/app/page.js` :

```jsx
import ShopLayout from "@/components/layout/ShopLayout";
import HeroSection from "@/components/shop/HeroSection";
import CategoriesSection from "@/components/shop/CategoriesSection";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import SubscriptionsSection from "@/components/shop/SubscriptionsSection";
import ClientGallery from "@/components/shop/ClientGallery";
import SocialProofSection from "@/components/shop/SocialProofSection";

export default function HomePage() {
  return (
    <ShopLayout>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <SubscriptionsSection />
      <ClientGallery />
      <SocialProofSection />
    </ShopLayout>
  );
}
```

- [ ] **Étape 3 : Autoriser le domaine Cloudinary pour `next/image`**

Vérifier que `next.config.mjs` contient déjà `res.cloudinary.com` dans
`images.remotePatterns` ou `images.domains` :

```bash
cd mtechbenin-frontend && grep -n "cloudinary" next.config.mjs
```

Si aucune ligne ne ressort, ajouter dans l'objet `images` :

```js
remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
```

- [ ] **Étape 4 : Vérifier la syntaxe**

```bash
cd mtechbenin-frontend
npx eslint src/components/shop/ClientGallery.js src/app/page.js --no-eslintrc \
  --parser-options=ecmaVersion:2022,sourceType:module,ecmaFeatures:{jsx:true}
echo "EXIT:$?"
```

Attendu : `EXIT:0`.

- [ ] **Étape 5 : Vérifier dans le navigateur**

Insérer deux médias de test, puis contrôler le rendu :

```bash
cd mtechbenin-backend
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient({log:[]});
(async()=>{
  await p.clientMedia.createMany({ data:[
    { url:'https://res.cloudinary.com/demo/image/upload/w_600/sample.jpg', caption:'Fatou · Cotonou', type:'image', order:1 },
    { url:'https://res.cloudinary.com/demo/image/upload/w_600/shoes.jpg',  caption:'', type:'image', order:2 },
  ]});
  console.log('medias de test inseres :', await p.clientMedia.count());
  await p.\$disconnect();
})();" 2>/dev/null
```

Puis `npm run dev` côté frontend et ouvrir `http://localhost:3000`.

Contrôler :
1. La section « Nos clients satisfaits » apparaît **entre** les abonnements et
   « Ils parlent de nous ».
2. La mosaïque affiche 2 colonnes à 360 px de large, 3 à 768 px, 4 à 1440 px
   (réduire la fenêtre pour vérifier).
3. La légende n'apparaît que sur la première vignette (la seconde a une
   légende vide).
4. Un clic ouvre la visionneuse ; `←`/`→` naviguent ; `Échap` ferme ; la page
   derrière ne défile pas pendant l'ouverture.
5. Aucun débordement horizontal de la page.

- [ ] **Étape 6 : Vérifier la section vide**

```bash
cd mtechbenin-backend
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient({log:[]});
(async()=>{ await p.clientMedia.deleteMany({}); console.log('reste :', await p.clientMedia.count()); await p.\$disconnect(); })();" 2>/dev/null
```

Recharger l'accueil : aucune trace de la section (ni titre, ni espace vide)
entre les abonnements et les témoignages.

- [ ] **Étape 7 : Commit**

```bash
git add src/components/shop/ClientGallery.js src/app/page.js next.config.mjs
git commit -m "feat: section clients satisfaits en mosaique sur l accueil"
```

---

### Tâche 6 : Écran d'administration

**Fichiers :**
- Créer : `mtechbenin-frontend/src/components/admin/AdminClientMedia.js`
- Créer : `mtechbenin-frontend/src/app/admin/clients-satisfaits/page.js`
- Modifier : `mtechbenin-frontend/src/components/layout/AdminLayout.js`

**Interfaces :**
- Consomme : `clientMediaApi` (tâche 3), `MediaUploader` (composant existant,
  `@/components/admin/MediaUploader`, dont le `onChange(url, type)` renvoie le
  type auto-détecté).

- [ ] **Étape 1 : Écrire l'écran d'administration**

Créer `src/components/admin/AdminClientMedia.js` :

```jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X, RefreshCw, Video,
} from "lucide-react";
import { clientMediaApi } from "@/lib/api";
import MediaUploader from "@/components/admin/MediaUploader";

const emptyForm = { url: "", type: "image", caption: "" };

export default function AdminClientMedia() {
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clientMediaApi.getAll();
      setMedias(data.medias || []);
    } catch (err) {
      setError("Chargement impossible — " + (err.message || "réessayez"));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.url) return;
    setSaving(true);
    setError("");
    try {
      await clientMediaApi.create(form);
      setShowModal(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError("Enregistrement impossible — " + (err.message || "réessayez"));
    }
    setSaving(false);
  };

  const handleToggle = async (id) => {
    try {
      await clientMediaApi.toggle(id);
      await load();
    } catch (err) {
      setError("Modification impossible — " + (err.message || "réessayez"));
    }
  };

  const handleDelete = async (id) => {
    try {
      await clientMediaApi.delete(id);
      setDeleteConfirm(null);
      await load();
    } catch (err) {
      setError("Suppression impossible — " + (err.message || "réessayez"));
      setDeleteConfirm(null);
    }
  };

  // Échange les valeurs `order` des deux voisins, puis recharge.
  const handleMove = async (id, direction) => {
    const sorted = [...medias].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((m) => m.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= sorted.length) return;
    try {
      await clientMediaApi.update(sorted[i].id, { order: sorted[j].order });
      await clientMediaApi.update(sorted[j].id, { order: sorted[i].order });
      await load();
    } catch (err) {
      setError("Réorganisation impossible — " + (err.message || "réessayez"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Clients satisfaits
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            Photos et vidéos affichées sur la page d&apos;accueil.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-apple-mid hover:text-apple-black bg-apple-gray transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            onClick={() => { setForm(emptyForm); setShowModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-apple-black text-white hover:bg-neutral-800 transition"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-[13px] bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {medias.length === 0 && !loading ? (
        <div className="text-center py-16 glass-card rounded-3xl">
          <p className="text-apple-mid text-sm">
            Aucun média — la section n&apos;apparaît pas sur l&apos;accueil.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...medias].sort((a, b) => a.order - b.order).map((m, i, arr) => (
            <div
              key={m.id}
              className={`glass-card rounded-3xl overflow-hidden ${m.active ? "" : "opacity-50"}`}
            >
              <div className="relative aspect-[3/4] bg-black/[0.04]">
                {m.type === "video" ? (
                  <video src={m.url} muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <Image src={m.url} alt={m.caption || ""} fill className="object-cover" sizes="25vw" />
                )}
                {m.type === "video" && (
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                    <Video className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[12px] text-apple-black line-clamp-2 min-h-[2rem]">
                  {m.caption || <span className="text-apple-mid/60">Sans légende</span>}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleMove(m.id, "up")} disabled={i === 0}
                    aria-label="Monter"
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] disabled:opacity-30 transition">
                    <ArrowUp className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                  <button onClick={() => handleMove(m.id, "down")} disabled={i === arr.length - 1}
                    aria-label="Descendre"
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] disabled:opacity-30 transition">
                    <ArrowDown className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                  <button onClick={() => handleToggle(m.id)}
                    aria-label={m.active ? "Masquer" : "Afficher"}
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] transition">
                    {m.active
                      ? <Eye className="w-3.5 h-3.5 text-green-600" />
                      : <EyeOff className="w-3.5 h-3.5 text-apple-mid" />}
                  </button>
                  <button onClick={() => setDeleteConfirm(m.id)}
                    aria-label="Supprimer"
                    className="p-1.5 rounded-lg hover:bg-red-50 transition ml-auto">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl">
              <h2 className="font-display font-bold text-lg text-apple-black">Ajouter un média</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-black/[0.05] rounded-xl transition">
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <MediaUploader
                value={form.url}
                onChange={(url, type) =>
                  setForm((p) => ({ ...p, url, type: type || "image" }))
                }
                folder="mtechbenin/clients"
                accept="image/*,video/*"
                label="Photo ou vidéo du client"
              />
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Légende (optionnelle)
                </label>
                <input
                  value={form.caption}
                  onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
                  maxLength={140}
                  placeholder="Ex : Fatou · Cotonou — ses AirPods reçus en 2h"
                  className="w-full bg-black/[0.03] text-apple-black text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
                <p className="text-[11px] text-apple-mid mt-1.5">
                  Laisser vide pour n&apos;afficher que le média.
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={!form.url || saving}
                className="w-full py-3 rounded-2xl bg-apple-black text-white font-semibold text-[13px] hover:bg-neutral-800 transition disabled:opacity-40"
              >
                {saving ? "Enregistrement..." : "Ajouter à l'accueil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">
              Supprimer ce média ?
            </h3>
            <p className="text-apple-mid text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl glass-card text-apple-black font-semibold text-sm hover:bg-apple-gray transition">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Étape 2 : Créer la route admin**

Créer `src/app/admin/clients-satisfaits/page.js` :

```jsx
import AdminLayout from "@/components/layout/AdminLayout";
import AdminClientMedia from "@/components/admin/AdminClientMedia";

export const metadata = { title: "Clients satisfaits | Admin MTECHBENIN" };

export default function AdminClientMediaPage() {
  return (
    <AdminLayout>
      <AdminClientMedia />
    </AdminLayout>
  );
}
```

- [ ] **Étape 3 : Ajouter l'entrée de navigation**

Dans `src/components/layout/AdminLayout.js`, importer l'icône `Smile` depuis
`lucide-react` (ajouter au bloc d'import existant), puis insérer dans le
tableau de navigation **juste après** la ligne `Hero Médias` (ligne 42) :

```js
  { href: "/admin/clients-satisfaits", icon: Smile, label: "Clients satisfaits" },
```

- [ ] **Étape 4 : Vérifier la syntaxe**

```bash
cd mtechbenin-frontend
npx eslint src/components/admin/AdminClientMedia.js \
  src/app/admin/clients-satisfaits/page.js \
  src/components/layout/AdminLayout.js --no-eslintrc \
  --parser-options=ecmaVersion:2022,sourceType:module,ecmaFeatures:{jsx:true}
echo "EXIT:$?"
```

Attendu : `EXIT:0`.

- [ ] **Étape 5 : Vérifier le parcours admin complet**

Backend démarré (`npm run dev`) et frontend démarré, ouvrir
`http://localhost:3000/admin/clients-satisfaits` et contrôler :

1. « Clients satisfaits » apparaît dans le menu latéral, sous « Hero Médias ».
2. Sans média : le message « Aucun média — la section n'apparaît pas sur
   l'accueil » s'affiche.
3. « Ajouter » → téléverser une image → la légende est facultative →
   « Ajouter à l'accueil » ferme la fenêtre et la vignette apparaît.
4. Recharger l'accueil : le média est visible dans la mosaïque.
5. Cliquer l'œil pour masquer → le média grise dans l'admin et **disparaît**
   de l'accueil après rechargement.
6. Les flèches montent/descendent le média ; l'ordre change aussi sur
   l'accueil après rechargement.
7. La corbeille demande confirmation avant de supprimer.
8. Téléverser une **vidéo** : la pastille vidéo apparaît dans l'admin, et sur
   l'accueil elle se lit en boucle, sans son, avec le bouton de son actif.

- [ ] **Étape 6 : Vérifier la protection admin**

L'endpoint d'administration ne doit pas répondre sans clé :

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/client-media/all
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/client-media
```

Attendu : `401` pour la première, `200` pour la seconde.

- [ ] **Étape 7 : Commit**

```bash
git add src/components/admin/AdminClientMedia.js \
        src/app/admin/clients-satisfaits src/components/layout/AdminLayout.js
git commit -m "feat: ecran admin clients satisfaits (ajout, ordre, visibilite)"
```

---

## Vérification finale du lot

- [ ] `cd mtechbenin-backend && npx prisma migrate status` → `up to date`
- [ ] `cd mtechbenin-frontend && npm run build` → build réussi
- [ ] Accueil sans média : aucune section vide entre abonnements et témoignages
- [ ] Accueil avec médias : mosaïque 2/3/4 colonnes, aucun débordement
  horizontal en 360 px
- [ ] Visionneuse : ouverture, navigation clavier, `Échap`, défilement de page
  bloqué pendant l'ouverture
- [ ] Vidéo : lecture auto silencieuse, bouton de son fonctionnel
- [ ] Les 18 avis existants et la section « Ils parlent de nous » sont
  inchangés
