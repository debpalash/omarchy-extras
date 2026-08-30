import { For, Show, createMemo, createSignal, onSettled } from 'solid-js';
import * as stylex from '@stylexjs/stylex';
import { menuStyles } from './SiteMenu.stylex';

type MenuIconName =
  | 'manual'
  | 'iso'
  | 'plugins'
  | 'github'
  | 'security'
  | 'news'
  | 'teams'
  | 'patrons'
  | 'sponsorships'
  | 'air'
  | 'discord'
  | 'meetups'
  | 'workstations'
  | 'merch';

const menuLinks: Array<{ label: string; href: string; icon: MenuIconName }> = [
  { label: 'Manual', href: '/manual/', icon: 'manual' },
  { label: 'ISO', href: 'https://iso.omarchy.org/omarchy-4.0.1.iso', icon: 'iso' },
  { label: 'Plugins', href: 'https://omarchyplugins.com/', icon: 'plugins' },
  { label: 'GitHub', href: 'https://github.com/omacom/omarchy', icon: 'github' },
  { label: 'Security', href: '/security/', icon: 'security' },
  { label: 'News', href: '/news/', icon: 'news' },
  { label: 'Teams', href: '/teams/', icon: 'teams' },
  { label: 'Patrons', href: '/patrons/', icon: 'patrons' },
  { label: 'Sponsorships', href: '/sponsorships/', icon: 'sponsorships' },
  { label: 'AIR', href: '/air/', icon: 'air' },
  { label: 'Discord', href: 'https://discord.gg/tXFUdasqhY', icon: 'discord' },
  { label: 'Meetups', href: '/meetups/', icon: 'meetups' },
  { label: 'Workstations', href: '/workstations/', icon: 'workstations' },
  { label: 'Merch', href: 'https://supply.37signals.com/collections/omarchy', icon: 'merch' },
];

