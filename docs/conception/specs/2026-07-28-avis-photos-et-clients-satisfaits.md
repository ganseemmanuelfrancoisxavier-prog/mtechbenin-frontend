# Avis avec photos + section « Clients satisfaits »

**Date :** 28 juillet 2026
**Portée :** `mtechbenin-frontend` et `mtechbenin-backend`

## Objectif

Renforcer la preuve sociale sur le site par deux ajouts :

1. Les visiteurs peuvent joindre des photos à leur avis produit. L'admin met un
   avis à la une comme aujourd'hui ; les photos suivent l'avis.
2. Une nouvelle section d'accueil présente des photos et vidéos de clients
   satisfaits, alimentée depuis le panel admin.

Les avis à la une gagnent un bouton « Voir tous les avis » menant à une page
`/avis` dédiée, pour que l'accueil reste court quand les avis s'accumulent.

## Décisions actées

| Sujet | Décision |
|---|---|
| Photos par avis | Jusqu'à 3, images uniquement |
| Modération | Photos et texte validés ensemble, comme aujourd'hui |
| Mise à la une | Reste un choix manuel de l'admin (inchangé) |
| Bouton « voir plus » | Mène à une page `/avis` dédiée |
| Contenu de `/avis` | Tous les avis approuvés, filtrables |
| Section clients satisfaits | Grille mosaïque, média + légende libre |
| Emplacement de la section | Accueil, juste avant les témoignages |
| Réception des photos | Endpoint public dédié, strictement bridé |

## Séquencement

La livraison se fait en deux lots.

