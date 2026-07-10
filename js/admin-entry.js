import { initApp }    from './app.js';
import { loadStats, renderStats, fetchAllUsers, renderUsersTable,
         fetchActivityLogs, renderActivityLogs, showAddUserModal,
         toggleUserDisabled, deleteUser, setUser } from './admin.js';
import { fetchFiles, renderGrid, renderList, renderSkeletons, setUser as setFilesUser } from './files.js';
import { toast }      from './notification.js';
import { confirmDialog } from './utils.js';

async function run() {
  const user = await initApp({ adminOnly: true });
  if (!user) throw new Error('Not admin');
  setUser(user);
  setFilesUser(user);

  // Tab switching
  const tabs = { overview: 'tab-overview', users: 'tab-users-panel', files: 'tab-files-panel', logs: 'tab-logs-panel' };
  document.querySelectorAll('.admin-tab,[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  function switchTab(name) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(tabs[name])?.classList.remove('hidden');
    document.querySelectorAll('.admin-tab').forEach(t => {
      const active = t.dataset.tab === name;
      t.style.borderBottomColor = active ? 'var(--primary)' : 'transparent';
      t.style.color = active ? 'var(--primary)' : 'var(--text-secondary)';
    });
    if (name === 'users') loadUsers();
    if (name === 'logs')  loadLogs();
    if (name === 'files') loadAllFiles();
  }

  // Load stats
  const stats = await loadStats();
  renderStats(stats);

  // Preview logs
  const previewLogs = await fetchActivityLogs(5);
  renderActivityLogs(previewLogs, document.getElementById('recent-logs-preview'));

  // Load users
  async function loadUsers() {
    const users = await fetchAllUsers();
    renderUsersTable(users, document.getElementById('users-table-container'), async (action, data) => {
      if (action === 'toggle') {
        await toggleUserDisabled(data.uid, data.disabled === 'true');
        loadUsers();
      }
      if (action === 'delete') {
        confirmDialog('Delete User', `Remove user <strong>${data.name}</strong>? This cannot be undone.`, async () => {
          await deleteUser(data.uid); loadUsers();
        });
      }
      if (action === 'reset-pw') {
        const { sendPasswordReset } = await import('./auth.js');
        await sendPasswordReset(data.email);
        toast.success(`Password reset link sent to ${data.email}`);
      }
    });
  }

  // Add user
  document.getElementById('add-user-btn').addEventListener('click', () => showAddUserModal(loadUsers));

  // Load logs
  async function loadLogs() {
    const logs = await fetchActivityLogs(100);
    renderActivityLogs(logs, document.getElementById('activity-logs-container'));
  }

  // Load all files (admin view)
  let adminViewMode = 'grid';
  async function loadAllFiles() {
    const c = document.getElementById('admin-files-area');
    renderSkeletons(c);
    const files = await fetchFiles({ allFiles: true });
    if (adminViewMode === 'grid') renderGrid(files, [], c);
    else renderList(files, [], c);
  }
  document.getElementById('view-grid')?.addEventListener('click', () => { adminViewMode='grid'; loadAllFiles(); });
  document.getElementById('view-list')?.addEventListener('click', () => { adminViewMode='list'; loadAllFiles(); });

  // Handle hash
  if (window.location.hash === '#users') switchTab('users');
  if (window.location.hash === '#logs')  switchTab('logs');
}

run();
