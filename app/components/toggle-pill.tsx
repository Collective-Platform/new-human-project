import type { ButtonHTMLAttributes } from "react";

const BASE =
  "w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200 active:scale-95";

const SELECTED_CLASSES = {
  secondary: "bg-secondary-container text-on-secondary-container ring-2 ring-secondary/20",
  tertiary: "bg-tertiary-container text-on-tertiary-fixed-variant ring-2 ring-tertiary/20",
  emotional: "bg-category-emotional-bg text-category-emotional ring-2 ring-category-emotional/20",
  physical: "bg-category-physical-bg text-category-physical ring-2 ring-category-physical/20",
};

const UNSELECTED =
  "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface";

export function TogglePill({
  selected,
  variant = "secondary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  variant?: "secondary" | "tertiary" | "emotional" | "physical";
}) {
  return (
    <button
      type="button"
      className={`${BASE} ${selected ? SELECTED_CLASSES[variant] : UNSELECTED}`}
      {...props}
    >
      {children}
    </button>
  );
}
