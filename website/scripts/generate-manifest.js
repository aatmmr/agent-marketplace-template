import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const pluginsDir = join(repoRoot, 'plugins');
const marketplacePath = join(repoRoot, '.github', 'plugin', 'marketplace.json');

const dataOutDir = join(__dirname, '..', 'src', 'data');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function safeRead(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

function listDirs(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((name) => statSync(join(path, name)).isDirectory());
}

// Recursively collect files matching a predicate, skipping node_modules/.git.
function walk(dir, predicate, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, predicate, acc);
    else if (predicate(name, full)) acc.push(full);
  }
  return acc;
}

function rel(path) {
  return relative(repoRoot, path).split('\\').join('/');
}

function excerpt(markdown, max = 220) {
  if (!markdown) return '';
  const text = markdown
    .replace(/^---[\s\S]*?---/, '') // strip frontmatter
    .replace(/^#.*$/gm, '') // strip headings
    .replace(/[`*_>#\-]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

const items = [];

// --- Plugins + marketplace metadata -------------------------------------
const marketplace = existsSync(marketplacePath) ? readJson(marketplacePath) : { plugins: [] };
const marketByName = new Map((marketplace.plugins || []).map((p) => [p.name, p]));

for (const pluginName of listDirs(pluginsDir)) {
  const pluginPath = join(pluginsDir, pluginName);
  const pluginJsonPath = join(pluginPath, 'plugin.json');
  if (!existsSync(pluginJsonPath)) continue;

  const meta = readJson(pluginJsonPath);
  const readme = safeRead(join(pluginPath, 'README.md'));
  const market = marketByName.get(meta.name) || marketByName.get(pluginName);

  items.push({
    type: 'plugin',
    id: `plugin:${meta.name || pluginName}`,
    name: meta.name || pluginName,
    plugin: meta.name || pluginName,
    description: meta.description || market?.description || '',
    marketplaceDescription: market?.description || '',
    version: meta.version || '',
    author: meta.author?.name || '',
    keywords: meta.keywords || [],
    license: meta.license || '',
    repository: meta.repository || '',
    path: rel(pluginPath),
    readme: readme || '',
    excerpt: excerpt(readme) || meta.description || ''
  });

  // --- Skills ----------------------------------------------------------
  const skillsDir = join(pluginPath, 'skills');
  for (const skillName of listDirs(skillsDir)) {
    const skillPath = join(skillsDir, skillName);
    const skillFile = join(skillPath, 'SKILL.md');
    if (!existsSync(skillFile)) continue;
    const { data, content } = matter(safeRead(skillFile) || '');
    const skillReadme = safeRead(join(skillPath, 'README.md'));
    items.push({
      type: 'skill',
      id: `skill:${pluginName}/${skillName}`,
      name: data.name || skillName,
      plugin: meta.name || pluginName,
      description: data.description || '',
      keywords: data.keywords || [],
      path: rel(skillFile),
      readme: skillReadme || content || '',
      excerpt: data.description || excerpt(content)
    });
  }

  // --- Agents (schema wired now; empty until *.agent.md exist) ----------
  for (const agentFile of walk(pluginPath, (name) => name.endsWith('.agent.md'))) {
    const { data, content } = matter(safeRead(agentFile) || '');
    items.push({
      type: 'agent',
      id: `agent:${pluginName}/${basename(agentFile)}`,
      name: data.name || basename(agentFile).replace(/\.agent\.md$/, ''),
      plugin: meta.name || pluginName,
      description: data.description || '',
      keywords: data.keywords || data.tools || [],
      path: rel(agentFile),
      readme: content || '',
      excerpt: data.description || excerpt(content)
    });
  }

  // --- MCP files (schema wired now; empty until mcp configs exist) ------
  for (const mcpFile of walk(pluginPath, (name) => name === 'mcp.json' || name.endsWith('.mcp.json'))) {
    let servers = [];
    try {
      const mcp = readJson(mcpFile);
      servers = Object.keys(mcp.servers || mcp.mcpServers || {});
    } catch {
      servers = [];
    }
    items.push({
      type: 'mcp',
      id: `mcp:${pluginName}/${basename(mcpFile)}`,
      name: basename(mcpFile),
      plugin: meta.name || pluginName,
      description: servers.length ? `MCP servers: ${servers.join(', ')}` : 'MCP server configuration',
      keywords: servers,
      path: rel(mcpFile),
      readme: '',
      excerpt: servers.length ? `Configures MCP servers: ${servers.join(', ')}` : 'MCP server configuration'
    });
  }
}

const counts = items.reduce((acc, it) => {
  acc[it.type] = (acc[it.type] || 0) + 1;
  return acc;
}, {});

const manifest = {
  name: marketplace.name || 'Agentic Marketplace',
  description: marketplace.metadata?.description || 'Marketplace for agentic assets.',
  repository: marketplace.metadata?.repository || '',
  owner: marketplace.owner?.name || '',
  generatedAt: new Date().toISOString(),
  counts,
  items
};

mkdirSync(dataOutDir, { recursive: true });
writeFileSync(join(dataOutDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Generated manifest with ${items.length} items:`, counts);
