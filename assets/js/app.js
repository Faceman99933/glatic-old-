import { ARCHIVE_NODES } from './data.js';

const ADMIN_PASS = '676767';
const STORAGE_KEY = 'helix_omicron_state_v3';

const state = {
  role: 'visitor',
  tab: 'overview',
  query: '',
  activeId: 1,
  siteState: 'STABLE',
  metrics: { shell: 99, obsidian: 100, prismarine: 94, energy: 92 },
  sectors: { Y: 'HEALTHY', X: 'READY', Z: 'WATCH', HCZ: 'SECURED', S: 'STABLE', H: 'FLOWING' },
  audit: [],
};

const $ = (id) => document.getElementById(id);
const now = () => new Date().toLocaleTimeString();

function hydrate() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.metrics) state.metrics = { ...state.metrics, ...saved.metrics };
    if (saved.sectors) state.sectors = { ...state.sectors, ...saved.sectors };
    if (saved.siteState) state.siteState = saved.siteState;
    if (Array.isArray(saved.audit)) state.audit = saved.audit.slice(0, 300);
  } catch { /* no-op */ }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    metrics: state.metrics,
    sectors: state.sectors,
    siteState: state.siteState,
    audit: state.audit.slice(0, 300),
  }));
}

function logAudit(message) {
  state.audit.unshift(`[${now()}] ${message}`);
  state.audit = state.audit.slice(0, 300);
  renderAudit();
  persist();
}

function updateTelemetry(visibleCount = ARCHIVE_NODES.length) {
  $('telemetry-db').textContent = `${ARCHIVE_NODES.length} NODES`;
  $('telemetry-visible').textContent = `${visibleCount} NODES`;
  $('telemetry-role').textContent = state.role.toUpperCase();
  $('telemetry-state').textContent = state.siteState;
  $('telemetry-active').textContent = String(state.activeId || 0).padStart(4, '0');
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
  $(`panel-${tab}`).classList.add('active');
  $('sidebar').style.display = tab === 'overview' ? 'none' : 'flex';
}

function boot() {
  const progress = $('boot-progress');
  const status = $('boot-status');
  const phases = [
    'Initializing secure archive shell...',
    'Mapping index topology...',
    'Attaching role security matrix...',
    'Binding admin control plane...',
    'Finalizing Site-Omicron handshake...'
  ];
  let pct = 0;
  const run = () => {
    pct = Math.min(100, pct + Math.random() * 8.5);
    progress.style.width = `${pct}%`;
    status.textContent = phases[Math.min(phases.length - 1, Math.floor((pct / 100) * phases.length))];
    if (pct < 100) setTimeout(run, 80);
    else setTimeout(() => $('boot-screen').classList.add('hidden'), 350);
  };
  run();
}

