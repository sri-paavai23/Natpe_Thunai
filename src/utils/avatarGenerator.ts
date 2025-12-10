export const DICEBEAR_AVATAR_STYLES = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "big-ears",
  "big-ears-neutral",
  "big-smile",
  "bottts",
  "bottts-neutral",
  "croodles",
  "croodles-neutral",
  "fun-emoji",
  "icons",
  "identicon",
  "initials",
  "lorelei",
  "lorelei-neutral",
  "micah",
  "miniavs",
  "open-peeps",
  "personas",
  "pixel-art",
  "pixel-art-neutral",
  "rings",
  "shapes",
  "thumbs",
];

export const generateAvatarUrl = (seed: string, style: string, size: number = 128): string => {
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/8.x/${style}/svg?seed=${encodedSeed}&size=${size}`;
};