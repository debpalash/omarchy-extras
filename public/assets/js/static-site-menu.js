const destinations = [
  ['Manual', '/manual/', 'page'],
  ['ISO', 'https://iso.omarchy.org/omarchy-4.0.1.iso', 'download'],
  ['Plugins', 'https://omarchyplugins.com/', 'plugin'],
  ['Themes', '/themes/', 'theme'],
  ['GitHub', 'https://github.com/omacom/omarchy', 'code'],
  ['Awesome Omarchy', 'https://github.com/aorumbayev/awesome-omarchy', 'code'],
  ['Security', '/security/', 'shield'],
  ['News', '/news/', 'news'],
  ['Teams', '/teams/', 'people'],
  ['Patrons', '/patrons/', 'heart'],
  ['Sponsorships', '/sponsorships/', 'sponsor'],
  ['AIR', '/air/', 'air'],
  ['Discord', 'https://discord.gg/tXFUdasqhY', 'people'],
  ['Meetups', '/meetups/', 'calendar'],
  ['Workstations', '/workstations/', 'monitor'],
  ['Merch', 'https://supply.37signals.com/collections/omarchy', 'merch'],
];

const iconPaths = {
  menu: '<path d="M4 8h16M4 16h16"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  page: '<path d="M5 3h10l4 4v14H5V3Z"/><path d="M15 3v5h4M8 12h8M8 16h8"/>',
  download: '<path d="M12 3v11m0 0 4-4m-4 4-4-4"/><path d="M5 17v3h14v-3"/>',
  plugin: '<path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4"/>',
  theme: '<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h3a6 6 0 0 0 0-12h-3Z"/><path d="M7.5 9h.01M9.5 5.5h.01M15 5.5h.01"/>',
  code: '<circle cx="12" cy="12" r="9"/><path d="m10 8-4 4 4 4m4-8 4 4-4 4"/>',
  shield: '<path d="M12 3 5 6v5c0 4.7 2.9 8.3 7 10 4.1-1.7 7-5.3 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>',
  news: '<path d="M4 5h13v15H5a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Z"/><path d="M17 8h4v10a2 2 0 0 1-2 2h-2M7 9h6M7 13h6M7 17h3"/>',
  people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20v-1a6 6 0 0 1 12 0v1m0-6a5 5 0 0 1 6 5v1"/>',
  heart: '<path d="M20.8 5.7a5.2 5.2 0 0 0-7.4 0L12 7.1l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 22l8.8-8.9a5.2 5.2 0 0 0 0-7.4Z"/>',
  sponsor: '<rect x="3" y="6" width="18" height="13"/><path d="M3 10h18M7 15h4"/>',
  air: '<path d="m4 20 5.5-1.5L20 8l-4-4L5.5 14.5 4 20Z"/><path d="m13.5 6.5 4 4M4 20l4-4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16"/><path d="M8 3v4m8-4v4M3 10h18m-13 4h3m2 0h3m-8 3h3"/>',
  monitor: '<rect x="2" y="3" width="20" height="14"/><path d="M8 21h8m-4-4v4"/>',
  merch: '<path d="m8 4-5 3 2 4 3-1v11h8V10l3 1 2-4-5-3a4 4 0 0 1-8 0Z"/>',
};

const icon = (kind) => `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[kind]}</svg>`;

const toggle = document.createElement('button');
toggle.className = 'static-menu-toggle';
toggle.type = 'button';
toggle.setAttribute('aria-controls', 'static-site-menu');
toggle.setAttribute('aria-expanded', 'false');
toggle.innerHTML = `${icon('menu')}<span>Menu</span>`;

const scrim = document.createElement('button');
scrim.className = 'static-menu-scrim';
scrim.type = 'button';
scrim.setAttribute('aria-label', 'Close menu');

const panel = document.createElement('nav');
panel.className = 'static-menu-panel';
panel.id = 'static-site-menu';
panel.setAttribute('aria-label', 'Omarchy destinations');
panel.innerHTML = `
  <p class="static-menu-prompt">Go...</p>
  <input class="static-menu-search" type="search" placeholder="Filter destinations" aria-label="Filter destinations" autocomplete="off">
  <ul class="static-menu-list"></ul>
`;

document.body.append(toggle, scrim, panel);

const list = panel.querySelector('.static-menu-list');
const search = panel.querySelector('.static-menu-search');

const render = (query = '') => {
  const normalized = query.trim().toLowerCase();
  const matches = destinations.filter(([label]) => label.toLowerCase().includes(normalized));
  list.innerHTML = matches.length
    ? matches.map(([label, href, kind]) => {
      const current = new URL(href, location.href).pathname === location.pathname;
      return `<li><a class="static-menu-link" href="${href}"${current ? ' aria-current="page"' : ''}>${icon(kind)}<span>${label}</span></a></li>`;
    }).join('')
    : '<li><p class="static-menu-empty">No matching destinations.</p></li>';
};

const setOpen = (open) => {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.innerHTML = `${icon(open ? 'close' : 'menu')}<span>${open ? 'Close' : 'Menu'}</span>`;
  panel.toggleAttribute('data-open', open);
  scrim.toggleAttribute('data-open', open);
  if (open) search.focus();
  else toggle.focus();
};

render();
toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
scrim.addEventListener('click', () => setOpen(false));
search.addEventListener('input', () => render(search.value));
panel.addEventListener('click', (event) => {
  if (event.target.closest('a')) setOpen(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
});
