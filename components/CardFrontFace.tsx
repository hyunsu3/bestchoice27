import type { UniversityCard } from "@/lib/types";

const INFO_BOX_PADDING = "px-5 py-6";

const SIZE_STYLES = {
  md: {
    badge: "text-base px-3.5 py-1.5",
    name: "mt-3 text-3xl",
    dept: "text-xl",
    infoValue: "text-4xl",
  },
  lg: {
    badge: "text-lg px-4 py-2",
    name: "mt-3 text-4xl",
    dept: "text-2xl",
    infoValue: "text-5xl",
  },
} as const;

export default function CardFrontFace({
  card,
  size = "md",
}: {
  card: UniversityCard;
  size?: keyof typeof SIZE_STYLES;
}) {
  const s = SIZE_STYLES[size];

  return (
    <>
      <span
        className={`inline-block self-start rounded-full bg-white/20 font-semibold tracking-wide text-white backdrop-blur-sm ${s.badge}`}
      >
        {card.admissionType || "전형 미입력"}
      </span>
      <h3 className={`font-black leading-tight drop-shadow-sm ${s.name}`}>
        {card.universityName}
      </h3>
      <div
        className={`mt-auto rounded-2xl bg-black/15 backdrop-blur-sm ${INFO_BOX_PADDING}`}
      >
        <p className={`text-center font-bold leading-tight text-white ${s.dept}`}>
          {card.department}
        </p>
        <p className={`mt-1.5 text-center font-black leading-none text-white ${s.infoValue}`}>
          {card.capacity || "-"}
        </p>
      </div>
    </>
  );
}
