import { marked } from 'marked';
import DOMPurify from 'dompurify';

const TYPE_META = {
  plugin: { label: 'Plugin', icon: 'ph-package' },
  skill: { label: 'Skill', icon: 'ph-lightning' },
  agent: { label: 'Agent', icon: 'ph-robot' },
  mcp: { label: 'MCP', icon: 'ph-plugs' }
};

export function typeMeta(type) {
  return TYPE_META[type] || { label: type, icon: 'ph-file' };
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCard(item) {
  const meta = typeMeta(item.type);
  const keywords = (item.keywords || []).slice(0, 4);
  const tags = keywords
    .map((k) => `<span class="tag">${escapeHtml(k)}</span>`)
    .join('');
  const version = item.version ? `<span class="card__version">v${escapeHtml(item.version)}</span>` : '';
  const parent =
    item.type !== 'plugin' && item.plugin
      ? `<div class="card__plugin"><i class="ph-thin ph-package"></i> ${escapeHtml(item.plugin)}</div>`
      : '';

  return `
    <button class="card" type="button" data-id="${escapeHtml(item.id)}">
      <div class="card__head">
        <div>
          <h3 class="card__title">${escapeHtml(item.name)}</h3>
          ${parent}
        </div>
        <span class="badge badge--${item.type}"><i class="ph-thin ${meta.icon}"></i>${meta.label}</span>
      </div>
      <p class="card__desc">${escapeHtml(item.excerpt || item.description || '')}</p>
      <div class="card__foot">
        ${tags}
        ${version}
      </div>
    </button>`;
}

export function renderGrid(items) {
  if (!items.length) {
    return `<div class="empty"><i class="ph-thin ph-magnifying-glass"></i><p>No results match your search.</p></div>`;
  }
  return items.map(renderCard).join('');
}

function metaRow(label, value) {
  if (!value) return '';
  return `<div><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`;
}

export function renderModal(item, repository) {
  const meta = typeMeta(item.type);
  const readmeHtml = item.readme
    ? DOMPurify.sanitize(marked.parse(item.readme))
    : `<p class="card__desc">${escapeHtml(item.description || 'No additional documentation available.')}</p>`;

  const repoLink =
    item.repository || repository
      ? `<a href="${escapeHtml(item.repository || repository)}" target="_blank" rel="noopener">Repository ↗</a>`
      : '';

  const keywords = (item.keywords || []).length
    ? (item.keywords || []).map((k) => escapeHtml(k)).join(', ')
    : '';

  return `
    <div class="modal__panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(item.name)}">
      <div class="modal__header">
        <div>
          <h2 class="modal__title">${escapeHtml(item.name)}</h2>
          <div class="modal__sub">
            <span class="badge badge--${item.type}"><i class="ph-thin ${meta.icon}"></i>${meta.label}</span>
            ${item.plugin ? `<span>in ${escapeHtml(item.plugin)}</span>` : ''}
            ${repoLink}
          </div>
        </div>
        <button class="modal__close" type="button" data-close aria-label="Close">×</button>
      </div>
      <div class="modal__body">
        <dl class="modal__meta">
          ${metaRow('Version', item.version ? `v${escapeHtml(item.version)}` : '')}
          ${metaRow('Author', escapeHtml(item.author || ''))}
          ${metaRow('License', escapeHtml(item.license || ''))}
          ${metaRow('Keywords', keywords)}
          ${metaRow('Path', `<code>${escapeHtml(item.path || '')}</code>`)}
        </dl>
        <div class="readme">${readmeHtml}</div>
      </div>
    </div>`;
}
