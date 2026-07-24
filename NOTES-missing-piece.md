# Editing notes — "My missing piece for React"

Working checklist for `content/posts/missing-piece-outline.md`. Tackle one at a time.
(This file lives at repo root so Hugo ignores it — delete when done.)

---

## A. Substance / structure (need your input — shapes the piece)

- [x] **A1. Address the strongest alternative: Jotai / Valtio.** ✅ DONE
  Added two paragraphs to "Existing solutions": (1) Jotai = source vs.
  react-arven = combinator; (2) origin-agnostic beat — state can come from
  useState / useQuery / URL (nuqs, useSearchParams), consumers don't know the
  source, swap-to-URL-in-the-provider refactoring win. Dropped `useForm` (RHF is
  uncontrolled + has its own context, so it's a bad example).

- [x] **A2. Credit prior art + say what react-arven adds.** ✅ DONE
  - #1: aside crediting `use-context-selector`; clarified react-arven has its
    OWN impl on `useSyncExternalStore` (+ `use-sync-external-store` shim for
    React < 18) — not a dependency. Ties to the 1.2KB / "half is polyfill" line.
  - #3: aside crediting React's `useEvent` / `useEffectEvent` proposal.
  - Value-add sentence in both: react-arven wires it into the provider / applies
    it to every action, so you never hand-write the trick.

- [x] **A3. Show, don't assert, the performance win.** ⏭️ CUT (intentional)
  Dropped to keep the article short — asserting the perf win is fine. Could
  revisit later with a React DevTools "Highlight updates" GIF if desired.

- [x] **Length pass.** ✅ DONE
  Front half was five setup sections with repeated ideas. Merged Intro + The 20%
  gap into one "Intro"; merged "What is actually missing?" + "But is it really
  all bad?" + the Meet react-arven intro into two tight sections; removed the
  redundant "bad practice" restatement. Technical sections #1/#2/#3 left intact.

## B. Correctness fixes (mechanical — I can just do these)

- [x] **B1. Inverted sentence.** ✅ → "the wrapper can re-render **without** touching the children."

- [x] **B2. State/selector name mismatch.** ✅ Made state expose `value`:
  `const state = { value: formState.value }` — now aligns with `useFormState(c => c.value)`.

- [x] **B3. Broken JSX `<button>Submit<button>` → `</button>` (both spots).** ✅

- [x] **B4. Typo pass.** ✅
  Fixed: paralesis→paralysis, "into into", "a small shared states", "source of a
  state", "regardless of where", endup→"end up", dismouts→unmount, "able to
  provide single value", "He's…himself"→"It's…itself", "hard do explain", "an
  callback", the Typescript sentence ("is inferred"→"are inferred"),
  "there are that there are", "on a pretty large project".
  (environmet / effortles / livecycle / contreoller / yayks were already removed
  by the earlier merges.)

## C. Housekeeping

- [ ] **C1. Consolidate the two files.**
  `missing-piece-outline.md` (this, the stronger draft) vs `missing-piece.md`
  (older). Same title + date, both `draft: true`. Keep this one, fold in the
  use-context-selector credit from the old one, delete the duplicate.

- [ ] **C2. Remove the "Working outline — not for publishing" comment (line ~9)**
  once this becomes the real post. Consider renaming file to `missing-piece.md`.
