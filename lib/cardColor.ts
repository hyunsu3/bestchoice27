// 24 hue-pair combinations spanning the full Tailwind color wheel, so
// auto-assigned university colors collide far less often than the old 10.
const GRADIENTS = [
  "from-red-500 to-amber-600",
  "from-orange-500 to-yellow-600",
  "from-amber-500 to-lime-600",
  "from-yellow-500 to-green-600",
  "from-lime-500 to-emerald-600",
  "from-green-500 to-teal-600",
  "from-emerald-500 to-cyan-600",
  "from-teal-500 to-sky-600",
  "from-cyan-500 to-blue-600",
  "from-sky-500 to-indigo-600",
  "from-blue-500 to-violet-600",
  "from-indigo-500 to-purple-600",
  "from-violet-500 to-fuchsia-600",
  "from-purple-500 to-pink-600",
  "from-fuchsia-500 to-rose-600",
  "from-pink-500 to-red-600",
  "from-rose-500 to-orange-600",
  "from-red-500 to-teal-600",
  "from-orange-500 to-cyan-600",
  "from-amber-500 to-sky-600",
  "from-yellow-500 to-blue-600",
  "from-lime-500 to-indigo-600",
  "from-green-500 to-violet-600",
  "from-emerald-500 to-purple-600",
];

// Accent text color for each GRADIENT above, keyed to its starting hue.
const ACCENTS = [
  "text-red-500 dark:text-red-400",
  "text-orange-600 dark:text-orange-400",
  "text-amber-600 dark:text-amber-400",
  "text-yellow-600 dark:text-yellow-400",
  "text-lime-600 dark:text-lime-400",
  "text-green-600 dark:text-green-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-teal-600 dark:text-teal-400",
  "text-cyan-600 dark:text-cyan-400",
  "text-sky-600 dark:text-sky-400",
  "text-blue-500 dark:text-blue-400",
  "text-indigo-500 dark:text-indigo-400",
  "text-violet-500 dark:text-violet-400",
  "text-purple-500 dark:text-purple-400",
  "text-fuchsia-600 dark:text-fuchsia-400",
  "text-pink-500 dark:text-pink-400",
  "text-rose-500 dark:text-rose-400",
  "text-red-500 dark:text-red-400",
  "text-orange-600 dark:text-orange-400",
  "text-amber-600 dark:text-amber-400",
  "text-yellow-600 dark:text-yellow-400",
  "text-lime-600 dark:text-lime-400",
  "text-green-600 dark:text-green-400",
  "text-emerald-600 dark:text-emerald-400",
];

// -500 shade hex values, one per hue on the wheel (independent of the
// GRADIENTS/ACCENTS length above). Exported for use as a "recommended
// colors" quick-pick swatch row.
export const HEXES = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
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
  const key = universityName.trim();
  if (!key) return 0;
  return hashString(key) % size;
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
