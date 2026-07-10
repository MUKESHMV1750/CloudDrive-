// ============================================================
// app.js — Application Bootstrap & Global Behavior
// ============================================================
import { sb }            from './supabase.js';
import { requireAuth, logout } from './auth.js';
import { toast }         from './notification.js';
import { formatSize, getInitials, avatarHtml, debounce } from './utils.js';

let currentUser = null;

// ---- INIT ----
export async function initApp(opts = {}) {
  const { adminOnly = false } = opts;

  initTheme();
  setupKeyboardShortcuts();

  currentUser = await requireAuth(adminOnly);
  if (!currentUser) return null;

  initSidebar(currentUser);
  initTopbar(currentUser);
  markActiveNav();
  initStorageMeter(currentUser);

  return currentUser;
}

// ---- Theme ----
export function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

export function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcons(next);
}

function updateThemeIcons(theme) {
  document.querySelectorAll('[data-theme-icon]').forEach(el => {
    el.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  });
}

// ---- Sidebar ----
function initSidebar(user) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Role-based nav items
  if (user.role === 'admin') {
    const adminNav = sidebar.querySelector('.admin-nav');
    if (adminNav) adminNav.classList.remove('hidden');
  }
}

// ---- Mark active nav ----
function markActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    if (item.dataset.page === path) item.classList.add('active');
  });
}

// ---- Topbar / User menu ----
function initTopbar(user) {
  // User avatar
  const avatarBtn  = document.getElementById('user-avatar-btn');
  const avatarMenu = document.getElementById('user-menu');
  const nameEl     = document.getElementById('user-display-name');
  const emailEl    = document.getElementById('user-display-email');
  const avatarEl   = document.getElementById('topbar-avatar');

  if (nameEl)  nameEl.textContent  = user.name  || 'User';
  if (emailEl) emailEl.textContent = user.email || '';
  if (avatarEl) {
    const init = getInitials(user.name || user.email || '?');
    if (user.photo) {
      avatarEl.innerHTML = `<img src="${user.photo}" class="avatar" alt="${init}">`;
    } else {
      avatarEl.textContent = init;
    }
  }

  // Toggle user menu dropdown
  if (avatarBtn && avatarMenu) {
    avatarBtn.addEventListener('click', e => {
      e.stopPropagation();
      avatarMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => avatarMenu?.classList.add('hidden'));
  }

  // Logout button
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await logout();
    });
  });

  // Theme toggle buttons
  document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
    const theme = localStorage.getItem('theme') || 'light';
    updateThemeIcons(theme);
  });

  // Hamburger (mobile)
  const ham = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (ham && sidebar) {
    ham.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('visible');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }
}

// ---- Storage meter ----
async function initStorageMeter(user) {
  const fill = document.getElementById('storage-fill');
  const used = document.getElementById('storage-used');
  const free = document.getElementById('storage-free');
  if (!fill) return;

  const limit    = user.storage_limit || (15 * 1024 * 1024 * 1024);
  const usedByte = user.storage_used  || 0;
  const pct      = Math.min((usedByte / limit) * 100, 100);

  fill.style.width = `${pct}%`;
  fill.className   = 'storage-fill' + (pct > 90 ? ' danger' : pct > 70 ? ' warning' : '');
  if (used) used.textContent = formatSize(usedByte);
  if (free) free.textContent = formatSize(limit - usedByte);
}

// ---- Global search (topbar) ----
export function initGlobalSearch(onSearch) {
  const input  = document.getElementById('global-search');
  const clear  = document.getElementById('search-clear');
  if (!input) return;

  const handler = debounce(e => {
    const q = e.target.value.trim();
    if (clear) clear.classList.toggle('hidden', !q);
    if (onSearch) onSearch(q);
  }, 300);

  input.addEventListener('input', handler);
  clear?.addEventListener('click', () => {
    input.value = '';
    clear.classList.add('hidden');
    if (onSearch) onSearch('');
    input.focus();
  });
}

// ---- Keyboard Shortcuts ----
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Ignore when typing in input
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;

    if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      document.getElementById('global-search')?.focus();
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
      document.querySelectorAll('.dropdown-menu').forEach(d => d.remove());
      document.querySelectorAll('.context-menu').forEach(d => d.remove());
    }
    if (e.key === 'u' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.getElementById('upload-trigger')?.click();
    }
  });
}

// ---- View toggle (grid/list) ----
export function initViewToggle(onViewChange) {
  const gridBtn = document.getElementById('view-grid');
  const listBtn = document.getElementById('view-list');
  const saved   = localStorage.getItem('viewMode') || 'grid';

  const setView = mode => {
    localStorage.setItem('viewMode', mode);
    gridBtn?.classList.toggle('active', mode === 'grid');
    listBtn?.classList.toggle('active', mode === 'list');
    if (onViewChange) onViewChange(mode);
  };

  setView(saved);
  gridBtn?.addEventListener('click', () => setView('grid'));
  listBtn?.addEventListener('click', () => setView('list'));
  return saved;
}

// ---- Sort select ----
export function initSortSelect(onSort) {
  const sel = document.getElementById('sort-select');
  if (!sel) return;
  sel.addEventListener('change', () => onSort && onSort(sel.value));
}

// ---- Context menu ----
export function showContextMenu(x, y, items) {
  document.querySelectorAll('.context-menu').forEach(m => m.remove());

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.cssText = `left:${x}px;top:${y}px`;

  items.forEach(item => {
    if (item === 'divider') {
      menu.innerHTML += '<hr class="dropdown-divider">';
      return;
    }
    const btn = document.createElement('button');
    btn.className = `dropdown-item${item.danger ? ' danger' : ''}`;
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${item.icon}</span>${item.label}`;
    btn.addEventListener('click', () => { menu.remove(); item.fn(); });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  // Adjust if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right  > window.innerWidth)  menu.style.left = `${x - rect.width}px`;
  if (rect.bottom > window.innerHeight) menu.style.top  = `${y - rect.height}px`;

  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
}

export { currentUser };
