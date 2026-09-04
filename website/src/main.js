import '@phosphor-icons/web/thin';
import './styles/fonts.css';
import './style.css';
import manifest from './data/manifest.json';
import { createSearch } from './search.js';
import { renderGrid, renderModal, typeMeta } from './render.js';

const BASE = import.meta.env.BASE_URL;
const items = manifest.items || [];
const search = createSearch(items);

const TYPES = ['plugin', 'skill', 'agent', 'mcp'];
const state = { query: '', type: 'all' };

const ROUTES = {
  '': { nav: 'Marketplace', view: marketplaceView },
  installation: { nav: 'Installation', view: installationView },
  contributing: { nav: 'Contributing', view: contributingView }
};

const app = document.getElementById('app');

function currentRoute() {
  const key = (location.hash.replace(/^#\/?/, '') || '').split('?')[0];
  return ROUTES[key] ? key : '';
}

function nav(activeKey) {
  return Object.entries(ROUTES)
    .map(([key, route]) => {
      const active = key === activeKey ? ' site-nav__link--active' : '';
      const href = key ? `#/${key}` : '#/';
      return `<a class="site-nav__link${active}" href="${href}">${route.nav}</a>`;
    })
    .join('');
}

const ALL_ICON = 'ph-funnel';

function typeIcon(type) {
  return type === 'all' ? ALL_ICON : typeMeta(type).icon;
}

function typeLabel(type) {
  return type === 'all' ? 'All' : `${typeMeta(type).label}s`;
}

function typeDropdown() {
  const c = counts();
  const options = ['all', ...TYPES].filter((t) => t === 'all' || c[t]);
  const menu = options
    .map((t) => {
      const on = state.type === t;
      return `<li class="dropdown__option${on ? ' dropdown__option--active' : ''}" role="option" data-type="${t}" aria-selected="${on}">
        <i class="ph-thin ${typeIcon(t)}"></i>
        <span class="dropdown__option-label">${typeLabel(t)}</span>
        <span class="dropdown__count">${c[t] || 0}</span>
      </li>`;
    })
    .join('');

  return `
    <div class="dropdown" id="type-filter">
      <button class="dropdown__toggle" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Filter by type">
        <i class="ph-thin ${typeIcon(state.type)} dropdown__toggle-icon"></i>
        <span class="dropdown__toggle-label">${typeLabel(state.type)}</span>
        <span class="dropdown__count">${c[state.type] || 0}</span>
        <i class="ph-thin ph-caret-down dropdown__caret"></i>
      </button>
      <ul class="dropdown__menu" role="listbox" aria-label="Filter by type">${menu}</ul>
    </div>`;
}

function counts() {
  return items.reduce(
    (acc, it) => {
      acc[it.type] = (acc[it.type] || 0) + 1;
      return acc;
    },
    { all: items.length }
  );
}

function currentResults() {
  let result = search(state.query);
  if (state.type !== 'all') result = result.filter((it) => it.type === state.type);
  return result;
}

function shell(activeKey, mainContent) {
  const c = counts();

  return `
    <header class="site-header">
      <div class="site-header__inner">
        <a class="brand" href="#/">
          <div class="brand__text">
            <h1 class="brand__title">Agentic Marketplace</h1>
            <span class="brand__tagline">Explore AI-supporting assets</span>
          </div>
        </a>
        <div class="site-header__spacer"></div>
        <nav class="site-nav" aria-label="Primary">${nav(activeKey)}</nav>
        <div class="site-meta">
          <div class="site-meta__stat">
            <span class="site-meta__value">${c.plugin || 0}</span>
            <span class="site-meta__label">Plugins</span>
          </div>
          <div class="site-meta__stat">
            <span class="site-meta__value">${c.skill || 0}</span>
            <span class="site-meta__label">Skills</span>
          </div>
          <div class="site-meta__stat">
            <span class="site-meta__value">${(c.agent || 0) + (c.mcp || 0)}</span>
            <span class="site-meta__label">Agents &amp; MCP</span>
          </div>
        </div>
      </div>
    </header>

    <main class="page">${mainContent}</main>

    <footer class="site-footer">
      <div class="site-footer__inner">
        <span>${manifest.owner} · ${manifest.name}</span>
        <span>${items.length} assets · generated ${new Date(manifest.generatedAt).toLocaleDateString()}</span>
      </div>
    </footer>

    <div class="modal" id="modal">
      <div class="modal__content" id="modal-content"></div>
    </div>`;
}

function marketplaceView() {
  return `
      <div class="controls">
        <div class="search">
          <i class="ph-thin ph-magnifying-glass search__icon"></i>
          <input
            class="search__input"
            id="search"
            type="search"
            placeholder="Search plugins, skills, agents, MCP files…"
            autocomplete="off"
            value="${state.query.replace(/"/g, '&quot;')}"
          />
        </div>
        ${typeDropdown()}
      </div>
      <p class="results-info" id="results-info"></p>
      <div class="grid" id="grid"></div>`;
}

function installationView() {
  return `
      <section class="info" aria-labelledby="installation-title">
        <div class="info__head">
          <span class="eyebrow">Getting started</span>
          <h2 class="info__title" id="installation-title">Using the Marketplace</h2>
          <p class="info__lead">
            Assets are packaged as VS Code agent plugins and installed straight from Copilot Chat.
          </p>
        </div>
        <ol class="steps">
          <li class="step">
            <span class="step__num">1</span>
            <div class="step__body">
              <h3 class="step__title">Register the marketplace</h3>
              <p>Add this repository to your VS Code <code>settings.json</code>:</p>
              <pre class="code"><code>"chat.plugins.marketplaces": [
          "aatmmr/agent-marketplace-template"
]</code></pre>
            </div>
          </li>
          <li class="step">
            <span class="step__num">2</span>
            <div class="step__body">
              <h3 class="step__title">Open the Extensions view</h3>
              <p>Press <kbd>⇧⌘X</kbd> and search for <code>@agentPlugins</code>.</p>
            </div>
          </li>
          <li class="step">
            <span class="step__num">3</span>
            <div class="step__body">
              <h3 class="step__title">Install a plugin</h3>
              <p>Pick a plugin from the list and select <strong>Install</strong>. Its skills, agents,
              and other customizations then appear automatically in Copilot Chat.</p>
            </div>
          </li>
        </ol>
        <p class="info__tip">
          <i class="ph-thin ph-lightbulb"></i>
          To try a plugin without adding the marketplace, run
          <strong>Chat: Install Plugin From Source</strong> from the Command Palette and paste this
          repository's URL. Access to this private repository may be required.
        </p>
      </section>`;
}

function contributingView() {
  return `
      <section class="info" aria-labelledby="contributing-title">
        <div class="info__head">
          <span class="eyebrow">Contributing</span>
          <h2 class="info__title" id="contributing-title">Add a new plugin</h2>
          <p class="info__lead">Follow these steps to publish your own plugin to the marketplace.</p>
        </div>
        <ol class="steps">
          <li class="step">
            <span class="step__num">1</span>
            <div class="step__body">
              <h3 class="step__title">Create a plugin folder</h3>
              <p>Add a new directory under <code>plugins/&lt;your-plugin&gt;/</code>.</p>
            </div>
          </li>
          <li class="step">
            <span class="step__num">2</span>
            <div class="step__body">
              <h3 class="step__title">Add a manifest</h3>
              <p>Create a <code>plugin.json</code> with <code>name</code>, <code>description</code>,
              and <code>version</code>.</p>
            </div>
          </li>
          <li class="step">
            <span class="step__num">3</span>
            <div class="step__body">
              <h3 class="step__title">Add skills</h3>
              <p>Add one or more skills under <code>skills/&lt;skill-name&gt;/SKILL.md</code>.</p>
            </div>
          </li>
          <li class="step">
            <span class="step__num">4</span>
            <div class="step__body">
              <h3 class="step__title">Register the plugin</h3>
              <p>Add the plugin to <code>.github/plugin/marketplace.json</code>.</p>
            </div>
          </li>
          <li class="step">
            <span class="step__num">5</span>
            <div class="step__body">
              <h3 class="step__title">Bump the version</h3>
              <p>Increase the <code>version</code> whenever you publish changes.</p>
            </div>
          </li>
        </ol>
      </section>`;
}

function renderResults() {
  const results = currentResults();
  const grid = document.getElementById('grid');
  const info = document.getElementById('results-info');
  if (!grid || !info) return;
  grid.innerHTML = renderGrid(results);
  info.textContent = `${results.length} ${results.length === 1 ? 'result' : 'results'}`;
}

function refreshDropdown() {
  const dd = document.getElementById('type-filter');
  if (!dd) return;
  const c = counts();
  dd.querySelector('.dropdown__toggle-icon').className = `ph-thin ${typeIcon(state.type)} dropdown__toggle-icon`;
  dd.querySelector('.dropdown__toggle-label').textContent = typeLabel(state.type);
  dd.querySelector('.dropdown__toggle .dropdown__count').textContent = c[state.type] || 0;
  dd.querySelectorAll('.dropdown__option').forEach((o) => {
    const on = o.dataset.type === state.type;
    o.classList.toggle('dropdown__option--active', on);
    o.setAttribute('aria-selected', String(on));
  });
}

function openModal(id) {
  const item = items.find((it) => it.id === id);
  if (!item) return;
  const modal = document.getElementById('modal');
  document.getElementById('modal-content').innerHTML = renderModal(item, manifest.repository);
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  modal.querySelector('[data-close]')?.focus();
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('is-open');
  document.getElementById('modal-content').innerHTML = '';
  document.body.style.overflow = '';
}

function bindMarketplaceEvents() {
  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderResults();
  });

  const dropdown = document.getElementById('type-filter');
  const toggle = dropdown.querySelector('.dropdown__toggle');

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('dropdown--open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  dropdown.querySelector('.dropdown__menu').addEventListener('click', (e) => {
    const option = e.target.closest('.dropdown__option');
    if (!option) return;
    state.type = option.dataset.type;
    dropdown.classList.remove('dropdown--open');
    toggle.setAttribute('aria-expanded', 'false');
    refreshDropdown();
    renderResults();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('dropdown--open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('grid').addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) openModal(card.dataset.id);
  });
}

function bindModalEvents() {
  const modal = document.getElementById('modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function render() {
  const key = currentRoute();
  app.innerHTML = shell(key, ROUTES[key].view());
  bindModalEvents();
  if (key === '') {
    bindMarketplaceEvents();
    renderResults();
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();
