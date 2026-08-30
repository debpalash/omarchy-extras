import * as stylex from '@stylexjs/stylex';
import { tokens } from './landing.stylex';

export const btopStyles = stylex.create({
  home: {
    minHeight: '100%',
    padding: {
      default: '0.65rem',
      '@media (max-width: 720px)': '0.5rem',
    },
    display: 'grid',
    alignContent: 'start',
    gap: '0.5rem',
    color: tokens.ink,
    backgroundColor: '#07080c',
    fontSize: '0.72rem',
    lineHeight: 1.45,
  },
  header: {
    minWidth: 0,
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr) auto',
      '@media (max-width: 620px)': '1fr',
    },
    gap: {
      default: '1rem',
      '@media (max-width: 620px)': '0.65rem',
    },
    alignItems: 'center',
    padding: '0.75rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.lineStrong,
    backgroundColor: '#0a0a0d',
  },
  identity: {
    minWidth: 0,
  },
  kicker: {
    margin: '0 0 0.25rem',
    color: tokens.green,
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  title: {
    maxWidth: '34ch',
    margin: 0,
    color: tokens.ink,
    fontSize: {
      default: 'clamp(1.2rem, 2.5vw, 2rem)',
      '@media (max-width: 420px)': '1.05rem',
    },
    fontWeight: 500,
    letterSpacing: '-0.045em',
    lineHeight: 1.05,
    overflowWrap: 'anywhere',
    textWrap: 'balance',
  },
  titleLink: {
    color: tokens.blue,
    textDecorationThickness: '0.08em',
    textUnderlineOffset: '0.14em',
  },
  session: {
    display: 'grid',
    gridTemplateColumns: 'auto auto auto',
    alignItems: 'center',
    gap: '0.65rem',
  },
  sessionLabel: {
    color: tokens.muted,
    letterSpacing: '0.06em',
  },
  sessionValue: {
    color: tokens.green,
    fontSize: '0.78rem',
    fontVariantNumeric: 'tabular-nums',
  },
  pauseButton: {
    minWidth: '76px',
    minHeight: '44px',
    paddingInline: '0.75rem',
    color: {
      default: tokens.ink,
      ':hover': tokens.black,
      ':active': tokens.black,
    },
    backgroundColor: {
      default: 'transparent',
      ':hover': tokens.green,
      ':active': tokens.green,
    },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: tokens.lineStrong,
      ':hover': tokens.green,
      ':active': tokens.green,
    },
    font: 'inherit',
    cursor: 'pointer',
  },
  grid: {
    minWidth: 0,
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1.25fr) minmax(280px, 0.75fr)',
      '@media (max-width: 720px)': '1fr',
    },
    gridTemplateAreas: {
      default: '"load memory" "system network" "tasks tasks"',
      '@media (max-width: 720px)': '"load" "memory" "network" "system" "tasks"',
    },
    gap: '0.5rem',
  },
  panel: {
    minWidth: 0,
    padding: '0.65rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.lineStrong,
    backgroundColor: '#0a0a0d',
  },
  loadPanel: {
    gridArea: 'load',
  },
  memoryPanel: {
    gridArea: 'memory',
  },
  systemPanel: {
    gridArea: 'system',
  },
  networkPanel: {
    gridArea: 'network',
  },
  tasksPanel: {
    gridArea: 'tasks',
  },
  panelHeading: {
    minHeight: '24px',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginBottom: '0.5rem',
    paddingBottom: '0.35rem',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.line,
  },
  panelTitle: {
    margin: 0,
    color: tokens.blue,
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  metric: {
    color: tokens.green,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    minHeight: '62px',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    color: tokens.muted,
  },
  chart: {
    height: '68px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2px',
    paddingTop: '0.25rem',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.lineStrong,
  },
  chartBar: {
    minWidth: '2px',
    flexGrow: 1,
    backgroundColor: tokens.blue,
    opacity: 0.72,
  },
  chartBarCurrent: {
    backgroundColor: tokens.green,
    opacity: 1,
  },
  chartSummary: {
    margin: '0.35rem 0 0',
    color: tokens.muted,
    fontSize: '0.66rem',
  },
  meter: {
    height: '18px',
    marginBottom: '0.55rem',
    overflow: 'hidden',
    backgroundColor: 'rgba(240, 238, 245, 0.08)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.line,
  },
  meterFill: {
    height: '100%',
    display: 'block',
    backgroundColor: tokens.green,
  },
  detailList: {
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.35rem 0.8rem',
    color: tokens.muted,
    fontVariantNumeric: 'tabular-nums',
  },
  detailRow: {
    minWidth: 0,
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  detailTerm: {
    color: tokens.muted,
  },
  detailValue: {
    minWidth: 0,
    margin: 0,
    color: tokens.ink,
    overflowWrap: 'anywhere',
    textAlign: 'right',
  },
  systemDetails: {
    '@media (max-width: 420px)': {
      gridTemplateColumns: '1fr',
    },
  },
  networkState: {
    color: tokens.green,
    fontWeight: 700,
    letterSpacing: '0.06em',
  },
  networkOffline: {
    color: '#f7768e',
  },
  taskList: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      '@media (max-width: 560px)': '1fr',
    },
    gap: '0.35rem',
  },
  task: {
    minWidth: 0,
    minHeight: '44px',
    display: 'grid',
    gridTemplateColumns: '2rem minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: '0.5rem',
    paddingInline: '0.55rem',
    color: {
      default: tokens.muted,
      ':hover': tokens.black,
      ':active': tokens.black,
    },
    backgroundColor: {
      default: 'rgba(240, 238, 245, 0.025)',
      ':hover': tokens.green,
      ':active': tokens.green,
    },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: tokens.line,
      ':hover': tokens.green,
      ':active': tokens.green,
    },
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  taskRunning: {
    color: tokens.ink,
    borderColor: tokens.lineStrong,
  },
  taskIndex: {
    color: 'inherit',
    fontVariantNumeric: 'tabular-nums',
  },
  taskName: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  taskState: {
    color: 'inherit',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
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
