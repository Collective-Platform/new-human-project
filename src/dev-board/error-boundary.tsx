"use client";

import { Component, type ReactNode } from "react";

// Shows a plain message when a real data component fails in "Local DB" mode,
// most often because the local database is behind the code (missing migration).
export class LiveErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="space-y-2 p-6 text-sm text-foreground/80">
        <p className="font-semibold">This screen could not load from the local database.</p>
        <p>
          The local database may be behind the code (a migration has not run). Check{" "}
          <code>psql new_human_dev -c &quot;\d nhp.task_completions&quot;</code> for a{" "}
          <code>plan_id</code> column. Ask before running <code>pnpm db:migrate</code>.
        </p>
        <p className="break-words text-xs text-foreground/50">{this.state.error.slice(0, 240)}</p>
      </div>
    );
  }
}
