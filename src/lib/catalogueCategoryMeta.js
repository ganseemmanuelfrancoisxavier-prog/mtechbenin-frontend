const META_PREFIX = "::catalogue-meta::";
const LEGACY_IMAGE_SEPARATOR = "::catalogue::";

export function readCatalogueCategoryMeta(value) {
  const stored = String(value || "");
  if (stored.startsWith(META_PREFIX)) {
    try {
      const parsed = JSON.parse(stored.slice(META_PREFIX.length));
      return {
        imageUrl: typeof parsed.imageUrl === "string" ? parsed.imageUrl : "",
        description: typeof parsed.description === "string" ? parsed.description : "",
      };
    } catch {
      return { imageUrl: "", description: "" };
    }
  }

  const legacyParts = stored.split(LEGACY_IMAGE_SEPARATOR);
  return {
    imageUrl: legacyParts.length > 1 ? legacyParts.slice(1).join(LEGACY_IMAGE_SEPARATOR) : "",
    description: "",
  };
}

export function writeCatalogueCategoryMeta({ imageUrl = "", description = "" } = {}) {
  return META_PREFIX + JSON.stringify({
    imageUrl: String(imageUrl || ""),
    description: String(description || "").trim(),
  });
}
