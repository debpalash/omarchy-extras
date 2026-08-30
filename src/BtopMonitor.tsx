import { For, Show, createMemo, createSignal, onSettled } from 'solid-js';
import * as stylex from '@stylexjs/stylex';
import { btopStyles as styles } from './BtopMonitor.stylex';

export type DesktopTaskId = 'about' | 'btop' | 'dhh-video' | 'network-video' | 'terminal' | 'files';

type HomeTask = {
  id: DesktopTaskId;
  title: string;
  workspace: number;
  open: boolean;
  minimized: boolean;
};

type BrowserMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

type BrowserConnection = EventTarget & {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

type ConnectionSnapshot = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

type BtopMonitorProps = {
  tasks: HomeTask[];
  onOpen: (id: DesktopTaskId) => void;
};

const taskLabels: Record<DesktopTaskId, string> = {
  about: 'About',
  btop: 'btop',
  'dhh-video': 'DHH Demo',
  'network-video': 'NetworkChuck Demo',
  terminal: 'Terminal',
  files: 'Files',
};

const systemProcesses = [
  ['chromium', '/usr/lib/chromium/chromium'],
  ['WebContent', 'browser content process'],
  ['Compositor', 'WebGL compositor thread'],
  ['Renderer', 'Solid application renderer'],
  ['Network', 'browser network service'],
  ['GPU Process', 'WebGL graphics process'],
  ['Audio', 'browser audio service'],
  ['Worker', 'site search index worker'],
  ['Vite', 'development module server'],
  ['CSS', 'StyleX atomic stylesheet'],
  ['Timer', 'performance sampler'],
  ['Session', 'Omarchy desktop session'],
] as const;

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
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
  const remainingSeconds = total % 60;
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':');
};

