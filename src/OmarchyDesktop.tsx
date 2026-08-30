import { For, Match, Show, Switch, createSignal, onSettled } from 'solid-js';
import * as stylex from '@stylexjs/stylex';
import type * as Three from 'three';
import { desktopStyles as styles } from './OmarchyDesktop.stylex';
import { styles as landingStyles } from './landing.stylex';
import AboutHome from './AboutHome';
import BtopMonitor from './BtopMonitor';
import type { DesktopTaskId } from './BtopMonitor';

type WindowId = DesktopTaskId;
type ShellWidgetId = 'clock' | 'network' | 'date' | 'threads' | 'viewport' | 'uptime' | 'delay';

type BrowserConnection = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

type DesktopWindow = {
  id: WindowId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  workspace: number;
  open: boolean;
  minimized: boolean;
  maximized: boolean;
};

type ThreeModule = typeof Three;

const initialWindows: DesktopWindow[] = [
  { id: 'about', title: 'About Omarchy', x: 634, y: 354, width: 634, height: 330, z: 6, workspace: 1, open: true, minimized: false, maximized: false },
  { id: 'btop', title: 'btop', x: 12, y: 354, width: 610, height: 330, z: 5, workspace: 1, open: true, minimized: false, maximized: false },
  { id: 'dhh-video', title: 'DHH Demo', x: 12, y: 12, width: 610, height: 330, z: 4, workspace: 1, open: true, minimized: false, maximized: false },
  { id: 'network-video', title: 'NetworkChuck Demo', x: 634, y: 12, width: 634, height: 330, z: 3, workspace: 1, open: true, minimized: false, maximized: false },
  { id: 'files', title: 'Files', x: 160, y: 105, width: 620, height: 430, z: 2, workspace: 2, open: true, minimized: false, maximized: false },
  { id: 'terminal', title: 'Terminal', x: 330, y: 110, width: 720, height: 440, z: 1, workspace: 3, open: true, minimized: false, maximized: false },
];

const homeWindowIds = new Set<WindowId>(['about', 'btop', 'dhh-video', 'network-video']);

const shellWidgetOptions: { id: ShellWidgetId; label: string; shortLabel: string }[] = [
  { id: 'clock', label: 'Clock', shortLabel: 'TIME' },
  { id: 'network', label: 'Network', shortLabel: 'NET' },
  { id: 'date', label: 'Date', shortLabel: 'DATE' },
  { id: 'threads', label: 'Threads', shortLabel: 'CPU' },
  { id: 'viewport', label: 'Viewport', shortLabel: 'VIEW' },
  { id: 'uptime', label: 'Uptime', shortLabel: 'UP' },
  { id: 'delay', label: 'UI delay', shortLabel: 'UI' },
];

const defaultShellWidgets: ShellWidgetId[] = ['clock', 'date', 'network'];
const centerShellWidgets = new Set<ShellWidgetId>(['clock', 'date']);
const shellWidgetStorageKey = 'omarchy-shell-widgets';
const shellTextSizeStorageKey = 'omarchy-shell-text-size';
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const fileLinks = [
  { label: 'Manual', href: '/manual/' },
  { label: 'News', href: '/news/' },
  { label: 'Themes', href: '/themes/' },
  { label: 'Security', href: '/security/' },
  { label: 'GitHub', href: 'https://github.com/omacom/omarchy' },
] as const;

const videos = [
  {
    videoId: 'F7fe9pa8OeE',
    title: 'Omarchy introduction video',
    image: '/screens/omarchy-quattro.webp',
    alt: 'Omarchy Quattro by David Heinemeier Hansson',
  },
  {
    videoId: '9SDkU5VDQEQ',
    title: 'You need to switch to Linux RIGHT NOW!! by NetworkChuck',
    image: '/screens/networkchuck.webp',
    alt: 'You need to switch to Linux RIGHT NOW!! by NetworkChuck',
  },
] as const;

