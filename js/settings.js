// ============================================================
// settings.js — App Settings Page
// ============================================================
import { initApp } from './app.js';
import { toast }   from './notification.js';
import { toggleTheme } from './app.js';

async function main() {
  const user = await initApp();
  if (!user) return;

  // Theme
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = localStorage.getItem('theme') || 'light';
    themeSelect.addEventListener('change', () => {
      document.documentElement.setAttribute('data-theme', themeSelect.value);
      localStorage.setItem('theme', themeSelect.value);
      toast.success(`Theme changed to ${themeSelect.value}`);
    });
  }

  // Language placeholder
  document.getElementById('lang-select')?.addEventListener('change', e => {
    toast.info('Language support coming soon');
  });

  // Notifications
  document.getElementById('notif-uploads')?.addEventListener('change', e => {
    localStorage.setItem('notif_uploads', e.target.checked);
  });
  document.getElementById('notif-shares')?.addEventListener('change', e => {
    localStorage.setItem('notif_shares', e.target.checked);
  });

  // Load saved prefs
  const notifUploads = localStorage.getItem('notif_uploads') !== 'false';
  const notifShares  = localStorage.getItem('notif_shares')  !== 'false';
  const up = document.getElementById('notif-uploads');
  const sh = document.getElementById('notif-shares');
  if (up) up.checked = notifUploads;
  if (sh) sh.checked = notifShares;

  // Keyboard shortcuts list
  const shortcuts = [
    { key: '/', desc: 'Focus search' },
    { key: 'Ctrl + K', desc: 'Focus search' },
    { key: 'Ctrl + U', desc: 'Upload file' },
    { key: 'Esc', desc: 'Close modal / menu' },
  ];
  const kbContainer = document.getElementById('keyboard-shortcuts');
  if (kbContainer) {
    kbContainer.innerHTML = shortcuts.map(s => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:14px;color:var(--text-secondary)">${s.desc}</span>
        <kbd style="background:var(--bg-hover);border:1px solid var(--border);border-radius:4px;padding:2px 8px;font-size:12px;font-family:monospace">${s.key}</kbd>
      </div>`).join('');
  }
}

main();
