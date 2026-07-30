# Social card

`generate.mjs` renders `static/blog/og/default.png` — the image X, LinkedIn,
Slack, Discord, Bluesky, Mastodon and Reddit show when someone shares a link
here.

```sh
node tools/og/generate.mjs
```

**Commit the output** — the build just serves the file, nothing regenerates in
CI. You only need to re-run this if you change the card design; it doesn't
depend on posts, so adding or retitling one changes nothing.

## Why one card for every page

Every unfurl already prints the post's title and description next to the image.
Putting the title *inside* the image too just says it twice, which reads as a
mistake. So the card carries the site's mark instead — the favicon gem and the
wordmark — and does brand recognition rather than selling one specific article.

The tradeoff is real: a per-post title card sells an individual post harder.
If you ever want that for one post, set `image: /some/card.png` in its front
matter and `layouts/partials/seo.html` will use it instead.

## Editing it

Colours are the dark scheme from `static/style.css`; the light values are noted
in a comment if you want to flip it. `WORDMARK` and `TAGLINE` are constants at
the top of the script.

The card is plain HTML screenshotted by headless Chrome — no dependencies, and
the design stays editable as CSS inside `generate.mjs`. Chrome is expected at
the macOS default path; override with `CHROME_PATH=…`.

Output has to be a raster format: no crawler renders SVG, so `favicon.svg`
can't be pointed at directly.
