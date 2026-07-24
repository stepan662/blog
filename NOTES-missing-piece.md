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

- [ ] **A3. Show, don't assert, the performance win.**
  The post claims perf but shows no measurement. Add a concrete before/after —
  even one line: "this input re-rendered every keystroke before, doesn't now."

## B. Correctness fixes (mechanical — I can just do these)

- [ ] **B1. Inverted sentence (line ~114) — most important fix.**
  "the wrapper will actually re-render touching the children" says the OPPOSITE
  of what you mean → should be "re-render **without** re-rendering the children."

- [ ] **B2. State/selector name mismatch in the final example (lines ~189–222).**
  `state = { formState }` but `InputField` does `useFormState(c => c.value)` and
  `setFormState({ value })`. Pick one name (formState vs value).

- [ ] **B3. Broken JSX: `<button>Submit<button>` → `</button>` (lines ~144 and ~228).**

- [ ] **B4. Typo pass.**
  paralesis, environmet, effortles, livecycle, contreoller, dismouts, yayks,
  "there are that there are a lot", "an callback", etc.

## C. Housekeeping

- [ ] **C1. Consolidate the two files.**
  `missing-piece-outline.md` (this, the stronger draft) vs `missing-piece.md`
  (older). Same title + date, both `draft: true`. Keep this one, fold in the
  use-context-selector credit from the old one, delete the duplicate.

- [ ] **C2. Remove the "Working outline — not for publishing" comment (line ~9)**
  once this becomes the real post. Consider renaming file to `missing-piece.md`.
