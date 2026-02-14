export const state = {
  role: 'visitor',
  siteStatus: 'STABLE',
  selectedId: 1,
  searchQuery: '',
  metrics: {
    integrity: 99,
    containment: 96,
    logistics: 93,
    mednet: 94,
  },
  sectors: {
    Y: 'stable', X: 'stable', Z: 'warning', HCZ: 'stable', G: 'stable', H: 'stable', S: 'warning', Vault: 'stable'
  },
  audit: []
};

export const persist = () => {
  localStorage.setItem('helix_state_v2', JSON.stringify({
    role: state.role === 'admin' ? 'admin' : 'visitor',
    siteStatus: state.siteStatus,
    metrics: state.metrics,
    sectors: state.sectors,
    audit: state.audit.slice(-200)
  }));
};

export const hydrate = () => {
  const raw = localStorage.getItem('helix_state_v2');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch {
    localStorage.removeItem('helix_state_v2');
  }
};

export const logAudit = (msg) => {
  state.audit.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  state.audit = state.audit.slice(0, 300);
};
