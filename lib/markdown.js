/**
 * Markdown helpers for message bubbles.
 *
 * Bare http(s) URLs are wrapped in markdown link syntax so they render as
 * clickable links, while content inside code fences is left untouched (a URL
 * in a code sample is code, not a link). URLs already written as markdown
 * links (`[text](url)`) are skipped via a lookbehind so they are never
 * double-wrapped.
 */
export function wrapBareUrls(text) {
  if (typeof text !== "string" || !text.includes("http")) return text;
  const fenceRe = /^\s*(```|~~~)\s*$/;
  const urlRe = /(?<![\\(\\[])(https?:\/\/[^\s<>"'()\[\]]+)/g;
  const trailingPunct = /[.,;:!?]+$/;

  let inCode = false;
  return text
    .split("\n")
    .map((line) => {
      if (fenceRe.test(line)) {
        inCode = !inCode;
        return line;
      }
      if (inCode) return line;
      return line.replace(urlRe, (url) => {
        const trimmed = url.replace(trailingPunct, "");
        // Sentence punctuation after the URL stays outside the link.
        const suffix = url.slice(trimmed.length);
        return `[${trimmed || url}](${trimmed || url})${suffix}`;
      });
    })
    .join("\n");
}
