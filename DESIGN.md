# Omarchy homepage direction

Reading: an official-site submission for design-conscious computer users, expressed through Omarchy's own quiet editorial and terminal language.

Design dials: ENERGY 2 / RHYTHM 2 / MOTION 2.

## Belief

The page lets Omarchy speak for itself. Marketing copy remains limited to the current official homepage, while desktop labels and terminal responses exist only to make the operating-system interaction functional.

## Visual system

- Tokyo Night colors connect the page to the default Omarchy desktop.
- The official ASCII mark uses Omarchy's original TTFX laseretch playback, including its reduced-motion fallback.
- The user-provided silk texture is reserved for the hero, where a dark overlay keeps the official headline readable.
- Gradients are limited to contrast scrims over the silk and video imagery, plus one faint Tokyo Night blue wash that connects the page background to the default desktop.
- JetBrains Mono is the only face, keeping the page close to Omarchy's terminal character.
- Thin rules organize the page. The full-width hero is the Omarchy desktop itself, so the first interaction demonstrates the window manager instead of framing it as a product screenshot.
- Green marks action; blue marks the DHH link in the headline.
- Dark is the native presentation because the default Tokyo Night desktop and Omarchy's terminal language are the product evidence, not a generic dark-mode treatment.
- Square controls retain Omarchy's terminal character.
- Shadows are limited to active desktop windows, where they communicate focus and stacking order.

## Layout

- The first view places the official headline inside an Omarchy window on a full-width desktop. Terminal and Files windows demonstrate the interface without adding marketing copy.
- Three compact rows reproduce the official navigation labels and destinations.
- Two equal video facades follow without extra section copy.
- Mobile turns the desktop into a one-window-at-a-time app switcher and collapses the videos to one column while keeping every navigation target visible.
- All official static pages and nested routes remain available under the same paths as omarchy.org.

## Interaction

- The Three.js wallpaper responds only to direct pointer input and settles immediately. There is no idle animation.
- Windows can be focused, dragged, resized, minimized, maximized, closed, reopened, and moved between real workspaces through the app launcher.
- The terminal accepts a small documented command set, while Files contains real site destinations.
- Arrow keys move focused title bars, Shift plus arrow keys resize, Enter maximizes, Escape closes the launcher, and Alt plus 1 to 3 switches workspaces.
- Mobile uses one full-screen focused window at a time with the dock as the app switcher. Reduced motion and WebGL failure keep every operating-system interaction available over the CSS wallpaper.
- Video thumbnails are real buttons and load privacy-enhanced YouTube embeds only after selection.
- All primary controls meet a 44px minimum target and expose visible keyboard focus.

## Implementation

- Solid 2 owns the redesigned homepage.
- StyleX owns component, responsive, state, and token styling for that homepage.
- Three.js owns the lazy-loaded WebGL 2 wallpaper compositor. Solid supplies the accessible window layer, renderer work happens on demand, device pixel ratio is capped, and scene resources are disposed with the component.
- A small global stylesheet supplies font faces, the document reset, and the upstream TTFX canvas fallback contract.
- Official static routes and shared assets are preserved from `omacom/omarchy-site` revision `31a5ecd`.
