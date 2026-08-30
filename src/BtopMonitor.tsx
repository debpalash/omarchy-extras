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
    <div {...stylex.attrs(styles.home)} aria-label="Browser session monitor">
      <header {...stylex.attrs(styles.header)}>
        <div {...stylex.attrs(styles.identity)}>
          <p {...stylex.attrs(styles.kicker)}>1 cpu</p>
          <h2 {...stylex.attrs(styles.title)}>Browser session monitor</h2>
        </div>
        <div {...stylex.attrs(styles.session)}>
          <span {...stylex.attrs(styles.sessionLabel)}>UP</span>
          <strong {...stylex.attrs(styles.sessionValue)}>{formatUptime(uptime())}</strong>
          <button
            {...stylex.attrs(styles.pauseButton, styles.focusRing)}
            type="button"
            aria-pressed={paused() ? 'true' : 'false'}
            onClick={() => setPaused((current) => !current)}
          >
            {paused() ? 'Resume' : 'Pause'}
          </button>
        </div>
      </header>

      <div {...stylex.attrs(styles.grid)}>
        <section {...stylex.attrs(styles.panel, styles.loadPanel)} aria-labelledby="ui-load-title">
          <div {...stylex.attrs(styles.panelHeading)}>
            <h2 {...stylex.attrs(styles.panelTitle)} id="ui-load-title">UI DELAY</h2>
            <span {...stylex.attrs(styles.metric)}>{currentLag() === undefined ? 'sampling' : `${currentLag()!.toFixed(1)} ms`}</span>
          </div>
          <Show when={lagHistory().length > 0} fallback={<p {...stylex.attrs(styles.emptyState)}>Measuring browser event-loop delay.</p>}>
            <div {...stylex.attrs(styles.chart)} aria-hidden="true">
              <For each={lagHistory()}>
                {(value, index) => (
                  <span
                    {...stylex.attrs(styles.chartBar, index() === lagHistory().length - 1 && styles.chartBarCurrent)}
                    style={{ height: `${Math.max(3, (value / chartMax()) * 100)}%` }}
                  />
                )}
              </For>
            </div>
            <p {...stylex.attrs(styles.chartSummary)}>Last {lagHistory().length} measured samples. Lower is more responsive.</p>
          </Show>
        </section>

        <section {...stylex.attrs(styles.panel, styles.memoryPanel)} aria-labelledby="memory-title">
          <div {...stylex.attrs(styles.panelHeading)}>
            <h2 {...stylex.attrs(styles.panelTitle)} id="memory-title">JS HEAP</h2>
            <span {...stylex.attrs(styles.metric)}>{memory() ? `${memoryPercent().toFixed(1)}%` : 'n/a'}</span>
          </div>
          <Show
            when={memory()}
            fallback={<p {...stylex.attrs(styles.emptyState)}>{memoryChecked() ? 'Heap data is not exposed by this browser.' : 'Reading browser heap data.'}</p>}
          >
            {(current) => (
              <>
                <div {...stylex.attrs(styles.meter)} aria-hidden="true">
                  <span {...stylex.attrs(styles.meterFill)} style={{ width: `${memoryPercent()}%` }} />
                </div>
                <dl {...stylex.attrs(styles.detailList)}>
                  <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>USED</dt><dd {...stylex.attrs(styles.detailValue)}>{formatBytes(current().usedJSHeapSize)}</dd></div>
                  <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>ALLOC</dt><dd {...stylex.attrs(styles.detailValue)}>{formatBytes(current().totalJSHeapSize)}</dd></div>
                  <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>LIMIT</dt><dd {...stylex.attrs(styles.detailValue)}>{formatBytes(current().jsHeapSizeLimit)}</dd></div>
                </dl>
              </>
            )}
          </Show>
        </section>

        <section {...stylex.attrs(styles.panel, styles.systemPanel)} aria-labelledby="system-title">
          <div {...stylex.attrs(styles.panelHeading)}>
            <h2 {...stylex.attrs(styles.panelTitle)} id="system-title">SYSTEM</h2>
          </div>
          <dl {...stylex.attrs(styles.detailList, styles.systemDetails)}>
            <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>PLATFORM</dt><dd {...stylex.attrs(styles.detailValue)}>{platform()}</dd></div>
            <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>THREADS</dt><dd {...stylex.attrs(styles.detailValue)}>{cores() ?? 'Not exposed'}</dd></div>
            <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>VIEW</dt><dd {...stylex.attrs(styles.detailValue)}>{viewport()}</dd></div>
            <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>RENDER</dt><dd {...stylex.attrs(styles.detailValue)}>Solid 2 / WebGL 2</dd></div>
          </dl>
        </section>

        <section {...stylex.attrs(styles.panel, styles.networkPanel)} aria-labelledby="network-title">
          <div {...stylex.attrs(styles.panelHeading)}>
            <h2 {...stylex.attrs(styles.panelTitle)} id="network-title">NETWORK</h2>
            <span {...stylex.attrs(styles.networkState, online() === false && styles.networkOffline)}>
              {online() === null ? 'CHECKING' : online() ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <dl {...stylex.attrs(styles.detailList)}>
            <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>TYPE</dt><dd {...stylex.attrs(styles.detailValue)}>{environmentReady() ? connection()?.effectiveType?.toUpperCase() ?? 'Not exposed' : 'Detecting'}</dd></div>
            <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>DOWN</dt><dd {...stylex.attrs(styles.detailValue)}>{!environmentReady() ? 'Detecting' : connection()?.downlink === undefined ? 'Not exposed' : `${connection()!.downlink} Mbps`}</dd></div>
            <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>RTT</dt><dd {...stylex.attrs(styles.detailValue)}>{!environmentReady() ? 'Detecting' : connection()?.rtt === undefined ? 'Not exposed' : `${connection()!.rtt} ms`}</dd></div>
            <div {...stylex.attrs(styles.detailRow)}><dt {...stylex.attrs(styles.detailTerm)}>DATA SAVE</dt><dd {...stylex.attrs(styles.detailValue)}>{!environmentReady() ? 'Detecting' : connection() ? (connection()!.saveData ? 'ON' : 'OFF') : 'Not exposed'}</dd></div>
          </dl>
        </section>

        <section {...stylex.attrs(styles.panel, styles.tasksPanel)} aria-labelledby="tasks-title">
          <div {...stylex.attrs(styles.panelHeading)}>
            <h2 {...stylex.attrs(styles.panelTitle)} id="tasks-title">TASKS</h2>
            <span {...stylex.attrs(styles.metric)}>{props.tasks.filter((task) => task.open).length} running</span>
          </div>
          <div {...stylex.attrs(styles.taskList)}>
            <For each={props.tasks}>
              {(task, index) => (
                <button
                  {...stylex.attrs(styles.task, task.open && !task.minimized && styles.taskRunning, styles.focusRing)}
                  type="button"
                  aria-label={`${taskLabels[task.id]}: ${taskState(task)}. Activate app.`}
                  onClick={() => props.onOpen(task.id)}
                >
                  <span {...stylex.attrs(styles.taskIndex)}>{String(index() + 1).padStart(2, '0')}</span>
                  <span {...stylex.attrs(styles.taskName)}>{taskLabels[task.id]}</span>
                  <span {...stylex.attrs(styles.taskState)}>{taskState(task)}</span>
                </button>
              )}
            </For>
          </div>
        </section>
      </div>
    </div>
  );
}
