# The Story — Atlas UI Specification

## Product intent

The Story is an immersive interactive atlas of the biblical world.

The interface should feel closer to a historical atlas or documentary experience than a modern analytics dashboard.

The map is always the primary visual surface. Application UI floats above the map and should reveal itself progressively as the user explores.

Avoid generic SaaS styling, large white cards, excessive borders, bright colors, dense toolbars, or permanent side navigation.

---

# Visual language

## Color tokens

Use these values consistently rather than introducing arbitrary colors inside components.

```css
--atlas-bg: #17110c;
--atlas-surface: #120d09;
--atlas-surface-translucent: rgba(18, 13, 9, 0.92);

--atlas-land: #594631;
--atlas-water: #294954;

--atlas-text: #f4ead7;
--atlas-text-secondary: #d2c1a3;
--atlas-text-muted: #9f9078;

--atlas-gold: #d8ac61;
--atlas-gold-bright: #f2d69a;
--atlas-gold-soft: #c79a50;

--atlas-border: rgba(234, 223, 201, 0.16);
--atlas-border-strong: rgba(234, 223, 201, 0.28);

--atlas-shadow: rgba(0, 0, 0, 0.38);
```

Do not introduce saturated blue, purple, green, or generic Tailwind palette colors unless they have a semantic reason.

## Typography

Two typography roles are used.

### Display / narrative

Use:

```css
font-family: Georgia, "Times New Roman", serif;
```

Use for:

- The Story wordmark
- Intro headings
- Place names
- Narrative headings
- Era/story headings

### Interface

Use Geist / system sans-serif.

Use for:

- Buttons
- Search
- Metadata
- Controls
- Labels
- Keyboard hints
- Filters

Do not use serif typography for every small interface label.

---

# Spacing

Prefer the following spacing rhythm:

- 4px — micro
- 8px — compact
- 12px — control spacing
- 16px — standard
- 20px — panel inner spacing
- 24px — layout spacing
- 32px — section spacing
- 48px+ — major narrative spacing

Main floating UI should stay approximately 20–24px from viewport edges on desktop.

---

# Borders and surfaces

Floating surfaces should generally use:

```css
background: rgba(18, 13, 9, 0.92);
border: 1px solid rgba(234, 223, 201, 0.16);
backdrop-filter: blur(14px);
border-radius: 14px;
box-shadow: 0 16px 60px rgba(0, 0, 0, 0.3);
```

Avoid stacking many bordered cards inside other bordered cards.

Use spacing and typography before adding more boxes.

---

# Motion

Motion should be restrained and cinematic.

Standard UI transition:

```css
transition-duration: 180ms;
transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
```

Drawer/sheet:

```css
280ms cubic-bezier(.22, 1, .36, 1)
```

Intro fade:

```css
900ms cubic-bezier(.22, 1, .36, 1)
```

Do not add bouncing, spring-heavy, playful, or attention-seeking animation.

---

# Application layout

The atlas fills the viewport.

```text
StoryAtlas
├── AtlasMap
├── CinematicOverlay
├── AtlasIntro
├── AtlasTopBar
├── AtlasControls
├── PlaceDrawer
├── TimelineDock
└── StatusToast
```

There should be no normal document scrolling on the atlas route.

---

# Intro state

On initial load the map remains visible behind a cinematic dark wash.

Centered content:

```text
THE STORY

Explore the World
of Scripture

66 books. Thousands of years.
One unfolding story.

EXPLORE THE MAP TO BEGIN
```

The intro disappears when the user:

- drags the map
- zooms the map
- selects a location
- starts a search
- explicitly chooses Explore

The logo remains after the intro disappears.

Do not remove the current cinematic concept.

---

# Top bar

## Desktop

Top-left:

`THE STORY`

Clicking the wordmark resets the atlas to its initial extent.

Center/top area:

Search control approximately 400–480px wide.

Placeholder:

`Search places, Scripture, and journeys…`

Keyboard hint:

`⌘ K` / `Ctrl K`

Top-right:

- Layers
- About/help

Controls should be translucent and visually secondary to the map.

## Mobile

Show:

- logo
- search icon/control
- layers button

Do not attempt to fit the full desktop toolbar onto narrow screens.

---

# Search

Search is one of the primary atlas navigation mechanisms.

Search should support:

- place name
- aliases when data becomes available
- place type
- Scripture references in a later iteration

Desktop search may expand into a command-palette-style result surface.

Each result shows:

```text
Jerusalem
Settlement · 800 references
```

Selecting a search result must:

1. close search
2. dismiss intro
3. set the selected place
4. animate the map to the coordinates
5. open PlaceDrawer

Keyboard support:

- Arrow Up / Down
- Enter
- Escape
- Cmd/Ctrl+K

---

# Place rendering

Maintain visual hierarchy based on importance.

### Minor place

Small subdued gold point.

### Important place

More visible gold point.

### Major place

Bright gold point with label.

Do not render every label at low zoom.

Avoid label clutter.

Use one logical interaction/hit-target layer so a single click does not trigger several independent handlers for stacked visual layers.

---

# Selected place

A selected place must look visibly different from an ordinary marker.

Add a selection layer consisting of:

- warm gold core
- subtle larger halo
- optional slow opacity transition

Do not use a generic bright-blue selected marker.

When a place is selected, animate the map so that the marker remains visible beside the place drawer rather than being hidden beneath it.

---

# Place drawer

## Desktop

Right-aligned floating panel.

Recommended dimensions:

```text
width: 380px
top: 76px
right: 20px
bottom: 20px
```

The drawer can scroll internally if content exceeds its height.

It should slide/fade in rather than appear instantly.

## Header

Example:

```text
SETTLEMENT

Jerusalem

800 Scripture references
```

