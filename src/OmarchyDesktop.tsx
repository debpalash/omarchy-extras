import { For, Match, Show, Switch, createSignal, onSettled } from 'solid-js';
import * as stylex from '@stylexjs/stylex';
import type * as Three from 'three';
import { desktopStyles as styles } from './OmarchyDesktop.stylex';
import { styles as landingStyles } from './landing.stylex';

type WindowId = 'about' | 'terminal' | 'files';
type DragMode = 'move' | 'resize';

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

type DragState = {
  id: WindowId;
  mode: DragMode;
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ThreeModule = typeof Three;

const initialWindows: DesktopWindow[] = [
  { id: 'about', title: 'Omarchy', x: 72, y: 72, width: 670, height: 430, z: 2, workspace: 1, open: true, minimized: false, maximized: false },
  { id: 'terminal', title: 'Terminal', x: 680, y: 245, width: 620, height: 340, z: 3, workspace: 1, open: true, minimized: false, maximized: false },
  { id: 'files', title: 'Files', x: 160, y: 105, width: 520, height: 390, z: 1, workspace: 2, open: true, minimized: false, maximized: false },
];

const fileLinks = [
  { label: 'Manual', href: '/manual/' },
  { label: 'News', href: '/news/' },
  { label: 'Themes', href: '/themes/' },
  { label: 'Security', href: '/security/' },
  { label: 'GitHub', href: 'https://github.com/omacom/omarchy' },
] as const;

function WindowGlyph(props: { kind: 'minimize' | 'maximize' | 'close' }) {
  return (
    <span aria-hidden="true">
      <Switch>
        <Match when={props.kind === 'minimize'}>−</Match>
        <Match when={props.kind === 'maximize'}>□</Match>
        <Match when={props.kind === 'close'}>×</Match>
      </Switch>
    </span>
  );
}

export default function OmarchyDesktop() {
  const [windows, setWindows] = createSignal(initialWindows);
  const [focusedId, setFocusedId] = createSignal<WindowId>('terminal');
  const [workspace, setWorkspace] = createSignal(1);
  const [launcherOpen, setLauncherOpen] = createSignal(false);
  const [isMobile, setIsMobile] = createSignal(false);
  const [webglReady, setWebglReady] = createSignal(false);
  const [clock, setClock] = createSignal('');
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
  let dragState: DragState | null = null;
  let zCounter = 4;
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
    focusWindow(id);
    setStatus(`${initialWindows.find((item) => item.id === id)?.title} opened`);
    if (id === 'terminal') queueMicrotask(() => terminalField?.focus());
  };

  const minimizeWindow = (id: WindowId) => {
    updateWindow(id, { minimized: true });
    setStatus(`${initialWindows.find((item) => item.id === id)?.title} minimized`);
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
    const visible = windows()
      .filter((item) => item.workspace === nextWorkspace && item.open && !item.minimized)
      .sort((left, right) => right.z - left.z)[0];
    if (visible) setFocusedId(visible.id);
    setStatus(`Workspace ${nextWorkspace}`);
  };

  const toggleLauncher = () => {
    const nextOpen = !launcherOpen();
    setLauncherOpen(nextOpen);
    if (nextOpen) queueMicrotask(() => launcherFirstButton?.focus());
  };

  const clampWindow = (item: DesktopWindow, update: Partial<DesktopWindow>) => {
    const bounds = desktop.getBoundingClientRect();
    const width = Math.min(Math.max(update.width ?? item.width, 300), Math.max(300, bounds.width - 16));
    const height = Math.min(Math.max(update.height ?? item.height, 230), Math.max(230, bounds.height - 118));
    const x = Math.min(Math.max(update.x ?? item.x, 8), Math.max(8, bounds.width - width - 8));
    const y = Math.min(Math.max(update.y ?? item.y, 8), Math.max(8, bounds.height - height - 118));
    return { x, y, width, height };
  };

  const beginDrag = (event: PointerEvent, id: WindowId, mode: DragMode) => {
    if (isMobile()) return;
    const item = windows().find((candidate) => candidate.id === id);
    if (!item || item.maximized) return;
    event.preventDefault();
    focusWindow(id);
    dragState = {
      id,
      mode,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    };
    setStatus(`${item.title} ${mode === 'move' ? 'moving' : 'resizing'}`);
  };

  const focusFromWindow = (event: PointerEvent, id: WindowId) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, [data-window-drag]')) {
      setFocusedId(id);
      return;
    }
    focusWindow(id);
  };

  const moveByKeyboard = (event: KeyboardEvent, id: WindowId, mode: DragMode) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      if (event.key === 'Enter' && mode === 'move') toggleMaximize(id);
      return;
    }
    event.preventDefault();
    const item = windows().find((candidate) => candidate.id === id);
    if (!item || item.maximized || isMobile()) return;
    const amount = event.shiftKey ? 48 : 24;
    const horizontal = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
    const vertical = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
    const next = mode === 'move'
      ? clampWindow(item, { x: item.x + horizontal, y: item.y + vertical })
      : clampWindow(item, { width: item.width + horizontal, height: item.height + vertical });
    updateWindow(id, next);
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
        <div {...stylex.attrs(styles.aboutContent)}>
          <h1 {...stylex.attrs(styles.heroTitle)} id="rd-hero-title">
            Beautiful, Fun &amp; Opinionated Linux by{' '}
            <a {...stylex.attrs(styles.heroLink, landingStyles.focusRing)} href="https://dhh.dk">DHH</a>
          </h1>
        </div>
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
    </Switch>
  );

  onSettled(() => {
    let disposed = false;
    let cleanupThree = () => undefined;

    const updateClock = () => setClock(new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date()));
    updateClock();
    const clockTimer = window.setInterval(updateClock, 30_000);

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

      if (!dragState) return;
      const item = windows().find((candidate) => candidate.id === dragState?.id);
      if (!item) return;
      const deltaX = event.clientX - dragState.pointerX;
      const deltaY = event.clientY - dragState.pointerY;
      const update = dragState.mode === 'move'
        ? { x: dragState.x + deltaX, y: dragState.y + deltaY }
        : { width: dragState.width + deltaX, height: dragState.height + deltaY };
      updateWindow(item.id, clampWindow(item, update));
    };

    const endDrag = () => {
      if (dragState) setStatus(`${initialWindows.find((item) => item.id === dragState?.id)?.title} placed`);
      dragState = null;
    };

    const leaveDesktop = () => resetWallpaperPointer();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (launcherOpen()) {
          setLauncherOpen(false);
          queueMicrotask(() => appsButton?.focus());
        }
        endDrag();
      }
      if (event.altKey && ['1', '2', '3'].includes(event.key)) {
        event.preventDefault();
        switchWorkspace(Number(event.key));
      }
    };

    const resizeLayout = () => {
      const bounds = desktop.getBoundingClientRect();
      const mobile = bounds.width <= 720;
      if (mobile && !isMobile()) setFocusedId('about');
      setIsMobile(mobile);
      if (!mobile) {
        setWindows((current) => current.map((item) => ({ ...item, ...clampWindow(item, {}) })));
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('keydown', onKeyDown);
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
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('pointerleave', leaveDesktop);
      cleanupThree();
    };
  });

  const visibleWindows = () => windows().filter((item) => item.workspace === workspace() && item.open && !item.minimized);

  return (
    <div ref={desktop} {...stylex.attrs(styles.desktop)} aria-label="Interactive Omarchy desktop">
      <canvas ref={canvas} {...stylex.attrs(styles.canvas, webglReady() && styles.canvasReady)} aria-hidden="true" />
      <span {...stylex.attrs(styles.shade)} aria-hidden="true" />

      <header {...stylex.attrs(styles.topbar)}>
        <span {...stylex.attrs(styles.brand)}>OMARCHY</span>
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
        <time {...stylex.attrs(styles.clock)}>{clock()}</time>
      </header>

      <div {...stylex.attrs(styles.windowsLayer)}>
        <Show when={visibleWindows().length > 0} fallback={<p {...stylex.attrs(styles.emptyWorkspace)}>Empty workspace. Open an app from the dock.</p>}>
          <For each={visibleWindows()}>
            {(item) => {
              return (
                <section
                  {...stylex.attrs(
                    styles.window,
                    focusedId() === item.id && styles.windowFocused,
                    item.maximized && styles.windowMaximized,
                    isMobile() && styles.windowMobile,
                    isMobile() && focusedId() !== item.id && styles.hidden,
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
                  <div
                    {...stylex.attrs(styles.titlebar, landingStyles.focusRing)}
                    role="group"
                    data-window-drag
                    tabindex="0"
                    aria-label={`${item.title} window title bar. Arrow keys move. Shift and arrow keys resize. Enter maximizes.`}
                    onPointerDown={(event) => beginDrag(event, item.id, 'move')}
                    onKeyDown={(event) => moveByKeyboard(event, item.id, event.shiftKey ? 'resize' : 'move')}
                  >
                    <span {...stylex.attrs(styles.title)}>{item.title}</span>
                    <div {...stylex.attrs(styles.windowControls)}>
                      <button {...stylex.attrs(styles.windowControl, landingStyles.focusRing)} type="button" aria-label={`Minimize ${item.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => minimizeWindow(item.id)}><WindowGlyph kind="minimize" /></button>
                      <button {...stylex.attrs(styles.windowControl, landingStyles.focusRing)} type="button" aria-label={`${item.maximized ? 'Restore' : 'Maximize'} ${item.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => toggleMaximize(item.id)}><WindowGlyph kind="maximize" /></button>
                      <button {...stylex.attrs(styles.windowControl, landingStyles.focusRing)} type="button" aria-label={`Close ${item.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => closeWindow(item.id)}><WindowGlyph kind="close" /></button>
                    </div>
                  </div>
                  <div {...stylex.attrs(styles.windowContent)}>{renderWindowContent(item.id)}</div>
                  <Show when={!item.maximized && !isMobile()}>
                    <button
                      {...stylex.attrs(styles.resizeHandle, landingStyles.focusRing)}
                      type="button"
                      aria-label={`Resize ${item.title}. Use arrow keys.`}
                      onPointerDown={(event) => beginDrag(event, item.id, 'resize')}
                      onKeyDown={(event) => moveByKeyboard(event, item.id, 'resize')}
                    />
                  </Show>
                </section>
              );
            }}
          </For>
        </Show>
      </div>

      <Show when={launcherOpen()}>
        <div {...stylex.attrs(styles.launcher)} role="dialog" aria-label="Application launcher">
          <For each={initialWindows}>
            {(item, index) => <button ref={(element) => { if (index() === 0) launcherFirstButton = element; }} {...stylex.attrs(styles.launcherButton, landingStyles.focusRing)} type="button" onClick={() => openWindow(item.id)}>{item.title}</button>}
          </For>
          <button {...stylex.attrs(styles.launcherButton, landingStyles.focusRing)} type="button" onClick={() => window.location.assign('/manual/')}>Manual</button>
        </div>
      </Show>

      <nav {...stylex.attrs(styles.dock)} aria-label="Desktop applications">
        <button
          ref={appsButton}
          {...stylex.attrs(styles.dockButton, launcherOpen() && styles.dockButtonActive, landingStyles.focusRing)}
          type="button"
          aria-expanded={launcherOpen() ? 'true' : 'false'}
          onClick={toggleLauncher}
        >
          Apps
        </button>
        <button {...stylex.attrs(styles.dockButton, focusedId() === 'terminal' && styles.dockButtonActive, landingStyles.focusRing)} type="button" onClick={() => openWindow('terminal')}>Terminal</button>
        <button {...stylex.attrs(styles.dockButton, focusedId() === 'files' && styles.dockButtonActive, landingStyles.focusRing)} type="button" onClick={() => openWindow('files')}>Files</button>
        <button {...stylex.attrs(styles.dockButton, focusedId() === 'about' && styles.dockButtonActive, landingStyles.focusRing)} type="button" onClick={() => openWindow('about')}>Omarchy</button>
      </nav>

      <span {...stylex.attrs(styles.srOnly)} role="status" aria-live="polite">{status()}</span>
    </div>
  );
}
