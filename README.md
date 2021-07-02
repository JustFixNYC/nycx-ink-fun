This is an attempt to model a chatbot--specifically, [JustFix.nyc][]'s prototype [NYCx Co-Labs: Housing Rights Challenge][nycx] chatbot--using Inkle's [Ink][] narrative scripting language.

[JustFix.nyc]: https://justfix.nyc
[nycx]: https://www1.nyc.gov/html/nycx/housingchallenge/challenge
[Ink]: https://www.inklestudios.com/ink/

## Motivation

Using TextIt for prototyping our NYCx chatbot has proven to be a challenge for our non-technical users for a few reasons:

* Once a conversation becomes slightly complex, it becomes difficult to follow the lines of the flowchart to determine how a flow works.

* While creating sub-flows is an option to reduce conversational complexity, it has limitations:
  * It's still hard to link to a specific point within a sub-flow.
  * It's difficult to "refactor" an existing, complex flow into smaller sub-flows.

* We're not sure exactly when or how it happens, but TextIt appears to occasionally re-organize the positioning of boxes in visual flows without the user's consent. For example, a flow with boxes that were carefully positioned to not include overlapping lines may on day appear to have suddenly re-organized itself to be much more confusing.  A post-it note carefully positioned next to a box that explains some context surrounding it may suddenly appear in a completely different place in a subsequent page load.  Not only is this confusing, it's also unhelpful for preserving one's sense of spatial navigation as the flow evolves.

* It's difficult to make changes to the flow that affect many conversation points at once. For example, what if we wanted to provide a "go back" option that allowed the user to "rewind" the conversation at any step in the flow?  This would be very cumbersome to do in TextIt, and would significantly affect the visual complexity of the flow.

One solution to these issues is moving the entire flow from TextIt to a full-on programming language. This was explored in [JustFixNYC/textit-webhook-fun][], but it greatly increases the barrier to entry for non-technical users to change the flow.  It also isn't particularly easy to understand, because the flow of control in a computer program whose state needs to be serializable doesn't necessarily represent the actual structure of a conversation very well.

Another option that keeps the barrier to entry low while still resolving TextIt's limitations is to use the _Ink_ narrative scripting language. While the language was originally created for non-technical writers to author "Choose Your Own Adventure"-style games, it has potential to be useful for chatbots. This project is an exploration of this possibility.

## Prerequisites

- Download the [latest release of ink](https://github.com/inkle/ink/releases) and put it on your `PATH` (i.e., you should be able to run `inklecate` from the terminal).
- You will also need [node](https://nodejs.org) and [yarn](https://yarnpkg.com/getting-started/install).

## Quick start

In one terminal, run:

```
yarn
yarn watch
```

Then in another terminal, run:

```
node fun.js
```

## Related projects

- [JustFixNYC/textit-webhook-fun][] is a 2020 experiment to model a TextIt/RapidPro flow as a finite state machine in TypeScript.

- [toolness/justfix-interview-ts-fun](https://github.com/toolness/justfix-interview-ts-fun) is a 2018 experiment to build a conversational system that could work across many different media including SMS and web.

[JustFixNYC/textit-webhook-fun]: https://github.com/JustFixNYC/textit-webhook-fun
