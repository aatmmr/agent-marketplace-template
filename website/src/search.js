import Fuse from 'fuse.js';

const fuseOptions = {
  includeScore: true,
  threshold: 0.38,
  ignoreLocation: true,
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'keywords', weight: 0.15 },
    { name: 'plugin', weight: 0.1 },
    { name: 'type', weight: 0.05 }
  ]
};

export function createSearch(items) {
  const fuse = new Fuse(items, fuseOptions);

  return function search(query) {
    const q = query.trim();
    if (!q) return items;
    return fuse.search(q).map((r) => r.item);
  };
}