function MenuIcon(props: { name: MenuIconName }) {
  const paths = () => {
    switch (props.name) {
      case 'manual':
        return <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a2 2 0 0 1 2 2v15a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17a2 2 0 0 1 2-2h2.5a2.5 2.5 0 0 1 2.5 2.5v-15Z" /></>;
      case 'iso':
        return <><path d="M12 3v11m0 0 4-4m-4 4-4-4" /><path d="M5 16v3h14v-3" /></>;
      case 'plugins':
        return <><path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4" /></>;
      case 'github':
        return <><circle cx="12" cy="12" r="9" /><path d="M9 20v-3.2c-2.7.6-3.3-1.2-3.3-1.2M15 20v-3.8c0-1 .3-1.8.8-2.3 2.6-.3 5.2-1.3 5.2-5.2 0-1.1-.4-2.1-1.1-2.8.1-.4.5-1.7-.1-2.8 0 0-.9-.3-2.9 1.1a10 10 0 0 0-5.2 0C9.7 2.8 8.8 3.1 8.8 3.1c-.6 1.1-.2 2.4-.1 2.8A4 4 0 0 0 7.6 8.7c0 3.9 2.6 4.9 5.2 5.2" /></>;
      case 'security':
        return <><path d="M12 3 5 6v5c0 4.7 2.9 8.3 7 10 4.1-1.7 7-5.3 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-5" /></>;
      case 'news':
        return <><path d="M4 5h13v15H5a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Z" /><path d="M17 8h4v10a2 2 0 0 1-2 2h-2M7 9h6M7 13h6M7 17h3" /></>;
      case 'teams':
        return <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20v-1a6 6 0 0 1 12 0v1m0-6a5 5 0 0 1 6 5v1" /></>;
      case 'patrons':
        return <path d="M20.8 5.7a5.2 5.2 0 0 0-7.4 0L12 7.1l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 22l8.8-8.9a5.2 5.2 0 0 0 0-7.4Z" />;
      case 'sponsorships':
        return <><rect x="3" y="6" width="18" height="13" /><path d="M3 10h18M7 15h4" /></>;
      case 'air':
        return <><path d="m4 20 5.5-1.5L20 8l-4-4L5.5 14.5 4 20Z" /><path d="m13.5 6.5 4 4M4 20l4-4" /></>;
      case 'discord':
        return <><path d="M7 6a13 13 0 0 1 10 0c2 2.7 3 5.8 3 9-2 1.5-3.8 2.2-5.4 2.6l-.8-1.3a9 9 0 0 0 2.2-1.1c-2.7 1.2-5.3 1.2-8 0a9 9 0 0 0 2.2 1.1l-.8 1.3C7.8 17.2 6 16.5 4 15c0-3.2 1-6.3 3-9Z" /><path d="M9 12h.01M15 12h.01" /></>;
      case 'meetups':
        return <><rect x="3" y="5" width="18" height="16" /><path d="M8 3v4m8-4v4M3 10h18m-13 4h3m2 0h3m-8 3h3" /></>;
      case 'workstations':
        return <><rect x="2" y="3" width="20" height="14" /><path d="M8 21h8m-4-4v4" /></>;
      case 'merch':
        return <path d="m8 4-5 3 2 4 3-1v11h8V10l3 1 2-4-5-3a4 4 0 0 1-8 0Z" />;
    }
  };

  return (
    <svg
      {...stylex.attrs(menuStyles.icon)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="square"
      stroke-linejoin="miter"
      aria-hidden="true"
    >
      {paths()}
    </svg>
  );
}

export default function SiteMenu() {
  const [open, setOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [query, setQuery] = createSignal('');
  const [toggleHidden, setToggleHidden] = createSignal(false);
  const filteredLinks = createMemo(() => {
    const normalizedQuery = query().trim().toLocaleLowerCase();
    if (!normalizedQuery) return menuLinks;
    return menuLinks.filter((link) => link.label.toLocaleLowerCase().includes(normalizedQuery));
  });
  let controls: HTMLDivElement | undefined;
  let toggleButton: HTMLButtonElement | undefined;
  let searchInput: HTMLInputElement | undefined;
  let panel: HTMLElement | undefined;
  let scrollEndTimer: number | undefined;

  const focusToggle = () => queueMicrotask(() => toggleButton?.focus({ preventScroll: true }));

  const closeMenu = (restoreFocus = false) => {
    if (!open()) return;
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    if (restoreFocus) focusToggle();
  };

  const openMenu = () => {
    setToggleHidden(false);
    setOpen(true);
    window.setTimeout(() => searchInput?.focus({ preventScroll: true }), 30);
  };

  const moveActive = (nextIndex: number) => {
    const visibleLinks = Array.from(panel?.querySelectorAll<HTMLAnchorElement>('[data-menu-link]') ?? []);
    if (!visibleLinks.length) return;
    const wrappedIndex = (nextIndex + visibleLinks.length) % visibleLinks.length;
    setActiveIndex(wrappedIndex);
    visibleLinks[wrappedIndex]?.focus({ preventScroll: true });
  };

  const handlePanelKeyDown = (event: KeyboardEvent) => {
    if (!open()) return;
    const targetIsSearch = event.target === searchInput;
    const resultCount = filteredLinks().length;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(targetIsSearch ? 0 : activeIndex() + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(targetIsSearch ? resultCount - 1 : activeIndex() - 1);
    } else if (event.key === 'Home' && !targetIsSearch) {
      event.preventDefault();
      moveActive(0);
    } else if (event.key === 'End' && !targetIsSearch) {
      event.preventDefault();
      moveActive(resultCount - 1);
    } else if (event.key === 'Enter' && targetIsSearch && resultCount) {
      event.preventDefault();
      panel?.querySelector<HTMLAnchorElement>('[data-menu-link]')?.click();
    }
  };

  onSettled(() => {
    const handleScroll = () => {
      const focusIsInsideMenu = panel?.contains(document.activeElement) ?? false;
      const focusIsInsideControls = controls?.contains(document.activeElement) ?? false;
      closeMenu(focusIsInsideMenu);

      if (!focusIsInsideMenu && !focusIsInsideControls) {
        setToggleHidden(true);
      }

      if (scrollEndTimer) window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => setToggleHidden(false), 360);
    };

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open()) {
        event.preventDefault();
        closeMenu(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (scrollEndTimer) window.clearTimeout(scrollEndTimer);
    };
  });

  return (
    <>
      <div
        ref={controls}
        {...stylex.attrs(menuStyles.controls, toggleHidden() && menuStyles.controlsHidden)}
      >
        <button
          ref={toggleButton}
          type="button"
          aria-controls="site-menu"
          aria-expanded={open() ? 'true' : 'false'}
          {...stylex.attrs(menuStyles.toggle, open() && menuStyles.toggleOpen, menuStyles.focusRing)}
          onClick={() => (open() ? closeMenu(false) : openMenu())}
        >
          <span {...stylex.attrs(menuStyles.toggleMark)} aria-hidden="true">
            <span {...stylex.attrs(menuStyles.toggleMarkLine, open() && menuStyles.toggleMarkLineTopOpen)} />
            <span {...stylex.attrs(menuStyles.toggleMarkLine, open() && menuStyles.toggleMarkLineBottomOpen)} />
          </span>
          <span>{open() ? 'Close' : 'Menu'}</span>
        </button>

        <a
          href="https://iso.omarchy.org/omarchy-4.0.1.iso"
          {...stylex.attrs(menuStyles.download, menuStyles.focusRing)}
        >
          Download
        </a>
      </div>

      <div
        aria-hidden="true"
        {...stylex.attrs(menuStyles.scrim, open() && menuStyles.scrimOpen)}
        onClick={() => closeMenu(true)}
      />

      <nav
        ref={panel}
        id="site-menu"
        aria-label="Omarchy destinations"
        aria-hidden={open() ? 'false' : 'true'}
        {...stylex.attrs(menuStyles.panel, open() && menuStyles.panelOpen)}
        onKeyDown={handlePanelKeyDown}
      >
        <label for="site-menu-search" {...stylex.attrs(menuStyles.prompt)}>Go...</label>
        <input
          ref={searchInput}
          id="site-menu-search"
          type="search"
          value={query()}
          placeholder="Search destinations"
          autocomplete="off"
          spellcheck={false}
          aria-controls="site-menu-results"
          {...stylex.attrs(menuStyles.search, menuStyles.focusRing)}
          onInput={(event) => {
            setQuery(event.currentTarget.value);
            setActiveIndex(0);
          }}
        />
        <ul id="site-menu-results" {...stylex.attrs(menuStyles.list)}>
          <Show
            when={filteredLinks().length > 0}
            fallback={<li role="status" {...stylex.attrs(menuStyles.empty)}>No matches. Try Manual or GitHub.</li>}
          >
            <For each={filteredLinks()}>
              {(link, index) => (
                <li {...stylex.attrs(menuStyles.listItem)}>
                  <a
                    data-menu-link
                    href={link.href}
                    tabindex={open() ? 0 : -1}
                    {...stylex.attrs(
                      menuStyles.menuLink,
                      activeIndex() === index() && menuStyles.menuLinkActive,
                      menuStyles.focusRing,
                    )}
                    onMouseEnter={() => setActiveIndex(index())}
                    onFocus={() => setActiveIndex(index())}
                    onClick={() => closeMenu(false)}
                  >
                    <MenuIcon name={link.icon} />
                    <span {...stylex.attrs(menuStyles.linkLabel)}>{link.label}</span>
                    <span {...stylex.attrs(menuStyles.chevron)} aria-hidden="true" />
                  </a>
                </li>
              )}
            </For>
          </Show>
        </ul>
      </nav>
    </>
  );
}
