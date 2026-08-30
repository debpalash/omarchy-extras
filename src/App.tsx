import { For, createSignal, onSettled } from 'solid-js';
import plugins from '../catalog/plugins.json';
import themes from '../catalog/themes.json';
import Redesign from './Redesign';
import './styles.css';

type CopyCommandProps = {
  command: string;
  label: string;
};

function CopyCommand(props: CopyCommandProps) {
  const [status, setStatus] = createSignal<'idle' | 'copied' | 'failed'>('idle');

  const copyWithSelection = () => {
    const textarea = document.createElement('textarea');
    textarea.value = props.command;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  };

  const copy = async () => {
    let copied = false;

    try {
      if (navigator.clipboard?.writeText) {
        copied = await Promise.race([
          navigator.clipboard.writeText(props.command).then(() => true),
          new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 600)),
        ]);
      } else {
        copied = copyWithSelection();
      }
    } catch {
      copied = false;
    }

    if (!copied) copied = copyWithSelection();
    setStatus(copied ? 'copied' : 'failed');
    window.setTimeout(() => setStatus('idle'), 1800);
  };

  return (
    <div class="command-row">
      <code>{props.command}</code>
      <button type="button" class="copy-button" onClick={copy} aria-live="polite">
        {status() === 'copied' ? 'Copied' : status() === 'failed' ? 'Select command' : props.label}
      </button>
    </div>
  );
}

function Palette(props: { colors: string[] }) {
  return (
    <div class="palette" aria-label="GTA6 color palette">
      <For each={props.colors}>
        {(color) => <span style={{ '--swatch': color }} title={color} />}
      </For>
    </div>
  );
}

function highQualitySource(src: string) {
  return src.replace('/previews/', '/wallpapers/').replace(/\.jpg$/, '.webp');
}

