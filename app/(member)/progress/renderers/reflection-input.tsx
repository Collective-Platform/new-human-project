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
  onSave,
  placeholder,
  rows = 4,
  ariaLabel,
}: {
  initialValue: string;
  onSave: (text: string) => void | Promise<void>;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const lastSavedRef = useRef(initialValue);
  const onSaveRef = useRef(onSave);
  // Ref so the unmount cleanup always sees the latest value, not the
  // stale mount-time value that a [] closure would capture.
  const valueRef = useRef(value);

  // Keep callback and value ref fresh without retriggering other effects.
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);
  useEffect(() => {
    valueRef.current = value;
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

  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      rows={rows}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="w-full resize-none rounded-md border-0 bg-surface-container-low px-4 py-3 text-sm font-medium text-foreground placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
    />
  );
}