function highlight(text, query) {
  if (!query) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${safe})`, 'ig'), '<mark>$1</mark>');
}

function score(node, query) {
  if (!query) return 1;
  const visibleText = state.role === 'admin' ? node.adminContent : node.visitorContent;
  const payload = `${node.id} ${node.title} ${node.classification} ${node.tags.join(' ')} ${visibleText}`.toLowerCase();
  if (!payload.includes(query)) return 0;
  let s = 1;
  if (node.title.toLowerCase().includes(query)) s += 6;
  if (node.tags.join(' ').toLowerCase().includes(query)) s += 3;
  if (`${node.id}` === query) s += 7;
  return s;
}

function getFilteredNodes() {
  const q = state.query.trim().toLowerCase();
  return ARCHIVE_NODES
    .map((node) => ({ node, score: score(node, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.node.id - b.node.id)
    .map((entry) => entry.node);
}

function renderList() {
  const list = $('record-list');
  const nodes = getFilteredNodes();
  list.innerHTML = '';
  $('result-count').textContent = `${nodes.length}`;
  updateTelemetry(nodes.length);

  nodes.forEach((node) => {
    const li = document.createElement('li');
    li.className = `record-item ${state.activeId === node.id ? 'active' : ''}`;
    li.innerHTML = `<div class="title">${String(node.id).padStart(2, '0')} — ${highlight(node.title, state.query)}</div>
      <div class="meta">${node.classification} / ${node.tags.join(', ')}</div>`;
    li.addEventListener('click', () => openNode(node.id));
    list.appendChild(li);
  });
}

function openNode(id) {
  const node = ARCHIVE_NODES.find((entry) => entry.id === id);
  if (!node) return;
  state.activeId = id;
  const full = state.role === 'admin';
  const body = full ? node.adminContent : node.visitorContent;
  $('dossier-view').innerHTML = `
    <h2>${node.title}</h2>
    <div>
      <span class="pill">NODE ${String(node.id).padStart(4, '0')}</span>
      <span class="pill">${node.classification}</span>
      <span class="pill ${full ? 'full' : 'redacted'}">${full ? 'UNREDACTED' : 'REDACTED_VIEW'}</span>
    </div>
    <p class="muted">Tags: ${node.tags.join(', ')}</p>
    ${body.split('\n\n').map((p) => `<p>${highlight(p, state.query)}</p>`).join('')}`;

  renderList();
  updateTelemetry(getFilteredNodes().length);
}

function setRole(role) {
  state.role = role;
  $('identity-badge').className = `identity ${role}`;
  $('identity-badge').textContent = role === 'admin' ? 'ADMIN_ACCESS' : 'VISITOR_ACCESS';
  $('elevate-access').textContent = role === 'admin' ? 'De-escalate' : 'Admin Login';
  $('admin-locked').classList.toggle('hidden', role === 'admin');
  $('admin-console').classList.toggle('hidden', role !== 'admin');
  openNode(state.activeId);
  logAudit(`ROLE_SWITCH ${role.toUpperCase()}`);
}

function renderMetrics() {
  $('metric-bars').innerHTML = Object.entries(state.metrics).map(([key, value]) => {
    const color = value >= 90 ? 'var(--good)' : value >= 70 ? 'var(--warn)' : 'var(--danger)';
    return `<div class="metric"><div class="metric-row"><span>${key.toUpperCase()}</span><span>${value}%</span></div><div class="meter"><span style="width:${value}%;background:${color}"></span></div></div>`;
  }).join('');
}

function renderSectors() {
  $('sector-cards').innerHTML = Object.entries(state.sectors)
    .map(([name, status]) => `<div class="sector-card"><span>${name}</span><strong>${status}</strong></div>`)
    .join('');
}

function renderState() {
  $('site-state').textContent = state.siteState;
  $('state-description').textContent = {
    STABLE: 'All systems nominal.',
    WARNING: 'Partial instability detected; elevated monitoring active.',
    CRITICAL: 'Breach-level event response in progress.',
    LOCKDOWN: 'Maximum isolation protocols in effect.',
  }[state.siteState] || 'Custom state active.';
  updateTelemetry(getFilteredNodes().length);
}

function renderAudit() {
  const html = state.audit.map((line) => `<div>${line}</div>`).join('');
  $('audit-log').innerHTML = html;
  $('console-output').innerHTML = html;
}

function rebuildAdminControls() {
  $('metric-controls').innerHTML = Object.entries(state.metrics).map(([key, value]) => `
    <label class="range-group">${key.toUpperCase()} <strong id="m-${key}">${value}%</strong>
      <input data-metric="${key}" type="range" min="0" max="100" value="${value}" />
    </label>`).join('');

  document.querySelectorAll('#metric-controls input[type="range"]').forEach((range) => {
    range.addEventListener('input', () => {
      if (state.role !== 'admin') return;
      const key = range.dataset.metric;
      state.metrics[key] = Number(range.value);
      $(`m-${key}`).textContent = `${range.value}%`;
      renderMetrics();
      logAudit(`METRIC_SET ${key.toUpperCase()}=${range.value}%`);
      persist();
    });
  });

  const options = ['HEALTHY', 'WATCH', 'DEGRADED', 'ALERT', 'OFFLINE', 'SECURED', 'READY', 'FLOWING'];
  $('sector-controls').innerHTML = Object.entries(state.sectors).map(([name, active]) => `
    <label class="range-group">SECTOR ${name}
      <select data-sector="${name}">${options.map((o) => `<option ${o === active ? 'selected' : ''}>${o}</option>`).join('')}</select>
    </label>`).join('');

  document.querySelectorAll('#sector-controls select').forEach((select) => {
    select.addEventListener('change', () => {
      if (state.role !== 'admin') return;
      state.sectors[select.dataset.sector] = select.value;
      renderSectors();
      logAudit(`SECTOR_${select.dataset.sector}=>${select.value}`);
      persist();
    });
  });
}

function bindEvents() {
  document.querySelectorAll('.tab').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  $('global-search').addEventListener('input', () => {
    state.query = $('global-search').value;
    renderList();
    openNode(state.activeId);
  });

  $('search-clear').addEventListener('click', () => {
    $('global-search').value = '';
    state.query = '';
    renderList();
    openNode(state.activeId);
  });

  const closeModal = () => {
    $('lock-overlay').classList.add('hidden');
    $('elevation-pass').value = '';
    $('elevation-msg').textContent = '';
  };

  $('elevate-access').addEventListener('click', () => {
    if (state.role === 'admin') return setRole('visitor');
    $('lock-overlay').classList.remove('hidden');
  });

  $('admin-login-cta').addEventListener('click', () => $('lock-overlay').classList.remove('hidden'));
  $('elevation-cancel').addEventListener('click', closeModal);
  $('elevation-submit').addEventListener('click', () => {
    if ($('elevation-pass').value === ADMIN_PASS) {
      setRole('admin');
      closeModal();
    } else {
      $('elevation-msg').textContent = 'Invalid passcode.';
    }
  });

  $('elevation-pass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('elevation-submit').click();
    if (e.key === 'Escape') closeModal();
  });

  document.querySelectorAll('.status-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.role !== 'admin') return;
      state.siteState = btn.dataset.state;
      renderState();
      logAudit(`GLOBAL_STATE ${state.siteState}`);
      persist();
    });
  });

  $('console-input').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const cmd = e.target.value.trim().toLowerCase();
    e.target.value = '';
    if (!cmd) return;
    if (cmd === 'help') logAudit('CMD help => help, clear, state <stable|warning|critical|lockdown>, reset');
    else if (cmd === 'clear') { state.audit = []; renderAudit(); persist(); }
    else if (cmd.startsWith('state ')) {
      const target = cmd.split(' ')[1].toUpperCase();
      if (['STABLE', 'WARNING', 'CRITICAL', 'LOCKDOWN'].includes(target)) {
        state.siteState = target;
        renderState();
        logAudit(`CMD state ${target}`);
        persist();
      } else logAudit('CMD ERROR invalid state');
    } else if (cmd === 'reset') {
      state.metrics = { shell: 99, obsidian: 100, prismarine: 94, energy: 92 };
      state.sectors = { Y: 'HEALTHY', X: 'READY', Z: 'WATCH', HCZ: 'SECURED', S: 'STABLE', H: 'FLOWING' };
      state.siteState = 'STABLE';
      rebuildAdminControls();
      renderMetrics();
      renderSectors();
      renderState();
      logAudit('CMD reset applied');
      persist();
    } else logAudit(`CMD ERROR unknown: ${cmd}`);
  });

  document.querySelectorAll('[data-jump-node]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openNode(Number(btn.dataset.jumpNode));
      switchTab('database');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/') {
      e.preventDefault();
      $('global-search').focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $('global-search').focus();
      $('global-search').select();
    }
    if (e.key === 'Escape') closeModal();
  });
}

function tickClock() {
  $('clock').textContent = `Server Time: ${new Date().toLocaleTimeString()}`;
}

function init() {
  hydrate();
  boot();
  bindEvents();
  rebuildAdminControls();
  renderMetrics();
  renderSectors();
  renderState();
  renderAudit();
  renderList();
  openNode(1);
  switchTab('overview');
  tickClock();
  setInterval(tickClock, 1000);
  logAudit('SYSTEM INIT COMPLETE');
}

init();
