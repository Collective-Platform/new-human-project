"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";

const steps = [
  {
    icon: "auto_stories",
    colorClass: "text-category-mental",
    bgClass: "bg-category-mental/10",
    translationKey: "mentalExplain" as const,
  },
  {
    icon: "favorite",
    colorClass: "text-category-emotional",
    bgClass: "bg-category-emotional/10",
    translationKey: "emotionalExplain" as const,
  },
  {
    icon: "fitness_center",
    colorClass: "text-[#b8a44c]",
    bgClass: "bg-category-physical",
    translationKey: "physicalExplain" as const,
  },
];

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const isWelcome = currentStep === 0;
  const isBlockExplain = currentStep === steps.length + 1;
  const stepIndex = currentStep - 1;

  async function handleGetStarted() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (isBlockExplain) {
      handleGetStarted();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      {isWelcome && (
        <div className="space-y-6 max-w-sm">
          <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-[40px] text-primary">
              church
            </span>
          </div>
          <h1 className="text-3xl font-bold font-headline text-foreground">
            {t("welcome")}
          </h1>
          <p className="text-foreground/60 leading-relaxed">
            {t("blockExplain")}
          </p>
        </div>
      )}

      {!isWelcome && !isBlockExplain && steps[stepIndex] && (
        <div className="space-y-6 max-w-sm">
          <div
            className={`flex items-center justify-center w-20 h-20 mx-auto rounded-full ${steps[stepIndex].bgClass}`}
          >
            <span
              className={`material-symbols-outlined text-[40px] ${steps[stepIndex].colorClass}`}
            >
              {steps[stepIndex].icon}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-headline text-foreground">
            {t(steps[stepIndex].translationKey)}
          </h2>
        </div>
      )}

      {isBlockExplain && (
        <div className="space-y-6 max-w-sm">
          <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-[40px] text-primary">
              calendar_month
            </span>
          </div>
          <h2 className="text-2xl font-bold font-headline text-foreground">
            {t("blockExplain")}
          </h2>
        </div>
      )}

      {/* Step indicators */}
      <div className="flex gap-2 mt-10">
        {Array.from({ length: steps.length + 2 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i === currentStep ? "bg-primary" : "bg-foreground/10"
            }`}
          />
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={loading}
        className="mt-8 w-full max-w-sm rounded-md bg-primary py-4 text-white font-semibold text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isBlockExplain
          ? loading
            ? "…"
            : t("getStarted")
          : t("getStarted")}
      </button>
    </div>
  );
}
