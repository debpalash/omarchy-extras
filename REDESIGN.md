# Omarchy homepage redesign

## Design read

An open-source Linux homepage for curious developers and power users, using Omarchy's own terminal-editorial language.

- ENERGY: 3
- RHYTHM: 3
- MOTION: 2
- Theme: fixed dark, because Omarchy's existing identity and the official desktop captures are dark and terminal-led

## Why these choices

- The current homepage puts a large masthead and many equal-weight links before the product. The redesign puts the product, ISO, and manual in the first viewport.
- The Tokyo Night palette comes from an official built-in Omarchy theme, so the interface feels native without inventing a new visual identity.
- JetBrains Mono is already used by Omarchy. Large type, bracketed section labels, rules, and keycaps make the page feel editorial and terminal-aware without fake terminal decoration.
- Real Omarchy screenshots do the visual work. There are no generated dashboards, fake metrics, testimonials, or decorative gradients.
- The page stays dark because the official identity and screenshots are dark. The light green accent is reserved for install actions, focus, and small state markers.
- Motion is limited to media reveal and direct hover feedback. Reduced-motion users get the same content with no reveal transition.
- Repeated tiles are used only where direct comparison helps: themes and community destinations.

## Content order

1. Foundation announcement
2. Product promise and ISO/manual actions
3. What ships with the system
4. Keyboard-first workflow
5. Built-in themes
6. Two official homepage promo videos
7. Community and project links
8. Install reminder and footer

## Visual tokens

- Night: `#11121a`
- Surface: `#1a1b26`
- Raised: `#24283b`
- Text: `#c0caf5`
- Bright text: `#f4f6ff`
- Muted text: `#a9b1d6`
- Blue: `#7aa2f7`
- Cyan: `#7dcfff`
- Install and focus: `#9ece6a`
- Hairline: `#3b4261`

## Interaction and accessibility

- All controls and links have a minimum 44px target.
- The mobile navigation uses a labelled native disclosure with an Escape-key close path.
- The video uses a privacy-enhanced facade and loads the embed only after an explicit click.
- Visible focus, semantic landmarks, a skip link, descriptive image text, and reduced-motion behavior are required.
- The layout has dedicated desktop, tablet, and narrow-phone compositions with no horizontal page scroll.
