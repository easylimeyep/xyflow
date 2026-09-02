# ADR-0008: The provider and the shell are separate seams

**Date**: 2026-09-02
**Status**: accepted
**Deciders**: flow package maintainers

## Context

ADR-0007 handed the host its layout: every compound part took a `className`,
the palette gained a `placement`, and the canvas gained `refitOnResize`. A
host could reorder and restyle the parts. But three seams from that same
decision were left half-finished, and each one leaked in a way the "host owns
layout" claim did not admit.

- **The provider and the shell were one component.** `WorkflowEditor` wired
  the store, runtime observation, and the shared layout context — and, in the
  same function, rendered a `styles.root()` `div` around whatever it composed.
  There was no way to take the context without the `div`. A host that wanted
  to own the outermost element still inherited the package's
  `relative flex h-full w-full flex-1 flex-col ... rounded-md`, and composed
  its own layout *inside* a flex column it did not ask for. "Own the layout"
  stopped one element short of the top.

- **The layout state was private.** `isPaletteOpen` and `quickAddActive` lived
  in a context the package did not export, reachable only by the parts the
  package shipped. A host rendering its own palette toggle — exactly the kind
  of part ADR-0007 invited — could not read whether the palette was open. It
  either re-derived a subset from store selectors (and `isPaletteOpen` is not
  in the store at all) or lifted its own duplicate state and let the two drift.
  The parts had a shared source of truth; the host was locked out of it.

- **The config panel's side was a hardcoded convention, not a prop.** The
  panel's base style carried `border-r`, so it read as a left rail only
  because it was the first child of the row and its border happened to face
  the canvas. A host that composed it on the *right* — which
  `backend-transform-example` already did — got `border-r` on the outer edge,
  the border facing away from the canvas, a hairline in the wrong place. The
  palette had `placement` to state its side; the panel had nothing, so its
  side was whatever DOM order implied, and its border did not follow.

All three trace to the same gap: ADR-0007 exposed *styling* and *ordering* but
not the *seams underneath them* — where the context begins, where the shell
begins, and which facts the parts share.

## Decision

Three changes, one per symptom, shipped as the single shape rather than
layered behind aliases.

**1. `WorkflowProvider` is the headless seam; `WorkflowEditor` is the shell on
top of it.** `WorkflowProvider` renders the store, validation sync, runtime
observation, and the layout context — and no markup of its own. A host that
wants the whole layout renders `WorkflowProvider` and composes
`WorkflowEditor.*` parts inside its own DOM, owning the outermost element.
`WorkflowEditor` is now exactly `WorkflowProvider` plus the `styles.root()`
`div` and the default composition: the convenience path is unchanged for the
common case, and it is defined in terms of the seam it used to hide.

**2. `useWorkflowLayout()` exposes the shared layout state.** The hook returns
`{ isPaletteOpen, setIsPaletteOpen, quickAddActive, mode }` — the same facts
the built-in parts read, from the same context. A host-rendered palette toggle
reads `isPaletteOpen` and calls `setIsPaletteOpen` and stays in lockstep with
the built-in toggle, because there is one source, not two. It throws when
called outside a `WorkflowProvider`, so the mistake surfaces at first render
rather than as a silently dead control. It is also reachable as
`WorkflowEditor.use.layout`, beside the store and selection hooks already
there.

**3. The config panel takes `side`.** `border-r`/`border-l` moved out of the
panel's base and into a `tv` variant, `side: "left" | "right"`, default
`left`. A host that composes the panel on the right passes `side="right"` and
the border follows to the inner edge. This makes the panel symmetric with the
palette's `placement`: each part states which side it is on rather than
inferring it from where it happens to land in the row.

## Consequences

### Positive
- A host owns the top element. `WorkflowProvider` imposes no `div`, so the
  outermost node and its grid or flex are entirely the host's.
- Host-rendered parts share the built-in parts' state through
  `useWorkflowLayout` instead of duplicating a subset of it, and the hook
  throws outside a provider rather than returning a stale default.
- The config panel's border follows its stated side, so composing it on the
  right no longer ships a hairline in the wrong place — the bug
  `backend-transform-example` carried is fixed, and that example now states
  `side="right"`.
- `WorkflowEditor` is defined as `WorkflowProvider` plus a shell, so the two
  paths cannot drift: fixing the provider fixes both.

### Negative
- There are now two entry points, `WorkflowProvider` and `WorkflowEditor`, and
  a reader has to know which one they want. The default composition is the
  right answer for most consumers, and reaching for the provider is a decision
  to own the layout — but the surface is larger than one component was.
- `side` is a second lever that can disagree with reality the same way
  `placement` can: a host can pass `side="right"` and still compose the panel
  on the left, and nothing catches the mismatch — the border is a statement
  the host makes, not one the package derives.
- `useWorkflowLayout` widens the public API with state a future refactor might
  want to move (into the store, or a dedicated layout store). It is now a
  compatibility surface, not a private context.

### Risks
- **Risk**: the provider/shell split is a breaking change to the internals of
  `WorkflowEditor` — the layout context is now provided a level up, in
  `WorkflowProvider`. A part that assumed the context and the `styles.root()`
  `div` were the same element could observe a different tree. The same class
  of gap ADR-0007 named applies: typecheck, lint, and unit tests stayed green
  through this refactor; only the e2e suite and a rendered page confirm the
  headless composition actually lays out.
- **Mitigation**: the package ships a headless example
  (`provider-layout-example`) that exercises `WorkflowProvider`,
  `useWorkflowLayout`, and `side="right"` together, so the seam has at least
  one consumer inside the repo that visual review and the story suite cover —
  the same load-bearing role ADR-0007 assigned the e2e suite for anything that
  touches host layout.
