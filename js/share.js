// ============================================================
// share.js — File Sharing Module
// ============================================================
import { sb }    from './supabase.js';
import { toast } from './notification.js';
import { logActivity, avatarHtml, formatDate } from './utils.js';

let currentUser = null;
export function setUser(u) { currentUser = u; }

// ---- Get shares for a file ----
export async function getFileShares(fileId) {
  const { data, error } = await sb.from('shares')
    .select('*, shared_user:shared_with(id, name, email, photo)')
    .eq('file_id', fileId)
    .eq('owner_id', currentUser.id);
  if (error) throw error;
  return data || [];
}

// ---- Share with user by email ----
export async function shareWithUser(fileId, email, permission = 'view') {
  // Find user by email
  const { data: target, error: userErr } = await sb.from('users')
    .select('id, name, email')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (userErr || !target) throw new Error('User not found with that email address.');
  if (target.id === currentUser.id) throw new Error('You cannot share a file with yourself.');

  // Check existing share
  const { data: existing } = await sb.from('shares')
    .select('id')
    .eq('file_id', fileId)
    .eq('shared_with', target.id)
    .single();

  if (existing) {
    // Update permission
    await sb.from('shares').update({ permission }).eq('id', existing.id);
    toast.success(`Permission updated for ${target.name || email}`);
    return;
  }

  // Insert share
  const { error } = await sb.from('shares').insert({
    file_id: fileId, owner_id: currentUser.id,
    shared_with: target.id, permission
  });
  if (error) throw error;

  await logActivity('share', fileId, null, { with: email, permission });
  toast.success(`Shared with ${target.name || email}`);
  return target;
}

// ---- Update share permission ----
export async function updateSharePermission(shareId, permission) {
  const { error } = await sb.from('shares').update({ permission }).eq('id', shareId);
  if (error) throw error;
  toast.success('Permission updated');
}

// ---- Remove share ----
export async function removeShare(shareId) {
  const { error } = await sb.from('shares').delete().eq('id', shareId);
  if (error) throw error;
  toast.success('Access removed');
}

// ---- Generate public link ----
export async function generatePublicLink(fileId) {
  const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

  // Upsert public share record
  const { data, error } = await sb.from('shares').upsert({
    file_id: fileId, owner_id: currentUser.id,
    public_link: true, link_token: token,
    shared_with: null, permission: 'view'
  }, { onConflict: 'link_token' }).select().single();

  if (error) throw error;
  return `${window.location.origin}/shared-link.html?token=${token}`;
}

// ---- Open Share Modal ----
export async function openShareModal(file) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:520px">
      <div class="modal-header">
        <span class="modal-title">Share "${file.original_name}"</span>
        <button class="btn-icon" id="share-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <input class="form-control" id="share-email" placeholder="Add people by email" type="email" style="flex:1">
          <select class="form-control" id="share-perm" style="width:90px">
            <option value="view">View</option>
            <option value="edit">Edit</option>
          </select>
          <button class="btn btn-primary" id="share-send">Share</button>
        </div>
        <div id="share-list"><div class="loading-spinner"></div></div>
        <div class="divider"></div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:13px;font-weight:500">Public link</div>
            <div style="font-size:12px;color:var(--text-secondary)">Anyone with link can view</div>
          </div>
          <button class="btn btn-outlined btn-sm" id="copy-link">
            <span class="material-symbols-outlined" style="font-size:16px">link</span>Copy link</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#share-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  // Load current shares
  loadShareList(file.id, overlay.querySelector('#share-list'));

  // Share button
  overlay.querySelector('#share-send').addEventListener('click', async () => {
    const email = overlay.querySelector('#share-email').value.trim();
    const perm  = overlay.querySelector('#share-perm').value;
    if (!email) return;
    try {
      await shareWithUser(file.id, email, perm);
      overlay.querySelector('#share-email').value = '';
      loadShareList(file.id, overlay.querySelector('#share-list'));
    } catch (err) { toast.error(err.message); }
  });

  // Copy link
  overlay.querySelector('#copy-link').addEventListener('click', async () => {
    try {
      const link = await generatePublicLink(file.id);
      await navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard');
    } catch (err) { toast.error('Failed to copy link'); }
  });
}

async function loadShareList(fileId, container) {
  try {
    const shares = await getFileShares(fileId);
    if (!shares.length) {
      container.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">Not shared with anyone yet.</p>';
      return;
    }
    container.innerHTML = `<div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px">SHARED WITH</div>
      <div class="share-user-list">
        ${shares.map(s => `
          <div class="share-user-row" data-share-id="${s.id}">
            ${avatarHtml(s.shared_user || {}, 'sm')}
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500">${s.shared_user?.name || '—'}</div>
              <div style="font-size:12px;color:var(--text-secondary)">${s.shared_user?.email || ''}</div>
            </div>
            <select class="share-perm-select" data-share="${s.id}">
              <option value="view" ${s.permission==='view'?'selected':''}>View</option>
              <option value="edit" ${s.permission==='edit'?'selected':''}>Edit</option>
            </select>
            <button class="btn-icon btn-sm remove-share" data-share="${s.id}" style="color:var(--danger)">
              <span class="material-symbols-outlined" style="font-size:18px">person_remove</span></button>
          </div>`).join('')}
      </div>`;

    container.querySelectorAll('.share-perm-select').forEach(sel => {
      sel.addEventListener('change', () => updateSharePermission(sel.dataset.share, sel.value));
    });
    container.querySelectorAll('.remove-share').forEach(btn => {
      btn.addEventListener('click', async () => {
        await removeShare(btn.dataset.share);
        loadShareList(fileId, container);
      });
    });
  } catch { container.innerHTML = '<p class="text-danger">Failed to load shares.</p>'; }
}
