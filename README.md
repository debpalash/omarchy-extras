# Omarchy Extras

**Themes and bar plugins for Omarchy, plus an independent redesign of the Omarchy website.**

[Themes](#themes) · [Plugins](#plugins) · [Live site](https://omarchy.palash.dev) · [Develop the site](#develop-the-site)

## Themes

### GTA VI

A fan theme with a **Vice Sunset** default, 15 alternate palettes, and Yaru Magenta icons.

```bash
omarchy theme install https://github.com/debpalash/omarchy-gta6-theme.git
```

[Theme source](https://github.com/debpalash/omarchy-gta6-theme) · [Desktop preview](https://github.com/debpalash/omarchy-gta6-theme/blob/f1eaa3c7c7eb8bfac1ef05e67f680124c314cf01/preview.png)

## Plugins

### Bootable

Browse Linux ISO releases, download an image, and prepare a removable drive from the Omarchy bar.

[<img src="https://raw.githubusercontent.com/debpalash/omarchy-bootable/3fdd881074e9c791b8014686a327f4eda378d824/preview.png" width="280" alt="Bootable panel with options to choose a local image or discover an ISO">](https://github.com/debpalash/omarchy-bootable#screenshots)

```bash
omarchy plugin add https://github.com/debpalash/omarchy-bootable.git --enable --yes
```

[Bootable plugin docs](https://github.com/debpalash/omarchy-bootable#install)

### Disk Guard

See which caches, build artifacts, and downloads are using disk space, then move selected items to recoverable Trash.

From a local clone of Omarchy Extras:

```bash
cd plugins/disk-guard
python3 install.py
```

[Disk Guard source and install guide](plugins/disk-guard/)

### Private plugins

| Plugin | What it does |
| --- | --- |
| [Qwen Servers](https://github.com/debpalash/qwen-workspace) | Start, stop, and switch local Qwen inference servers from the bar. |
| [Android Emulator](https://github.com/debpalash/omarchy-android-emulator) | Manage Android virtual devices from the bar. |

## Browse the source locally

Bootable and GTA VI are pinned Git submodules under `plugins/bootable` and `themes/gta6`. To populate both in an existing clone:

```bash
git submodule update --init --recursive
```

Disk Guard is tracked directly in this repo. The private plugin links require GitHub access to their respective repos.

## Develop the site

The [live site](https://omarchy.palash.dev) is an independent design submission for the [Omarchy Design team call](https://omarchy.org).

```bash
npm install
npm run dev
```

Before submitting site changes:

```bash
npm run check
npm run build
```

The homepage uses Solid 2, StyleX, and Vite 8, with a Three.js desktop preview that loads on demand. The site deploys through Cloudflare Workers Static Assets. The manual, news, teams, themes, security, and other upstream routes come from [`omacom/omarchy-site`](https://github.com/omacom/omarchy-site) at revision `31a5ecd`.

Created by [Palash Deb](https://palash.dev). Upstream Omarchy content, branding, and assets remain the property of their respective owners.
