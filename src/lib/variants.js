/**
 * Builds a unique cart key for a product + variant combination.
 * Only selected variants are included — optional unselected variants
 * do not create separate cart entries.
 */
export function buildCartKey(productId, variants) {
  if (!variants?.length) return productId;
  const sorted = [...variants].sort((a, b) =>
    a.typeName.localeCompare(b.typeName)
  );
  return (
    productId +
    "__" +
    sorted.map((v) => `${v.typeName}:${v.value}`).join("__")
  );
}

/**
 * Builds the full variants array for an order item.
 * Required types always have a value (guaranteed by the checkout gate).
 * Optional types that were not selected get the value "Non choisi".
 */
export function buildOrderVariantsArray(variantTypes, selected) {
  if (!variantTypes?.length) return [];
  return variantTypes.map((t) => ({
    typeName: t.name,
    value: selected[t.name] ?? "Non choisi",
  }));
}
