# ADR-0007: The host owns layout

**Date**: 2026-09-01
**Status**: accepted
**Deciders**: flow package maintainers

## Context

The compound `WorkflowEditor` parts rendered fixed layout: `WorkflowEditorBody`
arranged its children, `WorkflowEditorCanvas` filled whatever space it was
given, `WorkflowEditorConfigPanel` sat where the package put it, and none of
the three accepted a `className`. The palette went further and pinned its own
position — `absolute z-10 top-0 bottom-0 right-0 m-4`, `w-72` — inside the
package's own styles, floating over the canvas rather than occupying a lane
of it. A host that needed a different arrangement had no lever but
composition order and wrapper divs around parts that ignored them.

`apps/web/components/ai/playbook/editor/editor-shell.tsx`, the one real
consumer, carried the cost of that in three separate places by the time this
ADR was written:

- **A ten-line comment tolerating overlap.** Because the palette floated
  instead of taking a lane, a node underneath it was unreachable while the
  palette was open. The host documented this as an accepted trade-off — the
  alternative it had actually tried was reserving an empty 320px column it
  couldn't get back — because there was no way to ask the package to place
  the palette anywhere else.
- **A synthesised DOM click.** The canvas had no way to learn that its usable
  area had changed, so when the run panel took or freed the right lane the
  host reached through `anchorRefs` — refs that exist for a product tour —
  and called `anchorRefs.current.fitView?.click()` inside a
  `requestAnimationFrame`, faking a user click on a toolbar button to force a
  refit.
- **A semantic prop doing layout work.** `mode="observe"` had the side effect
  of withdrawing the palette, and the host depended on that side effect to
  free the right lane while a run was being observed. Whether a run was being
  watched and how much of the canvas the palette covered were two different
  facts wearing one prop.

All three trace back to the same cause: no compound part accepted styling,
and the palette had opinions about its own placement that only the package
could override.

## Decision

Three changes, one for each symptom above.

**1. Every compound part takes an optional `className`.** `WorkflowEditorBody`,
`WorkflowEditorCanvas`, `WorkflowEditorConfigPanel`, and the palette now
forward `className` into their `tv` slot: `styles.slot({ class: className })`.
`tv`'s merge resolves Tailwind conflicts by precedence rather than by source
order, which a hand-built template string cannot do reliably — the host's
class and the package's class can disagree about, say, a grid column, and the
right one wins regardless of which was written first.

**2. The palette's placement is a `tv` variant, not a fixed position.**
`floating` reproduces the historical pinned overlay exactly, byte for byte in
its composed class string; `inline` renders the palette in flow, so a host
can give it a lane in its own grid instead of a layer above the canvas. The
default is `floating`, so no existing consumer's layout changes underneath
it — `floating` stops being the only option and becomes an explicit choice
alongside `inline`. Under `inline` the palette still exposes its own
`data-state`, so a host that wants to collapse it can style that state
itself; only the slide transform stays placement-dependent, because a slide
off the edge of the viewport only means something when the element is
floating above it.

**3. The canvas can watch its own box and refit.** An opt-in `refitOnResize`
prop wires a `ResizeObserver` to the canvas element, refitting the viewport
through the package's existing fit constants when the observed box changes.
It is opt-in rather than always-on because an unconditional observer would
yank the viewport out from under a user who is panning or zooming while some
unrelated element on the page resizes — a scrollbar appearing, a toast
mounting. The prop is the host stating a fact only the host can know: "my
lanes change size, and when they do, the graph should still fit them,"
replacing the synthetic click with a declared intent instead of a simulated
gesture.

Together these retire the tour-anchor click and the `mode="observe"` layout
side effect from `editor-shell.tsx`: the host now composes the canvas,
config panel, and an `inline` or `floating` palette in its own grid, sizes
lanes with ordinary CSS, and lets `refitOnResize` keep the viewport correct
as those lanes change.

### Two lessons from migrating the host, worth recording here

