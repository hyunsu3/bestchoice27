// 17 vivid -500 shades, one per hue on the Tailwind color wheel. Used as
// solid card backgrounds (both auto-assigned and the "recommended colors"
// quick-pick swatch row) so colors read as sharp, flat fills rather than
// gradients.
export const HEXES = [
  "#f87171", // red
  "#fb923c", // orange
  "#fbbf24", // amber
  "#facc15", // yellow
  "#a3e635", // lime
  "#4ade80", // green
  "#34d399", // emerald
  "#2dd4bf", // teal
  "#22d3ee", // cyan
  "#38bdf8", // sky
  "#60a5fa", // blue
  "#818cf8", // indigo
  "#a78bfa", // violet
  "#c084fc", // purple
  "#e879f9", // fuchsia
  "#f472b6", // pink
  "#fb7185", // rose
];

// Accent text color for each HEX above, same order/index.
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

export function getCardAccent(universityName: string): string {
  return ACCENTS[indexFor(universityName, ACCENTS.length)];
}

export function getAutoHex(universityName: string): string {
  return HEXES[indexFor(universityName, HEXES.length)];
}
