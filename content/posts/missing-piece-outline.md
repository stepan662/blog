---
title: "My missing piece for React — OUTLINE"
date: 2026-06-26
draft: true
---

<!-- Working outline for missing-piece.md — not for publishing. -->

## Intro — the contradiction (hook)

- I once wrote an article titled ["React doesn't need a state management tool"](https://dev.to/tolgee_i18n/react-doesnt-need-state-management-tool-i-said-31l4).
- Then I went and built one. This post is about that — `react-arven`.
- Resolution up front: I still believe it. react-arven is **not** a state store like Redux — it doesn't own any state. It's a state **orchestrator** that combines the stores you already have.
- Keep it short — a couple of sentences of "line of thinking", then get to the point.

## The state management gap

- React's API is minimal on purpose — rendering + components, the rest is up to you.
- That minimalism is also the biggest gap: state management.
- Redux was the original answer: one global store, any component subscribes to any slice.
- Problem: a single global store breaks component isolation. Fine for niche "everything connected to everything" apps, a burden for apps with multiple routes/pages.

## Specialized tools cover ~80%

- My approach shifted to specialized tools for specialized tasks: react-query/swr for fetching, formik for forms, zustand for ad-hoc shared state.
- Covers ~80% of state management. The rest is local component state.
- This is the world of article #1: you don't need a dedicated state tool.

## The missing 20% — combining tools

- The painful part is the remaining 20%: when you have to *combine* these tools.
- Concrete example: a complex main view — highly optimized infinite-scroll list with an inline editor.
  - (Same view I optimized to the bone in ["Faster — optimizing a React app to the bone"](https://dev.to/tolgee_i18n/faster-optimizing-react-app-to-the-bone-21kc) — link out for the perf story instead of re-explaining re-renders/memo/virtualization.)
- State had to be centralized per-view (mini-redux-store-per-view) for optimization: keep fetched items in one place to update without refetching, track currently edited value, etc.
- Friction: a zustand store can hold editor state — fine. But combining it with data fetched via react-query (which lives in the React tree) means passing props/context — not performant.

## What was actually missing: state orchestration

- I didn't need another store. I needed to *orchestrate* the stores I already had — react-query has its own, zustand has its own — into one combined, subscribable API.
- Children should read from it without caring where each piece comes from.
- Found [use-context-selector](https://github.com/dai-shi/use-context-selector) — gets most of the way there.
- Note: since React 18 you can build selectable context yourself with `useSyncExternalStore`.
- But one piece was still missing.

## The piece that was missing: stable actions

- Show the naive `use-context-selector` provider (state + actions mixed in one object).
- The construction exists for performance — and quietly defeats itself: `updateItem` is re-created every render, so subscribers re-render on every context change.
- The "fix" is `useCallback`, but it depends on `value`, so `value` goes in deps and you're back to re-creating it.
- Everyone who uses React knows this dance. It's unnecessary — we want actions to behave like a React state setter: stable even as the state they close over changes.

## The solution: separate state from actions

- Idea after a few iterations: split **state** (subscribable, changes often) from **actions** (stable, identity never changes).
- Show the two-object version (`state` vs `actions`).
- Mirror `actions` with a stable proxy via `useRef` — created once, functions always call through to the latest implementation. (Show the `currentActionsRef` / `stableActionsRef` snippet.)
- Now state is subscribable, actions are stable — both go through context, subscribing to an action never re-renders.
- Tie-back to article #1: that article had *one* stable dispatch via `useRef`; this generalizes it to a whole object of stable actions (with nesting).

## Comfort vs. speed — react-arven inverts the tradeoff

- Borrow the line from article #2: "optimizations are tradeoffs — you exchange comfort for speed."
- react-arven is the rare optimization that buys comfort *back*: selective-subscription performance + stable references, without the `useCallback`/`useRef`/dependency-array dance.
- Reframes "stable actions" from a clever trick into "how to stop paying for the trick."
- Mention the **children-as-props** optimization (from article #1) — passing children through the Provider so they aren't recreated on state change; part of why the pattern is fast, and react-arven handles it for you.

## react-arven — the result

- Packaged into a library. Show the `createProvider` API:
  - `createProvider(() => ({ state, actions }))` returns `[Provider, useActions, useState]`.
- Callback runs as a regular React component → you can use any hooks inside (react-query, zustand, useState). This is the orchestration point.
- Types inferred for both hooks.
- `actions` must be a plain object of functions; nesting allowed (upgrade over the hand-rolled version).

## How to use it (and when not to)

- Even with this, prefer plain local component state where you can.
- In practice: one truly global store (logged-in user, dark mode, …) + only ~4 others.
- Works through React context → only the subtree under a Provider can access that state → nicely encapsulates each store to the part of the app that needs it.

## Closing

- TODO: repo / npm link.
- Optional: where the name "arven" comes from.
- Tie back to the "missing piece" framing — and to "React doesn't need a state management tool… it needed an orchestrator."
