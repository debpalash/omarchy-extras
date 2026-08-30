import * as stylex from '@stylexjs/stylex';
import { tokens } from './landing.stylex';

export const computerStyles = stylex.create({
  shell: {
    minWidth: 0,
    width: '100%',
    display: 'grid',
    gap: '0.75rem',
    justifySelf: 'stretch',
  },
  viewport: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: '4 / 3',
    isolation: 'isolate',
    touchAction: 'pan-y',
    cursor: 'grab',
  },
  viewportActive: {
    cursor: 'grabbing',
  },
  viewportStatic: {
    cursor: 'default',
  },
  fallbackFrame: {
    position: 'absolute',
    zIndex: 0,
    inset: {
      default: '11% 4% 16%',
      '@media (max-width: 720px)': '12% 0 16%',
    },
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.lineStrong,
    backgroundColor: tokens.panel,
    boxShadow: '0 2rem 5rem rgba(0, 0, 0, 0.42)',
    opacity: 1,
    transitionProperty: 'opacity',
    transitionDuration: {
      default: '180ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionTimingFunction: 'ease-out',
  },
  fallbackFrameHidden: {
    opacity: 0,
  },
  fallbackImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  canvas: {
    position: 'absolute',
    zIndex: 1,
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: {
      default: '180ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionTimingFunction: 'ease-out',
  },
  canvasReady: {
    opacity: 1,
  },
  controls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '0.5rem',
    width: {
      default: 'min(100%, 31rem)',
      '@media (max-width: 420px)': '100%',
    },
    marginInline: 'auto',
  },
  control: {
    minWidth: 0,
    minHeight: '44px',
    paddingBlock: '0.65rem',
    paddingInline: {
      default: '0.9rem',
      '@media (max-width: 420px)': '0.5rem',
    },
    color: {
      default: tokens.muted,
      ':hover': tokens.ink,
      ':active': tokens.black,
    },
    backgroundColor: {
      default: tokens.surface,
      ':hover': 'rgba(17, 18, 26, 0.94)',
      ':active': tokens.green,
    },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: tokens.line,
      ':hover': tokens.lineStrong,
      ':active': tokens.green,
    },
    fontFamily: 'inherit',
    fontSize: {
      default: '0.67rem',
      '@media (max-width: 420px)': '0.6rem',
    },
    fontWeight: 700,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: {
      default: '120ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionTimingFunction: 'ease-out',
  },
  controlSelected: {
    color: tokens.black,
    backgroundColor: tokens.green,
    borderColor: tokens.green,
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
});
