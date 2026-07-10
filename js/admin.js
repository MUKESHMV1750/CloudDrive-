// ============================================================
// admin.js — Admin Dashboard & User Management
// ============================================================
import { sb, SUPABASE_URL, SUPABASE_ANON } from './supabase.js';
import { toast } from './notification.js';
import { formatSize, formatDate, avatarHtml, confirmDialog, getInitials } from './utils.js';

let currentUser = null;
export function setUser(u) { currentUser = u; }

// ============================================================
//   STATS
// ============================================================
export async function loadStats() {
  const [usersRes, filesRes, trashRes, logsRes] = await Promise.all([
    sb.from('users').select('id, storage_used', { count: 'exact' }),
    sb.from('files').select('id, file_size, created_at', { count: 'exact' }).eq('is_deleted', false),
    sb.from('files').select('id', { count: 'exact' }).eq('is_deleted', true),
    sb.from('shares').select('id', { count: 'exact' }),
  ]);

  const totalUsers   = usersRes.count  || 0;
  const totalFiles   = filesRes.count  || 0;
  const totalDeleted = trashRes.count  || 0;
  const totalShared  = logsRes.count   || 0;

  const totalStorage = (filesRes.data || []).reduce((sum, f) => sum + (f.file_size || 0), 0);

  const today = new Date().toDateString();
  const todayUploads = (filesRes.data || []).filter(f => new Date(f.created_at).toDateString() === today).length;

  return { totalUsers, totalFiles, totalDeleted, totalShared, totalStorage, todayUploads };
}

export function renderStats(stats) {
  const map = {
    'stat-users':    { val: stats.totalUsers,               icon: 'people',        color: 'blue' },
    'stat-files':    { val: stats.totalFiles,               icon: 'description',   color: 'green' },
    'stat-storage':  { val: formatSize(stats.totalStorage), icon: 'storage',       color: 'yellow' },
    'stat-today':    { val: stats.todayUploads,             icon: 'upload',        color: 'purple' },
    'stat-deleted':  { val: stats.totalDeleted,             icon: 'delete',        color: 'red' },
    'stat-shared':   { val: stats.totalShared,              icon: 'share',         color: 'blue' },
  };
  Object.entries(map).forEach(([id, cfg]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = cfg.val;
  });
}

// ============================================================
//   USER MANAGEMENT
// ============================================================
export async function fetchAllUsers() {
  const { data, error } = await sb.from('users')
    .select('*, files_count:files(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export function renderUsersTable(users, container, onAction) {
  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:2px solid var(--border)">
          <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:600;color:var(--text-secondary)">USER</th>
          <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:600;color:var(--text-secondary)">ROLE</th>
          <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:600;color:var(--text-secondary)">STORAGE</th>
          <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:600;color:var(--text-secondary)">JOINED</th>
          <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:600;color:var(--text-secondary)">STATUS</th>
          <th style="padding:10px 16px;text-align:right;font-size:12px;font-weight:600;color:var(--text-secondary)">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr data-uid="${u.id}" style="border-bottom:1px solid var(--border);transition:background var(--t-fast)" 
            onmouseover="this.style.background='var(--bg-hover)'" 
            onmouseout="this.style.background=''" >
            <td style="padding:12px 16px">
              <div style="display:flex;align-items:center;gap:10px">
                ${avatarHtml(u, 'sm')}
                <div>
                  <div style="font-size:14px;font-weight:500">${u.name || '—'}</div>
                  <div style="font-size:12px;color:var(--text-secondary)">${u.email}</div>
                </div>
              </div>
            </td>
            <td style="padding:12px 16px">
              <span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-success'}">${u.role}</span>
            </td>
            <td style="padding:12px 16px;font-size:13px;color:var(--text-secondary)">${formatSize(u.storage_used || 0)}</td>
            <td style="padding:12px 16px;font-size:13px;color:var(--text-secondary)">${formatDate(u.created_at)}</td>
            <td style="padding:12px 16px">
              <span class="badge ${u.is_disabled ? 'badge-danger' : 'badge-success'}">
                ${u.is_disabled ? 'Disabled' : 'Active'}</span>
            </td>
            <td style="padding:12px 16px;text-align:right">
              <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
                <button class="btn-icon btn-sm" data-action="toggle" data-uid="${u.id}" data-disabled="${u.is_disabled}" title="${u.is_disabled?'Enable':'Disable'}">
                  <span class="material-symbols-outlined" style="font-size:18px">${u.is_disabled?'person_check':'block'}</span>
                </button>
                <button class="btn-icon btn-sm" data-action="reset-pw" data-uid="${u.id}" data-email="${u.email}" title="Reset Password">
                  <span class="material-symbols-outlined" style="font-size:18px">lock_reset</span>
                </button>
                ${u.id !== currentUser?.id ? `
                <button class="btn-icon btn-sm" data-action="delete" data-uid="${u.id}" data-name="${u.name||u.email}" title="Delete" style="color:var(--danger)">
                  <span class="material-symbols-outlined" style="font-size:18px">delete</span>
                </button>` : ''}
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => onAction(btn.dataset.action, btn.dataset));
  });
}

