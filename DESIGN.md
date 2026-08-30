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
- The foundation announcement is a single underlined link beneath the ASCII mark, keeping it visible without adding a separate promotional bar.
- Green marks action; blue marks the DHH link in the headline. Pink is reserved for the launcher selection state, matching the Omarchy desktop menu language.
- Dark is the native presentation because the default Tokyo Night desktop and Omarchy's terminal language are the product evidence, not a generic dark-mode treatment.
- Square controls retain Omarchy's terminal character.
- Shadows are limited to active desktop windows and the site launcher, where they communicate focus and overlay stacking.

## Layout

- The first view is a maximized btop-inspired Home app on workspace 1. It keeps the official headline as the focal point, then reports only measurable browser-session health: event-loop delay, exposed JavaScript heap, connection details, platform facts, session uptime, and the real state of the OS apps. Terminal remains closed until requested, Files waits on workspace 2, and Videos waits on workspace 3.
- A narrow, centered Omarchy launcher holds every official navigation label and destination. Its fixed top-left control remains the stable way back into the menu, while the ISO download sits at the opposite screen edge for direct access.
- Both promo videos live inside a Videos app on workspace 3, so the product demonstration remains part of the desktop instead of becoming a separate marketing section.
- Mobile turns the desktop into a one-window-at-a-time app switcher, stacks the videos in a scrollable window, and keeps every launcher target reachable through an internally scrolling panel.
- All official static pages and nested routes remain available under the same paths as omarchy.org.

## Interaction

- The Three.js wallpaper responds only to direct pointer input and settles immediately. There is no idle animation.
- The CSS wallpaper and usable desktop paint immediately. Three.js enhances the wallpaper after first paint, with no blocking splash screen or simulated boot delay.
- Home samples live values only while its window is mounted and visible. The pause control stops monitoring, missing browser APIs say they are not exposed, and no CPU, memory, network, or process value is fabricated to imitate btop.
- Windows can be focused, dragged, resized, minimized, maximized, closed, reopened, and moved between real workspaces through the app launcher.
- The terminal accepts a small documented command set, while Files contains real site destinations.
- Arrow keys move focused title bars, Shift plus arrow keys resize, Enter maximizes, Escape closes the launcher, and Alt plus 1 to 3 switches workspaces.
- Mobile uses one full-screen focused window at a time with the dock as the app switcher. Reduced motion and WebGL failure keep every operating-system interaction available over the CSS wallpaper.
- Video thumbnails are real buttons and load privacy-enhanced YouTube embeds only after selection. Closing the Videos window or leaving its workspace stops playback by unmounting the player.
- The site launcher opens from its fixed top-left control or Ctrl/Cmd plus K, focuses site search, closes on Escape, backdrop selection, or page scroll, and supports arrow, Home, End, and Enter key navigation. Its blank state shows the destination list. Typing places Orama results on the left and a related-content graph on the right across manuals, news, static pages, and external destinations; narrower screens stack a horizontally scrollable result rail above the graph. Selecting a result or node recenters the graph and finds the next useful documents. Open page follows the selected result, while Search results returns to the original query. Its control hides only while scrolling, then returns.
- All primary controls meet a 44px minimum target and expose visible keyboard focus.

## Implementation

- Solid 2 owns the redesigned homepage.
- StyleX owns component, responsive, state, and token styling for that homepage.
- Three.js owns the lazy-loaded WebGL 2 wallpaper compositor. Solid supplies the accessible window layer, renderer work happens on demand, device pixel ratio is capped, and scene resources are disposed with the component.
- Orama is lazy-loaded when the launcher opens. A repeatable predev and prebuild step generates its document corpus from the real manual index, static HTML pages, and verified external destinations. Solid owns accessible graph nodes and progressive exploration. Three.js draws their relationships on demand without a render loop; the native controls remain complete when WebGL is unavailable.
- A small global stylesheet supplies font faces, the document reset, and the upstream TTFX canvas fallback contract.
- Official static routes and shared assets are preserved from `omacom/omarchy-site` revision `31a5ecd`.
