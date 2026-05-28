import type { ButtonHTMLAttributes } from "react";

const CLASS =
  "w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-default disabled:opacity-50 disabled:shadow-none";

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={CLASS} {...props}>
      {children}
    </button>
  );
}
