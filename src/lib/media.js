// ─────────────────────────────────────────────────────────────────────────────
// Normalisation des URLs vidéo.
//
// Une vidéo filmée avec un iPhone arrive en `.mov`. Cloudinary la sert alors
// avec le type MIME `video/quicktime`, que Chrome et Firefox refusent — même
// quand le codec à l'intérieur est du H.264 parfaitement lisible. Résultat :
// la vidéo s'affiche sur iPhone et reste vide partout ailleurs.
//
// Cloudinary sait transcoder à la livraison : il suffit de demander l'asset
// avec l'extension `.mp4`. La conversion est faite une fois puis mise en cache.
// ─────────────────────────────────────────────────────────────────────────────

// Conteneurs qu'au moins un navigateur majeur refuse de lire.
// L'extension est en groupe NON capturant : seul le délimiteur qui la suit
// (fin de chaîne, `?` ou `#`) est repris dans le remplacement.
const CONTENEURS_A_RISQUE =
  /\.(?:mov|avi|mkv|wmv|m4v|mpe?g|3gp|flv|ogv)(\?|#|$)/i;

/**
 * Renvoie une URL de vidéo lisible par tous les navigateurs.
 * Les URLs non-Cloudinary sont laissées telles quelles : on ne peut rien
 * transcoder chez un hébergeur qu'on ne contrôle pas.
 *
 * @param {string} url
 * @returns {string}
 */
export function urlVideoJouable(url) {
  if (typeof url !== "string" || !url) return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return url;
  }
  return url.replace(CONTENEURS_A_RISQUE, ".mp4$1");
}

/**
 * Première image de la vidéo, servie en JPEG par Cloudinary.
 *
 * Sert d'image d'attente : un `<video>` sans affiche n'occupe aucune hauteur
 * tant que rien n'est chargé — la tuile paraît alors absente, puis surgit.
 * L'affiche pèse quelques kilo-octets contre plusieurs centaines pour la vidéo.
 *
 * @param {string} url
 * @returns {string|undefined} l'URL de l'affiche, ou `undefined` si on ne sait
 *   pas la produire (hébergeur tiers).
 */
export function afficheVideo(url) {
  if (typeof url !== "string" || !url) return undefined;
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return undefined;
  }
  return url
    .replace("/video/upload/", "/video/upload/so_0/")
    .replace(/\.[a-z0-9]+(\?|#|$)/i, ".jpg$1");
}

export default urlVideoJouable;
