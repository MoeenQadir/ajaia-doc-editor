import { describe, it, expect } from "vitest";
import { parseTxtToHtml, parseMdToHtml, sanitizeHtml } from "../lib/fileParser";

describe("File Parser & Ingestion Suite", () => {
  it("parses plain text into paragraphs and line breaks", () => {
    const raw = "Paragraph 1\nStill paragraph 1\n\nParagraph 2";
    const html = parseTxtToHtml(raw);
    expect(html).toContain("<p>Paragraph 1<br />Still paragraph 1</p>");
    expect(html).toContain("<p>Paragraph 2</p>");
  });

  it("parses markdown headings, lists, bold, and italics", () => {
    const md = `# Main Title
## Section 2
- Bullet 1
- Bullet 2
1. First
2. Second

Some **bold** and *italic* text.`;

    const html = parseMdToHtml(md);
    expect(html).toContain("<h1>Main Title</h1>");
    expect(html).toContain("<h2>Section 2</h2>");
    expect(html).toContain("<ul><li>Bullet 1</li><li>Bullet 2</li></ul>");
    expect(html).toContain("<ol><li>First</li><li>Second</li></ol>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("sanitizes HTML to prevent script injection", () => {
    const malicious = `<p>Safe text</p><script>alert('xss')</script><iframe src="evil.com"></iframe><img src="x" onerror="alert(1)">`;
    const cleaned = sanitizeHtml(malicious);
    expect(cleaned).toContain("<p>Safe text</p>");
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("<iframe");
    expect(cleaned).not.toContain("onerror");
  });
});