// ---- Toggle user disable ----
export async function toggleUserDisabled(uid, currentState) {
  const { error } = await sb.from('users').update({ is_disabled: !currentState }).eq('id', uid);
  if (error) throw error;
  toast.success(!currentState ? 'User disabled' : 'User enabled');
}

// ---- Delete user ----
export async function deleteUser(uid) {
  const { error } = await sb.auth.admin.deleteUser(uid);
  if (error) {
    // Fallback: just disable
    await sb.from('users').update({ is_disabled: true }).eq('id', uid);
  }
  toast.success('User removed');
}

// ---- Add User Modal ----
export function showAddUserModal(onCreated) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <span class="modal-title">Add New User</span>
        <button class="btn-icon" id="au-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-control" id="au-name" placeholder="John Doe">
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input class="form-control" id="au-email" type="email" placeholder="john@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <select class="form-control" id="au-role">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Password</label>
          <input class="form-control" id="au-pass" type="password" placeholder="Temporary password">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outlined" id="au-cancel">Cancel</button>
        <button class="btn btn-primary" id="au-create">Create User</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#au-close').addEventListener('click', close);
  overlay.querySelector('#au-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelector('#au-create').addEventListener('click', async () => {
    const name  = overlay.querySelector('#au-name').value.trim();
    const email = overlay.querySelector('#au-email').value.trim();
    const role  = overlay.querySelector('#au-role').value;
    const pass  = overlay.querySelector('#au-pass').value;

    if (!name || !email || !pass) { toast.error('All fields are required'); return; }

    const btn = overlay.querySelector('#au-create');
    btn.disabled = true; btn.textContent = 'Creating…';

    try {
      // Use a secondary client so we don't log out the admin
      const tempClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const { data, error } = await tempClient.auth.signUp({
        email, password: pass,
        options: { data: { name, role } }
      });
      if (error) throw error;
      if (!data?.user) throw new Error("Failed to create user");
      
      // Upsert profile in main DB
      await sb.from('users').upsert({ id: data.user.id, name, email, role });
      toast.success(`User "${name}" created`);
      close();
      if (onCreated) onCreated();
    } catch (err) {
      toast.error(err.message);
      btn.disabled = false; btn.textContent = 'Create User';
    }
  });
}

// ============================================================
//   ACTIVITY LOGS
// ============================================================
export async function fetchActivityLogs(limit = 50) {
  const { data, error } = await sb.from('activity_logs')
    .select('*, users:user_id(name, email, photo), files:file_id(original_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export function renderActivityLogs(logs, container) {
  const actionIcons = {
    login:'login', logout:'logout', upload:'upload', download:'download',
    delete:'delete', rename:'edit', share:'share', restore:'restore', create_folder:'create_new_folder', move:'drive_file_move'
  };
  const actionColors = {
    login:'var(--success)', logout:'var(--text-secondary)', upload:'var(--primary)',
    download:'var(--info)', delete:'var(--danger)', rename:'var(--warning)',
    share:'var(--success)', restore:'var(--success)', create_folder:'#FBBC05'
  };

  container.innerHTML = logs.length ? '' : `
    <div class="empty-state">
      <div class="empty-icon"><span class="material-symbols-outlined">history</span></div>
      <h3>No activity yet</h3>
    </div>`;

  logs.forEach(log => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)';
    row.innerHTML = `
      <div style="width:36px;height:36px;border-radius:50%;background:var(--bg-hover);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:18px;color:${actionColors[log.action]||'var(--primary)'}">
          ${actionIcons[log.action] || 'circle'}</span>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500">${log.users?.name || '?'}
          <span style="font-weight:400;color:var(--text-secondary)">${formatAction(log.action)}${log.files?.original_name ? ` "${log.files.original_name}"` : ''}</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary)">${formatDate(log.created_at, 'relative')}</div>
      </div>`;
    container.appendChild(row);
  });
}

function formatAction(action) {
  return { login:'logged in', logout:'logged out', upload:'uploaded', download:'downloaded',
    delete:'deleted', rename:'renamed', share:'shared', restore:'restored',
    create_folder:'created folder', move:'moved' }[action] || action;
}