export default function BtopMonitor(props: BtopMonitorProps) {
  const [paused, setPaused] = createSignal(false);
  const [lagHistory, setLagHistory] = createSignal<number[]>([]);
  const [memory, setMemory] = createSignal<BrowserMemory | null>(null);
  const [memoryChecked, setMemoryChecked] = createSignal(false);
  const [environmentReady, setEnvironmentReady] = createSignal(false);
  const [platform, setPlatform] = createSignal('Detecting');
  const [cores, setCores] = createSignal<number | null>(null);
  const [viewport, setViewport] = createSignal('Detecting');
  const [uptime, setUptime] = createSignal(0);
  const [online, setOnline] = createSignal<boolean | null>(null);
  const [connection, setConnection] = createSignal<ConnectionSnapshot | null>(null);

  const currentLag = createMemo(() => lagHistory().at(-1));
  const chartMax = createMemo(() => Math.max(16, ...lagHistory()));
  const memoryPercent = createMemo(() => {
    const current = memory();
    if (!current?.jsHeapSizeLimit) return 0;
    return Math.min(100, (current.usedJSHeapSize / current.jsHeapSizeLimit) * 100);
  });

  const taskState = (task: HomeTask) => {
    if (!task.open) return 'STOP';
    if (task.minimized) return `MIN  WS${task.workspace}`;
    return `RUN  WS${task.workspace}`;
  };

  const visibleCores = createMemo(() => Array.from(
    { length: Math.min(32, Math.max(8, cores() ?? 8)) },
    (_, index) => ({ index, load: Math.round(((currentLag() ?? 2) * 7 + index * 11) % 18) }),
  ));

  onSettled(() => {
    const navigatorWithDetails = navigator as Navigator & {
      connection?: BrowserConnection;
      userAgentData?: { platform?: string };
    };
    const performanceWithMemory = performance as Performance & { memory?: BrowserMemory };
    const browserConnection = navigatorWithDetails.connection ?? null;
    let lastSample = performance.now();

    const readEnvironment = () => {
      const measuredMemory = performanceWithMemory.memory;
      if (measuredMemory) {
        setMemory({
          usedJSHeapSize: measuredMemory.usedJSHeapSize,
          totalJSHeapSize: measuredMemory.totalJSHeapSize,
          jsHeapSizeLimit: measuredMemory.jsHeapSizeLimit,
        });
      }
      setMemoryChecked(true);
      setPlatform(navigatorWithDetails.userAgentData?.platform || navigator.platform || 'Not exposed');
      setCores(navigator.hardwareConcurrency || null);
      setViewport(`${window.innerWidth} × ${window.innerHeight}`);
      setUptime(performance.now() / 1000);
      setOnline(navigator.onLine);
      setConnection(browserConnection ? {
        effectiveType: browserConnection.effectiveType,
        downlink: browserConnection.downlink,
        rtt: browserConnection.rtt,
        saveData: browserConnection.saveData,
      } : null);
      setEnvironmentReady(true);
    };

    const sample = () => {
      if (paused() || document.hidden) {
        lastSample = performance.now();
        return;
      }
      const now = performance.now();
      const delay = Math.max(0, now - lastSample - 500);
      lastSample = now;
      setLagHistory((current) => [...current, delay].slice(-32));
      readEnvironment();
    };

    readEnvironment();
    const sampleTimer = window.setInterval(sample, 500);
    const onVisibilityChange = () => { lastSample = performance.now(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('resize', readEnvironment);
    window.addEventListener('online', readEnvironment);
    window.addEventListener('offline', readEnvironment);
    browserConnection?.addEventListener('change', readEnvironment);

    return () => {
      window.clearInterval(sampleTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', readEnvironment);
      window.removeEventListener('online', readEnvironment);
      window.removeEventListener('offline', readEnvironment);
      browserConnection?.removeEventListener('change', readEnvironment);
    };
  });

  return (
    <div {...stylex.attrs(styles.home)} aria-label="btop browser system monitor">
      <header {...stylex.attrs(styles.topbar)}>
        <strong><span {...stylex.attrs(styles.pink)}>1</span>cpu</strong>
        <span>menu</span><span>preset *</span>
        <time {...stylex.attrs(styles.clock)}>{new Date().toLocaleTimeString([], { hour12: false })}</time>
        <button {...stylex.attrs(styles.pauseButton, styles.focusRing)} type="button" aria-pressed={paused() ? 'true' : 'false'} onClick={() => setPaused((value) => !value)}>
          {paused() ? 'resume' : 'pause'}
        </button>
      </header>

      <div {...stylex.attrs(styles.grid)}>
        <section {...stylex.attrs(styles.panel, styles.cpuPanel)} aria-labelledby="cpu-title">
          <div {...stylex.attrs(styles.panelHeading)}><h2 {...stylex.attrs(styles.panelTitle)} id="cpu-title">Ryzen Browser CPU</h2><span>{cores() ?? 8} cores</span></div>
          <div {...stylex.attrs(styles.cpuBody)}>
            <Show when={lagHistory().length} fallback={<p {...stylex.attrs(styles.emptyState)}>sampling cpu history...</p>}>
              <div {...stylex.attrs(styles.chart)} aria-hidden="true"><For each={lagHistory()}>{(value, index) => <span {...stylex.attrs(styles.chartBar, index() === lagHistory().length - 1 && styles.chartBarCurrent)} style={{ height: `${Math.max(2, (value / chartMax()) * 100)}%` }} />}</For></div>
            </Show>
            <div {...stylex.attrs(styles.coreGrid)}><For each={visibleCores()}>{(core) => <div {...stylex.attrs(styles.coreRow)}><span>C{core.index}</span><span {...stylex.attrs(styles.coreMeter)}>{'·'.repeat(Math.max(2, Math.round(core.load / 2)))}</span><strong>{core.load}%</strong><em>{32 + core.index % 5}°</em></div>}</For></div>
          </div>
          <p {...stylex.attrs(styles.uptime)}>up {formatUptime(uptime())} <span>load avg: {((currentLag() ?? 0) / 10).toFixed(2)}</span></p>
        </section>

        <section {...stylex.attrs(styles.panel, styles.memoryPanel)} aria-labelledby="memory-title">
          <div {...stylex.attrs(styles.panelHeading)}><h2 {...stylex.attrs(styles.panelTitle)} id="memory-title">mem</h2><span>{memory() ? `${memoryPercent().toFixed(0)}%` : 'n/a'}</span></div>
          <Show when={memory()} fallback={<p {...stylex.attrs(styles.emptyState)}>heap data unavailable</p>}>{(current) => <><dl {...stylex.attrs(styles.stackList)}><div><dt>Total</dt><dd>{formatBytes(current().jsHeapSizeLimit)}</dd></div><div><dt>Used</dt><dd>{formatBytes(current().usedJSHeapSize)}</dd></div><div><dt>Free</dt><dd>{formatBytes(current().jsHeapSizeLimit - current().usedJSHeapSize)}</dd></div></dl><div {...stylex.attrs(styles.memoryMeter)} aria-hidden="true"><span style={{ height: `${Math.max(8, memoryPercent())}%`, width: '100%', 'background-color': '#76c7a0', opacity: 0.78 }} /></div><div {...stylex.attrs(styles.blockGraph)} aria-hidden="true">▁▁▂▂▃▃▄▄▅▅▆▇</div></>}</Show>
        </section>

        <section {...stylex.attrs(styles.panel, styles.diskPanel)} aria-labelledby="disk-title">
          <div {...stylex.attrs(styles.panelHeading)}><h2 {...stylex.attrs(styles.panelTitle)} id="disk-title">disks</h2><span>io</span></div>
          <dl {...stylex.attrs(styles.diskList)}><div><dt>root</dt><dd><span>Used 51%</span><b>▰▰▰▰▱▱▱▱</b></dd></div><div><dt>home</dt><dd><span>Used 51%</span><b>▰▰▰▰▱▱▱▱</b></dd></div><div><dt>boot</dt><dd><span>Used 41%</span><b>▰▰▰▱▱▱▱▱</b></dd></div></dl>
        </section>

        <section {...stylex.attrs(styles.panel, styles.networkPanel)} aria-labelledby="network-title">
          <div {...stylex.attrs(styles.panelHeading)}><h2 {...stylex.attrs(styles.panelTitle)} id="network-title">net</h2><span {...stylex.attrs(styles.networkState, online() === false && styles.networkOffline)}>{online() ? 'sync auto' : 'offline'}</span></div>
          <div {...stylex.attrs(styles.netGraph)} aria-hidden="true">▁▁▂▃▅▂▆▃▂▇▅▂▁</div>
          <dl {...stylex.attrs(styles.stackList)}><div><dt>download</dt><dd>{connection()?.downlink ? `${connection()!.downlink} Mbps` : 'not exposed'}</dd></div><div><dt>rtt</dt><dd>{connection()?.rtt ? `${connection()!.rtt} ms` : 'not exposed'}</dd></div></dl>
        </section>

        <section {...stylex.attrs(styles.panel, styles.processPanel)} aria-labelledby="process-title">
          <div {...stylex.attrs(styles.panelHeading)}><h2 {...stylex.attrs(styles.panelTitle)} id="process-title">proc</h2><span>filter　per-core　tree</span></div>
          <div {...stylex.attrs(styles.processHeader)}><span>Pid</span><span>Program</span><span>MemB</span><span>Cpu%</span></div>
          <div {...stylex.attrs(styles.processList)}>
            <For each={props.tasks}>{(task, index) => <button {...stylex.attrs(styles.processRow, index() === 0 && styles.processSelected, styles.focusRing)} type="button" onClick={() => props.onOpen(task.id)} aria-label={`${taskLabels[task.id]}: ${taskState(task)}. Activate app.`}><span>{4980 + index() * 317}</span><strong>{taskLabels[task.id]}</strong><span>{task.open ? 215 + index() * 39 : 0}M</span><span>{task.open ? (0.1 + index() * 0.1).toFixed(1) : '0.0'}</span></button>}</For>
            <For each={systemProcesses}>{(process, index) => <div {...stylex.attrs(styles.processStaticRow)}><span>{7934 + index() * 211}</span><span title={process[1]}>{process[0]}</span><span>{64 + index() * 23}M</span><span>{(index() % 4 / 10).toFixed(1)}</span></div>}</For>
          </div>
          <footer {...stylex.attrs(styles.processFooter)}>↑ select　↓ info　↵ open　q close <span>{props.tasks.filter((task) => task.open).length}/{props.tasks.length}</span></footer>
        </section>
      </div>
    </div>
  );
}
