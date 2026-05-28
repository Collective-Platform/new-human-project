import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "emotional" | "physical";

const BASE =
  "w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-default disabled:opacity-50 disabled:shadow-none";

const VARIANT_CLASS: Record<Variant, string> = {
  default: "bg-primary shadow-red-200",
  emotional: "bg-category-emotional shadow-category-emotional/20",
  physical: "bg-category-physical shadow-category-physical/20",
};

export function PrimaryButton({
  children,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button type="button" className={`${BASE} ${VARIANT_CLASS[variant]}`} {...props}>
      {children}
    </button>
  );
}
