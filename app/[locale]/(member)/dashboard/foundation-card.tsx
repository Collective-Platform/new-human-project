import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { ChevronRight } from "lucide-react";

const foundationColors = [
  "bg-[#f8d7da]",
  "bg-[#f1b0b7]",
  "bg-[#e4606d]",
  "bg-[#d93749]",
  "bg-[#c10014]",
  "bg-[#d93749]",
  "bg-[#c10014]",
  "bg-[#ab0010]",
  "bg-[#90000c]",
  "bg-surface-container-highest",
  "bg-surface-container-high",
  "bg-surface-container-high",
  "bg-surface-container-high",
  "bg-surface-container-high",
  "bg-surface-container-high",
];

export function FoundationCard() {
  const t = useTranslations("block");
  return (
    <section className="flex flex-col justify-between rounded-md border border-surface-container bg-white p-8 shadow-card">
      <div>
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-primary">
          {t("theFoundation")}
        </p>
        <h3 className="mb-4 font-headline text-2xl font-bold text-on-surface">
          {t("the25DayBlock")}
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
          {t("foundationDescription")}
        </p>
        <div className="mb-8 grid grid-cols-5 gap-2">
          {foundationColors.map((color, index) => (
            <span
              key={index}
              className={`aspect-square rounded-sm ${color}`}
              aria-label={`Foundation marker ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <Link
        href="/progress"
        prefetch
        className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 font-bold text-white shadow-lg shadow-red-200 transition-transform active:scale-95"
      >
        {t("startJourney")}
        <ChevronRight size={20} className="ml-2" aria-hidden="true" />
      </Link>
    </section>
  );
}
