function normaliser(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isRepairCategory(category) {
  const slug = normaliser(category?.slug);
  const label = normaliser(category?.label || category?.name);
  return /(^|-)repar/.test(`${slug}-${label}`);
}

export function isCatalogueCategory(category) {
  const searchable = `${normaliser(category?.slug)}-${normaliser(category?.label || category?.name)}`;
  return !(
    /(^|-)suivi($|-)/.test(searchable) ||
    /order-tracking/.test(searchable)
  );
}