function VideoFacade(props: typeof videos[number]) {
  const [playing, setPlaying] = createSignal(false);

  return (
    <div {...stylex.attrs(styles.videoFrame)}>
      <Show
        when={playing()}
        fallback={
          <button
            {...stylex.attrs(styles.videoFill, styles.videoFacade, landingStyles.focusRing)}
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

function LauncherIcon(props: { kind: WindowId | 'manual' | 'claude' | 'codex' | 'plugins' }) {
  if (props.kind === 'about') {
    return (
      <svg {...stylex.attrs(styles.launcherIcon)} aria-hidden="true" viewBox="0 0 1200 1200">
        <path fill="currentColor" fill-rule="evenodd" d="M1200 1200H720v-80h400V80H640v160H240v720h720V240h-80v-80h160v880H640v160H0V0h1200ZM80 1120h480v-80H160l.004-400H80Zm0-560h80.004V160h400V80H80Z" />
      </svg>
    );
  }

  return (
    <svg {...stylex.attrs(styles.launcherIcon)} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" stroke-linejoin="miter">
      <Switch>
        <Match when={props.kind === 'btop'}>
          <path d="M3 19V5h18v14H3Z" /><path d="m6 15 3-4 3 2 5-6 2 2" />
        </Match>
        <Match when={props.kind === 'dhh-video' || props.kind === 'network-video'}>
          <path d="M3 5h18v14H3Z" /><path d="m10 9 5 3-5 3V9Z" />
        </Match>
        <Match when={props.kind === 'files'}>
          <path d="M3 7h7l2 2h9v10H3V7Z" /><path d="M3 7V5h7l2 2" />
        </Match>
        <Match when={props.kind === 'terminal'}>
          <path d="M3 5h18v14H3Z" /><path d="m7 9 3 3-3 3M12 15h5" />
        </Match>
        <Match when={props.kind === 'manual'}>
          <path d="M5 3h10l4 4v14H5V3Z" /><path d="M15 3v5h4M8 12h8M8 16h8" />
        </Match>
        <Match when={props.kind === 'claude'}>
          <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M5 12h14" />
        </Match>
        <Match when={props.kind === 'codex'}>
          <path d="m12 3 7.8 4.5v9L12 21l-7.8-4.5v-9L12 3Z" /><path d="m8.5 9 3.5-2 3.5 2v4L12 15l-3.5-2V9Z" />
        </Match>
        <Match when={props.kind === 'plugins'}>
          <path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4" />
        </Match>
      </Switch>
    </svg>
  );
}

function ShellWidgetIcon(props: { kind: ShellWidgetId }) {
  return (
    <svg {...stylex.attrs(styles.shellWidgetIcon)} aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">
      <Switch>
        <Match when={props.kind === 'clock'}><circle cx="10" cy="10" r="7" /><path d="M10 6v4l3 2" /></Match>
        <Match when={props.kind === 'network'}><path d="M3 8.5a10 10 0 0 1 14 0M6 12a6 6 0 0 1 8 0M9 15.5a1.5 1.5 0 0 1 2 0" /></Match>
        <Match when={props.kind === 'date'}><path d="M3 5h14v12H3V5ZM6 3v4M14 3v4M3 9h14" /></Match>
        <Match when={props.kind === 'threads'}><path d="M6 6h8v8H6V6ZM2 7h4M2 10h4M2 13h4M14 7h4M14 10h4M14 13h4M7 2v4M10 2v4M13 2v4M7 14v4M10 14v4M13 14v4" /></Match>
        <Match when={props.kind === 'viewport'}><path d="M2 4h16v11H2V4ZM7 18h6M10 15v3" /></Match>
        <Match when={props.kind === 'uptime'}><path d="M5 3h10M5 17h10M6 3c0 4 2 5 4 7-2 2-4 3-4 7M14 3c0 4-2 5-4 7 2 2 4 3 4 7" /></Match>
        <Match when={props.kind === 'delay'}><path d="M2 11h3l2-6 3 10 3-8 2 4h3" /></Match>
      </Switch>
    </svg>
  );
}

const formatSessionUptime = (seconds: number) => {
  const totalMinutes = Math.max(0, Math.floor(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
};

export default function OmarchyDesktop() {
  const [windows, setWindows] = createSignal(initialWindows);
  const [focusedId, setFocusedId] = createSignal<WindowId>('about');
  const [workspace, setWorkspace] = createSignal(1);
  const [launcherOpen, setLauncherOpen] = createSignal(false);
  const [isMobile, setIsMobile] = createSignal(false);
  const [webglReady, setWebglReady] = createSignal(false);
  const [clock, setClock] = createSignal('');
  const [date, setDate] = createSignal('');
  const [currentDate, setCurrentDate] = createSignal(new Date());
  const [calendarMonth, setCalendarMonth] = createSignal(new Date());
  const [online, setOnline] = createSignal<boolean | null>(null);
  const [connection, setConnection] = createSignal<BrowserConnection | null>(null);
  const [threads, setThreads] = createSignal<number | null>(null);
  const [platform, setPlatform] = createSignal('Detecting');
  const [viewport, setViewport] = createSignal('');
  const [pixelRatio, setPixelRatio] = createSignal(1);
  const [sessionUptime, setSessionUptime] = createSignal(0);
  const [uiDelay, setUiDelay] = createSignal(0);
  const [interfaceTextSize, setInterfaceTextSize] = createSignal(16);
  const [shellWidgets, setShellWidgets] = createSignal<ShellWidgetId[]>(defaultShellWidgets);
  const [widgetEditorOpen, setWidgetEditorOpen] = createSignal(false);
  const [activeWidget, setActiveWidget] = createSignal<ShellWidgetId | null>(null);
  const [terminalInput, setTerminalInput] = createSignal('');
  const [terminalLines, setTerminalLines] = createSignal([
    'Omarchy terminal',
    'Type help for commands.',
  ]);
  const [status, setStatus] = createSignal('Omarchy desktop ready');

  let desktop!: HTMLDivElement;
  let canvas!: HTMLCanvasElement;
  let terminalField!: HTMLInputElement;
  let appsButton!: HTMLButtonElement;
  let launcherFirstButton!: HTMLButtonElement;
  let widgetEditorFirstButton!: HTMLButtonElement;
  let shellPopoverClose!: HTMLButtonElement;
  const shellWidgetButtons = new Map<ShellWidgetId, HTMLButtonElement>();
  let zCounter = 5;
  let setWallpaperPointer: (x: number, y: number) => void = () => undefined;
  let resetWallpaperPointer: () => void = () => undefined;

  const updateWindow = (id: WindowId, update: Partial<DesktopWindow>) => {
    setWindows((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  };

  const focusWindow = (id: WindowId) => {
    zCounter += 1;
    setFocusedId(id);
    updateWindow(id, { z: zCounter, open: true, minimized: false, workspace: workspace() });
  };

  const openWindow = (id: WindowId) => {
    setLauncherOpen(false);
    const target = windows().find((item) => item.id === id);
    const destination = target?.open ? target.workspace : workspace();
    if (destination !== workspace()) setWorkspace(destination);
    zCounter += 1;
    setFocusedId(id);
    updateWindow(id, { z: zCounter, open: true, minimized: false, workspace: destination });
    setStatus(`${initialWindows.find((item) => item.id === id)?.title} active`);
    if (id === 'terminal') queueMicrotask(() => terminalField?.focus());
  };

  const closeWindow = (id: WindowId) => {
    updateWindow(id, { open: false, minimized: false });
    setStatus(`${initialWindows.find((item) => item.id === id)?.title} closed`);
  };

  const toggleMaximize = (id: WindowId) => {
    const target = windows().find((item) => item.id === id);
    if (!target) return;
    updateWindow(id, { maximized: !target.maximized });
    focusWindow(id);
    setStatus(`${target.title} ${target.maximized ? 'restored' : 'maximized'}`);
  };

  const switchWorkspace = (nextWorkspace: number) => {
    setWorkspace(nextWorkspace);
    setLauncherOpen(false);
    setActiveWidget(null);
    const visible = windows()
      .filter((item) => item.workspace === nextWorkspace && item.open && !item.minimized)
      .sort((left, right) => right.z - left.z)[0];
    if (visible) setFocusedId(visible.id);
    setStatus(`Workspace ${nextWorkspace}`);
  };

  const toggleLauncher = () => {
    const nextOpen = !launcherOpen();
    setLauncherOpen(nextOpen);
    if (nextOpen) {
      setActiveWidget(null);
      setWidgetEditorOpen(false);
    }
    if (nextOpen) queueMicrotask(() => launcherFirstButton?.focus());
  };

  const setWidgetEditor = (open: boolean) => {
    setWidgetEditorOpen(open);
    if (open) {
      setLauncherOpen(false);
      setActiveWidget(null);
      setStatus('Quickshell widget edit mode');
      queueMicrotask(() => widgetEditorFirstButton?.focus());
    } else {
      setStatus('Quickshell widgets saved');
    }
  };

  const toggleShellWidget = (id: ShellWidgetId) => {
    setShellWidgets((current) => {
      const next = current.includes(id) ? current.filter((widget) => widget !== id) : [...current, id];
      localStorage.setItem(shellWidgetStorageKey, JSON.stringify(next));
      if (!next.includes(id) && activeWidget() === id) setActiveWidget(null);
      return next;
    });
  };

  const closeShellWidget = (restoreFocus = true) => {
    const current = activeWidget();
    setActiveWidget(null);
    setStatus('Widget closed');
    if (restoreFocus && current) queueMicrotask(() => shellWidgetButtons.get(current)?.focus());
  };

  const openShellWidget = (id: ShellWidgetId) => {
    if (activeWidget() === id) {
      closeShellWidget();
      return;
    }
    setActiveWidget(id);
    setLauncherOpen(false);
    setWidgetEditorOpen(false);
    if (id === 'clock' || id === 'date') setCalendarMonth(currentDate());
    setStatus(`${shellWidgetOptions.find((option) => option.id === id)?.label} widget open`);
    queueMicrotask(() => shellPopoverClose?.focus());
  };

  const changeInterfaceTextSize = (size: number) => {
    setInterfaceTextSize(size);
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem(shellTextSizeStorageKey, String(size));
  };

  const shellWidgetValue = (id: ShellWidgetId) => {
    if (id === 'clock') return clock();
    if (id === 'network') return online() === null ? 'checking' : online() ? 'online' : 'offline';
    if (id === 'date') return date();
    if (id === 'threads') return threads() === null ? 'n/a' : `${threads()} threads`;
    if (id === 'viewport') return viewport();
    if (id === 'uptime') return formatSessionUptime(sessionUptime());
    return `${uiDelay().toFixed(1)} ms`;
  };

  const renderShellWidget = (widget: ShellWidgetId) => (
    <button
      ref={(element) => shellWidgetButtons.set(widget, element)}
      {...stylex.attrs(
        styles.shellWidget,
        !centerShellWidgets.has(widget) && styles.shellWidgetIconOnly,
        widget === 'date' && styles.shellWidgetMobileSecondary,
        activeWidget() === widget && styles.shellWidgetActive,
        widget === 'network' && online() === false && styles.shellWidgetAlert,
        landingStyles.focusRing,
      )}
      type="button"
      aria-label={`${shellWidgetOptions.find((option) => option.id === widget)?.label}: ${shellWidgetValue(widget)}`}
      aria-expanded={activeWidget() === widget ? 'true' : 'false'}
      aria-controls={`shell-widget-${widget}`}
      title={`${shellWidgetOptions.find((option) => option.id === widget)?.label}: ${shellWidgetValue(widget)}`}
      onClick={() => openShellWidget(widget)}
    >
      <ShellWidgetIcon kind={widget} />
      <span {...stylex.attrs(styles.shellWidgetLabel, !centerShellWidgets.has(widget) && styles.shellWidgetTextHidden)}>{shellWidgetOptions.find((option) => option.id === widget)?.shortLabel}</span>
      <span {...stylex.attrs(styles.shellWidgetValue, !centerShellWidgets.has(widget) && styles.shellWidgetTextHidden)}>{shellWidgetValue(widget)}</span>
    </button>
  );

  const editWidgetsFromBar = () => setWidgetEditor(!widgetEditorOpen());

  const calendarCells = () => {
    const month = calendarMonth();
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const value = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return {
        value,
        currentMonth: value.getMonth() === month.getMonth(),
        today: value.toDateString() === currentDate().toDateString(),
      };
    });
  };

  const moveCalendarMonth = (amount: number) => {
    const month = calendarMonth();
    setCalendarMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  const clampWindow = (item: DesktopWindow, update: Partial<DesktopWindow>) => {
    const bounds = desktop.getBoundingClientRect();
    const width = Math.min(Math.max(update.width ?? item.width, 300), Math.max(300, bounds.width - 16));
    const height = Math.min(Math.max(update.height ?? item.height, 230), Math.max(230, bounds.height - 118));
    const x = Math.min(Math.max(update.x ?? item.x, 8), Math.max(8, bounds.width - width - 8));
    const y = Math.min(Math.max(update.y ?? item.y, 8), Math.max(8, bounds.height - height - 118));
    return { x, y, width, height };
  };

  const focusFromWindow = (event: PointerEvent, id: WindowId) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input')) {
      setFocusedId(id);
      return;
    }
    focusWindow(id);
  };

  const runTerminalCommand = (event: SubmitEvent) => {
    event.preventDefault();
    const raw = terminalInput().trim();
    if (!raw) return;
    const command = raw.toLowerCase();
    setTerminalInput('');

    if (command === 'clear') {
      setTerminalLines([]);
      return;
    }
    if (command === 'manual') {
      window.location.assign('/manual/');
      return;
    }

    const response = command === 'help'
      ? 'help  about  clear  date  manual'
      : command === 'about'
        ? 'Beautiful, Fun & Opinionated Linux by DHH'
        : command === 'date'
          ? new Date().toLocaleString()
          : `command not found: ${raw}`;
    setTerminalLines((current) => [...current, `~ ${raw}`, response].slice(-12));
  };

  const renderWindowContent = (id: WindowId) => (
    <Switch>
      <Match when={id === 'about'}>
        <AboutHome />
      </Match>
      <Match when={id === 'btop'}>
        <BtopMonitor
          tasks={windows().map(({ id: taskId, title, workspace: taskWorkspace, open, minimized }) => ({ id: taskId, title, workspace: taskWorkspace, open, minimized }))}
          onOpen={openWindow}
        />
      </Match>
      <Match when={id === 'terminal'}>
        <div {...stylex.attrs(styles.terminal)}>
          <div {...stylex.attrs(styles.terminalOutput)} aria-live="polite">
            <For each={terminalLines()}>{(line) => <p {...stylex.attrs(styles.terminalLine)}>{line}</p>}</For>
          </div>
          <form {...stylex.attrs(styles.terminalForm)} onSubmit={runTerminalCommand}>
            <span {...stylex.attrs(styles.prompt)} aria-hidden="true">~</span>
            <label {...stylex.attrs(styles.srOnly)} for="omarchy-command">Terminal command</label>
            <input
              ref={terminalField}
              {...stylex.attrs(styles.terminalInput, landingStyles.focusRing)}
              id="omarchy-command"
              value={terminalInput()}
              onInput={(event) => setTerminalInput(event.currentTarget.value)}
              autocomplete="off"
              spellcheck={false}
            />
          </form>
        </div>
      </Match>
      <Match when={id === 'files'}>
        <nav {...stylex.attrs(styles.files)} aria-label="Omarchy files">
          <For each={fileLinks}>
            {(link) => <a {...stylex.attrs(styles.fileLink, landingStyles.focusRing)} href={link.href}>{link.label}</a>}
          </For>
        </nav>
      </Match>
      <Match when={id === 'dhh-video'}>
        <div {...stylex.attrs(styles.videoWindow)}>
          <VideoFacade {...videos[0]} />
        </div>
      </Match>
      <Match when={id === 'network-video'}>
        <div {...stylex.attrs(styles.videoWindow)}>
          <VideoFacade {...videos[1]} />
        </div>
      </Match>
    </Switch>
  );

  onSettled(() => {
    let disposed = false;
    let cleanupThree = () => undefined;
    let lastShellSample = performance.now();

    try {
      const stored = JSON.parse(localStorage.getItem(shellWidgetStorageKey) ?? 'null');
      if (Array.isArray(stored)) {
        const valid = stored.filter((id): id is ShellWidgetId => shellWidgetOptions.some((option) => option.id === id));
        setShellWidgets([...new Set(valid)]);
      }
    } catch {
      setShellWidgets(defaultShellWidgets);
    }

    const storedTextSize = Number(localStorage.getItem(shellTextSizeStorageKey));
    if ([14, 16, 18, 20].includes(storedTextSize)) {
      setInterfaceTextSize(storedTextSize);
      document.documentElement.style.fontSize = `${storedTextSize}px`;
    }

    const updateShell = () => {
      const now = new Date();
      const measuredAt = performance.now();
      const browserNavigator = navigator as Navigator & {
        connection?: BrowserConnection;
        userAgentData?: { platform?: string };
      };
      const browserConnection = browserNavigator.connection;
      if (!document.hidden) setUiDelay(Math.max(0, measuredAt - lastShellSample - 1000));
      lastShellSample = measuredAt;
      setCurrentDate(now);
      setClock(new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(now));
      setDate(new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(now));
      setOnline(navigator.onLine);
      setConnection(browserConnection ? {
        effectiveType: browserConnection.effectiveType,
        downlink: browserConnection.downlink,
        rtt: browserConnection.rtt,
        saveData: browserConnection.saveData,
      } : null);
      setThreads(navigator.hardwareConcurrency || null);
      setPlatform(browserNavigator.userAgentData?.platform || navigator.platform || 'Not exposed');
      setViewport(`${window.innerWidth}×${window.innerHeight}`);
      setPixelRatio(window.devicePixelRatio || 1);
      setSessionUptime(performance.now() / 1000);
    };
    updateShell();
    const clockTimer = window.setInterval(updateShell, 1000);
    const resetShellSample = () => { lastShellSample = performance.now(); };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = desktop.getBoundingClientRect();
      const withinDesktop = event.clientX >= bounds.left
        && event.clientX <= bounds.right
        && event.clientY >= bounds.top
        && event.clientY <= bounds.bottom;
      if (withinDesktop) {
        const normalizedX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        const normalizedY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
        setWallpaperPointer(normalizedX, normalizedY);
      }

    };

    const leaveDesktop = () => resetWallpaperPointer();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeWidget()) {
          closeShellWidget();
        }
        if (launcherOpen()) {
          setLauncherOpen(false);
          queueMicrotask(() => appsButton?.focus());
        }
        if (widgetEditorOpen()) {
          setWidgetEditor(false);
          queueMicrotask(() => appsButton?.focus());
        }
      }
      if (event.altKey && ['1', '2', '3'].includes(event.key)) {
        event.preventDefault();
        switchWorkspace(Number(event.key));
      }
      if (event.altKey && event.key.toLowerCase() === 'q') {
        event.preventDefault();
        closeWindow(focusedId());
      }
      if (event.altKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleMaximize(focusedId());
      }
      if (event.altKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        setWidgetEditor(!widgetEditorOpen());
      }
    };

    const resizeLayout = () => {
      const bounds = desktop.getBoundingClientRect();
      const mobile = bounds.width <= 720;
      if (mobile && !isMobile()) setFocusedId('about');
      setIsMobile(mobile);
      if (!mobile) {
        const gap = 8;
        const columnWidth = Math.max(300, (bounds.width - gap * 3) / 2);
        const rowHeight = Math.max(260, (bounds.height - 36 - gap * 3) / 2);
        setWindows((current) => current.map((item) => {
          if (homeWindowIds.has(item.id) && !item.maximized) {
            const right = item.id === 'btop' || item.id === 'network-video';
            const bottom = item.id === 'dhh-video' || item.id === 'network-video';
            return {
              ...item,
              x: right ? gap * 2 + columnWidth : gap,
              y: bottom ? gap * 2 + rowHeight : gap,
              width: columnWidth,
              height: rowHeight,
            };
          }
          return { ...item, ...clampWindow(item, {}) };
        }));
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('online', updateShell);
    window.addEventListener('offline', updateShell);
    document.addEventListener('visibilitychange', resetShellSample);
    desktop.addEventListener('pointerleave', leaveDesktop);

    const layoutObserver = new ResizeObserver(resizeLayout);
    layoutObserver.observe(desktop);
    resizeLayout();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const probe = document.createElement('canvas');
    const probeContext = probe.getContext('webgl2');
    const supportsWebGL2 = Boolean(probeContext);
    probeContext?.getExtension('WEBGL_lose_context')?.loseContext();

    if (!reducedMotion && supportsWebGL2) {
      void import('three').then(async (THREE: ThreeModule) => {
        if (disposed) return;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 2;
        const texture = await new THREE.TextureLoader().loadAsync('/images/silk.webp');
        if (disposed) {
          texture.dispose();
          renderer.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        const geometry = new THREE.PlaneGeometry(2.08, 2.08);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const wallpaper = new THREE.Mesh(geometry, material);
        scene.add(wallpaper);

        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        let renderActive = false;

        const renderFrame = () => {
          currentX += (targetX - currentX) * 0.1;
          currentY += (targetY - currentY) * 0.1;
          wallpaper.position.x = currentX;
          wallpaper.position.y = currentY;
          renderer.render(scene, camera);
          if (Math.abs(targetX - currentX) < 0.0002 && Math.abs(targetY - currentY) < 0.0002) {
            wallpaper.position.set(targetX, targetY, 0);
            renderer.render(scene, camera);
            renderer.setAnimationLoop(null);
            renderActive = false;
          }
        };

        const requestRender = () => {
          if (disposed || renderActive) return;
          renderActive = true;
          renderer.setAnimationLoop(renderFrame);
        };

        setWallpaperPointer = (x, y) => {
          targetX = x * -0.018;
          targetY = y * 0.018;
          requestRender();
        };
        resetWallpaperPointer = () => {
          targetX = 0;
          targetY = 0;
          requestRender();
        };

        const resizeCanvas = () => {
          const width = Math.max(1, desktop.clientWidth);
          const height = Math.max(1, desktop.clientHeight);
          const maxPixels = 1920 * 1080;
          const desiredRatio = Math.min(window.devicePixelRatio || 1, 1.5);
          const limitedRatio = Math.min(desiredRatio, Math.sqrt(maxPixels / (width * height)));
          renderer.setPixelRatio(Math.max(0.75, limitedRatio));
          renderer.setSize(width, height, false);

          const viewportAspect = width / height;
          const imageAspect = 16 / 9;
          texture.repeat.set(1, 1);
          texture.offset.set(0, 0);
          if (viewportAspect > imageAspect) {
            texture.repeat.y = imageAspect / viewportAspect;
            texture.offset.y = (1 - texture.repeat.y) / 2;
          } else {
            texture.repeat.x = viewportAspect / imageAspect;
            texture.offset.x = (1 - texture.repeat.x) / 2;
          }
          texture.needsUpdate = true;
          renderer.render(scene, camera);
        };

        const canvasObserver = new ResizeObserver(resizeCanvas);
        canvasObserver.observe(desktop);
        const onContextLost = (event: Event) => {
          event.preventDefault();
          setWebglReady(false);
          renderer.setAnimationLoop(null);
        };
        canvas.addEventListener('webglcontextlost', onContextLost);
        resizeCanvas();
        setWebglReady(true);

        cleanupThree = () => {
          canvasObserver.disconnect();
          canvas.removeEventListener('webglcontextlost', onContextLost);
          renderer.setAnimationLoop(null);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          renderer.dispose();
        };
      }).catch(() => setWebglReady(false));
    }

    return () => {
      disposed = true;
      window.clearInterval(clockTimer);
      layoutObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('online', updateShell);
      window.removeEventListener('offline', updateShell);
      document.removeEventListener('visibilitychange', resetShellSample);
      desktop.removeEventListener('pointerleave', leaveDesktop);
      cleanupThree();
    };
  });

  const visibleWindows = () => windows().filter((item) => item.workspace === workspace() && item.open && !item.minimized);
  const focusedTitle = () => windows().find((item) => item.id === focusedId())?.title ?? 'Desktop';

  return (
    <div ref={desktop} {...stylex.attrs(styles.desktop)} aria-label="Interactive Omarchy desktop">
      <canvas ref={canvas} {...stylex.attrs(styles.canvas, webglReady() && styles.canvasReady)} aria-hidden="true" />
      <span {...stylex.attrs(styles.shade)} aria-hidden="true" />

      <header
        {...stylex.attrs(styles.topbar, widgetEditorOpen() && styles.topbarEditing)}
        aria-label="Quickshell bar. Double-click to edit widgets."
        onDblClick={editWidgetsFromBar}
      >
        <div {...stylex.attrs(styles.shellStart)}>
          <button
            ref={appsButton}
            {...stylex.attrs(styles.shellMenu, launcherOpen() && styles.shellMenuActive, landingStyles.focusRing)}
            type="button"
            aria-label="Open application launcher"
            aria-expanded={launcherOpen() ? 'true' : 'false'}
            onClick={toggleLauncher}
          >
            <img {...stylex.attrs(styles.shellLogo)} src="/icon.svg" alt="" width="28" height="28" />
          </button>
          <nav {...stylex.attrs(styles.workspaces)} aria-label="Workspaces">
            <For each={[1, 2, 3]}>
              {(number) => (
                <button
                  {...stylex.attrs(styles.workspace, workspace() === number && styles.workspaceActive, landingStyles.focusRing)}
                  type="button"
                  aria-label={`Workspace ${number}`}
                  aria-pressed={workspace() === number ? 'true' : 'false'}
                  onClick={() => switchWorkspace(number)}
                >
                  {number}
                </button>
              )}
            </For>
          </nav>
          <span {...stylex.attrs(styles.activeApp)}>APP · {focusedTitle()}</span>
        </div>
        <div {...stylex.attrs(styles.shellCenter)} aria-label="Date and time widgets">
          <For each={shellWidgets().filter((widget) => centerShellWidgets.has(widget))}>
            {(widget) => renderShellWidget(widget)}
          </For>
        </div>
        <div {...stylex.attrs(styles.shellWidgets)} aria-label="Active Quickshell widgets">
          <Show when={shellWidgets().some((widget) => !centerShellWidgets.has(widget))} fallback={<span {...stylex.attrs(styles.shellWidgetEmpty)}>add widgets</span>}>
            <For each={shellWidgets().filter((widget) => !centerShellWidgets.has(widget))}>
              {(widget) => renderShellWidget(widget)}
            </For>
          </Show>
        </div>
      </header>

      <Show when={activeWidget()} keyed>
        {(widget) => (
          <section
            id={`shell-widget-${widget}`}
            {...stylex.attrs(
              styles.shellPopover,
              centerShellWidgets.has(widget) && styles.shellPopoverCentered,
            )}
            role="dialog"
            aria-label={`${shellWidgetOptions.find((option) => option.id === widget)?.label} widget details`}
          >
            <header {...stylex.attrs(styles.shellPopoverHeader)}>
              <div {...stylex.attrs(styles.shellPopoverHeading)}>
                <ShellWidgetIcon kind={widget} />
                <h2 {...stylex.attrs(styles.shellPopoverTitle)}>{shellWidgetOptions.find((option) => option.id === widget)?.label}</h2>
              </div>
              <button
                ref={shellPopoverClose}
                {...stylex.attrs(styles.shellPopoverClose, landingStyles.focusRing)}
                type="button"
                aria-label={`Close ${shellWidgetOptions.find((option) => option.id === widget)?.label} widget`}
                onClick={() => closeShellWidget()}
              >
                ×
              </button>
            </header>

            <Show when={widget === 'clock' || widget === 'date'}>
              <div {...stylex.attrs(styles.calendarLead)}>
                <svg {...stylex.attrs(styles.calendarLeadIcon)} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square">
                  <path d="M4 6h16v15H4V6ZM8 3v6M16 3v6M4 11h16" />
                </svg>
                <strong {...stylex.attrs(styles.calendarLeadDate)}>
                  {new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(currentDate())}
                </strong>
              </div>
              <p {...stylex.attrs(styles.calendarEvent)}>Nothing else today</p>
              <div {...stylex.attrs(styles.calendarWeekdays)} aria-hidden="true">
                <For each={weekDays}>{(day) => <span>{day}</span>}</For>
              </div>
              <div {...stylex.attrs(styles.calendarGrid)} aria-label="Calendar month">
                <For each={calendarCells()}>
                  {(cell) => (
                    <span
                      {...stylex.attrs(
                        styles.calendarDay,
                        !cell.currentMonth && styles.calendarDayOutside,
                        cell.today && styles.calendarDayToday,
                      )}
                      aria-current={cell.today ? 'date' : undefined}
                    >
                      {cell.value.getDate()}
                    </span>
                  )}
                </For>
              </div>
              <div {...stylex.attrs(styles.calendarMonthNav)}>
                <button {...stylex.attrs(styles.calendarNavButton, landingStyles.focusRing)} type="button" aria-label="Previous month" onClick={() => moveCalendarMonth(-1)}>‹</button>
                <strong {...stylex.attrs(styles.calendarMonthLabel)}>{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(calendarMonth())}</strong>
                <button {...stylex.attrs(styles.calendarNavButton, landingStyles.focusRing)} type="button" aria-label="Next month" onClick={() => moveCalendarMonth(1)}>›</button>
              </div>
              <p {...stylex.attrs(styles.shellPopoverNote)}>Browser calendar is not connected.</p>
            </Show>

            <Show when={widget === 'network'}>
              <p {...stylex.attrs(styles.shellMetric, !online() && styles.shellMetricAlert)}>{online() ? 'Online' : 'Offline'}</p>
              <dl {...stylex.attrs(styles.shellDetails)}>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Connection</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{connection()?.effectiveType?.toUpperCase() ?? 'Not exposed'}</dd></div>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Downlink</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{connection()?.downlink === undefined ? 'Not exposed' : `${connection()?.downlink} Mb/s`}</dd></div>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Round trip</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{connection()?.rtt === undefined ? 'Not exposed' : `${connection()?.rtt} ms`}</dd></div>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Data saver</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{connection()?.saveData === undefined ? 'Not exposed' : connection()?.saveData ? 'On' : 'Off'}</dd></div>
              </dl>
              <p {...stylex.attrs(styles.shellPopoverNote)}>Values come from the browser Network Information API when available.</p>
            </Show>

            <Show when={widget === 'threads'}>
              <p {...stylex.attrs(styles.shellMetric)}>{threads() ?? 'Not exposed'}</p>
              <dl {...stylex.attrs(styles.shellDetails)}>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Platform</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{platform()}</dd></div>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Logical threads</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{threads() ?? 'Not exposed'}</dd></div>
              </dl>
              <p {...stylex.attrs(styles.shellPopoverNote)}>The browser reports logical processor capacity, not live CPU usage.</p>
            </Show>

            <Show when={widget === 'viewport'}>
              <p {...stylex.attrs(styles.shellMetric)}>{viewport()}</p>
              <dl {...stylex.attrs(styles.shellDetails)}>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Pixel ratio</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{pixelRatio().toFixed(2)}×</dd></div>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Text size</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{interfaceTextSize()}px</dd></div>
              </dl>
              <h3 {...stylex.attrs(styles.shellControlLabel)}>Interface text size</h3>
              <div {...stylex.attrs(styles.textSizeControls)}>
                <For each={[14, 16, 18, 20]}>
                  {(size) => (
                    <button
                      {...stylex.attrs(styles.textSizeButton, interfaceTextSize() === size && styles.textSizeButtonActive, landingStyles.focusRing)}
                      type="button"
                      aria-pressed={interfaceTextSize() === size ? 'true' : 'false'}
                      onClick={() => changeInterfaceTextSize(size)}
                    >
                      {size}px
                    </button>
                  )}
                </For>
              </div>
              <p {...stylex.attrs(styles.shellPopoverNote)}>Display brightness and scale are not controllable from a webpage.</p>
            </Show>

            <Show when={widget === 'uptime'}>
              <p {...stylex.attrs(styles.shellMetric)}>{formatSessionUptime(sessionUptime())}</p>
              <dl {...stylex.attrs(styles.shellDetails)}>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Session seconds</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{Math.floor(sessionUptime()).toLocaleString()}</dd></div>
              </dl>
              <p {...stylex.attrs(styles.shellPopoverNote)}>Uptime starts when this page session begins.</p>
            </Show>

            <Show when={widget === 'delay'}>
              <p {...stylex.attrs(styles.shellMetric)}>{uiDelay().toFixed(1)} ms</p>
              <dl {...stylex.attrs(styles.shellDetails)}>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>Sample interval</dt><dd {...stylex.attrs(styles.shellDetailValue)}>1 second</dd></div>
                <div {...stylex.attrs(styles.shellDetailRow)}><dt {...stylex.attrs(styles.shellDetailTerm)}>State</dt><dd {...stylex.attrs(styles.shellDetailValue)}>{uiDelay() < 50 ? 'Responsive' : 'Busy'}</dd></div>
              </dl>
              <p {...stylex.attrs(styles.shellPopoverNote)}>This is event-loop delay for the page, not operating-system latency.</p>
            </Show>
          </section>
        )}
      </Show>

      <Show when={widgetEditorOpen()}>
        <section {...stylex.attrs(styles.widgetEditor)} role="dialog" aria-label="Edit Quickshell widgets">
          <header {...stylex.attrs(styles.widgetEditorHeader)}>
            <div>
              <h2 {...stylex.attrs(styles.widgetEditorTitle)}>Quickshell widgets</h2>
              <p {...stylex.attrs(styles.widgetEditorHint)}>Double-click the bar or press Alt+E to leave edit mode.</p>
            </div>
            <button {...stylex.attrs(styles.widgetEditorClose, landingStyles.focusRing)} type="button" onClick={() => setWidgetEditor(false)}>Done</button>
          </header>
          <div {...stylex.attrs(styles.widgetEditorList)}>
            <For each={shellWidgetOptions}>
              {(option, index) => {
                const active = () => shellWidgets().includes(option.id);
                return (
                  <button
                    ref={(element) => { if (index() === 0) widgetEditorFirstButton = element; }}
                    {...stylex.attrs(styles.widgetOption, active() && styles.widgetOptionActive, landingStyles.focusRing)}
                    type="button"
                    aria-pressed={active() ? 'true' : 'false'}
                    onClick={() => toggleShellWidget(option.id)}
                  >
                    <ShellWidgetIcon kind={option.id} />
                    <span {...stylex.attrs(styles.widgetOptionLabel)}>{option.label}</span>
                    <span {...stylex.attrs(styles.widgetOptionState)}>{active() ? 'Remove' : 'Add'}</span>
                  </button>
                );
              }}
            </For>
          </div>
        </section>
      </Show>

      <div {...stylex.attrs(styles.windowsLayer, isMobile() && workspace() === 1 && styles.homeStackLayer)}>
        <Show when={visibleWindows().length > 0} fallback={<p {...stylex.attrs(styles.emptyWorkspace)}>Empty workspace. Open an app from the Omarchy menu.</p>}>
          <For each={visibleWindows()}>
            {(item) => {
              return (
                <section
                  {...stylex.attrs(
                    styles.window,
                    focusedId() === item.id && styles.windowFocused,
                    item.maximized && styles.windowMaximized,
                    isMobile() && workspace() !== 1 && styles.windowMobile,
                    isMobile() && workspace() === 1 && homeWindowIds.has(item.id) && !item.maximized && styles.homeStackWindow,
                    isMobile() && workspace() === 1 && item.id === 'about' && !item.maximized && styles.homeAboutWindow,
                    isMobile() && workspace() === 1 && item.id === 'btop' && !item.maximized && styles.homeBtopWindow,
                    isMobile() && workspace() === 1 && (item.id === 'dhh-video' || item.id === 'network-video') && !item.maximized && styles.homeVideoWindow,
                    isMobile() && workspace() !== 1 && focusedId() !== item.id && styles.hidden,
                  )}
                  style={item.maximized || isMobile() ? { 'z-index': item.z } : {
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                    'z-index': item.z,
                  }}
                  aria-label={`${item.title} window`}
                  onPointerDown={(event) => focusFromWindow(event, item.id)}
                >
                  <div {...stylex.attrs(styles.windowContent)}>{renderWindowContent(item.id)}</div>
                </section>
              );
            }}
          </For>
        </Show>
      </div>

      <Show when={launcherOpen()}>
        <button
          {...stylex.attrs(styles.launcherScrim)}
          type="button"
          aria-label="Close application launcher"
          onClick={() => {
            setLauncherOpen(false);
            queueMicrotask(() => appsButton?.focus());
          }}
        />
        <div {...stylex.attrs(styles.launcher)} role="dialog" aria-label="Application launcher">
          <For each={initialWindows}>
            {(item, index) => (
              <button ref={(element) => { if (index() === 0) launcherFirstButton = element; }} {...stylex.attrs(styles.launcherButton, landingStyles.focusRing)} type="button" onClick={() => openWindow(item.id)}>
                <LauncherIcon kind={item.id} />
                <span>{item.title}</span>
                <span {...stylex.attrs(styles.launcherChevron)} aria-hidden="true" />
              </button>
            )}
          </For>
          <a {...stylex.attrs(styles.launcherButton, landingStyles.focusRing)} href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">
            <LauncherIcon kind="claude" />
            <span>Claude</span>
            <span {...stylex.attrs(styles.launcherChevron)} aria-hidden="true" />
          </a>
          <a {...stylex.attrs(styles.launcherButton, landingStyles.focusRing)} href="https://chatgpt.com/codex" target="_blank" rel="noopener noreferrer">
            <LauncherIcon kind="codex" />
            <span>Codex</span>
            <span {...stylex.attrs(styles.launcherChevron)} aria-hidden="true" />
          </a>
          <a {...stylex.attrs(styles.launcherButton, landingStyles.focusRing)} href="https://omarchyplugins.com/" target="_blank" rel="noopener noreferrer">
            <LauncherIcon kind="plugins" />
            <span>Plugins</span>
            <span {...stylex.attrs(styles.launcherChevron)} aria-hidden="true" />
          </a>
          <button {...stylex.attrs(styles.launcherButton, landingStyles.focusRing)} type="button" onClick={() => window.location.assign('/manual/')}>
            <LauncherIcon kind="manual" />
            <span>Manual</span>
            <span {...stylex.attrs(styles.launcherChevron)} aria-hidden="true" />
          </button>
        </div>
      </Show>

      <span {...stylex.attrs(styles.srOnly)} role="status" aria-live="polite">{status()}</span>
    </div>
  );
}
