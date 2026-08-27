import { renderWithSmall } from "@/lib/formatText";
import type { UniversityCard } from "@/lib/types";

// "md" scales down on narrow mobile grid cards (2-col) and grows back to
// the original desktop sizing at sm/lg so the PC look is unchanged.
const SIZE_STYLES = {
  sm: {
    badge: "text-xs px-2 py-1",
    name: "mt-1.5 text-lg",
    dept: "text-xs",
    infoBox: "px-2.5 py-2",
    infoValue: "text-xl",
    minReq: "text-[9px]",
  },
  md: {
    badge: "text-[10px] px-2 py-1 sm:text-sm sm:px-3 sm:py-1.5 lg:text-base lg:px-3.5",
    name: "mt-1.5 text-lg sm:mt-3 sm:text-2xl lg:text-3xl",
    dept: "text-xs sm:text-lg lg:text-xl",
    infoBox: "px-2.5 py-2 sm:px-4 sm:py-4 lg:px-5 lg:py-6",
    infoValue: "text-xl sm:text-3xl lg:text-4xl",
    minReq: "text-[9px] sm:text-sm lg:text-base",
  },
  lg: {
    badge: "text-lg px-4 py-2",
    name: "mt-3 text-4xl",
    dept: "text-2xl",
    infoBox: "px-5 py-6",
    infoValue: "text-5xl",
    minReq: "text-sm",
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
      <div className="flex flex-wrap items-center gap-1.5 self-start">
        <span
          className={`inline-block rounded-full bg-white/20 font-semibold tracking-wide text-white backdrop-blur-sm ${s.badge}`}
        >
          {card.admissionType || "전형 미입력"}
        </span>
      </div>
      <h3 className={`font-black leading-tight drop-shadow-sm ${s.name}`}>
        {renderWithSmall(card.universityName)}
      </h3>
      <div
        className={`mt-auto rounded-2xl bg-black/15 backdrop-blur-sm ${s.infoBox}`}
      >
        <p className={`text-center font-bold leading-tight text-white ${s.dept}`}>
          {card.department}
        </p>
        <p className={`mt-1.5 text-center font-black leading-none text-white ${s.infoValue}`}>
          {card.capacity ? renderWithSmall(card.capacity) : "-"}
        </p>
        {card.minRequirement && (
          <p
            className={`mt-1.5 text-center font-semibold leading-tight text-white/90 ${s.minReq}`}
          >
            수능최저 {card.minRequirement}
          </p>
        )}
      </div>
    </>
  );
}
