<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# The Story — Agent Guide

## Product

The Story is an immersive interactive atlas for exploring the geographic world of Scripture.

The map is the primary product surface.

The product should feel like a historical atlas or documentary experience, not a generic SaaS dashboard.

Before implementing UI work, read:

```text
docs/UI_SPEC.md
```

Treat that document as the visual source of truth.

---

# Stack

The current project uses:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- MapLibre GL
- OpenBible.info geographic data

Do not replace major dependencies or introduce a UI framework without a concrete need.

Prefer the tools already present in the repository.

---

# Required commands

Before finishing a change, run:

```bash
npm run lint
npm run build
```

If the data-generation code changes, also run:

```bash
npm run data:build
```

Never report a task as complete if one of the required checks is failing.

If a check cannot be run, explicitly say so in the final task summary.

---

# Next.js

This repository runs a newer Next.js release whose behavior may differ from model training knowledge.

Before making changes involving Next.js APIs, routing, rendering, metadata, fonts, configuration, caching, or server/client boundaries, consult the documentation shipped in:

```text
node_modules/next/dist/docs/
```

Do not rely on remembered behavior when the local documentation disagrees.

Do not remove or rewrite the generated Next.js block at the top of this file.

---

# Architecture

Keep these concerns separated:

```text
Map rendering
Product state
Application data
Presentation UI
```

## MapLibre

MapLibre-specific imperative code belongs in:

```text
app/hooks/useAtlasMap.ts
```

or modules under:

```text
app/lib/atlas/
```

Do not spread direct `map.addLayer`, `map.setPaintProperty`, `map.easeTo`, or event-registration calls throughout presentation components.

## React UI

React components own application presentation.

Components such as:

```text
AtlasSearch
PlaceDrawer
LayerMenu
TimelineDock
```

must not directly manipulate the MapLibre instance.

They communicate intent through typed callbacks/state.

## Atlas controller

Atlas-level product state belongs in a controller hook such as:

```text
useAtlasController()
```

Examples:

```text
selectedPlaceId
hoveredPlaceId
introVisible
searchOpen
searchQuery
activeFilters
```

Do not introduce Redux, Zustand, or another state library unless existing React state becomes demonstrably inadequate.

---

# Component philosophy

Split components around meaningful behavior or reusable visual units.

Do not:

- keep the entire atlas in one component
- create dozens of trivial one-line components
- abstract code merely because it could theoretically be reused

Good component boundaries include:

```text
StoryAtlas
AtlasMap
AtlasIntro
AtlasTopBar
AtlasSearch
AtlasControls
LayerMenu
PlaceDrawer
TimelineDock
ScriptureReferences
IdentificationDetails
```

---

# TypeScript

Avoid `any`.

Define application-level atlas types centrally:

```text
app/lib/atlas/types.ts
```

UI components should consume typed application objects rather than raw MapLibre feature-property objects.

For example, prefer:

```ts
type BiblicalPlace = {
  id: string;
  name: string;
  slug: string;
  primaryType: string | null;
  longitude: number;
  latitude: number;
  verseCount: number;
};
```

over repeatedly casting:

```ts
feature.properties as ...
```

Keep data parsing/conversion at the boundary.

---

# Data

Source geographic data lives under:

```text
data/
```

Generated browser assets live under:

```text
public/data/
```

Do not manually edit generated files if the same result should be produced by a build script.

Update:

```text
scripts/build-openbible.ts
```

and regenerate the output instead.

Preserve source attribution and uncertainty information.

Never convert a tentative scholarly identification into an assertion of certainty simply because the data contains coordinates.

---

# Map visual style

The Story owns its visual map appearance.

Do not build long-term styling around guessing or matching arbitrary layer IDs in an externally hosted map style.

Prefer a repository-owned MapLibre style/configuration.

Existing Story colors should remain the basis of the visual language:

```text
background  #17110c
land        #594631
water       #294954
gold        #d8ac61
text        #f4ead7
```

See `docs/UI_SPEC.md` for the complete visual system.

---

# Styling

Prefer:

1. shared CSS tokens
2. Tailwind utility classes
3. small targeted CSS modules/classes when appropriate

Avoid large inline-style objects inside JSX.

Do not arbitrarily change established colors, radius, shadows, typography, or spacing.

Do not redesign unrelated surfaces while implementing a focused feature.

---

# UI fidelity

When implementing a UI from `docs/UI_SPEC.md`, match the specification before adding personal design interpretation.

Pay particular attention to:

- spacing
- typography hierarchy
- translucent panel surfaces
- restrained borders
- map visibility
- muted secondary copy
- gold interaction colors
- responsive behavior
- motion timing

Do not turn the interface into a conventional dashboard.

For UI changes, inspect the result at minimum at:

```text
1440x900
390x844
```

A feature that technically works but visibly breaks the intended composition is not finished.

---

# Responsive design

Desktop place information is displayed in a right-side drawer.

Mobile place information is displayed as a bottom sheet.

Do not simply shrink the desktop drawer until it fits on mobile.

Ensure floating map controls are not covered by the mobile sheet.

---

# Accessibility

Use semantic HTML.

All controls must support keyboard operation.

Icon-only controls require accessible labels.

Interactive elements require visible focus states.

Support:

```css
prefers-reduced-motion
```

Do not encode meaning only through color.

---

# Map interaction

Map interaction needs a single clear ownership path.

Avoid registering equivalent click handlers on several overlapping visual layers.

Use a dedicated interaction layer or another mechanism that guarantees one logical selection event per user action.

Map event handlers must be cleaned up when the map is destroyed.

---

# Scope discipline

Before editing:

1. read the relevant files
2. understand existing behavior
3. identify the smallest coherent implementation
4. preserve functionality not included in the task

Do not perform unrelated refactors.

Do not rename or reorganize unrelated files merely for style preference.

If architecture needs changing to implement the requested feature cleanly, keep the architectural change directly tied to the feature.

---

# Commits and PR-sized work

Prefer work that can be reviewed as one coherent change.

Good examples:

```text
refactor atlas UI architecture
add atlas place search
add place details drawer
add map layer filtering
add place deep links
```

Avoid combining multiple major product features into a single implementation unless specifically requested.

---

# Completion checklist

Before reporting completion:

- [ ] requested behavior works
- [ ] UI follows `docs/UI_SPEC.md`
- [ ] TypeScript types remain meaningful
- [ ] no unnecessary `any`
- [ ] MapLibre listeners clean up correctly
- [ ] generated data was regenerated when required
- [ ] desktop layout checked
- [ ] mobile layout checked
- [ ] keyboard interaction checked
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] no unrelated changes were introduced

In the final summary, state:

1. what changed
2. important architectural decisions
3. files changed
4. checks run
5. any known limitations or follow-up work
