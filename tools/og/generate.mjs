/* ------------------------------------------------------------------
   Generates static/blog/og/default.png — the 1200x630 image X, LinkedIn,
   Slack, Discord, Bluesky, Mastodon and Reddit show when a link here is
   shared.

   Run:  node tools/og/generate.mjs

   One card serves the whole site. Every unfurl already prints the post's
   title and description right beside the image, so putting the title *in*
   the image just says it twice; this is the site's mark instead.

   The card is laid out as HTML and screenshotted with headless Chrome — no
   dependencies, and the design stays editable as CSS below. Output has to be
   a raster format: no crawler renders SVG, so neither the favicon nor the
   site's own diagrams can be pointed at directly.

   A post can still override it with `image: /path.png` in its front matter;
   see layouts/partials/seo.html.
------------------------------------------------------------------ */

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "static/blog/og");

const CHROME = process.env.CHROME_PATH
  ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const WORDMARK = "granat.blog";
const TAGLINE = "React, performance, and stubborn problems";

/* The dark scheme from static/style.css. A card is one fixed image shown
   against both light and dark feeds, so it can't adapt — dark wins here
   because the terracotta mark holds more contrast against #121212, which
   matters at the thumbnail size a timeline actually renders. Swap in the
   light values to flip it. */
const C = {
  bg: "#121212",
  fg: "#d6d6d2",
  muted: "#8a8a84",
  accent: "#e07a4f",
};

/* The favicon, inline — same geometry as static/favicon.svg, with the facet
   strokes recoloured to the card background so they read as cuts in the gem. */
const GEM = `
<svg viewBox="0 0 32 32" width="180" height="180" aria-hidden="true">
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

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: ${C.bg};
    color: ${C.fg};
    font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
    -webkit-font-smoothing: antialiased;
    display: flex; align-items: center; justify-content: center;
  }
  .stack { display: flex; flex-direction: column; align-items: center; }
  .mark {
    font-size: 64px; font-weight: 700; letter-spacing: -.02em; margin-top: 28px;
  }
  .sub { font-size: 26px; color: ${C.muted}; margin-top: 8px; }
</style>
<div class="stack">
  ${GEM}
  <div class="mark">${WORDMARK}</div>
  <div class="sub">${TAGLINE}</div>
</div>`;

mkdirSync(OUT, { recursive: true });
const out = join(OUT, "default.png");
const tmp = join(tmpdir(), "og-card.html");
writeFileSync(tmp, html);
execFileSync(CHROME, [
  "--headless",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1200,630",
  `--screenshot=${out}`,
  `file://${tmp}`,
], { stdio: "pipe" });
rmSync(tmp, { force: true });

console.log(`wrote ${out}`);
