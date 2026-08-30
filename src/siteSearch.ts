export type SiteSearchDocument = {
  id: string;
  title: string;
  url: string;
  section: string;
  kind: string;
  content: string;
  icon: string;
};

const schema = {
  id: 'string',
  title: 'string',
  url: 'string',
  section: 'string',
  kind: 'string',
  content: 'string',
  icon: 'string',
} as const;

async function createSiteSearch() {
  const [{ create, insertMultiple, search }, response] = await Promise.all([
    import('@orama/orama'),
    fetch('/site-search-index.json'),
  ]);
  if (!response.ok) throw new Error(`Search index request failed with ${response.status}`);

  const documents = await response.json() as SiteSearchDocument[];
  const database = create({ schema });
  await insertMultiple(database, documents, 200);
  return { database, search };
}

let databasePromise: ReturnType<typeof createSiteSearch> | undefined;

export function preloadSiteSearch() {
  databasePromise ??= createSiteSearch().catch((error) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

export async function searchSite(term: string, limit = 10) {
  const engine = await preloadSiteSearch();
  const result = await engine.search(engine.database, {
    term,
    properties: ['title', 'section', 'content'],
    boost: { title: 3, section: 1.5 },
    tolerance: term.length >= 5 ? 1 : 0,
    limit,
  });

  return result.hits.map((hit) => hit.document as SiteSearchDocument);
}

export async function relatedSiteDocuments(document: SiteSearchDocument, excludeIds: string[] = [], limit = 7) {
  const excluded = new Set([document.id, ...excludeIds]);
  const collect = (documents: SiteSearchDocument[], current: SiteSearchDocument[]) => {
    for (const candidate of documents) {
      if (excluded.has(candidate.id) || current.some((item) => item.id === candidate.id)) continue;
      current.push(candidate);
      if (current.length === limit) break;
    }
    return current;
  };

  const related = collect(await searchSite(document.section, limit * 6), []);
  if (related.length < limit && document.section !== document.title) {
    collect(await searchSite(document.title, limit * 4), related);
  }

  return related;
}
