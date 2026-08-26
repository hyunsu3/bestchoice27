// 24 hue-pair combinations spanning the full Tailwind color wheel, so
// auto-assigned university colors collide far less often than the old 10.
const GRADIENTS = [
  "from-red-400 to-amber-500",
  "from-orange-400 to-yellow-500",
  "from-amber-400 to-lime-500",
  "from-yellow-400 to-green-500",
  "from-lime-400 to-emerald-500",
  "from-green-400 to-teal-500",
  "from-emerald-400 to-cyan-500",
  "from-teal-400 to-sky-500",
  "from-cyan-400 to-blue-500",
  "from-sky-400 to-indigo-500",
  "from-blue-400 to-violet-500",
  "from-indigo-400 to-purple-500",
  "from-violet-400 to-fuchsia-500",
  "from-purple-400 to-pink-500",
  "from-fuchsia-400 to-rose-500",
  "from-pink-400 to-red-500",
  "from-rose-400 to-orange-500",
  "from-red-400 to-teal-500",
  "from-orange-400 to-cyan-500",
  "from-amber-400 to-sky-500",
  "from-yellow-400 to-blue-500",
  "from-lime-400 to-indigo-500",
  "from-green-400 to-violet-500",
  "from-emerald-400 to-purple-500",
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

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rn = 0;
  let gn = 0;
  let bn = 0;
  if (h < 60) [rn, gn, bn] = [c, x, 0];
  else if (h < 120) [rn, gn, bn] = [x, c, 0];
  else if (h < 180) [rn, gn, bn] = [0, c, x];
  else if (h < 240) [rn, gn, bn] = [0, x, c];
  else if (h < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rn)}${toHex(gn)}${toHex(bn)}`;
}

// Second gradient stop for a custom card color: rotates the hue to pair it
// with a distinct color (instead of just darkening the same hue) and floors
// the lightness so saturated/dark picks (deep greens, yellows, roses) don't
// end up muddy or too dark.
function gradientPairHex(hex: string, hueShift = 35): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [h, s, l] = rgbToHsl(...rgb);
  const nextHue = (h + hueShift) % 360;
  const nextLightness = Math.min(0.62, Math.max(0.42, l + 0.08));
  return hslToHex(nextHue, s, nextLightness);
}

// YIQ perceived brightness (0-1). Above ~0.75 a color reads as "near-white"
// to the eye (pure yellow, lime, ...) even though it isn't literally light.
function perceivedBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb;
  return (r * 299 + g * 587 + b * 114) / 1000 / 255;
}

const TOO_BRIGHT_FOR_WHITE_TEXT = 0.75;

// Card fronts put the badge/title directly on the gradient's top-left stop
// (no dark backdrop there, unlike the department/capacity box lower down).
// If the chosen color itself is glaring, put the calmer paired color at
// that top-left stop instead so the white text stays readable, and push
// the glaring color to the bottom-right corner instead.
export function getCardGradientStops(hex: string): [string, string] {
  const pair = gradientPairHex(hex);
  return perceivedBrightness(hex) > TOO_BRIGHT_FOR_WHITE_TEXT
    ? [pair, hex]
    : [hex, pair];
}
