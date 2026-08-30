import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import * as stylex from '@stylexjs/stylex';
import type * as Three from 'three';
import { graphStyles as styles } from './ContentGraph.stylex';
import type { SiteSearchDocument } from './siteSearch';

type ThreeModule = typeof Three;

type ContentGraphProps = {
  query: string;
  root: SiteSearchDocument | null;
  documents: SiteSearchDocument[];
  trail: SiteSearchDocument[];
  loading: boolean;
  error: boolean;
  activeIndex: number;
  onActiveIndex: (index: number) => void;
  onExplore: (document: SiteSearchDocument) => void;
  onReset: () => void;
};

const desktopPositions = [
  [50, 12],
  [79, 23],
  [85, 53],
  [72, 84],
  [38, 87],
  [14, 63],
  [18, 28],
];

const compactPositions = [
  [27, 31],
  [73, 31],
  [27, 48],
  [73, 48],
  [27, 65],
  [73, 65],
  [50, 82],
];

export default function ContentGraph(props: ContentGraphProps) {
  const [compact, setCompact] = createSignal(false);
  const [canvasReady, setCanvasReady] = createSignal(false);
  let stage!: HTMLDivElement;
  let canvas!: HTMLCanvasElement;
  let redraw = () => undefined;

  const root = createMemo(() => props.root);
  const documents = createMemo(() => props.documents);
  const trail = createMemo(() => props.trail);
  const loading = createMemo(() => props.loading);
  const error = createMemo(() => props.error);
  const positionFor = (index: number) => (compact() ? compactPositions : desktopPositions)[index] ?? [50, 88];
  const rootKind = () => root() ? `${root()?.kind} / ${root()?.section}` : 'Search';
  const rootTitle = () => root()?.title ?? props.query;

  createEffect(
    () => `${root()?.id ?? props.query}:${documents().map((document) => document.id).join('|')}:${compact()}`,
    () => queueMicrotask(() => redraw()),
  );

  onSettled(() => {
    let disposed = false;
    let cleanupThree = () => undefined;
    const resizeObserver = new ResizeObserver(() => {
      setCompact(stage.clientWidth < 620);
      redraw();
    });
    resizeObserver.observe(stage);
    setCompact(stage.clientWidth < 620);

    void import('three').then((THREE: ThreeModule) => {
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
      const lineGeometry = new THREE.BufferGeometry();
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x87718d, transparent: true, opacity: 0.72 });
      const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      const pointGeometry = new THREE.BufferGeometry();
      const pointMaterial = new THREE.PointsMaterial({ color: 0x9ece6a, size: 4, sizeAttenuation: false });
      const points = new THREE.Points(pointGeometry, pointMaterial);
      scene.add(lines, points);

      redraw = () => {
        if (disposed || !stage.isConnected) return;
        const width = Math.max(1, stage.clientWidth);
        const height = Math.max(1, stage.clientHeight);
        const stageBounds = stage.getBoundingClientRect();
        const rootElement = stage.querySelector<HTMLElement>('[data-graph-root]');
        const nodeElements = Array.from(stage.querySelectorAll<HTMLElement>('[data-graph-node]'));
        if (!rootElement) return;

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height, false);
        camera.left = 0;
        camera.right = width;
        camera.top = height;
        camera.bottom = 0;
        camera.updateProjectionMatrix();

        const centerOf = (element: HTMLElement) => {
          const bounds = element.getBoundingClientRect();
          return [
            bounds.left - stageBounds.left + bounds.width / 2,
            height - (bounds.top - stageBounds.top + bounds.height / 2),
            0,
          ];
        };
        const rootCenter = centerOf(rootElement);
        const nodeCenters = nodeElements.map(centerOf);
        const linePositions = nodeCenters.flatMap((center) => [...rootCenter, ...center]);
        const pointPositions = [rootCenter, ...nodeCenters].flat();
        lines.geometry.dispose();
        lines.geometry = new THREE.BufferGeometry();
        lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        points.geometry.dispose();
        points.geometry = new THREE.BufferGeometry();
        points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
        renderer.render(scene, camera);
        setCanvasReady(true);
      };

      const onContextLost = (event: Event) => {
        event.preventDefault();
        setCanvasReady(false);
      };
      canvas.addEventListener('webglcontextlost', onContextLost);
      queueMicrotask(() => redraw());

      cleanupThree = () => {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        lineGeometry.dispose();
        lineMaterial.dispose();
        lines.geometry.dispose();
        pointGeometry.dispose();
        pointMaterial.dispose();
        points.geometry.dispose();
        renderer.dispose();
      };
    }).catch(() => setCanvasReady(false));

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      cleanupThree();
    };
  });

  return (
    <section {...stylex.attrs(styles.graph)} aria-label="Related content graph">
      <header {...stylex.attrs(styles.header)}>
        <div {...stylex.attrs(styles.heading)}>
          <span {...stylex.attrs(styles.eyebrow)}>Related content graph</span>
          <h2 {...stylex.attrs(styles.title)} title={root()?.title ?? `Results for ${props.query}`}>{root()?.title ?? `Results for “${props.query}”`}</h2>
        </div>
        <div {...stylex.attrs(styles.headerActions)}>
          <Show when={root()}>
            {(document) => <a {...stylex.attrs(styles.action, styles.focusRing)} href={document().url}>Open page</a>}
          </Show>
          <Show when={root()}>
            {(_document) => <button {...stylex.attrs(styles.action, styles.focusRing)} type="button" onClick={props.onReset}>Search results</button>}
          </Show>
        </div>
      </header>

      <Show when={trail().length > 0}>
        {(_hasTrail) => (
          <nav {...stylex.attrs(styles.trail)} aria-label="Exploration trail">
            <span {...stylex.attrs(styles.trailLabel)}>Path</span>
            <For each={trail().slice(-5)}>
              {(document) => (
                <button {...stylex.attrs(styles.trailButton, styles.focusRing)} type="button" title={document.title} onClick={() => props.onExplore(document)}>
                  {document.title}
                </button>
              )}
            </For>
          </nav>
        )}
      </Show>

      <div ref={stage} {...stylex.attrs(styles.stage, compact() && styles.stageCompact)}>
        <canvas ref={canvas} {...stylex.attrs(styles.canvas, canvasReady() && styles.canvasReady)} aria-hidden="true" />
        <div data-graph-root {...stylex.attrs(styles.rootNode, compact() && styles.rootNodeCompact)}>
          <span {...stylex.attrs(styles.rootKind)}>{rootKind()}</span>
          <span {...stylex.attrs(styles.rootTitle)}>{rootTitle()}</span>
        </div>

        <For each={documents().slice(0, 7)}>
          {(document, index) => {
            const position = () => positionFor(index());
            return (
              <button
                data-graph-node
                type="button"
                aria-label={`Explore what follows ${document.title}`}
                title={document.title}
                style={{ left: `${position()[0]}%`, top: `${position()[1]}%` }}
                {...stylex.attrs(styles.node, compact() && styles.nodeCompact, props.activeIndex === index() && styles.nodeActive, styles.focusRing)}
                onMouseEnter={() => props.onActiveIndex(index())}
                onFocus={() => props.onActiveIndex(index())}
                onClick={() => props.onExplore(document)}
              >
                <span {...stylex.attrs(styles.nodeKind)}>{document.kind} / {document.section}</span>
                <span {...stylex.attrs(styles.nodeTitle)}>{document.title}</span>
              </button>
            );
          }}
        </For>

        <Show when={loading()}>
          {(_isLoading) => <p role="status" aria-live="polite" {...stylex.attrs(styles.stageState)}>Finding related pages...</p>}
        </Show>
        <Show when={!loading() && error()}>
          {(_hasError) => <p role="status" aria-live="polite" {...stylex.attrs(styles.stageState)}>Related content is unavailable. Change the query and try again.</p>}
        </Show>
        <Show when={!loading() && !error() && documents().length === 0}>
          {(_isEmpty) => <p role="status" aria-live="polite" {...stylex.attrs(styles.stageState)}>No further connections found.</p>}
        </Show>
      </div>

      <p {...stylex.attrs(styles.footer)}>Select a node to find what follows. Open page visits the selected result.</p>
    </section>
  );
}
