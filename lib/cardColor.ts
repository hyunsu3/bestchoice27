const GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
  "from-lime-500 to-green-600",
  "from-cyan-500 to-sky-600",
  "from-orange-500 to-red-600",
  "from-violet-500 to-fuchsia-600",
];

const ACCENTS = [
  "text-indigo-500 dark:text-indigo-400",
  "text-rose-500 dark:text-rose-400",
  "text-amber-600 dark:text-amber-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-sky-600 dark:text-sky-400",
  "text-fuchsia-600 dark:text-fuchsia-400",
  "text-lime-600 dark:text-lime-400",
  "text-cyan-600 dark:text-cyan-400",
  "text-orange-600 dark:text-orange-400",
  "text-violet-600 dark:text-violet-400",
];

// -500 shade hex values matching the GRADIENTS/ACCENTS palette order above.
// Exported for use as a "recommended colors" quick-pick swatch row.
export const HEXES = [
  "#6366f1", // indigo
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#d946ef", // fuchsia
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#f97316", // orange
  "#8b5cf6", // violet
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function indexFor(universityName: string, size: number): number {
  if (!universityName) return 0;
  return hashString(universityName) % size;
}

export function getCardGradient(universityName: string): string {
  return GRADIENTS[indexFor(universityName, GRADIENTS.length)];
}

export function getCardAccent(universityName: string): string {
  return ACCENTS[indexFor(universityName, ACCENTS.length)];
}

export function getAutoHex(universityName: string): string {
  return HEXES[indexFor(universityName, HEXES.length)];
}

export function darkenHex(hex: string, amount = 0.25): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;
  const r = Math.round(((num >> 16) & 255) * (1 - amount));
  const g = Math.round(((num >> 8) & 255) * (1 - amount));
  const b = Math.round((num & 255) * (1 - amount));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
