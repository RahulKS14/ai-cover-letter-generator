import React from 'react';

/**
 * Parses inline markdown (bold, italic) into React elements
 */
function parseInlineMarkdown(text) {
  if (!text) return null;

  // Split by bold (**text** or __text__) and italic (*text* or _text_)
  // Tokenize regex
  const parts = [];
  const regex = /(\*\*.*?\*\*|__.*?__|(?<!\*)\*[^*]+?\*(?!\*)|(?<!_)_[^_]+?_(?!_))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') || token.startsWith('__')) {
      // Bold
      parts.push(
        <strong key={`b-${match.index}`} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') || token.startsWith('_')) {
      // Italic
      parts.push(
        <em key={`i-${match.index}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Support single newlines as line breaks within a paragraph (e.g. address block)
  const elementsWithBreaks = [];
  parts.forEach((part, pIdx) => {
    if (typeof part === 'string' && part.includes('\n')) {
      const subLines = part.split('\n');
      subLines.forEach((line, lIdx) => {
        elementsWithBreaks.push(line);
        if (lIdx < subLines.length - 1) {
          elementsWithBreaks.push(<br key={`br-${pIdx}-${lIdx}`} />);
        }
      });
    } else {
      elementsWithBreaks.push(part);
    }
  });

  return elementsWithBreaks;
}

/**
 * MarkdownParagraphs
 * Renders raw LLM markdown as clean, semantic HTML <p> paragraphs,
 * lists, and headings, rather than a single monospace block of text.
 */
export default function MarkdownParagraphs({ content }) {
  if (!content) return null;

  // Normalize line endings and split into paragraph blocks
  const normalized = content.replace(/\r\n/g, '\n').trim();
  const rawBlocks = normalized.split(/\n{2,}/);

  return (
    <div className="cover-letter-content">
      {rawBlocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Check if block is a heading (e.g. # Title, ## Subtitle, ### Heading)
        if (trimmed.startsWith('#')) {
          const levelMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (levelMatch) {
            const headingText = levelMatch[2];
            return (
              <h4 key={`h-${index}`} className="cover-letter-heading">
                {parseInlineMarkdown(headingText)}
              </h4>
            );
          }
        }

        // Check if block is a list of bullet points
        const lines = trimmed.split('\n');
        const isList = lines.every((line) => /^\s*([*\-•]|\d+\.)\s+/.test(line));

        if (isList) {
          return (
            <ul key={`ul-${index}`} className="cover-letter-list">
              {lines.map((line, liIdx) => {
                const itemText = line.replace(/^\s*([*\-•]|\d+\.)\s+/, '');
                return (
                  <li key={`li-${index}-${liIdx}`} className="cover-letter-list-item">
                    {parseInlineMarkdown(itemText)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard paragraph
        return (
          <p key={`p-${index}`} className="cover-letter-paragraph">
            {parseInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