**Lot 1 — Section « Clients satisfaits »** (modèle `ClientMedia`, API, page
admin, section d'accueil). Entièrement nouveau : ne touche ni aux avis
existants, ni au formulaire produit, ni à l'upload. Livré en premier pour que
l'admin commence à rassembler et publier les médias — le contenu est le vrai
goulot d'étranglement — et pour valider mosaïque, agrandissement et lecture
vidéo avant de réutiliser ces composants au lot 2.

**Lot 2 — Avis avec photos + page `/avis`** (champ `photos`, endpoint public
bridé, formulaire, affichages, modération admin). Ouvre une surface publique et
modifie un flux existant : traité posément, une fois le langage visuel validé.

## Contrainte de sécurité structurante

`POST /api/upload` est protégé par `isAdmin`. Le formulaire d'avis est public :
le brancher tel quel obligerait à s'appuyer sur `NEXT_PUBLIC_ADMIN_API_KEY`,
exposée dans le bundle navigateur. N'importe quel visiteur pourrait alors
téléverser n'importe quoi sur le compte Cloudinary (coût, contenu illicite).

On crée donc un endpoint public **distinct et bridé**, sans jamais élargir les
droits de l'endpoint admin existant.

---

## 1. Modèle de données

### `Review` — ajout d'un champ

```prisma
model Review {
  // … champs existants inchangés
  photos Json?   // tableau d'URLs Cloudinary, max 3, null si aucune photo
}
```

`Json?` plutôt qu'une table dédiée : au plus 3 URLs, jamais requêtées
individuellement, et cohérent avec `Product.images` déjà stocké ainsi.
Nullable, donc les 18 avis existants restent valides sans reprise de données.

### `ClientMedia` — nouveau modèle

Calqué sur `HeroMedia`, déjà maîtrisé côté admin.

```prisma
model ClientMedia {
  id        String   @id @default(cuid())
  type      String   @default("image")   // "image" | "video"
  url       String
  caption   String?                      // légende libre, optionnelle
  active    Boolean  @default(true)
  order     Int      @default(0)
  createdAt DateTime @default(now())

  @@index([active, order])
}
```

Migration additive : une nouvelle table et une colonne nullable. Aucune donnée
existante touchée.

---

## 2. API backend

### Nouvel endpoint public — envoi d'une photo d'avis

`POST /api/reviews/photos`

Règles appliquées **côté serveur** (ne jamais faire confiance au client) :

- Images uniquement : `jpeg`, `png`, `webp`, `heic`. Tout `data:video/…` ou
  format inconnu est rejeté.
- 5 Mo maximum par fichier, vérifié sur la taille décodée du base64.
- Limite de débit dédiée : 20 envois par IP et par tranche de 15 minutes
  (`strictLimiter` existant est trop restrictif à 10 pour 3 photos).
- Dossier Cloudinary séparé : `mtechbenin/reviews`, pour isoler ces fichiers
  du contenu administré.
- Transformation à l'upload : `width 1200 crop limit`, `quality auto`,
  `fetch_format webp`.

Réponse : `{ url }` uniquement. Le `publicId` n'est pas exposé, pour qu'aucun
visiteur ne puisse cibler une suppression.

### Endpoints modifiés

- `POST /api/reviews` accepte `photos: string[]`. Le serveur **valide que
  chaque URL provient bien de `res.cloudinary.com` et du dossier
  `mtechbenin/reviews`**, et tronque à 3 entrées. Sans ce contrôle, on pourrait
  injecter n'importe quelle URL externe dans une page du site.
- `GET /api/reviews/featured` : ajout d'un paramètre `limit` (défaut 6).
- `GET /api/reviews` (nouveau, public) : tous les avis approuvés, paginés,
  avec filtre optionnel `withPhotos=true` et `minRating`.

### Endpoints `ClientMedia`

| Méthode | Route | Accès |
|---|---|---|
| `GET` | `/api/client-media` | public — actifs uniquement, triés par `order` |
| `GET` | `/api/client-media/all` | admin — tous |
| `POST` | `/api/client-media` | admin |
| `PATCH` | `/api/client-media/:id` | admin |
| `PATCH` | `/api/client-media/:id/toggle` | admin |
| `DELETE` | `/api/client-media/:id` | admin |

Le réordonnancement passe par deux appels `PATCH /:id` échangeant les valeurs
`order`, comme le fait déjà `heroStore` — pas d'endpoint dédié, pour rester sur
le patron du projet.

Module `src/modules/clientMedia/` suivant le patron
`{name}.controller.js` + `{name}.routes.js` du projet.

---

## 3. Interfaces

### Formulaire d'avis (fiche produit)

Sous le champ texte, une zone d'ajout de photos :

- Trois emplacements ; chacun ouvre le sélecteur de fichiers.
- Vignette avec bouton de retrait dès l'envoi terminé.
- Indicateur de progression pendant l'envoi, bouton d'envoi désactivé tant
  qu'un transfert est en cours.
- Message d'erreur explicite et actionnable : « Image trop lourde (max 5 Mo) »,
  « Format non accepté (JPG, PNG ou WEBP) ».
- Mention rassurante : « Votre avis sera publié après vérification. »

### Affichage d'un avis avec photos

- **Fiche produit et page `/avis`** : bande de vignettes carrées sous le texte.
  Clic → agrandissement plein écran, navigable au clavier et fermable par
  `Échap`.
- **Carte d'accueil** : au plus 2 vignettes, la seconde portant un compteur
  `+1` si une troisième existe — pour ne pas déséquilibrer la grille.

### Page `/avis`

- En-tête : note moyenne, nombre total d'avis, rappel de la modération.
- Filtres en une seule rangée : *Tous* / *Avec photos* / *5★*.
- Liste paginée (bouton « Charger plus », 12 par page).
- États couverts : chargement (squelettes), erreur réseau (message + bouton
  réessayer), liste vide (« Aucun avis pour ce filtre »).

### Section « Clients satisfaits » (accueil)

- Titre en surtitre + titre, aligné sur le style de « Ils parlent de nous ».
- Grille mosaïque à hauteurs variables : 2 colonnes en mobile, 3 en tablette,
  4 en desktop (CSS `columns`, sans dépendance externe).
- Vidéos : lecture automatique, en boucle, **silencieuses par défaut**
  (contrainte navigateur), bouton son en surimpression — même comportement que
  les vidéos produit déjà en place.
- Légende en surimpression basse, sur dégradé, seulement si renseignée.
- Clic → agrandissement plein écran, comme les photos d'avis.
- Section masquée entièrement si aucun média actif.

### Panel admin

- **Avis** : les photos jointes apparaissent dans la file de modération, pour
  qu'aucune image ne soit approuvée sans avoir été vue.
- **Nouvelle entrée « Clients satisfaits »** : liste ordonnable, ajout via
  `MediaUploader` (composant existant, type auto-détecté), champ légende,
  bascule actif/inactif, suppression avec confirmation.

### Cohérence visuelle

Reprise stricte des codes existants : `glass-card`, `rounded-3xl`,
`font-display` pour les titres, palette `apple-black` / `apple-mid` / `cta`,
surtitre en `text-[11px] uppercase tracking-widest`. Aucune nouvelle
dépendance : l'agrandissement plein écran et la mosaïque sont faits en CSS et
React.

---

## 4. Gestion des erreurs

| Situation | Comportement |
|---|---|
| Envoi de photo échoué | L'emplacement affiche l'erreur ; l'avis reste envoyable sans cette photo |
| Cloudinary indisponible | Message « Envoi impossible pour le moment » ; le texte de l'avis n'est jamais perdu |
| URL de photo non conforme | Rejetée côté serveur ; l'avis est créé sans elle plutôt qu'en échec total |
| `/api/client-media` en erreur | La section est simplement masquée ; l'accueil reste intact |
| Photos téléversées puis avis abandonné | Fichiers orphelins dans `mtechbenin/reviews`. Volume négligeable ; nettoyage manuel possible depuis Cloudinary. Pas de tâche automatique — YAGNI. |

---

## 5. Vérification

- **Validation serveur** : une vidéo déguisée, un fichier de 8 Mo et une URL
  externe sont tous rejetés par `POST /api/reviews/photos` et `POST /api/reviews`.
- **Modération** : un avis avec photos n'apparaît nulle part avant approbation.
- **Limite de 3** : un envoi de 5 URLs est tronqué à 3.
- **Non-régression** : les 18 avis existants (sans `photos`) s'affichent
  normalement sur la fiche produit, l'accueil et `/avis`.
- **Section vide** : sans média actif, l'accueil ne montre aucun espace vide.
- **Responsive** : mosaïque et vignettes vérifiées en 360 px, 768 px et 1440 px.
- **Vidéo** : lecture auto silencieuse effective, bouton son fonctionnel.

---

## Hors périmètre

- Modification de l'authentification admin (sujet distinct, déjà identifié).
- Réponses de l'admin aux avis.
- Notation par photo, signalement d'avis, ou vérification d'achat.
- Tâche automatique de nettoyage des fichiers orphelins.
