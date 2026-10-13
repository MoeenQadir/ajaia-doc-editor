import mammoth from "mammoth";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Parses plain text into HTML paragraphs.
 * Double linebreaks denote separate paragraphs, single linebreaks denote <br/>.
 */
export function parseTxtToHtml(text: string): string {
  if (!text || text.trim() === "") {
    return "<p></p>";
  }

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const paragraphs = normalized.split(/\n\n+/);

  return paragraphs
    .map((p) => {
      const clean = p.trim();
      if (!clean) return "";
      const escaped = escapeHtml(clean).replace(/\n/g, "<br />");
      return `<p>${escaped}</p>`;
    })
    .filter(Boolean)
    .join("");
}

/**
 * Parses markdown into clean HTML tags (h1, h2, h3, bold, italic, lists, paragraphs).
 */
export function parseMdToHtml(markdown: string): string {
  if (!markdown || markdown.trim() === "") {
    return "<p></p>";
  }

  const normalized = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  const output: string[] = [];
  let inUl = false;
  let inOl = false;
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      const inline = formatInline(paragraphBuffer.join(" "));
      if (inline.trim()) {
        output.push(`<p>${inline.trim()}</p>`);
      }
      paragraphBuffer = [];
    }
  }

  function flushLists() {
    if (inUl) {
      output.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      output.push("</ol>");
      inOl = false;
    }
  }

  function formatInline(str: string): string {
    let res = escapeHtml(str);
    // inline code
    res = res.replace(/`([^`]+)`/g, "<code>$1</code>");
    // bold
    res = res.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    res = res.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    // italic
    res = res.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    res = res.replace(/_([^_]+)_/g, "<em>$1</em>");
    return res;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      flushLists();
      continue;
    }

    // Heading 1
    if (/^#\s+/.test(trimmed)) {
      flushParagraph();
      flushLists();
      const content = formatInline(trimmed.replace(/^#\s+/, ""));
      output.push(`<h1>${content}</h1>`);
      continue;
    }

    // Heading 2
    if (/^##\s+/.test(trimmed)) {
      flushParagraph();
      flushLists();
      const content = formatInline(trimmed.replace(/^##\s+/, ""));
      output.push(`<h2>${content}</h2>`);
      continue;
    }

    // Heading 3
    if (/^###\s+/.test(trimmed)) {
      flushParagraph();
      flushLists();
      const content = formatInline(trimmed.replace(/^###\s+/, ""));
      output.push(`<h3>${content}</h3>`);
      continue;
    }

    // Unordered list item (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (inOl) {
        output.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        output.push("<ul>");
        inUl = true;
      }
      output.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list item (1., 2., etc.)
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (inUl) {
        output.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        output.push("<ol>");
        inOl = true;
      }
      output.push(`<li>${formatInline(olMatch[1])}</li>`);
      continue;
    }

    // Regular line inside a paragraph
    flushLists();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushLists();

  return output.join("") || "<p></p>";
}

/**
 * Parses .docx file buffer using mammoth into clean HTML.
 */
export async function parseDocxToHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  return result.value || "<p></p>";
}

/**
 * Main parser entrypoint based on file extension.
 */
export async function parseFileToHtml(
  fileName: string,
  buffer: Buffer
): Promise<{ title: string; html: string }> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const baseTitle = fileName.replace(/\.[^/.]+$/, "") || "Imported Document";

  let html = "<p></p>";

  if (ext === "docx") {
    html = await parseDocxToHtml(buffer);
  } else if (ext === "md" || ext === "markdown") {
    const text = buffer.toString("utf-8");
    html = parseMdToHtml(text);
  } else if (ext === "txt") {
    const text = buffer.toString("utf-8");
    html = parseTxtToHtml(text);
  } else {
    // Fallback to text parsing
    const text = buffer.toString("utf-8");
    html = parseTxtToHtml(text);
  }

  return {
    title: baseTitle,
    html,
  };
}

