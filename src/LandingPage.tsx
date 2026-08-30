import { onSettled } from 'solid-js';
import * as stylex from '@stylexjs/stylex';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '@fontsource-variable/jetbrains-mono/wght-italic.css';
import { styles } from './landing.stylex';
import OmarchyDesktop from './OmarchyDesktop';
import SiteMenu from './SiteMenu';
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
      <SiteMenu />

      <div class="pre">
        <aside {...stylex.attrs(styles.announcement)} aria-label="Project announcement">
          <a
            {...stylex.attrs(styles.announcementLink, styles.focusRing)}
            href="/news/2026/08/omacom-foundation-funding-hits-10m/"
          >
            Omacom Foundation launches with $10 million
          </a>
        </aside>
        <a {...stylex.attrs(styles.focusRing)} href="/" aria-label="Omarchy">
          <pre>{OMARCHY_MARK}</pre>
        </a>
        <header {...stylex.attrs(styles.heroCopy)}>
          <h1 {...stylex.attrs(styles.heroHeadline)} id="rd-hero-title">
            Beautiful, Fun &amp; Opinionated Linux by{' '}
            <a {...stylex.attrs(styles.heroDhhLink, styles.focusRing)} href="https://dhh.dk">DHH</a>
          </h1>
          <p {...stylex.attrs(styles.heroDescription)}>
            The malleable OS for the age of agents. Where you can vibe your way through every alteration, tweak, and desire.{' '}
            <a {...stylex.attrs(styles.heroOmarchLink, styles.focusRing)} href="https://omarchs.fyi/">Be the Omarch</a> and command your agent!
          </p>
        </header>
      </div>

      <main id="main">
        <section aria-label="Omarchy desktop preview">
          <OmarchyDesktop />
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
        <p {...stylex.attrs(styles.footerParagraph)}>
          Redesign by{' '}
          <a {...stylex.attrs(styles.footerLink, styles.focusRing)} href="https://palash.dev/">palash.dev</a>
        </p>
      </footer>
    </div>
  );
}
