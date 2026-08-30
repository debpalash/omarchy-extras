import { For, Show, createSignal, onSettled } from 'solid-js';
import './redesign.css';

const OFFICIAL = 'https://omarchy.org';
const ISO = 'https://iso.omarchy.org/omarchy-4.0.1.iso';

const shortcuts = [
  { keys: ['Super', 'Space'], action: 'Open the Omarchy menu' },
  { keys: ['Super', 'Return'], action: 'Launch the terminal' },
  { keys: ['Super', 'Shift', 'Return'], action: 'Launch the browser' },
  { keys: ['Super', 'J'], action: 'Stack the active windows' },
];

const themes = [
  { name: 'Tokyo Night', image: '/redesign/screens/tokyo-night.webp', mode: 'dark' },
  { name: 'Gruvbox', image: '/redesign/screens/gruvbox.webp', mode: 'dark' },
  { name: 'Catppuccin', image: '/redesign/screens/catppuccin.webp', mode: 'dark' },
  { name: 'Flexoki Light', image: '/redesign/screens/flexoki-light.webp', mode: 'light' },
];

const communityGroups = [
  {
    label: 'Follow the work',
    links: [
      { label: 'News', href: `${OFFICIAL}/news/` },
      { label: 'GitHub source', href: 'https://github.com/omacom/omarchy' },
      { label: 'Security', href: `${OFFICIAL}/security/` },
      { label: 'Plugins', href: 'https://omarchyplugins.com/' },
    ],
  },
  {
    label: 'Meet the people',
    links: [
      { label: 'Discord', href: 'https://discord.gg/tXFUdasqhY' },
      { label: 'Teams', href: `${OFFICIAL}/teams/` },
      { label: 'Meetups', href: `${OFFICIAL}/meetups/` },
      { label: 'Workstations', href: `${OFFICIAL}/workstations/` },
    ],
  },
  {
    label: 'Support the project',
    links: [
      { label: 'Patrons', href: `${OFFICIAL}/patrons/` },
      { label: 'Sponsorships', href: `${OFFICIAL}/sponsorships/` },
      { label: 'Artists in Residence', href: `${OFFICIAL}/air/` },
      { label: 'Merch', href: 'https://supply.37signals.com/collections/omarchy' },
    ],
  },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function SectionLabel(props: { number: string; children: string }) {
  return (
    <p class="rd-section-label">
      <span>[{props.number}]</span> {props.children}
    </p>
  );
}

type VideoFacadeProps = {
  videoId: string;
  title: string;
  image: string;
  alt: string;
};

function VideoFacade(props: VideoFacadeProps) {
  const [playing, setPlaying] = createSignal(false);

  return (
    <div class="rd-video-frame">
      <Show
        when={playing()}
        fallback={
          <button
            class="rd-video-facade"
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${props.title}`}
          >
            <img
              src={props.image}
              alt={props.alt}
              width="1280"
              height="720"
              loading="lazy"
              decoding="async"
            />
            <span class="rd-play" aria-hidden="true"><span>Play</span></span>
          </button>
        }
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${props.videoId}?autoplay=1&rel=0`}
          title={props.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        />
      </Show>
    </div>
  );
}

function setMeta(selector: string, attribute: string, value: string) {
  const element = document.querySelector(selector);
  const previous = element?.getAttribute(attribute);
  element?.setAttribute(attribute, value);
  return () => {
    if (!element) return;
    if (typeof previous !== 'string') element.removeAttribute(attribute);
    else element.setAttribute(attribute, previous);
  };
}

export default function Redesign() {
  let mobileMenu: HTMLDetailsElement | undefined;

  const closeMenu = () => {
    if (mobileMenu) mobileMenu.open = false;
  };

  onSettled(() => {
    const previousTitle = document.title;
    document.title = 'Omarchy | Beautiful, Fun & Opinionated Linux';
    document.body.classList.add('redesign-route');

    const restoreMeta = [
      setMeta('meta[name="description"]', 'content', 'Omarchy is a beautiful, fun and opinionated Linux distribution based on Arch, Hyprland and Quickshell.'),
      setMeta('meta[name="theme-color"]', 'content', '#11121a'),
      setMeta('meta[property="og:title"]', 'content', 'Omarchy | Beautiful, Fun & Opinionated Linux'),
      setMeta('meta[property="og:description"]', 'content', 'A complete, keyboard-first Linux system based on Arch, Hyprland and Quickshell.'),
      setMeta('meta[property="og:image"]', 'content', 'https://omarchy.palash.dev/redesign/screens/tokyo-night.webp'),
      setMeta('meta[property="og:url"]', 'content', 'https://omarchy.palash.dev/redesign/'),
      setMeta('link[rel="canonical"]', 'href', 'https://omarchy.palash.dev/redesign/'),
      setMeta('link[rel="icon"]', 'href', '/redesign/favicon.png'),
    ];

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !mobileMenu?.open) return;
      closeMenu();
      mobileMenu?.querySelector('summary')?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);

    const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let observer: IntersectionObserver | undefined;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'));
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer?.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      );
      targets.forEach((target) => observer?.observe(target));
    }

    return () => {
      document.title = previousTitle;
      document.body.classList.remove('redesign-route');
      document.removeEventListener('keydown', closeOnEscape);
      observer?.disconnect();
      restoreMeta.forEach((restore) => restore());
    };
  });

  return (
    <div class="redesign-page">
      <a class="rd-skip-link" href="#redesign-main">Skip to content</a>

      <aside class="rd-announcement" aria-label="Project announcement">
        <a href={`${OFFICIAL}/news/2026/08/omacom-foundation-launches-with-8-million`}>
          <span class="rd-live-dot" aria-hidden="true" />
          Omacom Foundation launches with <s>$8</s> $10 million
          <Arrow />
        </a>
      </aside>

      <header class="rd-header">
        <a class="rd-brand" href={`${OFFICIAL}/`} aria-label="Omarchy home">
          <img src="/redesign/favicon.png" width="28" height="28" alt="" />
          <span>OMARCHY</span>
        </a>

        <nav class="rd-desktop-nav" aria-label="Primary navigation">
          <a href={`${OFFICIAL}/manual/`}>Manual</a>
          <a href="#system">System</a>
          <a href="#themes">Themes</a>
          <a href="#community">Community</a>
          <a href="https://github.com/omacom/omarchy">GitHub</a>
        </nav>

        <a class="rd-header-cta" href={ISO}>Get the ISO <span aria-hidden="true">↓</span></a>

        <details
          class="rd-mobile-nav"
          ref={mobileMenu}
        >
          <summary>Menu <span aria-hidden="true" /></summary>
          <nav aria-label="Mobile navigation">
            <a href={`${OFFICIAL}/manual/`} onClick={closeMenu}>Manual</a>
            <a href="#system" onClick={closeMenu}>System</a>
            <a href="#themes" onClick={closeMenu}>Themes</a>
            <a href="#community" onClick={closeMenu}>Community</a>
            <a href="https://github.com/omacom/omarchy" onClick={closeMenu}>GitHub</a>
            <a class="rd-mobile-iso" href={ISO} onClick={closeMenu}>Get the ISO ↓</a>
          </nav>
        </details>
      </header>

      <main id="redesign-main">
        <section class="rd-hero" aria-labelledby="rd-hero-title">
          <div class="rd-hero-copy">
            <p class="rd-eyebrow">ARCH / HYPRLAND / QUICKSHELL</p>
            <h1 id="rd-hero-title">Beautiful, fun &amp; <span>opinionated</span> Linux.</h1>
            <p class="rd-lede">
              Omarchy is an omakase Linux distribution by DHH. A complete system tuned for aesthetics, focus, and getting real work done.
            </p>
            <div class="rd-actions">
              <a class="rd-button rd-button-primary" href={ISO}>Download the ISO <span aria-hidden="true">↓</span></a>
              <a class="rd-button rd-button-secondary" href={`${OFFICIAL}/manual/`}>Read the manual <Arrow /></a>
            </div>
            <p class="rd-install-note">
              <span aria-hidden="true">[!]</span> Full-disk or free-space install. Encryption is on by default.
            </p>
          </div>

          <figure class="rd-hero-figure" data-reveal>
            <div class="rd-screen-top" aria-hidden="true">
              <span>OMARCHY / TOKYO NIGHT</span>
              <span>SUPER + SPACE</span>
            </div>
            <img
              src="/redesign/screens/tokyo-night.webp"
              alt="Omarchy Tokyo Night desktop with the application menu, terminal and system monitor"
              width="1600"
              height="900"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
            <figcaption>Default desktop / Tokyo Night</figcaption>
          </figure>
        </section>

        <section class="rd-system rd-section" id="system" aria-labelledby="rd-system-title">
          <div class="rd-section-intro">
            <SectionLabel number="01">THE SYSTEM</SectionLabel>
            <h2 id="rd-system-title">A complete system.<br /><span>Not a starter kit.</span></h2>
          </div>
          <div class="rd-system-copy">
            <p class="rd-large-copy">
              Omarchy ships as one considered environment. The shell, editor, browser, creative tools, and desktop all arrive ready to use and styled as one.
            </p>
            <dl class="rd-tool-list">
              <div><dt>Build</dt><dd>Neovim · Terminal · Git</dd></div>
              <div><dt>Think</dt><dd>Chromium · Obsidian · LibreOffice</dd></div>
              <div><dt>Create</dt><dd>Kdenlive · OBS Studio · GIMP</dd></div>
              <div><dt>Enjoy</dt><dd>Spotify · Retro music player · Games</dd></div>
            </dl>
            <a class="rd-inline-link" href={`${OFFICIAL}/manual/`}>See what ships with Omarchy <Arrow /></a>
          </div>
        </section>

        <section class="rd-keyboard rd-section" aria-labelledby="rd-keyboard-title">
          <div class="rd-keyboard-media" data-reveal>
            <img
              src="/redesign/screens/keyboard-navigation.webp"
              alt="Four tiled applications on the Omarchy desktop"
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
            />
            <p aria-hidden="true">FOUR WINDOWS. ZERO WINDOW TETRIS.</p>
          </div>
          <div class="rd-keyboard-copy">
            <SectionLabel number="02">KEYBOARD FIRST</SectionLabel>
            <h2 id="rd-keyboard-title">Your hands stay where the work is.</h2>
            <p>Open, tile, move, stack, and close windows without hunting through docks or overlapping layers.</p>
            <ul class="rd-shortcuts">
              <For each={shortcuts}>
                {(shortcut) => (
                  <li>
                    <span class="rd-key-group">
                      <For each={shortcut.keys}>{(key) => <kbd>{key}</kbd>}</For>
                    </span>
                    <span>{shortcut.action}</span>
                  </li>
                )}
              </For>
            </ul>
            <a class="rd-inline-link" href={`${OFFICIAL}/manual/navigation/`}>Learn the navigation model <Arrow /></a>
          </div>
        </section>

        <section class="rd-themes rd-section" id="themes" aria-labelledby="rd-themes-title">
          <div class="rd-theme-heading">
            <div>
              <SectionLabel number="03">THEME DELIGHTED</SectionLabel>
              <h2 id="rd-themes-title">One switch.<br />The whole system follows.</h2>
            </div>
            <p>
              A theme styles the desktop, terminal, Neovim, system monitor, Chromium, and shell together. Pick a mood without rebuilding your setup.
            </p>
          </div>

          <div class="rd-theme-grid">
            <For each={themes}>
              {(theme, index) => (
                <figure data-reveal style={{ '--delay': `${index() * 45}ms` }}>
                  <img
                    src={theme.image}
                    alt={`${theme.name} theme running across the Omarchy desktop`}
                    width="1600"
                    height="900"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>
                    <span>{theme.name}</span>
                    <span>[{theme.mode}]</span>
                  </figcaption>
                </figure>
              )}
            </For>
          </div>
          <a class="rd-inline-link rd-theme-link" href={`${OFFICIAL}/manual/themes/`}>Explore themes and wallpapers <Arrow /></a>
        </section>

        <section class="rd-watch rd-section" aria-labelledby="rd-watch-title">
          <div class="rd-watch-heading">
            <div>
              <SectionLabel number="04">SEE IT MOVE</SectionLabel>
              <h2 id="rd-watch-title">Watch it work.</h2>
            </div>
            <p>Two ways into Omarchy: DHH's official Quattro introduction and NetworkChuck's tour of the system.</p>
          </div>
          <div class="rd-video-grid">
            <article>
              <VideoFacade
                videoId="F7fe9pa8OeE"
                title="Omarchy introduction by David Heinemeier Hansson"
                image="/redesign/screens/omarchy-quattro.webp"
                alt="Omarchy Quattro introduction video thumbnail showing DHH and a rally car at sunset"
              />
              <div class="rd-video-meta">
                <h3>Omarchy Quattro</h3>
                <p>DHH / Official introduction</p>
              </div>
            </article>
            <article>
              <VideoFacade
                videoId="9SDkU5VDQEQ"
                title="You need to switch to Linux right now by NetworkChuck"
                image="/redesign/screens/networkchuck.webp"
                alt="NetworkChuck holding a laptop running Omarchy in the Linux video thumbnail"
              />
              <div class="rd-video-meta">
                <h3>Switch to Linux right now</h3>
                <p>NetworkChuck / Omarchy walkthrough</p>
              </div>
            </article>
          </div>
        </section>

        <section class="rd-community rd-section" id="community" aria-labelledby="rd-community-title">
          <div class="rd-community-heading">
            <SectionLabel number="05">THE PROJECT</SectionLabel>
            <h2 id="rd-community-title">Open source is a group activity.</h2>
            <p>Read the work, meet the people, contribute code, or help fund what comes next.</p>
          </div>
          <div class="rd-link-directory">
            <For each={communityGroups}>
              {(group) => (
                <section aria-labelledby={`group-${group.label.replaceAll(' ', '-').toLowerCase()}`}>
                  <h3 id={`group-${group.label.replaceAll(' ', '-').toLowerCase()}`}>{group.label}</h3>
                  <For each={group.links}>
                    {(link) => <a href={link.href}><span>{link.label}</span><Arrow /></a>}
                  </For>
                </section>
              )}
            </For>
          </div>
        </section>

        <section class="rd-install rd-section" aria-labelledby="rd-install-title">
          <div>
            <SectionLabel number="06">READY WHEN YOU ARE</SectionLabel>
            <h2 id="rd-install-title">Take the whole thing for a spin.</h2>
          </div>
          <div class="rd-install-copy">
            <p>Install to a full disk or unallocated free space. Back up first, then turn off Secure Boot or TPM before starting the installer.</p>
            <div class="rd-actions">
              <a class="rd-button rd-button-primary" href={ISO}>Download Omarchy 4.0.1 <span aria-hidden="true">↓</span></a>
              <a class="rd-button rd-button-secondary" href={`${OFFICIAL}/manual/getting-started/`}>Installation guide <Arrow /></a>
            </div>
          </div>
        </section>
      </main>

      <footer class="rd-footer">
        <a class="rd-brand" href={`${OFFICIAL}/`} aria-label="Omarchy home">
          <img src="/redesign/favicon.png" width="24" height="24" alt="" />
          <span>OMARCHY</span>
        </a>
        <p>Incubated at <a href="https://37signals.com">37signals</a>. Hosted by <a href="https://cloudflare.com">Cloudflare</a>.</p>
        <div>
          <a href="https://github.com/omacom/omarchy">Source</a>
          <a href="https://github.com/omacom/omarchy/blob/quattro/LICENSE">License</a>
        </div>
      </footer>

      <a class="rd-concept-note" href="/" aria-label="Return to Omarchy Extras">
        DESIGN CONCEPT / PALASH DEB
      </a>
    </div>
  );
}
