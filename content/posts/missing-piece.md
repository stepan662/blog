---
title: "My missing piece for React"
date: 2026-06-26
draft: true
---

For years, I've tried to avoid creating a React library, there are already libraries for everything and new libraries just create decision paralysis. In the end I've ended up creating one anyway. But give me a chance, I might have some redeeming facts in my defence.

I was always a fan of React's API being minimal and its narrow focus — I think that's the hidden secret that made it so successful. So like many others, I've spent years exploring the libraries that plug into it, and fighting with the most important one: state management.

I became a strong advocate of local state with specialized tools for specific tasks — react-query or SWR for data fetching, formik or react-hook-form for forms, and so on. For maybe 80% of the cases this works perfectly: simple forms, views with a few buttons, no problem.

But the other 20% always got ugly. In some parts of the app a centralized state is just necessary — a super complicated custom form, or something performance-sensitive like an infinite scroll list. When everything is connected to everything, isolated states aren't the solution.

## Existing solutions

The advice I found was to use some lightweight state management library like zustand to create small shared states. You basically get a mini redux store, that you can use anywhere.

But I think this actually misses the point a bit. Libraries like formik or react-query are sources of state and zustand is a source of state as well. I usually need to combine data from multiple sources, some data are fetched, some are in formik and some are my custom state. I would like to combine them into one piece and let the components use this state regardless of where it's coming from.

If you want to do this with zustand you usually end up copying the state, so everything is in zustand, but then we don't have a single source of truth and because zustand lives outside the React lifecycle, it's easy to forget about cleaning the state on unmount and so on.

You might also reach for something like Jotai — a great library that gets much closer. With derived atoms and `atomWithQuery` you really can combine fetched data with local state. But notice what happened to get there: everything had to become an atom. Jotai is still a state *source* — a new primitive you build on top of. What I wanted was different: not another place to keep state, but a way to *combine* the state I already have.

## What is actually missing?

I used to reach for React Context, and conceptually it's perfect: the same state hook you'd write in a local component just moves up the tree, and you pass the value and actions down. Usually it isn't even complicated — a bit of `useState`, a `useQuery`, a few functions to mutate it. Find a common ancestor, put the state there, and you've built a "controller" component that resets automatically when it unmounts.

There's just one problem, and it's a big one: performance. Context forces every subscriber to re-render on every change — one keystroke can re-render half your app. That's why sharing frequently-changing state through context is considered bad practice.

## Meet react-arven

But imagine we could keep everything good about context and lose the re-renders. That's exactly what react-arven is for. The name is a bit mystical, but the idea is simple — and it falls out of three specific problems with Context, so let me walk through them.

### 1. No ability to select data

The most obvious issue of the React Context API is the fact that it can only provide a single value, and whenever that value changes, it forces all subscribers to re-render.

Libraries like redux or zustand allow us to select only the part we want, and then our component re-renders only if the required piece of the state changed.

The trick to fix this is actually quite simple, we can create a ref, and hide the state into the `value.current` mutable property. Then we can use well known mechanism from redux - selectors.

```ts
const items = useContextSelector(context => context.items)
```

Simple, powerful.

To be fair, none of this is new. dai-shi's [`use-context-selector`](https://github.com/dai-shi/use-context-selector) popularized exactly this pattern, and since React 18 the primitive ships built-in — `useSyncExternalStore` lets a component subscribe to an external store through a selector.

### 2. Parent re-render

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

It's easy to use context like this, but there is a huge performance problem. Because we are keeping the component which is parent to the whole subtree, when it re-renders all the children re-render as well (unless they use React.memo). Even components which are not using the context at all will get re-rendered, because it's not actually the context, which is causing this, it's the parent child structure.

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


### 3. Unstable actions

If you create custom actions (functions mutating the state), they will be unstable values in the context. Let me illustrate the issue:

```tsx
function FormProvider() {
  const [formState, setFormState] = (...)
  const { mutate } = useQuery('')

  const submit = useCallback(() => {
    mutate(formState)
  }, [mutate, formState])

  return (
    <Context.Provider value={{formState, setFormState, submit}}>
      {children}
    </Context.Provider>
  )
}

function SubmitButton() {
  const submit = useContextSelector(c => c.submit)
  return (
    <button onClick={submit}>Submit</button>
  )
}
```

If you look closely at this example, you'll see the SubmitButton will re-render on every keystroke in your form. And we are not able to fix it even with ugly `useCallback`, because we need to use formState inside.

The only way to optimize this is with `useRef`, but the code is really ugly, so cover your eyes:

```tsx
function FormProvider() {
  const [formState, setFormState] = (...)
  const { mutate } = useQuery('')

  const currentSubmitRef = useRef()

  currentSubmitRef.current = () => {
    mutate(formState)
  }

  const stableSubmitRef = useRef()

  if (!stableSubmitRef.current) {
    stableSubmitRef.current = () => currentSubmitRef.current()
  }

  const submit = stableSubmitRef.current

  return (
    <Context.Provider value={{formState, setFormState, submit }}>
      {children}
    </Context.Provider>
  )
}
```

It's a bit hard to follow, but basically the result of this is a stable proxy function, which will call the original function.

If this pattern looks familiar, it's the same idea as React's own `useEvent` / `useEffectEvent` proposal — a function with a stable identity that always sees the latest state. react-arven applies it to every action for you, so this ref dance never shows up in your own code.

## Now put it all together

If you made it this far, the design of react-arven should make sense for you. Let's look at the example:

```tsx
import { createProvider } from 'react-arven';

const [FormProvider, useFormActions, useFormState] = createProvider(() => {
  const [formState, setFormState] = (...)
  const { mutate } = useQuery(...)

  const state = { value: formState.value }
  const actions = {
    setFormState,
    submit() {
      mutate(formState)
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
  const { setFormState } = useFormActions()
  return (
    <input value={value} onChange={e => setFormState({ value: e.target.value })} />
  )
}


function SubmitButton() {
  const { submit } = useFormActions()
  return (
    <button onClick={submit}>Submit</button>
  )
}
```

The body of `createProvider` is a callback, which is basically the body of a regular React component (so you can use hooks), only you have to return an object with `actions` and `state` fields (names are not arbitrary). The library will build the Provider with context for you and also give you two hooks - one for subscribing to the state and other for the actions.

Actions are separate, because we use the trick with the refs to make them stable - we basically create a copy of the actions object with a proxy functions, the shape is exactly the same as you put in, no magic just an optimization.

## TypeScript

The types for your state and actions are inferred automatically — you don't have to specify them manually like with a native React Context.

## I offer, I don't impose

I'm aware there are a lot of sharp opinions on state management. I'm not saying this is the correct way, I think every solution has pros and cons, but this is what worked for me and the library was used internally in my last job, I've just polished it and gave it a name. We've used it on a pretty large project and we only needed about 4 separate contexts, for the whole app - in other cases we used local state in combination with react-query and formik.

Because the library is quite simple, it only has about 1.2KB over the wire (and half of it is polyfill for React < 18).

So I hope you find it useful, cheers :)

