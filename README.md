# Omarchy Extras

A Solid 2 and StyleX redesign for the [Omarchy Design team call](https://omarchy.org).

[View the live submission](https://omarchy.palash.dev)

## Themes and plugins

| Extra | Source | What it does |
| --- | --- | --- |
| GTA VI theme | [themes/gta6](https://github.com/debpalash/omarchy-gta6-theme) | Theme colors, icons, and backgrounds |
| Bootable | [plugins/bootable](https://github.com/debpalash/omarchy-bootable) | Browse ISO releases and prepare removable drives from the Omarchy bar |
| Disk Guard | [plugins/disk-guard](plugins/disk-guard/) | Review disk usage and move selected files to recoverable Trash |
| Qwen Servers | [qwen-workspace](https://github.com/debpalash/qwen-workspace) (private) | Manage local Qwen inference servers from the Omarchy bar |
| Android Emulator | [omarchy-android-emulator](https://github.com/debpalash/omarchy-android-emulator) (private) | Manage Android virtual devices from the Omarchy bar |

To load the two public submodules into an existing clone:

```bash
git submodule update --init --recursive
```

Follow each project's README for its installation steps. Website development
only requires the files in this repository.

## Develop the site

```bash
npm install
npm run dev
npm run check
npm run build
```

The redesigned homepage uses Solid 2, StyleX, Vite 8, and a lazy Three.js WebGL desktop compositor. It deploys through Cloudflare Workers Static Assets. The official manual, news, teams, themes, security, and other routes are included locally from [`omacom/omarchy-site`](https://github.com/omacom/omarchy-site) at revision `31a5ecd`.

This is an independent design submission by [Palash Deb](https://palash.dev). Upstream Omarchy content, branding, and assets remain the property of their respective owners.
