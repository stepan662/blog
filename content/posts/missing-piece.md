---
title: "My missing piece for React"
date: 2026-06-26
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

As soon as I discovered swr/react-query, I've drifted away from redux and my approach was to use specialized tools for specialized tasks. React-query for data fetching formik for forms. Turned out this covers about 80% of your state management and the rest you can just use local state in components or use simple zustand or something like that for small external state.

### Combining the tools