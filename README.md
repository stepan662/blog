# Štěpán's web and blog

Personal site and blog, built with [Hugo](https://gohugo.io/) and deployed to
GitHub Pages at **[granat.blog](https://granat.blog/)**.

## Requirements

- **Hugo extended**, v0.163.3 or newer.

  ```bash
  # macOS
  brew install hugo

  # verify — the version string must contain "extended"
  hugo version
  ```

## Development

Run the live-reload dev server:

```bash
hugo server -D
```

Then open <http://localhost:1313/>.

The `-D` flag includes **drafts** (posts with `draft: true` in their front
matter). Without it, unpublished posts won't show up.

Useful variations:

```bash
hugo server            # published content only, as it appears in production
hugo server -D --navigateToChanged   # jump the browser to the page you just edited
```

## Writing a post

Create a new post from the archetype:

```bash
hugo new content posts/my-post.md
```

New posts start as `draft: true`. Set it to `false` (or remove the line) when
the post is ready to publish. Front matter lives at the top of each Markdown
file:

```markdown
---
title: "My post title"
date: 2026-07-23
draft: true
tags: []
---
```

## Building

Produce the static site into `public/` (matches the CI build):

```bash
hugo --gc --minify
```

`public/` and `resources/_gen/` are build output and are git-ignored.

## Project layout

```
content/       Markdown content (posts/ holds blog entries, _index.md the section fronts)
layouts/       HTML templates (baseof, single, list, partials, home, 404)
static/        Assets copied verbatim to the site root (style.css, favicons, CNAME, images)
archetypes/    Front-matter template for `hugo new`
hugo.toml      Site configuration
public/        Generated output (git-ignored)
```

## Deployment

Pushing to `main` triggers the
[GitHub Actions workflow](.github/workflows/hugo.yml), which builds with Hugo
and publishes to GitHub Pages. The custom domain (`granat.blog`) is set via
[`static/CNAME`](static/CNAME).

The site is built from `hugo.toml`'s `baseURL` (`https://granat.blog/`) so all
links are root-absolute for the custom-domain root — no `/blog` subpath prefix.
