import { state } from './app-state.js';
import { searchNodes, highlight } from './search-engine.js';

const clsPill = (c) => c === 'PUBLIC' ? 'p-public' : c === 'RESTRICTED' ? 'p-restricted' : 'p-eyes';

export function renderSidebar(nodes) {
  const list = document.getElementById('archive-list');
  const results = searchNodes(nodes, state.searchQuery, state.role);
  list.innerHTML = '';
  results.forEach((n) => {
    const btn = document.createElement('button');
    btn.className = `node ${n.id === state.selectedId ? 'active' : ''}`;
    btn.innerHTML = `<strong>${String(n.id).padStart(2, '0')}</strong> ${highlight(n.title, state.searchQuery)}<br><small>${n.tags.join(' • ')}</small>`;
    btn.addEventListener('click', () => {
      state.selectedId = n.id;
      renderSidebar(nodes);
      renderDossier(nodes);
      document.querySelector('[data-tab="archive"]').click();
    });
    list.appendChild(btn);
  });
  document.getElementById('result-count').textContent = `${results.length} results`;
}

export function renderDossier(nodes) {
  const node = nodes.find((x) => x.id === state.selectedId) || nodes[0];
  const html = (state.role === 'admin' ? node.adminContent : node.visitorContent)
    .split(/\n\n+/)
    .map((p) => `<p>${highlight(p, state.searchQuery)}</p>`)
    .join('');
  document.getElementById('dossier').innerHTML = `
    <h2>${node.title}</h2>
    <div class="meta">
      <span class="pill ${clsPill(node.classification)}">${node.classification}</span>
      <span class="pill p-public">FRAG-${String(node.id).padStart(4, '0')}</span>
      <span class="pill ${state.role === 'admin' ? 'p-public':'p-restricted'}">${state.role === 'admin' ? 'UNREDACTED_ADMIN_VIEW' : 'REDACTED_VISITOR_VIEW'}</span>
    </div>
    <div class="body">${html}</div>
  `;
}

export function renderQuickCards(nodes) {
  const picks = [1,12,27,40,51].map((id) => nodes.find((x) => x.id === id));
  const root = document.getElementById('quick-cards');
  root.innerHTML = '';
  picks.forEach((n) => {
    const div = document.createElement('button');
    div.className = 'panel quick';
    div.innerHTML = `<h3>${n.title}</h3><p>${n.tags.join(', ')}</p>`;
    div.addEventListener('click', () => {
      state.selectedId = n.id;
      document.querySelector('[data-tab="archive"]').click();
    });
    root.appendChild(div);
  });
}
