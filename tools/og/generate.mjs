/* ------------------------------------------------------------------
   Generates the 1200x630 social card for every post into
   static/blog/og/<content-basename>.png, plus a site-wide default.png.

   Run it after adding or retitling a post:  node tools/og/generate.mjs

   The card is laid out as HTML and screenshotted with headless Chrome —
   no dependencies, no image library, and the design stays editable as CSS.
   The output has to be a raster format: no crawler renders SVG, so the
   site's own diagrams can't double as cards.

   layouts/partials/seo.html picks each file up by name; a post with no
   generated card silently falls back to default.png, so a failed run
   degrades instead of shipping a broken og:image.
------------------------------------------------------------------ */

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const POSTS = join(ROOT, "content/posts");
const OUT = join(ROOT, "static/blog/og");

const CHROME = process.env.CHROME_PATH
  ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/* Palette lifted from static/style.css — the light scheme. A card is one fixed
   image shown against both light and dark feeds, so it can't adapt; the light
   scheme is the site's primary identity and reads cleanly on either. */
const C = {
  bg: "#f7f7f4",
  fg: "#1c1c1c",
  muted: "#6b6b6b",
  accent: "#b5532b",
  line: "#d7d7d1",
};

/* Minimal front-matter reader: these files are hand-written with a flat
   YAML head, so a real parser would be a dependency for no gain. */
function frontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
    data[kv[1]] = v;
  }
  return { data, body: raw.slice(m[0].length) };
}

/* Hugo's own reading time: ceil(words / 213). Kept in step so the card and
   the page never disagree about the same post. */
const readingTime = (body) =>
  Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 213));

/* Monospace makes the line count predictable: ~0.6em per character across the
   1056px content box. Step the size down until the title fits three lines,
   which is the most the layout holds without crowding the footer. */
function titleSize(title) {
  for (const px of [64, 56, 48, 42, 36]) {
    const perLine = Math.floor(1056 / (px * 0.6));
    if (estimateLines(title, perLine) <= 3) return px;
  }
  return 36;
}

/* Wrap on whole words, the way the browser will. */
function estimateLines(text, perLine) {
  let lines = 1, len = 0;
  for (const word of text.split(" ")) {
    if (len === 0) { len = word.length; continue; }
    if (len + 1 + word.length > perLine) { lines++; len = word.length; }
    else len += 1 + word.length;
  }
  return lines;
}

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const GEM = `
<svg viewBox="0 0 32 32" width="44" height="44" aria-hidden="true">
  <polygon points="9,6 23,6 29,13 16,28 3,13" fill="${C.accent}"/>
  <g stroke="${C.bg}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round" fill="none" opacity="0.9">
    <line x1="3" y1="13" x2="29" y2="13"/>
    <line x1="9" y1="6" x2="12.5" y2="13"/>
    <line x1="23" y1="6" x2="19.5" y2="13"/>
    <line x1="12.5" y1="13" x2="16" y2="28"/>
    <line x1="19.5" y1="13" x2="16" y2="28"/>
    <line x1="3" y1="13" x2="16" y2="28"/>
    <line x1="29" y1="13" x2="16" y2="28"/>
  </g>
</svg>`;

function card({ title, kicker }) {
  return `<!doctype html>
<meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: ${C.bg};
    color: ${C.fg};
    font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
    padding: 68px 72px 60px;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }
  /* A hairline of accent down the left edge — the same terracotta the site
     uses for links, so the card is recognisable at thumbnail size. */
  body::before {
    content: ""; position: fixed; left: 0; top: 0; bottom: 0; width: 10px;
    background: ${C.accent};
  }
  .brand {
    display: flex; align-items: center; gap: 16px;
    font-size: 24px; color: ${C.muted}; letter-spacing: .04em;
  }
  h1 {
    flex: 1; display: flex; align-items: center;
    font-size: ${titleSize(title)}px;
    font-weight: 700; line-height: 1.3; letter-spacing: -.02em;
    padding: 40px 0;
  }
  .foot { font-size: 24px; color: ${C.muted}; }
  .rule { color: ${C.line}; letter-spacing: .1em; margin-bottom: 18px; overflow: hidden; white-space: nowrap; }
  .prompt { color: ${C.accent}; }
</style>
<div class="brand">${GEM}<span>granat.blog</span></div>
<h1>${escape(title)}</h1>
<div class="foot">
  <div class="rule">${"-".repeat(120)}</div>
  <span class="prompt">&gt;</span> ${escape(kicker)}
</div>`;
}

function shoot(html, outPath) {
  const tmp = join(tmpdir(), `og-${Math.abs(hash(outPath))}.html`);
  writeFileSync(tmp, html);
  execFileSync(CHROME, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    `--screenshot=${outPath}`,
    `file://${tmp}`,
  ], { stdio: "pipe" });
  rmSync(tmp, { force: true });
}

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

mkdirSync(OUT, { recursive: true });

const cards = [
  { name: "default", title: "Štěpán Granát", kicker: "web, React, and things I got wrong · granat.blog" },
];

for (const file of readdirSync(POSTS).filter((f) => f.endsWith(".md") && f !== "_index.md")) {
  const { data, body } = frontMatter(readFileSync(join(POSTS, file), "utf8"));
  if (data.draft === "true") continue;
  cards.push({
    name: file.replace(/\.md$/, ""),
    /* `ogTitle` lets a post override a title that's too long to set well on a
       card, without changing the headline on the page. */
    title: data.ogTitle || data.title || file,
    kicker: `${data.date} · ${readingTime(body)} min read`,
  });
}

for (const c of cards) {
  const out = join(OUT, `${c.name}.png`);
  shoot(card(c), out);
  console.log(`  ${c.name}.png  ${JSON.stringify(c.title)}`);
}
console.log(`\n${cards.length} card(s) written to static/blog/og/`);
