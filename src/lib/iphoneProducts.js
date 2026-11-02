const IPHONE_MODEL = /iphone[\s-]*(?:x(?:r|s(?:[\s-]*max)?)?|air|duo|\d{1,2})(?=$|[\s-])/i;
const IPHONE_ACCESSORY = /coque|étui|etui|chargeur|câble|cable|protection|vitre|film|case|cover|adaptateur/i;

export function isIPhoneProduct(product) {
  const label = `${product?.name || ""} ${product?.slug || ""}`;
  return IPHONE_MODEL.test(label) && !IPHONE_ACCESSORY.test(label);
}

export function compareIPhoneGeneration(a, b) {
  const order = (product) => {
    const label = `${product?.name || ""} ${product?.slug || ""}`.toLowerCase();
    const token = label.match(/iphone[\s-]*(x(?:r|s(?:[\s-]*max)?)?|air|duo|\d{1,2})/)?.[1] || "";
    const generation = token.startsWith("x") ? 10 : token === "air" ? 17 : token === "duo" ? 18 : Number(token || 0);
    const tier = /max/.test(label) ? 3 : /\bpro\b/.test(label) ? 2 : /\bplus\b/.test(label) || token === "air" ? 1 : 0;
    return generation * 10 + tier;
  };
  return order(b) - order(a) || String(b?.name || "").localeCompare(String(a?.name || ""), "fr");
}
