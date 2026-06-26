---
title: "My missing piece for React"
date: 2026-06-26
draft: true
---

When I was at the university the web was really messy platform. It was around year 2016 and jQuery was starting to be obsolete. Developers knew that the way how we write frontend code is not scalable, but there was not a clear replacement yet. It was the "hot" days of frontend frameworks. Every project I wrote became obsolete almost instantly, because a new better framework always popped up.

These days the order of the most popular frameworks/libraries haven't changed for a [few years](https://2025.stateofjs.com/en-US/libraries/front-end-frameworks/#front_end_frameworks_ratios) and paradoxically Rust, Go and Zig now triggered "hot" rewrites in a different areas of software engineering. These 

## Why React

Many times I was asking myself a question, why is React most popular, even though so many people tend to hate it? It's not the fastest one, it's not the most convenient one, it's not the easiest one to learn. And yet it still is the undisputed king.


## Components

The major thing React does right are components. You are basically always working on component, you can focus only on that part of the codebase and it's independent from everything else. These days every framework does this, but it wasn't granted in the age of jQuery.

## The stability

Last amost 5 years I was in charge of a React application and I think the biggest thing was that we were able to avoid big rewrites. Yes the codebase was envolving, we were swapping some libraries, but we were always able to do it gradually. At one point, we decided to stop using Redux for fetching data and start using react-query. For about 3 years we still had redux in our codebase, but piece by piece, we were able to remove it, when we were re-working the given piece of the codebase.

We were able to test new styling methods, and it was no problem to test it out and see if it works or not. In a way this leads to the codebase being a bit "messy". But it's much better than doing a complete rewrite.

## Minimmialistic API

What React does right from the begining is, keeping it's API minimal and only focusing on the core functionality. Library for rendering, using components, that's it.

And it's not without a tradeoffs. As a beginner you've learned React and then you needed to decide, how do I fetch data, how do I do routing, forms, css and so on. And are always different approaches as a beginner it's difficult to make a decision on this.

However this was the best strategy long-term. React team was able to make a quite big changes to the library, without major breaks to backward compatibility and still keeping the API quite clean. If you have a framework this is really difficult to do, and if you have many features, it's almost impossible to add a new one which would plug into the framework cleanly.

## Issue of state management

One area that react left mostly avoided was how to solve complex state management. When I started with react, the library to go to was redux. Idea is, you have one big state for your whole app and any component can subscribe to any piece of the state and use it. The library will take care of letting your components know about the changes.

However, this breaks the isolation of components. The global state can be useful in a certain nieche apps, where everything is connected with everything. But for app that has e.g. multiple routes/pages, this becomes a burden.

### Specialized tools

As soon as I discovered swr/react-query, I've drifted away from redux and my approach was to use specialized tools for specialized tasks. React-query for data fetching formik for forms. Turned out this covers about 80% of your state management and the rest you can just use local state in components or use zustand for ad hoc shared state.

### Combination create problems

I find the missing 20% problematic. Let me illustrate. At my last employment we had a main view of items, which was quite complicated. It was highly optimized infinite scroll view with editor and many other things connected to it. The state management was quite complicated mainly because of optimization reasons. It was necessary to store fetched items in one place, so we can update them without refetching. We also needed to know what is a current edited value and many more things, highly connected between each other.

Because of this we decided to have state for this view centralized in one component - something like a mini redux store. However, I found the combination of tools quite hard. You can for example create zustand store with some state, which would be useful for e.g. the editor state and this we can share in multiple components, ok. But what if I need to combine data that I've fetched with this state? Data were fetched through react-query and they live in the react dom. I would need to pass them down via props or context, but that would not be performant.

### Missing piece

What we were missing was a state orchestration tool. We basically have different external stores, react-query has it's own store, zustand as well. I would need to combine them into one centralized API, which would be accessible to all children. And the children don't have to care where is the state coming from.

So I've built a simple library to do this. My idea was basically to have an extension to react-context, which would be subscribable and pass all the combined state down through that. I found this library [use-context-selector](https://github.com/dai-shi/use-context-selector). This is great, but I was missing one piece.

