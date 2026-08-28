# Omarchy Extras

A curated catalog of public Omarchy extras by Palash Deb, served at [omarchy.palash.dev](https://omarchy.palash.dev).

The first catalog entries are:

- [Bootable](https://github.com/debpalash/omarchy-bootable), an Omarchy bar plugin for safe image discovery and removable-media writing
- [Vice](https://github.com/debpalash/omarchy-vice-theme), an unofficial GTA VI fan theme for Omarchy Quattro

## Stack

- Solid 2 release candidate
- The official Solid Vite plugin in static start mode
- Vite 8
- Cloudflare Workers Static Assets

## Local development

```bash
npm install
npm run dev
```

## Verify

```bash
npm run check
npm run build
```

## Deploy

Wrangler is configured to publish `dist/client` to the `omarchy.palash.dev` custom domain.

```bash
npm run deploy
```

## Catalog data

Plugin and theme records live in `catalog/`. Install commands remain visible in data and on the site so visitors can inspect them before copying anything.

Wallpaper previews came from the requested SFW [Wallhaven GTA VI search](https://wallhaven.cc/search?q=Grand+Theft+Auto+VI&categories=110&purity=100&sorting=relevance&order=desc). Full-resolution files and attribution live in the Vice theme repository.

Licensed under MIT. Third-party screenshots and background artwork retain their original ownership.
