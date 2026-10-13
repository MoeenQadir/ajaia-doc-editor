/**
 * Converts rich text HTML content from the editor into clean Markdown.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let md = html;

  // Clean empty tags
  md = md.replace(/<p><\/p>/gi, "");

  // Convert Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n\n# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n\n### $1\n\n");

  // Bold & Italic
  md = md.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, "**$2**");
  md = md.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, "*$2*");

  // Code
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

  // Lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, items) => {
    return (
      "\n\n" +
      items
        .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
        .trim() +
      "\n\n"
    );
  });

  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, items) => {
    let index = 1;
    return (
      "\n\n" +
      items
        .replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`)
        .trim() +
      "\n\n"
    );
  });

  // Paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n\n$1\n\n");

  // Line breaks
  md = md.replace(/<br\s*[\/]?>/gi, "\n");

  // Strip any remaining HTML tags
  md = md.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  md = md
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Normalize excessive newlines
  md = md.replace(/\n{3,}/g, "\n\n").trim();

  return md;
}

/**
 * Triggers a browser file download for text/blob data.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain"
) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

