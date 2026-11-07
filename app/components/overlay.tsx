"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Longer than the longest exit animation in globals.css (.overlay rules). */
const EXIT_MS = 200;

type OverlayVariant = "center" | "sheet" | "fullscreen" | "panel";

const ROOT_CLASS: Record<OverlayVariant, string> = {
  // Centered dialog on a dimmed backdrop.
  center: "overlay-center flex items-center justify-center p-4",
  // Bottom sheet on phones, centered dialog from the sm breakpoint up.
  sheet: "overlay-sheet flex items-end p-4 sm:items-center sm:justify-center",
  // Full-screen page that fades in. No backdrop; pass a background in className.
  fullscreen: "overlay-fullscreen",
  // Full-screen page that slides in from the right.
  panel: "overlay-panel",
};

/**
 * Shared modal / sheet / full-screen layer: backdrop, enter and exit motion.
 *
 * Keep it mounted and flip `open`. When `open` turns false the overlay plays its
 * exit animation, then unmounts and calls `onExited`. While it exits, it shows the
 * children from the last render where `open` was true, so content can depend on
 * state that was just cleared.
 *
 * `onClose` runs when the user taps the backdrop. The panel is the single child
 * (or, for fullscreen/panel, the overlay itself, styled through `className`).
 */
export function Overlay({
  open = true,
  variant = "center",
  onClose,
  onExited,
  className = "",
  children,
}: {
  open?: boolean;
  variant?: OverlayVariant;
  onClose?: () => void;
  onExited?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [lastOpenChildren, setLastOpenChildren] = useState(children);
  const onExitedRef = useRef(onExited);

  if (open) {
    if (!mounted) setMounted(true);
    if (lastOpenChildren !== children) setLastOpenChildren(children);
  }

  useEffect(() => {
    onExitedRef.current = onExited;
  });

  useEffect(() => {
    if (open || !mounted) return;
    const id = setTimeout(() => {
      setMounted(false);
      onExitedRef.current?.();
    }, EXIT_MS);
    return () => clearTimeout(id);
  }, [open, mounted]);

  if (!mounted) return null;

  const hasBackdrop = variant === "center" || variant === "sheet";

  return (
    <div
      className={`overlay fixed inset-0 z-50 ${ROOT_CLASS[variant]} ${className}`}
      data-state={open ? "open" : "closed"}
      onClick={hasBackdrop ? (e) => e.target === e.currentTarget && onClose?.() : undefined}
    >
      {hasBackdrop && (
        <div
          aria-hidden
          className="overlay-backdrop pointer-events-none absolute inset-0 -z-10 bg-black/40 backdrop-blur-sm"
        />
      )}
      {open ? children : lastOpenChildren}
    </div>
  );
}
