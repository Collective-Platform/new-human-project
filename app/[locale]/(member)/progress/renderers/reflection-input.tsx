"use client";

import { useEffect, useRef, useState } from "react";

const AUTOSAVE_DELAY_MS = 1000;

/**
 * Textarea with debounced autosave.
 *
 * Purely presentational: the parent decides what to do with the new value
 * (typically POST /api/tasks/complete with `{ taskId, data: { [slug]: text } }`
 * and apply the optimistic completion patch in `progress-client.tsx`).
 *
 * Autosave fires `AUTOSAVE_DELAY_MS` after the last keystroke, on blur,
 * and on unmount if there is an unsaved change.
 */
export function ReflectionInput({
  initialValue,
  onSaveAction,
  placeholder,
  rows = 4,
  ariaLabel,
}: {
  initialValue: string;
  onSaveAction: (text: string) => void | Promise<void>;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const lastSavedRef = useRef(initialValue);
  const onSaveRef = useRef(onSaveAction);
  // Ref so the unmount cleanup always sees the latest value, not the
  // stale mount-time value that a [] closure would capture.
  const valueRef = useRef(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep callback and value ref fresh without retriggering other effects.
  useEffect(() => {
    onSaveRef.current = onSaveAction;
  }, [onSaveAction]);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Auto-resize to fit content, then scroll the bottom edge into view while typing.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    if (document.activeElement === el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [value]);

  // Debounced autosave.
  useEffect(() => {
    if (value === lastSavedRef.current) return;
    const handle = setTimeout(() => {
      lastSavedRef.current = value;
      void onSaveRef.current(value);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(handle);
  }, [value]);

  // Flush on unmount if there is an outstanding edit.
  useEffect(() => {
    return () => {
      if (valueRef.current !== lastSavedRef.current) {
        lastSavedRef.current = valueRef.current;
        void onSaveRef.current(valueRef.current);
      }
    };
  }, []);

  function handleBlur() {
    if (value !== lastSavedRef.current) {
      lastSavedRef.current = value;
      void onSaveRef.current(value);
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300);
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onFocus={handleFocus}
      style={{ minHeight: `${rows * 1.5}rem` }}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="w-full resize-none overflow-hidden rounded-sm border-0 bg-surface-container-low px-3 py-2 text-lg tracking-tight leading-loose text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
    />
  );
}
