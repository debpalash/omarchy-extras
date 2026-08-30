import { Show, createSignal, onSettled } from 'solid-js';
import * as stylex from '@stylexjs/stylex';
import { aboutStyles as styles } from './AboutHome.stylex';

type BrowserMemory = {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
};

const formatBytes = (bytes: number) => {
  const units = ['B', 'KiB', 'MiB', 'GiB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
};

const formatUptime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

const browserName = (agent: string) => {
  if (/Edg\//.test(agent)) return 'Edge';
  if (/Firefox\//.test(agent)) return 'Firefox';
  if (/Chrom(e|ium)\//.test(agent)) return 'Chromium';
  if (/Safari\//.test(agent)) return 'Safari';
  return 'Browser';
};

export default function AboutHome() {
  const [platform, setPlatform] = createSignal('Detecting');
  const [browser, setBrowser] = createSignal('Detecting');
  const [threads, setThreads] = createSignal<number | null>(null);
  const [viewport, setViewport] = createSignal('Detecting');
  const [memory, setMemory] = createSignal<BrowserMemory | null>(null);
  const [online, setOnline] = createSignal<boolean | null>(null);
  const [uptime, setUptime] = createSignal(0);

  onSettled(() => {
    const navigatorWithDetails = navigator as Navigator & { userAgentData?: { platform?: string } };
    const performanceWithMemory = performance as Performance & { memory?: BrowserMemory };

    const readEnvironment = () => {
      setPlatform(navigatorWithDetails.userAgentData?.platform || navigator.platform || 'Not exposed');
      setBrowser(browserName(navigator.userAgent));
      setThreads(navigator.hardwareConcurrency || null);
      setViewport(`${window.innerWidth}×${window.innerHeight} @ ${window.devicePixelRatio.toFixed(1)}x`);
      setOnline(navigator.onLine);
      const measuredMemory = performanceWithMemory.memory;
      setMemory(measuredMemory ? {
        usedJSHeapSize: measuredMemory.usedJSHeapSize,
        jsHeapSizeLimit: measuredMemory.jsHeapSizeLimit,
      } : null);
      setUptime(performance.now() / 1000);
    };

    readEnvironment();
    const timer = window.setInterval(readEnvironment, 1000);
    window.addEventListener('resize', readEnvironment);
    window.addEventListener('online', readEnvironment);
    window.addEventListener('offline', readEnvironment);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', readEnvironment);
      window.removeEventListener('online', readEnvironment);
      window.removeEventListener('offline', readEnvironment);
    };
  });

  return (
    <div {...stylex.attrs(styles.about)}>
      <div {...stylex.attrs(styles.markWrap)} aria-hidden="true">
        <img {...stylex.attrs(styles.mark)} src="/icon.svg" alt="" width="1200" height="1200" />
      </div>

      <div {...stylex.attrs(styles.readout)}>
        <header {...stylex.attrs(styles.identity)}>
          <p {...stylex.attrs(styles.product)}>OMARCHY</p>
          <h1 {...stylex.attrs(styles.headline)} id="rd-hero-title">
            Beautiful, Fun &amp; Opinionated Linux by <a {...stylex.attrs(styles.link, styles.focusRing)} href="https://dhh.dk">DHH</a>
          </h1>
        </header>

        <section {...stylex.attrs(styles.group, styles.hardware)} aria-labelledby="about-hardware">
          <h2 {...stylex.attrs(styles.legend)} id="about-hardware">Hardware</h2>
          <dl {...stylex.attrs(styles.list)}>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>PC</dt><dd {...stylex.attrs(styles.value)}>{platform()}</dd></div>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>CPU</dt><dd {...stylex.attrs(styles.value)}>{threads() ? `${threads()} browser-exposed threads` : 'Not exposed'}</dd></div>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>Display</dt><dd {...stylex.attrs(styles.value)}>{viewport()}</dd></div>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>Memory</dt><dd {...stylex.attrs(styles.value)}>
              <Show when={memory()} fallback="Not exposed by this browser">
                {(current) => `${formatBytes(current().usedJSHeapSize)} / ${formatBytes(current().jsHeapSizeLimit)} JS heap`}
              </Show>
            </dd></div>
          </dl>
        </section>

        <section {...stylex.attrs(styles.group, styles.software)} aria-labelledby="about-software">
          <h2 {...stylex.attrs(styles.legend)} id="about-software">Software</h2>
          <dl {...stylex.attrs(styles.list)}>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>OS</dt><dd {...stylex.attrs(styles.value)}>Omarchy web preview</dd></div>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>UI</dt><dd {...stylex.attrs(styles.value)}>Solid 2 + StyleX</dd></div>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>WM</dt><dd {...stylex.attrs(styles.value)}>Interactive browser windows</dd></div>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>Render</dt><dd {...stylex.attrs(styles.value)}>Three.js / WebGL 2</dd></div>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>Shell</dt><dd {...stylex.attrs(styles.value)}>JetBrains Mono</dd></div>
          </dl>
        </section>

        <section {...stylex.attrs(styles.group, styles.session)} aria-labelledby="about-session">
          <h2 {...stylex.attrs(styles.legend)} id="about-session">Session</h2>
          <dl {...stylex.attrs(styles.sessionList)}>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>Browser</dt><dd {...stylex.attrs(styles.value)}>{browser()}</dd></div>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>Network</dt><dd {...stylex.attrs(styles.value)}>{online() === null ? 'Checking' : online() ? 'Online' : 'Offline'}</dd></div>
            <div {...stylex.attrs(styles.row)}><dt {...stylex.attrs(styles.key)}>Uptime</dt><dd {...stylex.attrs(styles.value)}>{formatUptime(uptime())}</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
