# Omarchy homepage direction

Reading: an official-site submission for design-conscious computer users, expressed through Omarchy's own quiet editorial and terminal language.

Design dials: ENERGY 2 / RHYTHM 2 / MOTION 2.

## Belief

The page lets Omarchy speak for itself. Visible copy is limited to wording used on the current official homepage.

## Visual system

- Tokyo Night colors connect the page to the default Omarchy desktop.
- The official ASCII mark uses Omarchy's original TTFX laseretch playback, including its reduced-motion fallback.
- The user-provided silk texture is reserved for the hero, where a dark overlay keeps the official headline readable.
- JetBrains Mono is the only face, keeping the page close to Omarchy's terminal character.
- Thin rules organize the page. Real screenshots remain the visual evidence inside a procedural laptop, so the hero represents the computer Omarchy changes rather than a decorative 3D object.
- Green marks action; blue marks the DHH link in the headline.
- Square controls retain Omarchy's terminal character.
- The laptop's only shadow establishes its position above the surface. It is the page's single elevation treatment.

## Layout

- The first view pairs the official headline with an interactive view of the actual default desktop. The laptop dominates the right side because experiencing Omarchy is the submission's central idea.
- Three compact rows reproduce the official navigation labels and destinations.
- Two equal video facades follow without extra section copy.
- Mobile collapses the hero and videos to one column while keeping every navigation target visible.
- All official static pages and nested routes remain available under the same paths as omarchy.org.

## Interaction

- The laptop responds only to direct pointer or touch input and settles immediately after it. There is no idle animation.
- Desktop, Navigate, and Workspace controls switch between real Omarchy screenshots, with native button semantics and keyboard operation.
- Reduced-motion, WebGL failure, and context loss all fall back to the same responsive screenshots.
- Pointer Events provide the same direct manipulation path for mouse, pen, and touch, while the visible buttons remain the non-gesture alternative.
- Video thumbnails are real buttons and load privacy-enhanced YouTube embeds only after selection.
- All primary controls meet a 44px minimum target and expose visible keyboard focus.

## Implementation

- Solid 2 owns the redesigned homepage.
- StyleX owns component, responsive, state, and token styling for that homepage.
- Three.js owns the lazy-loaded WebGL 2 laptop scene. Rendering happens on demand, device pixel ratio is capped, and scene resources are disposed with the component.
- A small global stylesheet supplies font faces, the document reset, and the upstream TTFX canvas fallback contract.
- Official static routes and shared assets are preserved from `omacom/omarchy-site` revision `31a5ecd`.
