function normaliser(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isCatalogueCategory(category) {
  const slug = normaliser(category?.slug);
  const label = normaliser(category?.label || category?.name);
  const searchable = `${slug}-${label}`;
  return !(
    /(^|-)repar/.test(searchable) ||
    /(^|-)suivi($|-)/.test(searchable) ||
    /order-tracking/.test(searchable)
  );
}