Both bugs the migration produced had the same shape: `flex` gives guarantees
for free that `grid` requires you to restate explicitly. They are the
practical content of "the host owns layout now."

- **Cross-axis stretch.** `WorkflowEditorBody` had been `display:flex`, whose
  default `align-items: stretch` gives every child full height for free.
  Switching the host's wrapper to `grid` without stating a row track left the
  implicit row sized to its content instead, and the canvas and palette both
  collapsed vertically. The fix was to state the row explicitly rather than
  rely on a default that `grid` doesn't share with `flex`.
- **Order-based placement.** The host's first grid composition assumed three
  columns for three children, but `WorkflowEditorConfigPanel` is an
  absolutely-positioned floating card, and absolutely-positioned elements are
  excluded from grid auto-placement. The grid therefore had two real items,
  not three — auto-placement put the canvas in the first track and the
  *palette* in the `1fr` track meant for the canvas. The fix was an explicit
  two-column grid with `col-start` stated on both real children, rather than
  trusting DOM order to produce the intended columns. The general lesson: the
  column count written in the JSX is not necessarily the column count the
  browser builds, and auto-placement reshuffles silently the moment a
  child's `position` or `display` changes.

## Alternatives Considered

### Alternative 1: Let the host override the package's classes with CSS specificity or `!important`
- **Pros**: no package change at all; the host could ship its fix today.
- **Cons**: it makes every internal class name of every compound part a
  public API by accident. Any restyle inside the package — renaming a
  utility class, changing a spacing scale — becomes a breaking change for a
  consumer the package doesn't know is reaching in, and the override is
  invisible from the package's side: nothing in the package's source shows
  that a host depends on one of its class names surviving unchanged.
- **Why not**: it solves the host's immediate problem by creating a
  standing, undetectable coupling instead of a declared one.

### Alternative 2: A full slot or render-prop API, where the host supplies the layout container and the package fills named slots
- **Pros**: more expressive than a `className` — a host could, in principle,
  restructure the DOM around each part arbitrarily, not just style it.
- **Cons**: far more surface than the problem needs. Every real requirement
  the host had — give the palette a lane or let it float, size the canvas
  and config panel to their own grid — is covered by a `className` on each
  part plus one placement variant on the palette. A slot API would add a
  second way to compose the same three parts, and it would have to be
  designed against exactly one consumer, since `editor-shell.tsx` was the
  only host that existed.
- **Why not**: it trades a known, minimal fix for a speculative, larger one
  built to no second use case.

## Consequences

### Positive
- The host composes lanes in its own grid instead of fighting fixed
  positioning with wrapper divs.
- `floating` remains available for a consumer that wants the package's
  original overlay behavior, now as something chosen rather than imposed.
- `refitOnResize` replaces a synthesized click on a tour anchor with a
  declared intent, and the tour anchors go back to being only tour anchors.
- `mode="observe"` is free to mean only what its name says; the host no
  longer overloads it to manage palette visibility.

### Negative
- Two placements mean two layouts the package has to keep working, tested,
  and documented, rather than one.
- `refitOnResize` is opt-in, so a host that resizes its lanes without
  setting it gets no error and no warning — just a viewport that quietly
  stops fitting the graph.

### Risks
- **Risk**: layout correctness moved to the host, and the package's own test
  suite cannot see host-side layout at all. During this very refactor the
  host's layout broke twice — the cross-axis stretch and the order-based
  placement bugs above — while five of six verification gates (typecheck,
  lint, format, build, and unit tests) stayed green throughout. Only the
  end-to-end suite and a human looking at the rendered page caught either
  one.
- **Mitigation**: none at the type level, by the same logic as ADR-0006's
  optional `definitions` prop — a `className` and a grid composition are
  inherently outside what a compiler can check. The mitigation available is
  the same kind: treat the e2e suite and visual review as load-bearing for
  any change that touches host layout, not as an optional extra pass after
  the gates that can see less.
