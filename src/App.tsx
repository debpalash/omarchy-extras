import { For, createSignal } from 'solid-js';
import plugins from '../catalog/plugins.json';
import themes from '../catalog/themes.json';
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
    <div class="palette" aria-label="Vice color palette">
      <For each={props.colors}>
        {(color) => <span style={{ '--swatch': color }} title={color} />}
      </For>
    </div>
  );
}

export default function App() {
  const theme = themes[0];
  const plugin = plugins[0];
  const [activePreview, setActivePreview] = createSignal(0);

  return (
    <>
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-header" id="top">
        <a class="wordmark" href="#top">
          <span>OMARCHY</span><b>/</b><span>EXTRAS</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#themes">Theme</a>
          <a href="#plugins">Plugin</a>
          <a href="https://github.com/debpalash/omarchy-extras">GitHub</a>
        </nav>
      </header>

      <main id="main">
        <section class="hero" aria-labelledby="hero-title">
          <div class="hero-copy">
            <p class="kicker">Curated by Palash Deb</p>
            <h1 id="hero-title">The side streets of <span>Omarchy.</span></h1>
            <p class="lede">
              A small catalog of extras that earn their place. One serious media writer,
              one sun-soaked desktop theme, and direct Git installs.
            </p>
            <div class="hero-actions">
              <a class="primary-link" href="#themes">Meet Vice</a>
              <a class="text-link" href="#plugins">See Bootable</a>
            </div>
          </div>

          <div class="desktop-shot" aria-label="Vice theme preview">
            <img
              src={theme.previews[0].src}
              alt="Palm trees against a GTA VI inspired sunset"
              width="432"
              height="243"
              fetchpriority="high"
            />
            <div class="desktop-bar" aria-hidden="true">
              <span>1</span>
              <span class="desktop-title">VICE</span>
              <span>18:06</span>
            </div>
            <div class="desktop-caption" aria-hidden="true">VICE / 01</div>
          </div>
        </section>

        <section class="record theme-record" id="themes" aria-labelledby="theme-title">
          <div class="record-heading">
            <p class="record-number">EXTRA 01 / THEME</p>
            <h2 id="theme-title">{theme.name}</h2>
            <p>{theme.summary}</p>
            <Palette colors={theme.palette} />
          </div>

          <div class="theme-stage">
            <a
              class="active-wallpaper"
              href={theme.previews[activePreview()].full}
              aria-label={`Open original resolution: ${theme.previews[activePreview()].label} wallpaper`}
            >
              <img
                src={theme.previews[activePreview()].src}
                alt={`${theme.previews[activePreview()].label} wallpaper preview`}
                width="432"
                height="243"
              />
              <span>Open original resolution</span>
            </a>
            <div class="wallpaper-picker" aria-label="Choose a Vice wallpaper preview">
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
                      src={preview.src}
                      alt=""
                      width="432"
                      height="243"
                      loading="lazy"
                    />
                  </button>
                )}
              </For>
            </div>
          </div>

          <div class="install-block">
            <div>
              <p class="install-label">Install from GitHub</p>
              <p>Omarchy validates the clone and rebuilds protected app configs from the palette.</p>
            </div>
            <CopyCommand command={theme.install} label="Copy theme command" />
            <div class="record-links">
              <a href={theme.repository}>Open Vice source</a>
              <a href={theme.previews[activePreview()].source}>Wallpaper source</a>
            </div>
          </div>
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
            <h2 id="plugin-title">{plugin.name}</h2>
            <p class="plugin-summary">{plugin.summary}</p>
            <ul class="requirement-list">
              <For each={plugin.requirements}>{(item) => <li>{item}</li>}</For>
            </ul>
            <CopyCommand command={plugin.install} label="Copy plugin command" />
            <p class="safety-note">
              Omarchy plugins run as user code. Read the source and keep the installer confirmation enabled.
            </p>
            <div class="record-links">
              <a href={plugin.repository}>Open Bootable source</a>
              <a href={plugin.project}>Visit Bootable</a>
            </div>
          </div>
        </section>

        <section class="closing" aria-labelledby="closing-title">
          <p class="kicker">Built for Quattro</p>
          <h2 id="closing-title">Useful first. Stylish on purpose.</h2>
          <p>
            Every entry points to a public repository, every install command is visible,
            and every borrowed image links back to its source.
          </p>
        </section>
      </main>

      <footer>
        <span>Omarchy Extras</span>
        <span>Unofficial community catalog by Palash Deb</span>
      </footer>
    </>
  );
}
