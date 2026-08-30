import { For, createSignal, onSettled } from 'solid-js';
import * as stylex from '@stylexjs/stylex';
import type * as Three from 'three';
import { computerStyles as styles } from './OmarchyComputer.stylex';
import { styles as landingStyles } from './landing.stylex';

const desktopViews = [
  {
    label: 'Desktop',
    src: '/screens/tokyo-night.webp',
    alt: 'Omarchy Tokyo Night desktop with terminal and system monitor',
  },
  {
    label: 'Navigate',
    src: '/screens/keyboard-navigation.webp',
    alt: 'Omarchy keyboard navigation interface',
  },
  {
    label: 'Workspace',
    src: '/screens/catppuccin.webp',
    alt: 'Omarchy desktop in a Catppuccin workspace',
  },
] as const;

type ThreeModule = typeof Three;

function createKeyboardTexture(THREE: ThreeModule) {
  const surface = document.createElement('canvas');
  surface.width = 1024;
  surface.height = 512;

  const context = surface.getContext('2d');
  if (!context) return null;

  context.clearRect(0, 0, surface.width, surface.height);
  context.fillStyle = '#151822';
  context.fillRect(28, 24, 968, 304);

  const rowLengths = [14, 14, 13, 12, 9];
  const keyWidth = 54;
  const keyHeight = 42;
  const gap = 11;

  context.strokeStyle = 'rgba(240, 238, 245, 0.38)';
  context.lineWidth = 2;
  rowLengths.forEach((length, row) => {
    const offset = 54 + row * 13;
    for (let column = 0; column < length; column += 1) {
      context.strokeRect(offset + column * (keyWidth + gap), 48 + row * (keyHeight + gap), keyWidth, keyHeight);
    }
  });

  context.strokeStyle = 'rgba(158, 206, 106, 0.62)';
  context.strokeRect(360, 360, 304, 120);

  const texture = new THREE.CanvasTexture(surface);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export default function OmarchyComputer() {
  const [activeView, setActiveView] = createSignal(0);
  const [ready, setReady] = createSignal(false);
  const [fallback, setFallback] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);

  let canvas!: HTMLCanvasElement;
  let viewport!: HTMLDivElement;
  let setSceneView: (index: number) => void = () => undefined;
  let setScenePointer: (x: number, y: number) => void = () => undefined;
  let resetScenePointer: () => void = () => undefined;

  const selectView = (index: number) => {
    setActiveView(index);
    setSceneView(index);
  };

  const updatePointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' && !dragging()) return;
    const bounds = viewport.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    setScenePointer(x, y);
  };

  const beginPointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') {
      setDragging(true);
      viewport.setPointerCapture(event.pointerId);
      updatePointer(event);
    }
  };

  const finishPointer = (event?: PointerEvent) => {
    if (event && viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    resetScenePointer();
  };

  onSettled(() => {
    let disposed = false;
    let cleanupScene = () => undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportProbe = document.createElement('canvas');
    const probeContext = supportProbe.getContext('webgl2');
    const supportsWebGL2 = Boolean(probeContext);
    probeContext?.getExtension('WEBGL_lose_context')?.loseContext();

    const leavePointer = () => {
      if (!dragging()) resetScenePointer();
    };

    const removePointerListeners = () => {
      viewport.removeEventListener('pointermove', updatePointer);
      viewport.removeEventListener('pointerdown', beginPointer);
      viewport.removeEventListener('pointerup', finishPointer);
      viewport.removeEventListener('pointercancel', finishPointer);
      viewport.removeEventListener('pointerleave', leavePointer);
    };

    viewport.addEventListener('pointermove', updatePointer);
    viewport.addEventListener('pointerdown', beginPointer);
    viewport.addEventListener('pointerup', finishPointer);
    viewport.addEventListener('pointercancel', finishPointer);
    viewport.addEventListener('pointerleave', leavePointer);

    if (reducedMotion || !supportsWebGL2) {
      setFallback(true);
      return () => {
        disposed = true;
        removePointerListeners();
      };
    }

    void import('three')
      .then(async (THREE) => {
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 50);
        camera.position.set(0, 0.5, 10.2);
        camera.lookAt(0, -0.2, 0.8);

        const computer = new THREE.Group();
        computer.rotation.set(0.02, -0.16, 0);
        scene.add(computer);

        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0x232631,
          roughness: 0.48,
          metalness: 0.74,
        });
        const edgeMaterial = new THREE.MeshStandardMaterial({
          color: 0x08090d,
          roughness: 0.72,
          metalness: 0.42,
        });

        const lid = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.95, 0.18), bodyMaterial);
        lid.position.set(0, 0.72, 0);
        computer.add(lid);

        const textureLoader = new THREE.TextureLoader();
        const textures = new Map<number, Three.Texture>();
        const screenMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(6.38, 3.58), screenMaterial);
        screen.position.set(0, 0.72, 0.096);
        computer.add(screen);

        const webcam = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), edgeMaterial);
        webcam.position.set(0, 2.61, 0.108);
        computer.add(webcam);

        const base = new THREE.Mesh(new THREE.BoxGeometry(6.95, 0.2, 3.9), bodyMaterial);
        base.position.set(0, -1.28, 1.9);
        computer.add(base);

        const keyboardTexture = createKeyboardTexture(THREE);
        const keyboardMaterial = new THREE.MeshBasicMaterial({
          map: keyboardTexture,
          transparent: true,
          opacity: 0.92,
        });
        const keyboard = new THREE.Mesh(new THREE.PlaneGeometry(6.18, 3.08), keyboardMaterial);
        keyboard.rotation.x = -Math.PI / 2;
        keyboard.position.set(0, -1.171, 1.64);
        computer.add(keyboard);

        const hingeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.78, 18);
        const leftHinge = new THREE.Mesh(hingeGeometry, edgeMaterial);
        leftHinge.rotation.z = Math.PI / 2;
        leftHinge.position.set(-2.72, -1.23, 0.16);
        computer.add(leftHinge);
        const rightHinge = leftHinge.clone();
        rightHinge.position.x = 2.72;
        computer.add(rightHinge);

        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(4.25, 48),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24 }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.scale.y = 0.46;
        shadow.position.set(0, -1.43, 1.3);
        scene.add(shadow);

        scene.add(new THREE.HemisphereLight(0xb9c9ff, 0x08080b, 2.2));
        const keyLight = new THREE.DirectionalLight(0xe5e7ff, 3.2);
        keyLight.position.set(-4, 7, 8);
        scene.add(keyLight);
        const accentLight = new THREE.PointLight(0x9ece6a, 5.5, 12);
        accentLight.position.set(4.8, -0.2, 4.5);
        scene.add(accentLight);

        let requestedView = activeView();
        let renderActive = false;
        let currentX = computer.rotation.x;
        let currentY = computer.rotation.y;
        let targetX = currentX;
        let targetY = currentY;

        const renderFrame = () => {
          currentX += (targetX - currentX) * 0.12;
          currentY += (targetY - currentY) * 0.12;
          computer.rotation.x = currentX;
          computer.rotation.y = currentY;
          renderer.render(scene, camera);

          if (Math.abs(targetX - currentX) < 0.0002 && Math.abs(targetY - currentY) < 0.0002) {
            computer.rotation.x = targetX;
            computer.rotation.y = targetY;
            renderer.render(scene, camera);
            renderer.setAnimationLoop(null);
            renderActive = false;
          }
        };

        const requestRender = () => {
          if (renderActive || disposed) return;
          renderActive = true;
          renderer.setAnimationLoop(renderFrame);
        };

        const loadView = async (index: number) => {
          requestedView = index;
          let texture = textures.get(index);
          if (!texture) {
            texture = await textureLoader.loadAsync(desktopViews[index].src);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
            textures.set(index, texture);
          }
          if (disposed || requestedView !== index) return;
          screenMaterial.map = texture;
          screenMaterial.needsUpdate = true;
          requestRender();
        };

        setSceneView = (index) => void loadView(index);
        setScenePointer = (x, y) => {
          targetX = 0.02 + y * 0.045;
          targetY = -0.16 + x * 0.12;
          requestRender();
        };
        resetScenePointer = () => {
          targetX = 0.02;
          targetY = -0.16;
          requestRender();
        };

        const resize = () => {
          const width = Math.max(1, viewport.clientWidth);
          const height = Math.max(1, viewport.clientHeight);
          const maxPixels = 1920 * 1080;
          const desiredRatio = Math.min(window.devicePixelRatio || 1, 1.5);
          const limitedRatio = Math.min(desiredRatio, Math.sqrt(maxPixels / (width * height)));
          renderer.setPixelRatio(Math.max(0.75, limitedRatio));
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(viewport);

        const onContextLost = (event: Event) => {
          event.preventDefault();
          renderer.setAnimationLoop(null);
          setReady(false);
          setFallback(true);
        };
        canvas.addEventListener('webglcontextlost', onContextLost);

        cleanupScene = () => {
          resizeObserver.disconnect();
          canvas.removeEventListener('webglcontextlost', onContextLost);
          renderer.setAnimationLoop(null);
          textures.forEach((texture) => texture.dispose());
          keyboardTexture?.dispose();
          lid.geometry.dispose();
          screen.geometry.dispose();
          webcam.geometry.dispose();
          base.geometry.dispose();
          keyboard.geometry.dispose();
          hingeGeometry.dispose();
          shadow.geometry.dispose();
          bodyMaterial.dispose();
          edgeMaterial.dispose();
          screenMaterial.dispose();
          keyboardMaterial.dispose();
          (shadow.material as Three.Material).dispose();
          renderer.dispose();
        };

        resize();
        await loadView(activeView());
        if (disposed) {
          cleanupScene();
          return;
        }
        setReady(true);
        requestRender();
      })
      .catch(() => {
        if (!disposed) setFallback(true);
      });

    return () => {
      disposed = true;
      removePointerListeners();
      cleanupScene();
    };
  });

  return (
    <div {...stylex.attrs(styles.shell)}>
      <div
        ref={viewport}
        {...stylex.attrs(
          styles.viewport,
          dragging() && styles.viewportActive,
          fallback() && styles.viewportStatic,
        )}
        role="group"
        aria-label="Interactive Omarchy laptop"
      >
        <div {...stylex.attrs(styles.fallbackFrame, ready() && !fallback() && styles.fallbackFrameHidden)}>
          <img
            {...stylex.attrs(styles.fallbackImage)}
            src={desktopViews[activeView()].src}
            alt={desktopViews[activeView()].alt}
            width="1600"
            height="900"
            decoding="async"
          />
        </div>
        <canvas
          ref={canvas}
          {...stylex.attrs(styles.canvas, ready() && !fallback() && styles.canvasReady)}
          role="img"
          aria-label={`${desktopViews[activeView()].alt}. Move the pointer or drag to adjust the laptop view.`}
          aria-hidden={ready() && !fallback() ? undefined : 'true'}
        />
      </div>

      <div {...stylex.attrs(styles.controls)} role="group" aria-label="Omarchy desktop views">
        <For each={desktopViews}>
          {(view, index) => (
            <button
              {...stylex.attrs(
                styles.control,
                activeView() === index() && styles.controlSelected,
                landingStyles.focusRing,
              )}
              type="button"
              aria-pressed={activeView() === index() ? 'true' : 'false'}
              onClick={() => selectView(index())}
            >
              {view.label}
            </button>
          )}
        </For>
      </div>
      <span {...stylex.attrs(styles.srOnly)} role="status" aria-live="polite">
        {desktopViews[activeView()].label} view selected
      </span>
    </div>
  );
}
