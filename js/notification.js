// ============================================================
// notification.js — Toast Notification System
// ============================================================

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Show a toast notification
 * @param {string} message - Message text
 * @param {'success'|'error'|'warning'|'info'|''} type
 * @param {number} duration - ms to display (default 3000)
 * @param {{ label: string, fn: Function }|null} action
 */
export function showToast(message, type = '', duration = 3000, action = null) {
  const c = getContainer();

  const icons = { success:'check_circle', error:'error', warning:'warning', info:'info', '':'notifications' };
  const icon  = icons[type] || 'notifications';

  const toast = document.createElement('div');
  toast.className = `toast${type ? ' ' + type : ''}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span class="toast-text">${message}</span>
    ${action ? `<button class="toast-action">${action.label}</button>` : ''}
    <span class="material-symbols-outlined" style="font-size:18px;cursor:pointer;opacity:.7" data-close>close</span>
  `;

  c.appendChild(toast);

  // Action click
  if (action) {
    toast.querySelector('.toast-action').addEventListener('click', () => {
      action.fn();
      remove();
    });
  }

  // Close click
  toast.querySelector('[data-close]').addEventListener('click', remove);

  // Auto remove
  const timer = setTimeout(remove, duration);

  function remove() {
    clearTimeout(timer);
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }

  return { remove };
}

export const toast = {
  success: (msg, action) => showToast(msg, 'success', 3000, action),
  error:   (msg, action) => showToast(msg, 'error',   4000, action),
  warning: (msg, action) => showToast(msg, 'warning', 3500, action),
  info:    (msg, action) => showToast(msg, 'info',    3000, action),
};
