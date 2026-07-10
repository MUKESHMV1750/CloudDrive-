// ============================================================
// trash.js — Trash Page Module
// ============================================================
import { sb, BUCKET }  from './supabase.js';
import { toast }       from './notification.js';
import { formatSize, formatDate, getExt, getFileIcon, getIconClass, confirmDialog } from './utils.js';
import { restoreFile, permanentDelete } from './files.js';

let currentUser = null;
export function setUser(u) { currentUser = u; }

// ---- Fetch deleted files ----
export async function fetchTrashFiles() {
  let q = sb.from('files')
    .select('*, users:user_id(name, email)')
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false });

  if (currentUser.role !== 'admin') q = q.eq('user_id', currentUser.id);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// ---- Restore all ----
export async function restoreAll(files) {
  for (const f of files) await restoreFile(f.id);
  toast.success(`${files.length} file(s) restored`);
}

// ---- Empty trash ----
export async function emptyTrash(files) {
  for (const f of files) {
    await sb.storage.from(BUCKET).remove([f.storage_path]).catch(() => {});
  }
  if (currentUser.role === 'admin') {
    await sb.from('files').delete().eq('is_deleted', true);
  } else {
    await sb.from('files').delete().eq('is_deleted', true).eq('user_id', currentUser.id);
  }
  toast.success('Trash emptied');
}

// ---- Render trash grid ----
export function renderTrash(files, container, onRefresh) {
  container.innerHTML = '';

  if (!files.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><span class="material-symbols-outlined">delete</span></div>
        <h3>Trash is empty</h3>
        <p>Items deleted from Drive will appear here.</p>
      </div>`;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'files-grid';

  files.forEach(file => {
    const ext  = getExt(file.original_name || file.file_name);
    const icon = getFileIcon(ext);
    const cls  = getIconClass(ext);

    const card = document.createElement('div');
    card.className = 'file-card';
    card.style.opacity = '0.85';
    card.innerHTML = `
      <div class="file-thumb ${ext}">
        <span class="material-symbols-outlined file-thumb-icon ${cls}">${icon}</span>
      </div>
      <div class="file-info">
        <div class="file-name" title="${file.original_name}">${file.original_name}</div>
        <div class="file-meta">
          <span>${formatSize(file.file_size)}</span>
          <span>·</span>
          <span>Deleted ${formatDate(file.deleted_at, 'relative')}</span>
        </div>
      </div>
      <div class="file-actions" style="opacity:1">
        <button class="btn btn-outlined btn-sm restore-btn" style="flex:1">
          <span class="material-symbols-outlined" style="font-size:14px">restore</span>Restore</button>
        <button class="btn btn-danger btn-sm perm-del-btn">
          <span class="material-symbols-outlined" style="font-size:14px">delete_forever</span></button>
      </div>`;

    card.querySelector('.restore-btn').addEventListener('click', async e => {
      e.stopPropagation();
      await restoreFile(file.id);
      card.remove();
      onRefresh?.();
    });

    card.querySelector('.perm-del-btn').addEventListener('click', e => {
      e.stopPropagation();
      confirmDialog(
        'Delete Forever',
        `Permanently delete "<strong>${file.original_name}</strong>"? This cannot be undone.`,
        async () => {
          await permanentDelete(file.id, file.storage_path);
          card.remove();
          onRefresh?.();
        }
      );
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
}
