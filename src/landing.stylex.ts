import * as stylex from '@stylexjs/stylex';

export const tokens = stylex.defineVars({
  ink: '#f0eef5',
  muted: '#a5a2ad',
  black: '#0a0a0d',
  backgroundNight: '#1a1b26',
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
    backgroundColor: tokens.backgroundNight,
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
    margin: '0 0 clamp(0.65rem, 1.25vw, 1rem)',
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'center',
  },
  heroCopy: {
    width: 'min(100%, 72rem)',
    margin: 'clamp(0.75rem, 1.5vw, 1.15rem) auto 0',
    display: 'grid',
    gap: '0.45rem',
    textAlign: 'center',
  },
  heroHeadline: {
    maxWidth: 'none',
    margin: '0 auto',
    color: '#c9c6d0',
    fontSize: {
      default: 'clamp(1.7rem, 2.45vw, 2.4rem)',
      '@media (max-width: 420px)': 'clamp(1.45rem, 8vw, 2rem)',
    },
    fontWeight: 680,
    letterSpacing: '-0.045em',
    lineHeight: 1.12,
    textWrap: 'balance',
  },
  heroDescription: {
    maxWidth: '78ch',
    margin: '0 auto',
    color: '#96929d',
    fontSize: {
      default: 'clamp(0.92rem, 1.35vw, 1.08rem)',
      '@media (max-width: 420px)': '0.9rem',
    },
    lineHeight: 1.5,
    textWrap: 'pretty',
  },
  heroDhhLink: {
    color: '#aa85c3',
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.18em',
  },
  heroOmarchLink: {
    color: '#86ad63',
    fontWeight: 700,
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.18em',
  },
  announcementLink: {
    width: 'fit-content',
    minHeight: '36px',
    paddingBlock: '0.25rem',
    paddingInline: '0.2rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: {
      default: '#aaa6b0',
      ':hover': tokens.green,
      ':active': tokens.green,
    },
    fontSize: {
      default: '0.9rem',
      '@media (max-width: 420px)': '0.8rem',
    },
    fontWeight: 500,
    letterSpacing: '0.02em',
    lineHeight: 1.35,
    textDecorationLine: 'underline',
    textDecorationColor: tokens.green,
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.35em',
    transitionProperty: 'color, text-decoration-color',
    transitionDuration: '100ms',
    transitionTimingFunction: 'linear',
  },
  footer: {
    paddingBlock: {
      default: '3.5rem 4rem',
      '@media (max-width: 720px)': '3rem 3.5rem',
    },
    display: 'grid',
    gap: '0.85rem',
    color: tokens.muted,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.line,
    fontSize: {
      default: '0.86rem',
      '@media (max-width: 420px)': '0.8rem',
    },
    lineHeight: 1.7,
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
