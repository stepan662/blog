# Social cards

`generate.mjs` renders the 1200×630 image that X, LinkedIn, Slack, Discord,
Bluesky, Mastodon and Reddit show when someone shares a link here.

```sh
node tools/og/generate.mjs
```

It writes one PNG per published post to `static/blog/og/<content-basename>.png`,
plus `default.png` for the home page, the post list and tag pages. **Commit the
output** — the build just serves the files, so nothing regenerates in CI.

Re-run it whenever you add a post or change a title, then commit. A post with no
card falls back to `default.png` rather than breaking, so forgetting is
survivable, just wasteful — the title *is* the artwork here, and a generic card
converts far worse than the real headline.

If a headline sets badly on a card (too long, or it needs a shorter hook), add
`ogTitle` to the post's front matter. It only affects the card; the page keeps
its own title.

## How it works

The card is plain HTML screenshotted by headless Chrome — no dependencies, and
the design stays editable as CSS inside `generate.mjs`. Colours come from the
light scheme in `static/style.css`, so the cards look like the site.

Chrome is expected at the macOS default path. Override with `CHROME_PATH=…`.

Output has to be a raster format: no crawler renders SVG, so the site's own
diagrams can't double as cards.
