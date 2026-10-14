"use client";

import { type ReactNode } from "react";

/**
 * Minimal, dependency-free Markdown renderer for assistant replies.
 *
 * The model returns a small, predictable subset of Markdown (bold, italics,
 * inline code, links, bullets, numbered lists, headings, fenced code and
 * blockquotes). Rather than pull the whole remark/rehype ecosystem, this parses
 * that subset and emits React elements — never HTML strings — so it is
 * inherently XSS-safe.
 */

const INLINE_RE =
  /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;

  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.82em] text-slate-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
      if (link) {
        nodes.push(
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#2563EB] underline decoration-[#2563EB]/30 underline-offset-2 hover:decoration-[#2563EB]"
          >
            {link[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string }
  | { type: "hr" };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const isBlockStart = (line: string): boolean =>
    /^```/.test(line.trim()) ||
    /^(#{1,6})\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^[-*+]\s+/.test(line) ||
    /^\d+[.)]\s+/.test(line) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim());

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (/^```/.test(line.trim())) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        code.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items: string[] = [];
      while (i < lines.length) {
        const nextBullet = /^[-*+]\s+(.*)$/.exec(lines[i]);
        const nextNumbered = /^\d+[.)]\s+(.*)$/.exec(lines[i]);
        if (ordered && nextNumbered) {
          items.push(nextNumbered[1]);
        } else if (!ordered && nextBullet) {
          items.push(nextBullet[1]);
        } else {
          break;
        }
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i])) {
      paragraph.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function headingClass(level: number): string {
  if (level <= 1) return "text-base font-bold text-slate-800";
  if (level === 2) return "text-[15px] font-semibold text-slate-800";
  return "text-sm font-semibold text-slate-700";
}

export function MarkdownText({
  content,
  streaming = false,
}: {
  content: string;
  streaming?: boolean;
}) {
  const blocks = parseBlocks(content);
  const caret = streaming ? (
    <span
      className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-sm bg-[#2563EB]"
      aria-hidden="true"
    />
  ) : null;

  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.map((block, index) => {
        const key = `b-${index}`;
        const isLast = index === blocks.length - 1;
        const trailing = isLast ? caret : null;

        switch (block.type) {
          case "paragraph":
            return (
              <p key={key}>
                {renderInline(block.text, key)}
                {trailing}
              </p>
            );
          case "heading":
            return (
              <p key={key} className={headingClass(block.level)}>
                {renderInline(block.text, key)}
                {trailing}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="border-l-2 border-slate-300 pl-3 text-slate-500"
              >
                {renderInline(block.text, key)}
                {trailing}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[12px] leading-relaxed text-slate-100"
              >
                <code>{block.text}{trailing}</code>
              </pre>
            );
          case "hr":
            return <hr key={key} className="border-slate-200" />;
          case "list":
            return block.ordered ? (
              <ol key={key} className="list-decimal space-y-1 pl-5 marker:text-slate-400">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </li>
                ))}
                {trailing}
              </ol>
            ) : (
              <ul key={key} className="list-disc space-y-1 pl-5 marker:text-slate-400">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </li>
                ))}
                {trailing}
              </ul>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}