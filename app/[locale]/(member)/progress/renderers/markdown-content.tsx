import Markdown from "react-markdown";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="font-headline text-2xl font-bold text-foreground mt-3">{children}</h1>
  ),
  hr: () => <hr className="my-4 border-t border-primary/40" />,
  p: ({ children }) => <p className="mb-2">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground/80">{children}</strong>
  ),
  ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
};

const inlineMarkdownComponents: Components = {
  ...markdownComponents,
  p: ({ children }) => <>{children}</>,
};

type MarkdownBlock = { type: "markdown"; value: string } | { type: "table"; rows: string[][] };

export function MarkdownContent({
  children,
  tableLayout = "default",
}: {
  children: string;
  tableLayout?: "default" | "stacked-overview";
}) {
  if (!children.trim()) return null;

  return (
    <>
      {parseMarkdownBlocks(children).map((block, index) => {
        if (block.type === "table") {
          const [header, separator, ...rows] = block.rows;
          const alignments = separator.map(getAlignment);

          if (tableLayout === "stacked-overview" && header.length === 4 && rows.length === 1) {
            return (
              <div key={index} className="my-4 overflow-hidden rounded-2xl">
                <table className="w-full border-collapse text-left">
                  <tbody>
                    {header.map((cell, cellIndex) => (
                      <MovementOverviewRow
                        key={cellIndex}
                        heading={cell}
                        markdown={rows[0][cellIndex] ?? ""}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          return (
            <div key={index} className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr>
                    {header.map((cell, cellIndex) => (
                      <th
                        key={cellIndex}
                        className="border border-zinc-200 text-sm bg-zinc-100 px-3 py-2 font-semibold text-primary"
                        style={{ textAlign: alignments[cellIndex] }}
                      >
                        <Markdown components={inlineMarkdownComponents}>{cell}</Markdown>
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
                          className="border border-zinc-200 px-3 py-2 text-lg align-top"
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

function MovementOverviewRow({ heading, markdown }: { heading: string; markdown: string }) {
  const { movement, title, days } = splitMovementHeading(heading);

  return (
    <>
      <tr>
        <th
          scope="col"
          className="border border-zinc-200 bg-surface-container-high px-4 py-4 text-left align-top"
        >
          <span className="block text-sm font-semibold leading-5 text-primary">{movement}</span>
          <span className="mt-1 block font-headline text-lg font-semibold leading-6 text-foreground">
            {title}
          </span>
          <span className="mt-1 block text-sm font-medium leading-5 text-on-surface-variant">
            {days}
          </span>
        </th>
      </tr>
      <tr>
        <td className="border border-zinc-200 px-4 py-4 text-base leading-7 text-foreground align-top">
          <Markdown components={inlineMarkdownComponents}>{markdown}</Markdown>
        </td>
      </tr>
    </>
  );
}

function splitMovementHeading(heading: string): {
  movement: string;
  title: string;
  days: string;
} {
  const match = /^(MOVEMENT\s+\d+|行动[一二三四])\s+(.+?)\s+_([^_]+)_$/.exec(heading.trim());
  if (!match) return { movement: heading, title: "", days: "" };

  return { movement: match[1], title: match[2], days: match[3] };
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
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
}

function getAlignment(cell: string): React.CSSProperties["textAlign"] {
  const value = cell.replace(/\s/g, "");
  if (value.startsWith(":") && value.endsWith(":")) return "center";
  if (value.endsWith(":")) return "right";
  return "left";
}
