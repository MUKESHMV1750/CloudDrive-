// ============================================================
// folders.js — Folder Operations
// ============================================================
import { sb }       from './supabase.js';
import { toast }    from './notification.js';
import { logActivity, confirmDialog } from './utils.js';

let currentUser = null;
export function setUser(u) { currentUser = u; }

// ---- Fetch folders ----
export async function fetchFolders({ parentId = null, userId = null } = {}) {
  let q = sb.from('folders')
    .select('*')
    .eq('is_deleted', false)
    .order('folder_name', { ascending: true });

  if (userId) q = q.eq('user_id', userId);
  else        q = q.eq('user_id', currentUser.id);

  if (parentId) q = q.eq('parent_id', parentId);
  else          q = q.is('parent_id', null);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// ---- Fetch folder by ID ----
export async function fetchFolder(folderId) {
  const { data, error } = await sb.from('folders').select('*').eq('id', folderId).single();
  if (error) throw error;
  return data;
}

// ---- Create folder ----
export async function createFolder(name, parentId = null) {
  if (!name?.trim()) throw new Error('Folder name is required');
  const { data, error } = await sb.from('folders').insert({
    user_id: currentUser.id,
    folder_name: name.trim(),
    parent_id: parentId || null
  }).select().single();
  if (error) throw error;
  await logActivity('create_folder', null, data.id, { name });
  toast.success(`Folder "${name}" created`);
  return data;
}

// ---- Rename folder ----
export async function renameFolder(folderId, newName) {
  if (!newName?.trim()) throw new Error('Name is required');
  const { error } = await sb.from('folders')
    .update({ folder_name: newName.trim(), updated_at: new Date().toISOString() })
    .eq('id', folderId);
  if (error) throw error;
  toast.success('Folder renamed');
}

// ---- Delete folder (and all contents) ----
export async function deleteFolder(folderId) {
  // Soft delete all files in folder
  await sb.from('files').update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('folder_id', folderId);
  // Soft delete folder
  const { error } = await sb.from('folders').update({ is_deleted: true }).eq('id', folderId);
  if (error) throw error;
  toast.success('Folder deleted');
}

// ---- Build breadcrumb path ----
export async function getBreadcrumb(folderId) {
  const crumbs = [];
  let id = folderId;
  while (id) {
    const { data } = await sb.from('folders').select('id, folder_name, parent_id').eq('id', id).single();
    if (!data) break;
    crumbs.unshift(data);
    id = data.parent_id;
  }
  return crumbs;
}

// ---- Get all folders for "Move" picker ----
export async function getAllFolders() {
  const { data } = await sb.from('folders')
    .select('id, folder_name, parent_id')
    .eq('user_id', currentUser.id)
    .eq('is_deleted', false)
    .order('folder_name');
  return data || [];
}

// ============================================================
//   UI Modals
// ============================================================

// ---- New Folder Modal ----
export function showNewFolderModal(parentId = null, onCreated) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:360px">
      <div class="modal-header">
        <span class="modal-title">New Folder</span>
        <button class="btn-icon" id="nf-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Folder name</label>
          <input class="form-control" id="nf-input" value="Untitled folder" placeholder="Folder name">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outlined" id="nf-cancel">Cancel</button>
        <button class="btn btn-primary" id="nf-create">Create</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#nf-input');
  input.select();

  const close = () => overlay.remove();
  overlay.querySelector('#nf-close').addEventListener('click', close);
  overlay.querySelector('#nf-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const create = async () => {
    const val = input.value.trim();
    if (!val) { input.focus(); return; }
    const btn = overlay.querySelector('#nf-create');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const folder = await createFolder(val, parentId);
      close();
      if (onCreated) onCreated(folder);
    } catch (err) { toast.error(err.message); btn.disabled = false; btn.textContent = 'Create'; }
  };

  overlay.querySelector('#nf-create').addEventListener('click', create);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') create(); });
}

// ---- Rename Folder Modal ----
export function showRenameFolderModal(folder, onRenamed) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:360px">
      <div class="modal-header">
        <span class="modal-title">Rename Folder</span>
        <button class="btn-icon" id="rf-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">New name</label>
          <input class="form-control" id="rf-input" value="${folder.folder_name}" placeholder="Folder name">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outlined" id="rf-cancel">Cancel</button>
        <button class="btn btn-primary" id="rf-save">Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#rf-input');
  input.select();

  const close = () => overlay.remove();
  overlay.querySelector('#rf-close').addEventListener('click', close);
  overlay.querySelector('#rf-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const save = async () => {
    const val = input.value.trim();
    if (!val || val === folder.folder_name) { close(); return; }
    try {
      await renameFolder(folder.id, val);
      folder.folder_name = val;
      close();
      if (onRenamed) onRenamed(folder);
    } catch (err) { toast.error(err.message); }
  };

  overlay.querySelector('#rf-save').addEventListener('click', save);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
}

// ---- Delete Folder with confirmation ----
export function deleteFolderAction(folder, onDeleted) {
  confirmDialog(
    'Delete Folder',
    `Delete "<strong>${folder.folder_name}</strong>" and all its contents? This moves files to Trash.`,
    async () => {
      try {
        await deleteFolder(folder.id);
        if (onDeleted) onDeleted(folder.id);
      } catch (err) { toast.error(err.message); }
    }
  );
}

// ---- Render Breadcrumb ----
export function renderBreadcrumb(crumbs, container, onNavigate) {
  if (!container) return;
  container.innerHTML = `
    <a class="breadcrumb-item" href="dashboard.html" data-page="home">
      <span class="material-symbols-outlined" style="font-size:18px">home</span>My Drive
    </a>`;

  crumbs.forEach((c, i) => {
    container.innerHTML += `<span class="breadcrumb-sep material-symbols-outlined" style="font-size:18px">chevron_right</span>`;
    if (i === crumbs.length - 1) {
      container.innerHTML += `<span class="breadcrumb-item active">${c.folder_name}</span>`;
    } else {
      const a = document.createElement('a');
      a.className = 'breadcrumb-item';
      a.textContent = c.folder_name;
      a.href = `folder.html?id=${c.id}&name=${encodeURIComponent(c.folder_name)}`;
      container.appendChild(a);
    }
  });
}
