import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(projectRoot, 'public');
const outputPath = join(publicRoot, 'site-search-index.json');

const pageIcons = {
  air: 'air',
  discord: 'discord',
  meetups: 'meetups',
  news: 'news',
  patrons: 'patrons',
  security: 'security',
  sponsorships: 'sponsorships',
  teams: 'teams',
  themes: 'merch',
  workstations: 'workstations',
};

const externalDocuments = [
  {
    id: 'destination:iso',
    title: 'Download Omarchy ISO',
    url: 'https://iso.omarchy.org/omarchy-4.0.1.iso',
    section: 'Download',
    kind: 'Destination',
    content: 'ISO installer image download',
    icon: 'iso',
  },
  {
    id: 'destination:plugins',
    title: 'Omarchy Plugins',
    url: 'https://omarchyplugins.com/',
    section: 'Plugins',
    kind: 'Destination',
    content: 'Browse plugins for Omarchy',
    icon: 'plugins',
  },
  {
    id: 'destination:github',
    title: 'Omarchy on GitHub',
    url: 'https://github.com/omacom/omarchy',
    section: 'GitHub',
    kind: 'Destination',
    content: 'Official Omarchy source code repository',
    icon: 'github',
  },
  {
    id: 'destination:awesome-omarchy',
    title: 'Awesome Omarchy',
    url: 'https://github.com/aorumbayev/awesome-omarchy',
    section: 'GitHub',
    kind: 'Destination',
    content: 'Curated Omarchy resources and community projects',
    icon: 'github',
  },
  {
    id: 'destination:discord',
    title: 'Omarchy Discord',
    url: 'https://discord.gg/tXFUdasqhY',
    section: 'Community',
    kind: 'Destination',
    content: 'Join the Omarchy community on Discord',
    icon: 'discord',
  },
  {
    id: 'destination:merch',
    title: 'Omarchy Merch',
    url: 'https://supply.37signals.com/collections/omarchy',
    section: 'Merch',
    kind: 'Destination',
    content: 'Omarchy merchandise from 37signals Supply',
    icon: 'merch',
  },
];

const entityMap = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  rdquo: '”',
  rsquo: '’',
};

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entityMap[name.toLowerCase()] ?? match);
}

function htmlToText(value) {
  return decodeEntities(
    value
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|svg|template|noscript|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/?(?:p|div|section|article|header|footer|nav|h[1-6]|li|dt|dd|br|tr)\b[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDisplayText(value) {
  return value
    .replace(/\s+[|·—–]\s+Omarchy.*$/i, '')
    .replace(/\s*[—–]\s*/g, ': ')
    .trim();
}

function attribute(html, name) {
  const nameFirst = html.match(new RegExp(`<meta\\b[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
  const contentFirst = html.match(new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'));
  return decodeEntities(nameFirst?.[1] ?? contentFirst?.[1] ?? '');
}

function routeFor(file) {
  const directory = relative(publicRoot, dirname(file)).split(sep).join('/');
  return directory ? `/${directory}/` : '/';
}

function titleFor(html, main) {
  const heading = main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const documentTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return cleanDisplayText(htmlToText(heading ?? documentTitle ?? ''));
}

function labelFor(slug) {
  return slug
    .split('-')
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : '')
    .join(' ');
}

async function findIndexFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findIndexFiles(path));
    if (entry.isFile() && entry.name === 'index.html') files.push(path);
  }

  return files;
}

async function buildPageDocument(file) {
  const url = routeFor(file);
  if (url.startsWith('/manual/') || url === '/discord/') return null;

  const html = await readFile(file, 'utf8');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]
    ?? html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]
    ?? html;
  const title = titleFor(html, main);
  if (!title) return null;

  const segment = url.split('/').filter(Boolean)[0] ?? 'home';
  const section = segment === 'home' ? 'Home' : labelFor(segment);
  const description = attribute(html, 'description');
  const content = `${description} ${htmlToText(main)}`.trim().slice(0, 20000);

  return {
    id: `page:${url}`,
    title,
    url,
    section,
    kind: segment === 'news' ? 'News' : 'Site',
    content,
    icon: pageIcons[segment] ?? 'manual',
  };
}

const manualEntries = JSON.parse(await readFile(join(publicRoot, 'manual/search-index.json'), 'utf8'));
const manualDocuments = manualEntries.map((entry, index) => ({
  id: `manual:${index}`,
  title: cleanDisplayText(entry.title),
  url: entry.url,
  section: cleanDisplayText(entry.chapter),
  kind: 'Manual',
  content: entry.text,
  icon: 'manual',
}));

const pageDocuments = (await Promise.all(
  (await findIndexFiles(publicRoot)).map(buildPageDocument),
)).filter(Boolean);

const documents = [
  {
    id: 'page:home',
    title: 'Omarchy',
    url: '/',
    section: 'Home',
    kind: 'Site',
    content: 'Beautiful, modern, fun Linux. An opinionated Arch and Hyprland system by DHH.',
    icon: 'manual',
  },
  ...externalDocuments,
  ...pageDocuments,
  ...manualDocuments,
];

await writeFile(outputPath, JSON.stringify(documents));
console.log(`Built ${documents.length} search documents at ${relative(projectRoot, outputPath)}`);