function ExtrasApp() {
  const theme = themes[0];
  const plugin = plugins[0];
  const defaultPreviewIndex = Math.max(
    theme.previews.findIndex((preview) => preview.edition === theme.editions[0].slug),
    0,
  );
  const defaultPreview = theme.previews[defaultPreviewIndex];
  const [activePreview, setActivePreview] = createSignal(defaultPreviewIndex);
  const [highQualityGalleryReady, setHighQualityGalleryReady] = createSignal(false);
  const selectedEdition = () => (
    theme.editions.find((edition) => edition.slug === theme.previews[activePreview()].edition)
    ?? theme.editions[0]
  );

  if (typeof window !== 'undefined') {
    onSettled(() => {
      const enableHighQualityGallery = () => setHighQualityGalleryReady(true);

      if (document.readyState === 'complete') {
        const timeout = window.setTimeout(enableHighQualityGallery, 0);
        return () => window.clearTimeout(timeout);
      }

      window.addEventListener('load', enableHighQualityGallery, { once: true });
      return () => window.removeEventListener('load', enableHighQualityGallery);
    });
  }

  return (
    <>
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-header" id="top">
        <a class="wordmark" href="#top">
          <span>OMARCHY</span><b>/</b><span>EXTRAS</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#themes">Themes</a>
          <a href="#plugins">Plugins</a>
          <a href="https://github.com/debpalash/omarchy-extras">GitHub</a>
        </nav>
      </header>

      <main id="main">
        <section class="hero" aria-labelledby="hero-title">
          <div class="hero-copy">
            <p class="kicker">Public catalog by Palash Deb</p>
            <h1 id="hero-title">Omarchy plugins and <span>themes.</span></h1>
            <p class="lede">
              Install Bootable or browse the GTA6 theme collection. Source, commands, and
              wallpaper credits stay with each entry.
            </p>
            <div class="hero-actions">
              <a class="primary-link" href="#themes">GTA6 themes</a>
              <a class="text-link" href="#plugins">Bootable plugin</a>
            </div>
          </div>

          <div class="desktop-shot" aria-label="Default GTA6 Omarchy theme preview">
            <img
              src={highQualitySource(defaultPreview.src)}
              alt="Vice Sunset, the default GTA6 Omarchy theme wallpaper with palms over a pink and orange sky"
              width="1920"
              height="810"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
            <div class="desktop-bar" aria-hidden="true">
              <span>1</span>
              <span class="desktop-title">GTA6</span>
              <span>18:06</span>
            </div>
            <div class="desktop-caption" aria-hidden="true">GTA6 / 27 WALLPAPERS</div>
          </div>
        </section>

        <section class="record theme-record" id="themes" aria-labelledby="theme-title">
          <div class="record-heading">
            <p class="record-number">EXTRA 01 / THEME</p>
            <h2 id="theme-title">{theme.name} theme</h2>
            <p>{theme.summary}</p>
            <div class="edition-readout" aria-live="polite">
              <p class="edition-label">Palette match / {selectedEdition().mode}</p>
              <h3>{selectedEdition().name}</h3>
              <p>{selectedEdition().description}</p>
              <Palette colors={selectedEdition().palette} />
            </div>
          </div>

          <div class="theme-stage">
            <a
              class="active-wallpaper"
              href={theme.previews[activePreview()].full}
              aria-label={`Open original resolution: ${theme.previews[activePreview()].label} wallpaper`}
            >
              <img
                src={highQualitySource(theme.previews[activePreview()].src)}
                alt={`${theme.previews[activePreview()].label} wallpaper preview`}
                width="1920"
                height="1080"
                loading={activePreview() === defaultPreviewIndex ? 'eager' : 'lazy'}
                decoding="async"
              />
              <span>Open original resolution</span>
            </a>
            <div class="wallpaper-picker" aria-label="Choose a GTA6 wallpaper preview">
              <For each={theme.previews}>
                {(preview, index) => (
                  <button
                    type="button"
                    class={activePreview() === index() ? 'selected' : undefined}
                    aria-pressed={activePreview() === index() ? 'true' : 'false'}
                    aria-label={`Preview ${preview.label}`}
                    onClick={() => setActivePreview(index())}
                  >
                    <img
                      src={highQualityGalleryReady() ? highQualitySource(preview.src) : preview.src}
                      alt=""
                      width="1920"
                      height="1080"
                      loading="lazy"
                      decoding="async"
                      fetchpriority="low"
                    />
                  </button>
                )}
              </For>
            </div>
          </div>

          <details class="install-block">
            <summary>Install the GTA6 Omarchy theme</summary>
            <div class="install-block-content">
              <div>
                <p class="install-label">Install from GitHub</p>
                <p>Install the base theme, then choose a wallpaper-matched edition.</p>
              </div>
              <div class="install-copy">
                <CopyCommand command={theme.install} label="Copy theme command" />
                <div class="variant-install">
                  <p class="install-label">Selected edition / {selectedEdition().name}</p>
                  <CopyCommand command={selectedEdition().command} label="Copy edition command" />
                </div>
                <div class="record-links">
                  <a href={theme.repository}>Open GTA6 theme source</a>
                  <a href={`${theme.repository}/blob/main/variants/README.md`}>Read the edition guide</a>
                  <a href={theme.previews[activePreview()].source}>Open wallpaper source</a>
                </div>
              </div>
            </div>
          </details>
        </section>

        <section class="record plugin-record" id="plugins" aria-labelledby="plugin-title">
          <div class="plugin-visual">
            <div class="plugin-frame">
              <img
                src={plugin.preview}
                alt="Bootable panel showing image and removable drive controls"
                width="553"
                height="699"
                loading="lazy"
              />
            </div>
          </div>

          <div class="plugin-copy">
            <p class="record-number">EXTRA 02 / {plugin.kind}</p>
            <h2 id="plugin-title">{plugin.name} plugin</h2>
            <p class="plugin-summary">{plugin.summary}</p>
            <ul class="requirement-list">
              <For each={plugin.requirements}>{(item) => <li>{item}</li>}</For>
            </ul>
            <details class="plugin-install">
              <summary>Install the Bootable Omarchy plugin</summary>
              <div class="plugin-install-content">
                <CopyCommand command={plugin.install} label="Copy plugin command" />
                <p class="safety-note">
                  Omarchy plugins run as user code. Read the source and keep the installer confirmation enabled.
                </p>
              </div>
            </details>
            <div class="record-links">
              <a href={plugin.repository}>Open Bootable source</a>
              <a href={plugin.project}>Visit Bootable</a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>Omarchy Extras</span>
        <span>Public catalog by Palash Deb</span>
      </footer>
    </>
  );
}

export default function App() {
  const path = typeof window === 'undefined' ? '/' : window.location.pathname.replace(/\/+$/, '') || '/';

  return path === '/redesign' ? <Redesign /> : <ExtrasApp />;
}
