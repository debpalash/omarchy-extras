# Omarchy homepage direction

Reading: an official-site submission for design-conscious computer users, expressed through Omarchy's own quiet editorial and terminal language.

Design dials: ENERGY 2 / RHYTHM 2 / MOTION 1.

## Belief

The page lets Omarchy speak for itself. Visible copy is limited to wording used on the current official homepage.

## Visual system

- Tokyo Night colors connect the page to the default Omarchy desktop.
- The official ASCII mark uses Omarchy's original TTFX laseretch playback, including its reduced-motion fallback.
- The user-provided silk texture is reserved for the hero, where a dark overlay keeps the official headline readable.
- JetBrains Mono is the only face, keeping the page close to Omarchy's terminal character.
- Thin rules organize the page. Real screenshots carry the visual weight.
- Green marks action; blue marks the DHH link in the headline.
- Square controls retain Omarchy's terminal character.

## Layout

- The first view pairs the official headline with the actual default desktop.
- Three compact rows reproduce the official navigation labels and destinations.
- Two equal video facades follow without extra section copy.
- Mobile collapses the hero and videos to one column while keeping every navigation target visible.
- All official static pages and nested routes remain available under the same paths as omarchy.org.

## Interaction

- Motion is limited to short hover transitions, with a reduced-motion path.
- Video thumbnails are real buttons and load privacy-enhanced YouTube embeds only after selection.
- All primary controls meet a 44px minimum target and expose visible keyboard focus.

## Implementation

- Solid 2 owns the redesigned homepage.
- StyleX owns component, responsive, state, and token styling for that homepage.
- A small global stylesheet supplies font faces, the document reset, and the upstream TTFX canvas fallback contract.
- Official static routes and shared assets are preserved from `omacom/omarchy-site` revision `31a5ecd`.
