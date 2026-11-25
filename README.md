# Omarchy Extras

![Illustrated Omarchy desktop with tiled terminal windows](docs/readme/cover.svg)

Omarchy Extras is an independent collection of **themes and Quickshell bar plugins for [Omarchy](https://omarchy.org)**, the Arch Linux desktop built around Hyprland. Change how your desktop looks, prepare a bootable USB drive, or find what's taking up disk space. If you're exploring Omarchy before installing it, try the desktop demo in your browser.

[Browse the catalog](#catalog) · [Install an extra](#installation) · [Try the web demo](https://omarchy.palash.dev) · [Develop locally](#development)

## Catalog

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <p><strong>GTA VI Theme</strong></p>
      <p><strong>Give your desktop a new look.</strong> Choose Vice Sunset or one of 15 alternate palettes, with matching wallpapers and Yaru Magenta icons.</p>
      <a href="#gta-vi-theme">Install theme →</a> · <a href="https://github.com/debpalash/omarchy-gta6-theme">Theme source</a>
    </td>
    <td width="50%" valign="top">
      <p><strong>Bootable</strong></p>
      <p><strong>Prepare an installer USB from the bar.</strong> Search Linux ISO releases, download or open an image, and review the selected drive before writing.</p>
      <a href="#bootable">Install plugin →</a> · <a href="https://github.com/debpalash/omarchy-bootable">Plugin source</a>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <p><strong>Disk Guard</strong></p>
      <p><strong>See where your disk space went.</strong> Find large files, stale caches, and build artifacts, then move the items you select to recoverable Trash.</p>
      <a href="#disk-guard">Install plugin →</a> · <a href="plugins/disk-guard/">Plugin source</a>
    </td>
    <td width="50%" valign="top">
      <p><strong>Omarchy Web Demo</strong></p>
      <p><strong>Explore the desktop in your browser.</strong> Try tiled windows, workspaces, a keyboard launcher, and searchable Omarchy docs without installing Linux.</p>
      <a href="https://omarchy.palash.dev">Open demo →</a> · <a href="DESIGN.md">Design notes</a>
    </td>
  </tr>
</table>

### Plugin previews

<table width="100%">
  <tr>
    <th width="50%" scope="col">Bootable</th>
    <th width="50%" scope="col">Disk Guard</th>
  </tr>
  <tr>
    <td align="center" valign="middle">
      <a href="https://github.com/debpalash/omarchy-bootable#screenshots"><img src="https://raw.githubusercontent.com/debpalash/omarchy-bootable/3fdd881074e9c791b8014686a327f4eda378d824/preview.png" alt="Bootable bar panel with options to choose a local image, discover an ISO, and select a removable drive" width="255"></a>
    </td>
    <td align="center" valign="middle">
      <a href="docs/readme/disk-guard.png"><img src="docs/readme/disk-guard.png" alt="Disk Guard showing free disk space and a review list of caches, build artifacts, and downloads with sample data" width="340"></a>
    </td>
  </tr>
</table>

## Installation

Install only the theme or plugin you want. The web demo runs in your browser and has no local dependencies.

### GTA VI Theme

```bash
omarchy theme install https://github.com/debpalash/omarchy-gta6-theme.git
```

Omarchy installs **Vice Sunset** as the default. The theme guide explains how to switch to any of the 15 additional editions. [Desktop preview](https://github.com/debpalash/omarchy-gta6-theme/blob/f1eaa3c7c7eb8bfac1ef05e67f680124c314cf01/preview.png) · [Edition guide](https://github.com/debpalash/omarchy-gta6-theme/blob/main/variants/README.md)

### Bootable

```bash
omarchy plugin add https://github.com/debpalash/omarchy-bootable.git --enable --yes
```

The full workflow needs **Omarchy 4 or newer** and **Bootable 0.1.4 or newer** with its privileged helper and Polkit policy. The plugin asks you to choose a removable target and confirm the erase plan before writing. [Requirements, updates, and removal](https://github.com/debpalash/omarchy-bootable#dependencies-and-permissions)

### Disk Guard

From a regular Omarchy terminal, clone Omarchy Extras and run the installer:

```bash
git clone https://github.com/debpalash/omarchy-extras.git
cd omarchy-extras/plugins/disk-guard
python3 install.py
```

Requires Omarchy's Quickshell plugin host, Python 3.11+, Git, and `df`. Disk scans stay on your machine, and cleanup requires your selection and confirmation. [Settings, cleanup behavior, and CLI](plugins/disk-guard/README.md)

### Private companion plugins

These projects require access to their respective GitHub repositories.

| Plugin | What it manages |
| --- | --- |
| [Qwen Servers](https://github.com/debpalash/qwen-workspace) | Local Qwen inference servers and runtime profiles from the Omarchy bar |
| [Android Emulator](https://github.com/debpalash/omarchy-android-emulator) | Android virtual devices from the Omarchy bar |

## Development

**Website:** The repository root contains the Solid 2, StyleX, and Vite web demo. A Three.js desktop compositor loads on demand. The live site deploys through Cloudflare Workers Static Assets.

```bash
npm install
npm run dev
```

Run `npm run check` and `npm run build` before opening a website PR. Website development requires Node.js 22.12 or newer and works without submodules.

**Catalog source:** Bootable and GTA VI are pinned submodules with their own release and update paths. Disk Guard is tracked directly in this repository.

| Path | Contents |
| --- | --- |
| `themes/gta6/` | GTA VI theme submodule |
| `plugins/bootable/` | Bootable plugin submodule |
| [`plugins/disk-guard/`](plugins/disk-guard/) | Disk Guard source, docs, and tests |
| [`src/`](src/) · [`public/`](public/) | Website code and static assets |

To populate the two submodules for local browsing:

```bash
git submodule update --init --recursive
```

## Credits

Omarchy Extras is maintained by [Palash Deb](https://palash.dev). The web demo began as a submission to the Omarchy Design team and includes upstream pages from [`omacom/omarchy-site`](https://github.com/omacom/omarchy-site/tree/31a5ecd). See the [MIT license](LICENSE) for this repository and the component repositories for their own licenses and artwork credits.
