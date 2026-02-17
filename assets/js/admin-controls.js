import { state, logAudit, persist } from './app-state.js';

export function renderStatus() {
  const metrics = document.getElementById('metrics');
  metrics.innerHTML = Object.entries(state.metrics).map(([k,v]) => {
    const color = v > 90 ? '#35d37f' : v > 65 ? '#f6b739' : '#f3505e';
    return `<div class="metric"><div>${k.toUpperCase()} <strong>${v}%</strong></div><div class="bar"><span style="width:${v}%;background:${color}"></span></div></div>`;
  }).join('');

  const sectorRoot = document.getElementById('sector-matrix');
  sectorRoot.innerHTML = Object.entries(state.sectors).map(([s,val]) => `<div>${s}: <strong>${val.toUpperCase()}</strong></div>`).join('');

  document.getElementById('audit').innerHTML = state.audit.map((l) => `<div>${l}</div>`).join('');
}

export function renderAdminPanel() {
  const lock = document.getElementById('admin-lock');
  const panel = document.getElementById('admin-console');
  if (state.role !== 'admin') {
    lock.classList.remove('hidden');
    panel.classList.add('hidden');
    return;
  }
  lock.classList.add('hidden');
  panel.classList.remove('hidden');

  panel.innerHTML = `
    <div class="ctrl-grid">
      <div class="panel control">
        <h3>Global Site State</h3>
        <button data-site="STABLE">STABLE</button>
        <button data-site="WARNING">WARNING</button>
        <button data-site="CRITICAL">CRITICAL</button>
      </div>
      <div class="panel control">
        <h3>Core Percentages</h3>
        ${Object.entries(state.metrics).map(([k,v]) => `
          <label>${k.toUpperCase()}</label>
          <div class="range-wrap"><input type="range" min="0" max="100" step="1" value="${v}" data-metric="${k}"><span>${v}%</span></div>
        `).join('')}
      </div>
      <div class="panel control">
        <h3>Sector State Matrix</h3>
        <div class="sectors">
          ${Object.entries(state.sectors).map(([k,v]) => `<button class="sector-btn ${v}" data-sector="${k}">${k}: ${v}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="panel control">
      <h3>Session & Persistence</h3>
      <button id="save-state">SAVE CONFIG</button>
      <button id="reset-state">RESET BASELINE</button>
      <button id="logout-admin">RETURN TO VISITOR</button>
    </div>`;

  panel.querySelectorAll('[data-site]').forEach((b)=>b.addEventListener('click',()=>setSiteStatus(b.dataset.site)));
  panel.querySelectorAll('[data-metric]').forEach((r)=>r.addEventListener('input',()=>{
    state.metrics[r.dataset.metric]=Number(r.value);
    r.nextElementSibling.textContent = `${r.value}%`;
    logAudit(`ADMIN: ${r.dataset.metric} set to ${r.value}%`);
    renderStatus();
  }));
  panel.querySelectorAll('[data-sector]').forEach((b)=>b.addEventListener('click',()=>{
    const cycle = {stable:'warning', warning:'critical', critical:'stable'};
    const now = state.sectors[b.dataset.sector];
    state.sectors[b.dataset.sector]=cycle[now];
    logAudit(`ADMIN: Sector ${b.dataset.sector} -> ${state.sectors[b.dataset.sector]}`);
    renderAdminPanel();
    renderStatus();
  }));
  panel.querySelector('#save-state').addEventListener('click',()=>{persist();logAudit('ADMIN: State persisted');renderStatus();});
  panel.querySelector('#logout-admin').addEventListener('click',()=>{ state.role='visitor'; logAudit('AUTH: Admin logged out to visitor mode'); persist(); renderAdminPanel(); renderStatus(); const badge=document.getElementById('role-badge'); if(badge){badge.className='badge visitor'; badge.textContent='VISITOR_ACCESS';} window.dispatchEvent(new CustomEvent('helix-role-changed')); });
  panel.querySelector('#reset-state').addEventListener('click',()=>{
    state.metrics={integrity:99,containment:96,logistics:93,mednet:94};
    Object.keys(state.sectors).forEach((k)=>state.sectors[k]='stable');
    setSiteStatus('STABLE', false);
    logAudit('ADMIN: Baseline restored');
    renderAdminPanel();
    renderStatus();
  });
}

export function setSiteStatus(status, writeAudit=true) {
  state.siteStatus = status;
  const badge = document.getElementById('site-badge');
  badge.className = `badge ${status.toLowerCase()}`;
  badge.textContent = `SITE_${status}`;
  if (writeAudit) logAudit(`SYSTEM: Site status changed to ${status}`);
}
