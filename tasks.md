# chat-demo (Next.js web client) tasks

## Phase 1 — Markdown rendering in message bubbles

Decisions (confirmed):
- **Scope:** message bubbles only — reply previews and chat-list previews stay
  plain text.
- **Features:** `#` headings, code blocks (triple-backtick fences), `*italic*`,
  `**bold**`, `~~strikethrough~~` (GFM).
- **Bare URLs keep linking** — same `wrapBareUrls()` preprocessing as Flutter,
  replacing the linkify import.
- Backend untouched (content stored raw; rendering is client-side).

| # | Title | Description | Priority | Difficulty |
|---|-------|-------------|----------|------------|
| 1 | ✅ Add markdown deps | `react-markdown` + `remark-gfm` (strikethrough) + `remark-breaks` (single newline → line break, matching today's per-line `<p>` rendering) | High | Easy |
| 2 | ✅ `wrapBareUrls` preprocessor | JS util wrapping bare URLs as markdown links, skipping code-fence contents; drop the `linkify-react` import from `MessageItem.jsx` | High | Medium |
| 3 | ✅ `<ReactMarkdown>` in `renderContent()` | Replace the `\n`-split `<p>` + Linkify block; custom `components`: code blocks (dark, rounded, `overflow-x-auto`), links (keep current blue-underline classes), compact headings; no raw-HTML path (react-markdown escapes by default) | High | Medium |
| 4 | ⚠️ Verify (blocked in this environment) | `npm run lint` script is broken (Next 16 removed `next lint`); `npx eslint .` shows **0 issues in the changed files** (pre-existing errors elsewhere). `node --check` + a 4-case behavior test of `wrapBareUrls` pass; import path resolves. `next build` cannot run here — the process dies with `Bus error` before any output (sandbox limitation, fails identically with or without these changes). **Manual render check still pending on a real machine.** | Medium | Easy |

✅ **Done (2026-08-17):** rows 1–3 implemented — `react-markdown ^10.1.0` +
`remark-gfm` + `remark-breaks` deps; `lib/markdown.js` `wrapBareUrls()`
(bare URLs → `[url](url)`, code fences skipped, no double-wrapping, trailing
sentence punctuation kept outside); `MessageItem.jsx` renders text via
`<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>` with custom
components (blue-underline links, scrollable dark code blocks, compact
headings, lists, blockquotes, tables) and the `linkify-react` import removed.
Reply previews (`ReplyContent.jsx`) intentionally untouched. Row 4 partially
verified — full build + manual render pending on a real machine.
