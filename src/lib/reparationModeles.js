export const MODELES_IPHONE = [
  { name: "iPhone 17 Pro Max", slug: "iphone-17-pro-max", image: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-17-pro-17-pro-max-hero.png" },
  { name: "iPhone 17 Pro", slug: "iphone-17-pro", image: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-17-pro-17-pro-max-hero.png" },
  { name: "iPhone 17", slug: "iphone-17", image: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-17-hero.png" },
  { name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max", image: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/121032-iphone-16-pro-max.png" },
  { name: "iPhone 16 Pro", slug: "iphone-16-pro", image: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/121031-iphone-16-pro.png" },
  { name: "iPhone 16", slug: "iphone-16", image: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-16.png" },
  { name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", image: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-15-pro-max.png" },
  { name: "iPhone 15 Pro", slug: "iphone-15-pro", image: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone_15_pro.png" },
  { name: "iPhone 15", slug: "iphone-15", image: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone_15_hero.png" },
  { name: "iPhone 14", slug: "iphone-14", image: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111850_iphone-14_1.png" },
  { name: "iPhone 13", slug: "iphone-13", image: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111872_iphone13-colors-480.png" },
  { name: "iPhone 12", slug: "iphone-12", image: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111876_sp830-iphone12-ios14-2x.png" },
];

export function imageIphone(identifier) {
  const normalized = String(identifier || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return MODELES_IPHONE.find((modele) =>
    normalized.includes(modele.slug.replace(/[^a-z0-9]/g, "")),
  )?.image || "/images/categories/smartphone-tablette.jpg";
}

export function modeleIphoneSecours(slug) {
  return MODELES_IPHONE.find((modele) => modele.slug === slug) || null;
}
