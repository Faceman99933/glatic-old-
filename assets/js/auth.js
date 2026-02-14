import { state, logAudit, persist } from './app-state.js';

const ADMIN_PASSWORD = '676767';

export function bindAuth(onChange) {
  const modal = document.getElementById('login-modal');
  const pass = document.getElementById('admin-pass');
  const msg = document.getElementById('auth-msg');
  document.getElementById('login-open').addEventListener('click', () => {
    msg.textContent = '';
    pass.value = '';
    modal.showModal();
    pass.focus();
  });

  document.getElementById('admin-submit').addEventListener('click', (e) => {
    e.preventDefault();
    if (pass.value === ADMIN_PASSWORD) {
      state.role = 'admin';
      logAudit('AUTH: Admin elevated access granted');
      modal.close();
      persist();
      onChange();
      return;
    }
    msg.textContent = 'Invalid password';
  });
}

export function forceVisitor(onChange) {
  state.role = 'visitor';
  logAudit('AUTH: Session returned to visitor');
  persist();
  onChange();
}
