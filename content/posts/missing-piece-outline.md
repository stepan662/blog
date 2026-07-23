---
title: "My missing piece for React"
date: 2026-06-26
draft: true
---

For years, I've tried to avoid creating a react library, there are already libraries for everything and new libraries just create decision paralesis. In the end I've ended up creating one anyway. But give me a chance, I might have some redeeming facts in my defence.

<!-- Working outline for missing-piece.md — not for publishing. -->

## Intro

Last 7 years I'm a React developer. I was always fan of React API being minimal and I like how the library itself has a narrow focus, I think it's the hidden secret that made React so successful.

So, like many more people I've been exploring different libraries that plug into React ecosystem. And like many others I've been fighting with the most important one: The State Management.

A few years ago I've became a strong advocate of local state, with specialized tools for specific tasks. Use react-query or SWR for data fetching, formik or react-hook-form and so on.

But, to be honest, this was always only an ideal which got ugly once the app started to being complicated and especially, when you get into performance issues.

## The 20% gap

The issue is, for 80% of the usecases, you can use this approach perfectly well. Simple forms, views with a few buttons, no problem.

But, I've always hit the problem that in some parts of the application a centralized state is necessary. You might have some super complicated custom form, or a view which is really performance sensitive like infinite scroll list. And then the separated states are quite difficult, because in environmet where everything is connected to everything, isolated states are not the solution.

## Existing solutions

The advice I found was to use some lightweight state management library like zustand to create a small shared states. You basically get a mini redux store, that you can use anywhere.

But I think this actually misses the point a bit. Libraries like formik or react-query are sources of state and zustand is source of a state as well. I usually need to combine data from multiple sources, some data are fetched, some are in formik and some are my custom state. I would like to combine them into into one piece and let the components use this state regardless where it's coming from.

If you want to do this with zustand you usually endup copying the state, so everything is in zustand, but then we don't have a single source of truth and because zustand lives outside the react lifecycle, it's easy to forget about cleaning the state on dismouts and so on.

## What is actually missing?

I used to use React Context to centralize my state and the concept is actually great. The same state hook that you've defined in you local component, can simply be moved up in the hierarchy and then you can just pass the value and actions down to the children through the context.

I usually don't need super complicated state, so it's just a question of combining `useState`, `useQuery` and then some functions for changing the state or mutations through rest API.

But as a common knowledge goes, using react context for sharing state is a major footgun for performance and it's quite hard to argue. React context basically forces all the components to update on every little change in the state and that can easily cause your whole app updating on every keystroke in your editor, yayks!

Because of this, using context for shared state that mutates a lot, is considered bad practice.

## But is it really all bad? 

Let's imagine now we could use context for sharing the state without the performance penalty. How does it feel, isn't it actually great experience? We don't have another place to store the state like redux or zustand, but we have a way how to select a place where the state should live with almost effortles flexibilty.

If you find out that some components need to share some state, find a common ancestor and put the state there, pass down the state and the functions for mutations and you've created a "controller"-like component. And because everything lives in the react livecycle, it automatically resets when the contreoller gets unmounted.

## Meet react-arven

This is the experience I'm aiming and I've created library react-arven. The name might be a bit mystical, but the idea is very simple. Provide React Context for sharing the state without the terrible performance.

To explain you why is the library designed the way it is I think it's the best if I show you what are actually the problems of React Context.

### 1. No ability to select data

The most obvious issue of the React Context API is the fact that it is able to provide single value and whenever this value changes, it forces all subscribers to re-render.

Libraries like redux or zustand allow us to select only the part we want, and then our component re-renders only if the required piece of the state changed.

The trick to fix this is actually quite simple, we can create a ref, and hide the state into the `value.current` mutable property. Then we can use well known mechanism from redux - selectors.

```ts
const items = useContextSelector(context => context.items)
```

Simple, powerful.

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

How is this different? In React, when you pass children as a prop, the wrapper will actually re-render touching the children. It took a while to wrap my head around this concept, so I'll try to explain this with a diagram:

![Trees comparison](/blog/missing-piece/trees-comparison.svg)

On the picture the edges represent the render hierarchy. And notice that CountProvider is not a parent of TreeOfChildren, but still can provide context to them. He's basically only saying where to render, but is not rendering himself. So if we change the state, it's acting like a leaf node in this structure.


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
    <button onClick={submit}>Submit<button>
  )
}
```

If you look closely at this example, you'll see the SubmitButton will re-render on every keystroke in your form. And we are not able to fix it even with ugly `useCallback`, because we need to use formState inside.

Only way to optimize this is with `useRef`, but the code is really ugly, so cover your eyes:

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

It's hard do explain what is really happening, but basically the result of this is a stable proxy function, which will call the original function.

## Now put it all together

If you made it this far, the design of react-arven should make sense for you. Let's look at the example:

```tsx
import { createProvider } from 'react-arven';

const [FormProvider, useFormActions, useFormState] = createProvider(() => {
  const [formState, setFormState] = (...)
  const { mutate } = useQuery(...)

  const state = { formState }
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
    <button onClick={submit}>Submit<button>
  )
}
```

The body of `createProvider` is an callback, which is basically a body of a regular react component (so you can use hooks), only you have to return an object with `actions` and `state` fields (names are not arbitrary). The library will build the Provider with context for you and also give you two hooks - one for subscribing to the state and other for the actions.

Actions are separate, because we use the trick with the refs to make them stable - we basically create a copy of the actions object with a proxy functions, the shape is exactly the same as you put in, no magic just an optimization.

## I offer, I don't impose

I'm aware that there are that there are a lot of sharp opinions on state management. I'm not saying this is the correct way, I think every solution has pros and cons, but this is what worked for me and the library was used internally in my last job, I've just polished it and gave it a name. We've used it on pretty large project and we only needed about 4 separate contexts, for the whole app - in other cases we used local state in combination with react-query and formik.

Because the library is quite simple, it only has about 1.2KB over the wire (and half of it is polyfill for react < 18).

So I hope you find it useful, cheers :)