Include a close button.

Use serif typography for the place name.

---

# Place drawer sections

## In Scripture

Show initial Scripture references from the dataset.

Example:

```text
IN SCRIPTURE

Genesis 14:18
Joshua 10:1
2 Samuel 5:6
Matthew 2:1
...

View all references
```

References should be compact and readable rather than rendered as large cards.

---

## Identification

Display the existing identification description when available.

Example:

```text
IDENTIFICATION

Usually identified with the ancient settlement located
beneath and around the modern Old City of Jerusalem.
```

The exact text must come from data where possible.

---

## Confidence

Expose uncertainty instead of hiding it.

Use available source/vote data.

Do not invent historical certainty from coordinates.

Possible presentation:

```text
IDENTIFICATION CONFIDENCE

Strong scholarly support
27 contributing votes
```

The data model should retain raw values even if the visual label changes later.

---

## Location

Display appropriate location information when useful:

```text
31.778°
35.235°

Coordinate type: exact
```

Coordinates should be visually secondary.

---

# Map controls

Provide compact zoom/reset controls.

A legend may be opened or expanded from the controls.

The legend should explain:

- major place
- important place
- minor place
- uncertain identification when implemented

Avoid recreating the standard default MapLibre visual style.

Controls must use The Story visual system.

---

# Layer menu

Layer menu initially supports:

- Major places
- Important places
- Minor places
- Place labels

Later:

- Regions
- Rivers
- Journeys
- Biblical eras
- Modern reference map

Layer state is owned by React/controller state and translated into MapLibre visibility/filter changes.

---

# Timeline

Timeline is a planned major component and should have a reserved component boundary even before its data model is finished.

Desktop placement:

bottom center.

The timeline should not occupy the entire bottom of the screen unless expanded.

Long-term timeline modes may include:

- biblical eras
- books
- events
- individual journeys

Do not hard-code invented event dates just to ship the timeline visually.

---

# Responsive behavior

## >= 1024px

Use right-side PlaceDrawer.

Search appears expanded in the top bar.

## 768–1023px

Drawer may become narrower.

Search may become a compact control.

## < 768px

Place details become a bottom sheet.

Do not render a 380px right drawer on mobile.

The bottom sheet should support approximately:

- collapsed: place summary
- medium: key details
- expanded: full scrollable content

Map controls need enough bottom spacing not to be obscured by the sheet.

---

# Accessibility

Every interactive control needs:

- a semantic button/input element
- keyboard operation
- visible focus treatment
- `aria-label` when an icon has no visible label

Respect:

```css
@media (prefers-reduced-motion: reduce);
```

Do not communicate confidence or selection using color alone.

---

# Component responsibilities

## StoryAtlas

Owns composition of the experience.

Does not contain detailed MapLibre setup code.

## AtlasMap

Owns the map canvas and bridges React state to the map controller.

It should not render search, drawers, or product panels.

## useAtlasMap

Owns MapLibre lifecycle:

- construct map
- destroy map
- register sources
- register layers
- register interactions
- fly/ease operations
- synchronize visibility/filter state

## useAtlasController

Owns product state:

```ts
selectedPlaceId;
hoveredPlaceId;
introVisible;
searchOpen;
searchQuery;
activeFilters;
```

Add timeline state when timeline functionality exists.

Do not introduce an external global state library until complexity justifies it.

## AtlasSearch

Owns search UI and keyboard interaction.

Search data comes from the atlas data layer, not directly from the DOM or MapLibre canvas.

## PlaceDrawer

Receives a typed place model.

It does not directly query MapLibre.

## LayerMenu

Updates atlas filter state.

It does not contain raw MapLibre calls.

---

# Data architecture

Separate the data used to render the map from the richer data used by the application UI.

The existing build script should eventually output:

```text
public/data/biblical-places.geojson
public/data/biblical-places.json
```

`biblical-places.geojson` should contain the properties required for map visualization.

`biblical-places.json` should contain richer application records including:

```ts
type BiblicalPlace = {
  id: string;
  name: string;
  slug: string;
  types: string[];
  primaryType: string | null;

  longitude: number;
  latitude: number;

  verseCount: number;
  verses: {
    osis: string;
    readable: string;
  }[];

  identification: {
    id: string;
    description: string | null;
    identificationCount: number;
    voteAverage: number | null;
    voteCount: number | null;
    coordinateType: string | null;
    geometryId: string | null;
  };
};
```

UI components should consume this typed application model.

Do not couple UI components to raw MapLibre feature property shapes.

---

# Map style

Make map styling deterministic.

Do not depend on inspecting arbitrary layer IDs in a third-party visual style and mutating every matching layer indefinitely.

The repo already contains:

```text
public/maps/ancient-atlas.json
```

Either make the atlas intentionally use and expand this owned style or replace it with another owned map-style module.

There should be one canonical definition of The Story map appearance.

---

# URL behavior

Place selections should eventually be linkable.

Preferred model:

```text
/?place=jerusalem
```

or:

```text
/place/jerusalem
```

Do not introduce a complex router structure solely for this feature.

Refreshing a valid deep link should restore the selected place and map location.

---

# Loading and failure states

The map must have visible states for:

- map loading
- atlas data loading
- data failure
- map style failure

Errors must not silently leave an empty screen.

Keep status UI visually quiet unless there is an actual failure.

---

# Definition of visual completion

A UI task is not complete merely because the controls technically exist.

Before considering an atlas UI change complete, verify:

### Desktop

1440 × 900

### Mobile

390 × 844

Check:

- typography
- alignment
- spacing
- map visibility
- drawer/sheet placement
- overflow
- hover states
- selected marker
- focus state
- long place names
- large Scripture-reference counts
- loading state

The final implementation should look intentionally designed at both target sizes.
