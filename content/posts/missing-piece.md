---
title: "React doesn't need a state management tool, I said. Then I built one."
date: 2026-06-26
draft: true
---

A while back I wrote an article with a title I stand behind to this day: [React doesn't need a state management tool](https://dev.to/tolgee_i18n/react-doesnt-need-state-management-tool-i-said-31l4). There's already a library for everything, and each new one just adds another decision to an exhausting pile.

So naturally, the next thing I did was build a React library. Before you close the tab — give me a chance. I think I have a decent excuse, and it doesn't actually contradict a word of that article.

## The other 20%

I'm a strong advocate of local state with specialized tools for specific tasks — react-query or SWR for data fetching, formik or react-hook-form for forms, and so on. For maybe 80% of the cases this works perfectly: simple forms, views with a few buttons, no problem.

But honestly, the remaining 20% often get ugly. In some parts of the app a centralized state simply **is** the better way. You might have some really complicated form, editor or some complex piece where everything is somehow connected to everything and you need to control it from one place.

## Existing solutions

The usual advice is to reach for a lightweight state manager like zustand — a mini redux store you can use anywhere. But I think that misses the point. formik, react-query, zustand — they're all *sources* of state, and I usually already have several: some data is fetched, some lives in formik, some is my own custom state. I don't want to add another source; I want to *combine* the ones I have into a single piece, and let components use it regardless of where it came from.

With zustand you get there by copying everything into the store — but then it's no longer the single source of truth, and since it lives outside React's lifecycle, it's easy to forget to clean up on unmount. Jotai gets much closer: with derived atoms and `atomWithQuery` you really can combine fetched and local state. But notice what it took — everything had to become an atom. Jotai is still a state *source*, a new primitive you build on top of. What I wanted was different: not another place to keep state, but a way to *combine* the state I already have.

## What is actually missing?

I used to reach for React Context, and conceptually it's exactly right: it gives that state a single home. You find a common ancestor, move the state up there — the same `useState`, `useQuery` and mutating functions you'd write in a local component, only now combined in one place — and pass the value and actions down. That's the whole point: one "controller" component that owns the combined state and resets automatically when it unmounts.

There's just one problem, and it's a big one: performance. Context forces every subscriber to re-render on every change — one keystroke can re-render half your app. That's why sharing frequently-changing state through context is considered bad practice.

## Meet react-arven

Imagine we could keep everything good about context and lose the re-renders. That's exactly what [react-arven](https://github.com/stepan662/react-arven) is for. The name is a bit mystical, but the idea is simple — and it falls out of three specific problems with Context, so let me walk through them.

### 1. The ability to select data

The most obvious issue of the React Context API is the fact that it can only provide a single value, and whenever that value changes, it forces all subscribers to re-render.

Libraries like redux or zustand allow us to select only the part we want, and then our component re-renders only if the required piece of the state changed.

The trick to fix this is actually quite simple: we create a ref and hide the state in its `value.current` mutable property. Then we can use a well-known mechanism from redux — selectors.

```ts
const items = useContextSelector(Context, c => c.items)
```

Simple, powerful.

To be fair, none of this is new. dai-shi's [`use-context-selector`](https://github.com/dai-shi/use-context-selector) popularized exactly this pattern, and since React 18 the primitive ships built-in — `useSyncExternalStore` lets a component subscribe to an external store through a selector.

### 2. Preventing parent causing re-render

This is a hidden foot-gun, let me show an example.

```tsx
const Context = React.createContext(...)

function Parent() {
  const [count, setCount] = useState(0)

  return (
    <Context.Provider value={{count, setCount}}>
      <TreeOfChildren />
    </Context.Provider>
  )
}
```

It's easy to use context like this, but there is a huge performance problem. Because the component sits above the whole subtree, whenever it re-renders all of its children re-render as well (unless they use React.memo). Even components that don't use the context at all get re-rendered — it's not actually the context causing this, it's the parent-child structure.

We need to do a subtle change, to prevent this:

```tsx
const Context = React.createContext(...)

function CountProvider ({ children }) {
  const [count, setCount] = useState(0)
  return (
    <Context.Provider value={{count, setCount}}>
      {children}
    </Context.Provider>
  )
}

function Parent() {
  return (
    <CountProvider>
      <TreeOfChildren />
    </CountProvider>
  )
}
```

How is this different? In React, when you pass children as a prop, the wrapper can re-render without touching the children. It took a while to wrap my head around this concept, so I'll try to explain this with a diagram:

![Trees comparison](/blog/missing-piece/trees-comparison.svg)

In the picture the edges represent the render hierarchy. And notice that CountProvider is not a parent of TreeOfChildren, but still can provide context to them. It's basically only saying where to render, but isn't rendering itself. So if we change the state, it's acting like a leaf node in this structure.

If you want to go deeper on React re-renders in general, I dug into it in [Faster: optimizing a React app to the bone](https://dev.to/tolgee_i18n/faster-optimizing-react-app-to-the-bone-21kc).


### 3. Stable actions

If you create custom actions (functions mutating the state), they end up as unstable values in the context. Let me illustrate:

```tsx
function FormProvider({ children }) {
  const { mutate } = useMutation(...)
  // formState changes on every keystroke → submit is a new function each time
  const submit = useCallback(() => mutate(formState), [mutate, formState])

  return (
    <Context.Provider value={{ formState, setFormState, submit }}>
      {children}
    </Context.Provider>
  )
}

function SubmitButton() {
  const submit = useContextSelector(Context, c => c.submit)
  return <button onClick={submit}>Submit</button> // re-renders on every keystroke
}
```

The `SubmitButton` re-renders on every keystroke, and we can't fix it with `useCallback` — `submit` needs `formState` inside, so it has to stay a dependency.

The only real fix is a `useRef` dance: one ref holding the latest closure, and a second, stable ref that just calls it. It's ugly enough that I'll spare you the code — and if it sounds familiar, it's the same idea as React's own `useEvent` / `useEffectEvent` proposal: a function with a stable identity that always sees the latest state. react-arven applies this to every action for you, so the ref dance never shows up in your own code.

## Now put it all together

If you made it this far, the design of react-arven should make sense for you. Let's look at the example:

```tsx
import { createProvider } from 'react-arven';

const [FormProvider, useFormActions, useFormState] = createProvider(() => {
  const [state, setState] = useState({ value: '' })
  const { mutate } = useMutation(...)

  const actions = {
    setState,
    submit() {
      mutate(state)
    }
  }

  return {
    state,
    actions
  }
})

function Parent() {
  return (
    <FormProvider>
      <InputField />
      <SubmitButton />
    </FormProvider>
  )
}

function InputField() {
  const value = useFormState(c => c.value)
  const { setState } = useFormActions()
  return (
    <input value={value} onChange={e => setState({ value: e.target.value })} />
  )
}


function SubmitButton() {
  const { submit } = useFormActions()
  return (
    <button onClick={submit}>Submit</button>
  )
}
```

The body of `createProvider` is a callback, which is basically the body of a regular React component (so you can use hooks). The one rule is that it must return an object with exactly two fields, named `state` and `actions`. Those names aren't arbitrary — the library looks them up by name, so you can't rename them or swap them around. Everything under `state` is what components subscribe to; everything under `actions` is the functions that change it. From that one callback the library builds the Provider for you and hands back two hooks — one for subscribing to the state, one for reading the actions.

Actions are kept in their own field so the library can make them stable with the ref trick from earlier — same shape you passed in, no magic, just an optimization. And because everything is inferred from what you return, the types for your state and actions come for free — no manual typing like you'd need with a native React Context.

## Performance

The library gives you the tools to keep things fast, but it won't do the thinking for you. If you subscribe to a slice of state that changes on every keystroke, the component using it will re-render on every keystroke — that's the selector doing exactly what you asked. The skill is selecting only what you actually need.

Used carefully, you get really good performance without ugly workarounds. In the example above the `SubmitButton` never re-renders while you type — it only uses actions, which are stable, so it has no reason to. And that's how it makes sense to me: it's not using the value, so why would it re-render when the value changes?

## I offer, I don't impose

I think every solution has pros and cons, but this is what worked for me. The library was used internally at my last job; I've just polished it and given it a name. We used it on a pretty large project and needed only about 4 separate contexts for the whole app — everywhere else we used local state in combination with react-query and formik.

Because the library is quite simple, it only has about 1.2KB over the wire (and half of it is polyfill for React < 18).

The full API and setup instructions live in the [react-arven README](https://github.com/stepan662/react-arven) — the only docs for now, but enough to get you going.

So I hope you find it useful, cheers :)

