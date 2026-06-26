---
title: "Hello, world"
date: 2026-06-26
draft: false
tags: ["meta"]
---

This is the first post on the new site. It's written in **Markdown** — every
post is just a `.md` file under `content/posts/`.

## Why a blog?

A place to think out loud. Short notes, longer essays, whatever's on my mind.
No algorithm, no comments to moderate, no newsletter pop-up.

## How posts work

To write a new post, run:

```sh
hugo new posts/my-new-post.md
```

That creates a Markdown file with the front matter already filled in. Write,
save, and `hugo server` shows it live. When you're happy, set `draft: false`
(or leave it off) and push — GitHub Actions builds and deploys the rest.

Markdown gives you everything you'd expect:

- **bold** and *italic* text
- [links](https://gohugo.io)
- lists, like this one
- `inline code` and fenced code blocks

> And blockquotes, for when you're feeling profound.

```python
def greet(name: str) -> str:
    return f"hello, {name}"

print(greet("world"))
```

That's it. More soon.
