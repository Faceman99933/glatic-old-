import { ARCHIVE_DATA } from './archive-data.js';
import { state, hydrate, persist, logAudit } from './app-state.js';
import { bindAuth, forceVisitor } from './auth.js';
import { renderSidebar, renderDossier, renderQuickCards } from './archive-ui.js';
import { renderAdminPanel, renderStatus, setSiteStatus } from './admin-controls.js';

const TABS = [
  ['home','HOME'],['archive','DATABASE'],['status','SYSTEM_STATUS'],['admin','ADMIN_CONSOLE']
];

function renderTabs() {
  const root = document.getElementById('tabs');
  root.innerHTML = TABS.map(([id,label], idx)=>`<button data-tab="${id}" class="${idx===0?'active':''}">${label}</button>`).join('');
  root.querySelectorAll('button').forEach((btn)=>btn.addEventListener('click',()=>activateTab(btn.dataset.tab)));
}

function activateTab(name) {
  document.querySelectorAll('#tabs button').forEach((b)=>b.classList.toggle('active', b.dataset.tab===name));
  ['home','archive','status','admin'].forEach((v)=>document.getElementById(`view-${v}`).classList.toggle('hidden', v!==name));
}

function syncRole() {
  const badge = document.getElementById('role-badge');
  badge.className = `badge ${state.role === 'admin' ? 'admin' : 'visitor'}`;
  badge.textContent = state.role === 'admin' ? 'ADMIN_ACCESS' : 'VISITOR_ACCESS';
  renderSidebar(ARCHIVE_DATA);
  renderDossier(ARCHIVE_DATA);
  renderAdminPanel();
  renderStatus();
  persist();
}

function bindSearch() {
  const el = document.getElementById('global-search');
  el.addEventListener('input', () => {
    state.searchQuery = el.value.trim();
    renderSidebar(ARCHIVE_DATA);
    renderDossier(ARCHIVE_DATA);
  });
}

function bindFooterClock() {
  const tick = () => document.getElementById('clock').textContent = `Server Time: ${new Date().toLocaleString()}`;
  tick();
  setInterval(tick, 1000);
}

function boot() {
  const fill = document.getElementById('boot-fill');
  const text = document.getElementById('boot-status');
  let p=0;
  const t = setInterval(()=>{
    p += Math.random()*11;
    if (p>100) p=100;
    fill.style.width = `${p}%`;
    text.textContent = p<30?'Loading interface modules…':p<65?'Indexing archive nodes…':'Finalizing subsystem handshake…';
    if (p===100){clearInterval(t);setTimeout(()=>document.getElementById('boot-overlay').classList.add('hide'),300);}
  },80);
}

function init() {
  hydrate();
  renderTabs();
  bindSearch();
  bindFooterClock();
  renderQuickCards(ARCHIVE_DATA);

  bindAuth(syncRole);
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape' && state.role==='admin') { forceVisitor(syncRole); }
  });
  window.addEventListener('helix-role-changed', () => syncRole());

  setSiteStatus(state.siteStatus, false);
  logAudit('SYSTEM: Interface initialized');
  renderSidebar(ARCHIVE_DATA);
  renderDossier(ARCHIVE_DATA);
  renderStatus();
  renderAdminPanel();
  syncRole();
  boot();
}

init();
