export const MODELES_IPHONE = [
  { name: "iPhone 17 Pro Max", slug: "iphone-17-pro-max", image: "iphone-17-pro-max.jpg" },
  { name: "iPhone 17 Pro", slug: "iphone-17-pro", image: "iphone-17-pro.jpg" },
  { name: "iPhone 17", slug: "iphone-17", image: "iphone-17.jpg" },
  { name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max", image: "iphone-16-pro-max.jpg" },
  { name: "iPhone 16 Pro", slug: "iphone-16-pro", image: "iphone-16-pro.jpg" },
  { name: "iPhone 16", slug: "iphone-16", image: "iphone-16.jpg" },
  { name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", image: "iphone-15-pro-max.jpg" },
  { name: "iPhone 15 Pro", slug: "iphone-15-pro", image: "iphone-15-pro.jpg" },
  { name: "iPhone 15", slug: "iphone-15", image: "iphone-15.jpg" },
  { name: "iPhone 14", slug: "iphone-14", image: "iphone-14.jpg" },
  { name: "iPhone 13", slug: "iphone-13", image: "iphone-13.jpg" },
  { name: "iPhone 12", slug: "iphone-12", image: "iphone-12.jpg" },
];

export function modeleIphoneSecours(slug) {
  return MODELES_IPHONE.find((modele) => modele.slug === slug) || null;
}
