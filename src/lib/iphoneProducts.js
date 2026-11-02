const IPHONE_MODEL = /iphone[\s-]*(?:x(?:r|s(?:[\s-]*max)?)?|\d{1,2})(?=$|[\s-])/i;
const IPHONE_ACCESSORY = /coque|étui|etui|chargeur|câble|cable|protection|vitre|film|case|cover|adaptateur/i;

export function isIPhoneProduct(product) {
  const label = `${product?.name || ""} ${product?.slug || ""}`;
  return IPHONE_MODEL.test(label) && !IPHONE_ACCESSORY.test(label);
}
