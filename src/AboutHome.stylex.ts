import * as stylex from '@stylexjs/stylex';
import { tokens } from './landing.stylex';

export const aboutStyles = stylex.create({
  about: {
    minHeight: '100%',
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(190px, 0.82fr) minmax(320px, 1.18fr)',
      '@media (max-width: 1100px)': '1fr',
    },
    alignItems: 'center',
    gap: {
      default: 'clamp(1rem, 3vw, 3rem)',
      '@media (max-width: 1100px)': '0.75rem',
    },
    padding: {
      default: 'clamp(1rem, 3vw, 2.5rem)',
      '@media (max-width: 1100px)': '0.75rem',
    },
    color: '#d7d0c7',
    backgroundColor: 'rgba(10, 8, 13, 0.97)',
    fontSize: 'clamp(0.68rem, 1vw, 0.84rem)',
    lineHeight: 1.45,
  },
  markWrap: {
    minWidth: 0,
    display: 'grid',
    placeItems: 'center',
    padding: {
      default: '1rem',
      '@media (max-width: 1100px)': '0.1rem',
    },
  },
  mark: {
    width: {
      default: 'min(100%, 360px)',
      '@media (max-width: 1100px)': 'min(32vw, 112px)',
    },
    height: 'auto',
    display: 'block',
    color: '#7dc79f',
    fill: 'currentColor',
  },
  readout: {
    minWidth: 0,
    display: 'grid',
    gap: '0.8rem',
  },
  identity: {
    minWidth: 0,
    marginBottom: '0.15rem',
  },
  product: {
    margin: '0 0 0.25rem',
    color: '#7dc79f',
    fontWeight: 700,
    letterSpacing: '0.06em',
  },
  headline: {
    maxWidth: '38ch',
    margin: 0,
    color: '#e2ddd6',
    fontSize: 'clamp(0.9rem, 1.55vw, 1.3rem)',
    fontWeight: 500,
    letterSpacing: '-0.035em',
    lineHeight: 1.2,
    textWrap: 'balance',
  },
  link: {
    color: '#b67ac7',
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.18em',
  },
  group: {
    position: 'relative',
    minWidth: 0,
    padding: '0.85rem 0.9rem 0.7rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#6c586d',
  },
  hardware: {
    borderLeftColor: '#7dc79f',
  },
  software: {
    borderLeftColor: '#7892c8',
  },
  session: {
    borderLeftColor: '#b67ac7',
  },
  legend: {
    position: 'absolute',
    top: '-0.65em',
    left: '50%',
    margin: 0,
    paddingInline: '0.45rem',
    color: '#957a99',
    backgroundColor: '#0a080d',
    fontSize: '0.76rem',
    fontWeight: 500,
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
  },
  list: {
    minWidth: 0,
    margin: 0,
    display: 'grid',
    gap: '0.22rem',
  },
  sessionList: {
    minWidth: 0,
    margin: 0,
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(3, minmax(0, 1fr))',
      '@media (max-width: 420px)': '1fr',
    },
    gap: '0.25rem 0.8rem',
  },
  row: {
    minWidth: 0,
    display: 'grid',
    gridTemplateColumns: 'minmax(4.8rem, auto) minmax(0, 1fr)',
    gap: '0.45rem',
  },
  key: {
    color: '#7dc79f',
    fontWeight: 600,
  },
  value: {
    minWidth: 0,
    margin: 0,
    overflowWrap: 'anywhere',
    color: '#d7d0c7',
    fontVariantNumeric: 'tabular-nums',
  },
  focusRing: {
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${tokens.green}`,
    },
    outlineOffset: {
      default: 0,
      ':focus-visible': '3px',
    },
  },
});
