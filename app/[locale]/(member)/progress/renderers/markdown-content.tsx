"use client";

import Markdown from "react-markdown";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground/80">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
};

const inlineMarkdownComponents: Components = {
  ...markdownComponents,
  p: ({ children }) => <>{children}</>,
};

type MarkdownBlock =
  | { type: "markdown"; value: string }
  | { type: "table"; rows: string[][] };

export function MarkdownContent({ children }: { children: string }) {
  if (!children.trim()) return null;

  return (
    <>
      {parseMarkdownBlocks(children).map((block, index) => {
        if (block.type === "table") {
          const [header, separator, ...rows] = block.rows;
          const alignments = separator.map(getAlignment);

          return (
            <div key={index} className="my-4 overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-left text-xs">
                <thead>
                  <tr>
                    {header.map((cell, cellIndex) => (
                      <th
                        key={cellIndex}
                        className="border border-zinc-200 bg-zinc-100 px-3 py-2 font-semibold text-foreground"
                        style={{ textAlign: alignments[cellIndex] }}
                      >
                        <Markdown components={inlineMarkdownComponents}>
                          {cell}
                        </Markdown>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {header.map((_, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-zinc-200 px-3 py-2 align-top"
                          style={{ textAlign: alignments[cellIndex] }}
                        >
                          <Markdown components={inlineMarkdownComponents}>
                            {row[cellIndex] ?? ""}
                          </Markdown>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <Markdown key={index} components={markdownComponents}>
            {block.value}
          </Markdown>
        );
      })}
    </>
  );
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let markdownLines: string[] = [];

  function flushMarkdown() {
    const value = markdownLines.join("\n").trim();
    if (value) blocks.push({ type: "markdown", value });
    markdownLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    if (isTableSeparator(lines[i + 1]) && lines[i].includes("|")) {
      flushMarkdown();

      const rows = [splitTableRow(lines[i]), splitTableRow(lines[i + 1])];
      i += 2;

      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }

      blocks.push({ type: "table", rows });
      i--;
    } else {
      markdownLines.push(lines[i]);
    }
  }

  flushMarkdown();
  return blocks;
}

function splitTableRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string | undefined): boolean {
  if (!line) return false;

  const cells = splitTableRow(line);
  return (
    cells.length > 1 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))
  );
}

function getAlignment(cell: string): React.CSSProperties["textAlign"] {
  const value = cell.replace(/\s/g, "");
  if (value.startsWith(":") && value.endsWith(":")) return "center";
  if (value.endsWith(":")) return "right";
  return "left";
}
