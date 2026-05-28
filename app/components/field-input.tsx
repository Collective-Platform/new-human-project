import type { InputHTMLAttributes } from "react";

const CLASS =
  "w-full rounded-md border-0 bg-surface-container-high px-4 py-3 text-sm font-medium text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container";

export function FieldInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={CLASS} {...props} />;
}