### Passing actions down is painful (unnecessarly)

Let's look at how this would look like on a simplified case:

```tsx
import { createContext, useContextSelector } from 'use-context-selector';

const context = createContext(null);


const StateProvider = ({ children }) => {
  const items = useQuery(....)
  const updateItem = useQuery(...)
  const [value, setValue] = useState('')

  const state = {
    value,
    setValue,
    items: items.data,
    updateItem(id) {
      update.mutate({
        id,
        value,
        ....
      })
    }
  }

  return (
    <context.Provider value={state}>
      {children}
    </context.Provider>
  )
};

// editor is rendered on item level in the infinitelly scrollable list
const Editor = ({ item }) => {
  const value = useContextSelector(context, c => c.value)
  const updateItem = useContextSelector(context, c => c.updateItem)
  return (
    <Editor 
      value={value} 
      onUpdate={() => updateItem(item.id)} 
    />
  )
}

```

> Note: Since react 18 it is quite easy to implement selectable context yourself with `useSyncExternalStore`, so you don't even need this library.

This is quite nice, but there is one quite big issue. The whole point of this construction is performance, and `updateItem` is not stable - it's re-generated on every render. So because we are subscribing to it, we are re-rendering the editor on every change of the context. For this to be truely performant, we would need to wrap `updateItem` with `useCallback`, but that is dependant on `value`, so we would need to add it to dependencies.

I'm sure you know this problem if you use React. Thing is, this is all quite unnecessary. We would want the `updateItem` to behave similarly to the react state update, which is stable even if the internal state changes.

### How to solve this?

I had a few iterations on this, but finally I've came to quite simple solution. Let's let the user separate state from actions.

```ts

  const state = {
    value,
    setValue,
    items: items.data,
  }

  const actions = {
    setValue,
    updateItem(id) {
      update.mutate({
        id,
        value,
        ....
      })
    }
  }
```

The actions object should be stable, so we can create proxy object which mirrors the actions object, but is created only once and has stable functions.

```ts
  const currentActionsRef = useRef(actions);
  const stableActionsRef = useRef<A>();

  currentActionsRef.current = actions;

  // stable actions
  if (!stableActionsRef.current) {
    Object.keys(actions).forEach((key) => {
      stableActionsRef.current[key] = (...params) => currentActionsRef.current[key](...params)
    })
  }  
```

### Final solution

Now we have `state` and `stableActionsRef.current`, which we can then just pass through context, actions will be stable and state which will be subscribable. I've created a library out of this, which is called `react-arven`. Let's look at the result:

```tsx

import { createProvider } from 'react-arven';

const [ItemsProvider, useItemsActions, useItemsState] = createProvider(() => {
  const items = useQuery(....)
  const updateItem = useQuery(...)
  const [value, setValue] = useState('')

  const state = {
    value,
    items: items.data,
  }

  const actions = {
    setValue,
    updateItem(id) {
      update.mutate({
        id,
        value,
        ....
      })
    }
  }

  return {
    state,
    actions
  }
});

// editor is rendered on item level in the infinitelly scrollable list
const Editor = ({ item }) => {
  const value = useItemsState(c => c.value)
  const { updateItem } = useItemsActions()
  return (
    <Editor 
      value={value}
      onUpdate={() => updateItem(item.id)} 
    />
  )
}
```

The library creates the context internally, and gives you the Provider and two hooks one for state and other for actions. The callback inside of `createProvider` is rendered as a regular react component and is expected to return object with state and action. It also infer types for the hooks.

In the library `actions` needs to be plain object only with functions, you can have nested objects, which is an upgrade from our simple solution.

## How to use it

Even if you have this powerfull tool, I still advice to stick to simple local state in components where possible. I ended up with one global state (logged user, dark mode etc.) and just a few (like 4) other states. Because this works through react-context parts of the application which are not children of this, won't have access to this. Which nicely encapsulates only the relevant parts.
