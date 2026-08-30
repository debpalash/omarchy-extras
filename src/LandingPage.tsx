import { For, Show, createSignal, onSettled } from 'solid-js';
import * as stylex from '@stylexjs/stylex';
import { styles } from './landing.stylex';
import './landing.css';

const OMARCHY_MARK = `                 ▄▄▄
 ▄█████▄    ▄███████████▄    ▄███████   ▄███████   ▄███████   ▄█   █▄    ▄█   █▄
███   ███  ███   ███   ███  ███   ███  ███   ███  ███   ███  ███   ███  ███   ███
███   ███  ███   ███   ███  ███   ███  ███   ███  ███   █▀   ███   ███  ███   ███
███   ███  ███   ███   ███ ▄███▄▄▄███ ▄███▄▄▄██▀  ███       ▄███▄▄▄███▄ ███▄▄▄███
███   ███  ███   ███   ███ ▀███▀▀▀███ ▀███▀▀▀▀    ███      ▀▀███▀▀▀███  ▀▀▀▀▀▀███
███   ███  ███   ███   ███  ███   ███ ██████████  ███   █▄   ███   ███  ▄██   ███
███   ███  ███   ███   ███  ███   ███  ███   ███  ███   ███  ███   ███  ███   ███
 ▀█████▀    ▀█   ███   █▀   ███   █▀   ███   ███  ███████▀   ███   █▀    ▀█████▀
                                       ███   █▀`;

const officialLinkGroups = [
  [
    { label: 'Manual', href: '/manual/' },
    { label: 'ISO', href: 'https://iso.omarchy.org/omarchy-4.0.1.iso' },
    { label: 'Plugins', href: 'https://omarchyplugins.com/' },
    { label: 'GitHub', href: 'https://github.com/omacom/omarchy' },
    { label: 'Security', href: '/security/' },
  ],
  [
    { label: 'News', href: '/news/' },
    { label: 'Teams', href: '/teams/' },
    { label: 'Patrons', href: '/patrons/' },
    { label: 'Sponsorships', href: '/sponsorships/' },
    { label: 'AIR', href: '/air/' },
  ],
  [
    { label: 'Discord', href: 'https://discord.gg/tXFUdasqhY' },
    { label: 'Meetups', href: '/meetups/' },
    { label: 'Workstations', href: '/workstations/' },
    { label: 'Merch', href: 'https://supply.37signals.com/collections/omarchy' },
  ],
];

type VideoFacadeProps = {
  videoId: string;
  title: string;
  image: string;
  alt: string;
};

function VideoFacade(props: VideoFacadeProps) {
  const [playing, setPlaying] = createSignal(false);

  return (
    <div {...stylex.attrs(styles.videoFrame)}>
      <Show
        when={playing()}
        fallback={
          <button
            {...stylex.attrs(styles.videoFill, styles.videoFacade, styles.focusRing)}
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${props.title}`}
          >
            <img
              {...stylex.attrs(styles.videoImage)}
              src={props.image}
              alt={props.alt}
              width="1280"
              height="720"
              loading="lazy"
              decoding="async"
            />
            <span {...stylex.attrs(styles.videoShade)} aria-hidden="true" />
            <span {...stylex.attrs(styles.play)} aria-hidden="true">
              <span {...stylex.attrs(styles.playIcon)} />
            </span>
          </button>
        }
      >
        <iframe
          {...stylex.attrs(styles.videoFill)}
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

export default function LandingPage() {
  onSettled(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/redesign') {
      window.history.replaceState(null, '', '/');
    }

    document.body.classList.add('omarchy-site');
    return () => document.body.classList.remove('omarchy-site');
  });

  return (
    <div {...stylex.attrs(styles.page)}>
      <a {...stylex.attrs(styles.skipLink, styles.focusRing)} href="#main">Skip to content</a>

      <aside {...stylex.attrs(styles.announcement)} aria-label="Project announcement">
        <a
          {...stylex.attrs(styles.announcementLink, styles.focusRing)}
          href="/news/2026/08/omacom-foundation-launches-with-8-million/"
        >
          <span {...stylex.attrs(styles.liveDot)} aria-hidden="true" />
          Omacom Foundation launches with <s>$8</s> $10 million
        </a>
      </aside>

      <div class="pre">
        <a {...stylex.attrs(styles.focusRing)} href="/" aria-label="Omarchy">
          <pre>{OMARCHY_MARK}</pre>
        </a>
      </div>

      <main id="main">
        <section {...stylex.attrs(styles.heroShell)} aria-labelledby="rd-hero-title">
          <span {...stylex.attrs(styles.heroGridOverlay)} aria-hidden="true" />
          <div {...stylex.attrs(styles.contentWidth, styles.hero)}>
            <h1 {...stylex.attrs(styles.heroTitle)} id="rd-hero-title">
              Beautiful, Fun &amp; Opinionated Linux by{' '}
              <a {...stylex.attrs(styles.heroTitleLink, styles.focusRing)} href="https://dhh.dk">DHH</a>
            </h1>

            <figure {...stylex.attrs(styles.heroFigure)}>
              <img
                {...stylex.attrs(styles.heroImage)}
                src="/screens/tokyo-night.webp"
                alt="Omarchy Tokyo Night desktop with the application menu, terminal and system monitor"
                width="1600"
                height="900"
                loading="eager"
                decoding="async"
                fetchpriority="high"
              />
            </figure>
          </div>
        </section>

        <nav {...stylex.attrs(styles.officialLinks)} aria-label="Omarchy links">
          <For each={officialLinkGroups}>
            {(group) => (
              <div {...stylex.attrs(styles.linkRow)}>
                <For each={group}>
                  {(link) => (
                    <a {...stylex.attrs(styles.navLink, styles.focusRing)} href={link.href}>
                      {link.label}
                    </a>
                  )}
                </For>
              </div>
            )}
          </For>
        </nav>

        <section {...stylex.attrs(styles.contentWidth, styles.videoGrid)} aria-label="Omarchy videos">
          <VideoFacade
            videoId="F7fe9pa8OeE"
            title="Omarchy introduction video"
            image="/screens/omarchy-quattro.webp"
            alt="Omarchy Quattro by David Heinemeier Hansson"
          />
          <VideoFacade
            videoId="9SDkU5VDQEQ"
            title="You need to switch to Linux RIGHT NOW!! by NetworkChuck"
            image="/screens/networkchuck.webp"
            alt="You need to switch to Linux RIGHT NOW!! by NetworkChuck"
          />
        </section>
      </main>

      <footer {...stylex.attrs(styles.contentWidth, styles.footer)}>
        <p {...stylex.attrs(styles.footerParagraph)}>
          Looking to become a partner or patron of Omarchy? Write{' '}
          <a {...stylex.attrs(styles.footerLink, styles.focusRing)} href="mailto:david@omarchy.org">david@omarchy.org</a>
        </p>
        <p {...stylex.attrs(styles.footerParagraph)}>
          Incubated at <a {...stylex.attrs(styles.footerLink, styles.focusRing)} href="https://37signals.com/">37signals</a> (makers of{' '}
          <a {...stylex.attrs(styles.footerLink, styles.focusRing)} href="https://basecamp.com/">Basecamp</a> and{' '}
          <a {...stylex.attrs(styles.footerLink, styles.focusRing)} href="https://www.hey.com/">HEY</a>)
        </p>
        <p {...stylex.attrs(styles.footerParagraph)}>
          Sponsored hosting by{' '}
          <a {...stylex.attrs(styles.footerLink, styles.focusRing)} href="https://www.cloudflare.com/">Cloudflare</a>
        </p>
      </footer>
    </div>
  );
}
