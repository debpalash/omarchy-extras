import { For, Show, createSignal, onSettled } from 'solid-js';
import './landing.css';

const OFFICIAL = 'https://omarchy.org';

const officialLinkGroups = [
  [
    { label: 'Manual', href: `${OFFICIAL}/manual/` },
    { label: 'ISO', href: 'https://iso.omarchy.org/omarchy-4.0.1.iso' },
    { label: 'Plugins', href: 'https://omarchyplugins.com/' },
    { label: 'GitHub', href: 'https://github.com/omacom/omarchy' },
    { label: 'Security', href: `${OFFICIAL}/security/` },
  ],
  [
    { label: 'News', href: `${OFFICIAL}/news/` },
    { label: 'Teams', href: `${OFFICIAL}/teams/` },
    { label: 'Patrons', href: `${OFFICIAL}/patrons/` },
    { label: 'Sponsorships', href: `${OFFICIAL}/sponsorships/` },
    { label: 'AIR', href: `${OFFICIAL}/air/` },
  ],
  [
    { label: 'Discord', href: 'https://discord.gg/tXFUdasqhY' },
    { label: 'Meetups', href: `${OFFICIAL}/meetups/` },
    { label: 'Workstations', href: `${OFFICIAL}/workstations/` },
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
            <span class="rd-play" aria-hidden="true" />
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

export default function LandingPage() {
  onSettled(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/redesign') {
      window.history.replaceState(null, '', '/');
    }

    document.body.classList.add('omarchy-site');
    return () => document.body.classList.remove('omarchy-site');
  });

  return (
    <div class="omarchy-page">
      <a class="rd-skip-link" href="#main">Skip to content</a>

      <aside class="rd-announcement" aria-label="Project announcement">
        <a href={`${OFFICIAL}/news/2026/08/omacom-foundation-launches-with-8-million`}>
          <span class="rd-live-dot" aria-hidden="true" />
          Omacom Foundation launches with <s>$8</s> $10 million
        </a>
      </aside>

      <header class="rd-header">
        <a class="rd-brand" href={`${OFFICIAL}/`} aria-label="Omarchy home">
          <img src="/favicon.png" width="28" height="28" alt="" />
          <span>OMARCHY</span>
        </a>
      </header>

      <main id="main">
        <section class="rd-hero-shell" aria-labelledby="rd-hero-title">
          <div class="rd-hero">
            <h1 id="rd-hero-title">
              Beautiful, Fun &amp; Opinionated Linux by <a href="https://dhh.dk">DHH</a>
            </h1>

            <figure class="rd-hero-figure">
              <img
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

        <nav class="rd-official-links" aria-label="Omarchy links">
          <For each={officialLinkGroups}>
            {(group) => (
              <div class="rd-link-row">
                <For each={group}>
                  {(link) => <a href={link.href}>{link.label}</a>}
                </For>
              </div>
            )}
          </For>
        </nav>

        <section class="rd-video-grid" aria-label="Omarchy videos">
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

      <footer class="rd-footer">
        <p>
          Looking to become a partner or patron of Omarchy? Write{' '}
          <a href="mailto:david@omarchy.org">david@omarchy.org</a>
        </p>
        <p>
          Incubated at <a href="https://37signals.com/">37signals</a> (makers of{' '}
          <a href="https://basecamp.com/">Basecamp</a> and <a href="https://www.hey.com/">HEY</a>)
        </p>
        <p>
          Sponsored hosting by <a href="https://www.cloudflare.com/">Cloudflare</a>
        </p>
      </footer>
    </div>
  );
}
