// src/utils/imageResolver.ts
// Utility to resolve image paths stored in the DB (like "../Assets/sofa/Name.jpg")
// to the built URL provided by Vite using import.meta.glob

type ImageMap = Record<string, string>;

// Glob all image files under any Assets folder in src. Vite resolves these at build time.
const modules = import.meta.glob('/src/**/Assets/**/*.{png,jpg,jpeg,webp,svg}', { eager: true }) as Record<string, any>;

const imageMap: ImageMap = {};

Object.keys(modules).forEach((p) => {
  const mod = modules[p];
  const url = (mod && (mod.default || mod)) as string;
  if (!url) return;

  // Create a key that is the part after the final 'Assets/' so we can match DB values
  const parts = p.split('/Assets/');
  const key = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : p.toLowerCase();
  imageMap[p] = url;
  imageMap[key] = url; // also allow direct lookup by key (sofa/Name.jpg)
});

export function resolveImagePath(dbPath?: string | null): string | undefined {
  if (!dbPath) return undefined;

  // Normalize the DB path: remove leading ./ or ../ and leading slashes
  let normalized = dbPath.replace(/^\.\/?|^\.\.\//g, '').replace(/^\//, '');
  normalized = normalized.replace(/\\\\/g, '/');
  const lower = normalized.toLowerCase();

  // If the DB path contains 'Assets/', take the part after it
  const idx = lower.indexOf('assets/');
  const key = idx >= 0 ? lower.slice(idx + 'assets/'.length) : lower;

  // Try direct key match
  if (imageMap[key]) return imageMap[key];

  // Try to find a map entry that endsWith the key
  for (const k of Object.keys(imageMap)) {
    if (k.toLowerCase().endsWith(key)) return imageMap[k];
  }

  return undefined;
}

export default resolveImagePath;
