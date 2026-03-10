import React from "react";
import { cn } from "@/lib/utils";

interface ChatMessageContentProps {
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
}

/**
 * Renders chat message content with simple markdown support:
 * - **bold** → <strong>
 * - Bullet points (• or - at line start) → styled list
 * - Line breaks preserved
 * - Animated cursor when streaming
 */
export function ChatMessageContent({ content, isUser, isStreaming = false }: ChatMessageContentProps) {
  if (isUser) {
    return <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let key = 0;

  const flushList = () => {
    if (currentList.length === 0) return;
    elements.push(
      <ul key={key++} className="space-y-1.5 my-2">
        {currentList.map((item, i) => (
          <li key={i} className="flex gap-2 text-[15px] leading-relaxed">
            <span className="shrink-0 mt-0.5">•</span>
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    currentList = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^\s*[•\-\*]\s+(.+)/);

    if (bulletMatch) {
      currentList.push(bulletMatch[1]);
    } else {
      flushList();
      if (line.trim() === "") {
        // Only add spacer if not at start/end
        if (i > 0 && i < lines.length - 1) {
          elements.push(<div key={key++} className="h-2" />);
        }
      } else {
        elements.push(
          <p key={key++} className="text-[15px] leading-relaxed">
            {renderInline(line)}
          </p>
        );
      }
    }
  }
  flushList();

  return (
    <div className="space-y-0.5">
      {elements}
      {isStreaming && <StreamingCursor />}
    </div>
  );
}

/** Animated typing cursor with fade-out on disappear */
function StreamingCursor() {
  return (
    <span
      className="inline-block w-[3px] h-[18px] bg-primary/70 rounded-full align-text-bottom ml-0.5 transition-opacity duration-300"
      style={{
        animation: "cursor-blink 0.8s ease-in-out infinite",
      }}
    />
  );
}

/** Render inline markdown: **bold** and *italic* */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*([^*]+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(
        <strong key={i++} className="font-semibold">
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      parts.push(
        <em key={i++} className="italic">
          {match[2]}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
