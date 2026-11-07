/**
 * Where to send a member after login, signup and onboarding. It comes from the URL,
 * so only invite pages are accepted. Any other value could send a member to another site.
 */
export function safeReturnPath(value: string | null | undefined): string | null {
  return value && /^\/join\/[\w-]+$/.test(value) ? value : null;
}

/** Adds the return path to a link, when there is one. */
export function withReturnPath(href: string, next: string | null): string {
  if (!next) return href;
  return `${href}${href.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}`;
}
