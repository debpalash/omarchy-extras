import * as stylex from '@stylexjs/stylex';

export const tokens = stylex.defineVars({
  ink: '#f0eef5',
  muted: '#a5a2ad',
  black: '#0a0a0d',
  panel: '#11121a',
  line: 'rgba(240, 238, 245, 0.2)',
  lineStrong: 'rgba(240, 238, 245, 0.38)',
  surface: 'rgba(13, 13, 18, 0.72)',
  blue: '#7aa2f7',
  green: '#9ece6a',
});

export const styles = stylex.create({
  page: {
    minHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: tokens.black,
    backgroundImage: 'radial-gradient(circle at 15% 24%, rgba(122, 162, 247, 0.08), transparent 24rem)',
  },
  contentWidth: {
    width: {
      default: 'min(1280px, calc(100% - 48px))',
      '@media (max-width: 720px)': 'min(1280px, calc(100% - 30px))',
    },
    marginInline: 'auto',
  },
  focusRing: {
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${tokens.green}`,
    },
    outlineOffset: {
      default: 0,
      ':focus-visible': '4px',
    },
  },
  skipLink: {
    position: 'fixed',
    zIndex: 100,
    top: '0.75rem',
    left: '0.75rem',
    paddingBlock: '0.7rem',
    paddingInline: '0.9rem',
    color: tokens.black,
    backgroundColor: tokens.green,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.black,
    transform: {
      default: 'translateY(-160%)',
      ':focus': 'translateY(0)',
    },
  },
  announcement: {
    marginTop: '1.35rem',
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'center',
  },
  announcementLink: {
    width: 'fit-content',
    minHeight: '48px',
    paddingBlock: '0.72rem',
    paddingInline: {
      default: '1.15rem',
      '@media (max-width: 420px)': '0.85rem',
    },
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: {
      default: tokens.black,
      ':hover': tokens.black,
      ':active': tokens.ink,
    },
    backgroundColor: {
      default: tokens.green,
      ':hover': tokens.ink,
      ':active': tokens.black,
    },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: tokens.green,
      ':hover': tokens.ink,
      ':active': tokens.green,
    },
    fontSize: {
      default: '0.78rem',
      '@media (max-width: 420px)': '0.7rem',
    },
    fontWeight: 700,
    letterSpacing: '0.015em',
    lineHeight: 1.35,
    textDecorationLine: 'none',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '100ms',
    transitionTimingFunction: 'linear',
  },
  footer: {
    paddingBlock: {
      default: '3.5rem 4rem',
      '@media (max-width: 720px)': '3rem 3.5rem',
    },
    display: 'grid',
    gap: '0.7rem',
    color: tokens.muted,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.line,
    fontSize: '0.7rem',
    lineHeight: 1.65,
    textAlign: 'center',
  },
  footerParagraph: {
    margin: 0,
  },
  footerLink: {
    color: {
      default: tokens.ink,
      ':hover': tokens.green,
    },
    textDecorationColor: tokens.lineStrong,
    textUnderlineOffset: '0.24em',
  },
});
