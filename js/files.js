// ============================================================
// files.js — File Operations (CRUD, Star, Preview, Move)
// ============================================================
import { sb, BUCKET }  from './supabase.js';
import { toast }       from './notification.js';
import { logActivity, formatSize, formatDate, getExt, getFileIcon, getIconClass,
         isImage, isVideo, isAudio, isPDF, confirmDialog, el, avatarHtml } from './utils.js';

let currentUser = null;
export function setUser(u) { currentUser = u; }

// ---- Fetch files ----
export async function fetchFiles({ folderId = null, userId = null, starred = false,
  deleted = false, shared = false, recent = false, limit = 100, offset = 0,
  sortBy = 'date_desc', category = '', allFiles = false } = {}) {

  let q = sb.from('files').select(`*, users:user_id(name, email, photo)`);

  if (deleted)  { q = q.eq('is_deleted', true); }
  else if (shared) {
    const { data: shareRows } = await sb.from('shares').select('file_id').eq('shared_with', currentUser.id);
    const ids = (shareRows || []).map(r => r.file_id);
    if (!ids.length) return [];
    q = q.in('id', ids).eq('is_deleted', false);
  } else {
    q = q.eq('is_deleted', false);
    if (starred) q = q.eq('is_starred', true);
    
    if (!allFiles) {
      if (userId)  q = q.eq('user_id', userId);
      else         q = q.eq('user_id', currentUser.id);
      q = folderId ? q.eq('folder_id', folderId) : q.is('folder_id', null);
    }
  }

  // Sorting
  if (recent) {
    q = q.order('updated_at', { ascending: false });
  } else {
    const sortMap = {
      date_desc:  { col: 'created_at',    asc: false },
      date_asc:   { col: 'created_at',    asc: true  },
      name_asc:   { col: 'original_name', asc: true  },
      name_desc:  { col: 'original_name', asc: false },
      size_desc:  { col: 'file_size',     asc: false },
      size_asc:   { col: 'file_size',     asc: true  },
    };
    const sort = sortMap[sortBy] || sortMap.date_desc;
    q = q.order(sort.col, { ascending: sort.asc });
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error) throw error;

  // Client-side category filter (by file extension)
  if (category && data) {
    const extMap = {
      image:   ['jpg','jpeg','png','gif','svg','webp','bmp'],
      video:   ['mp4','avi','mov','mkv','webm'],
      audio:   ['mp3','wav','ogg','flac','aac'],
      doc:     ['doc','docx','pdf','txt','md'],
      archive: ['zip','rar','7z','tar','gz'],
      code:    ['js','ts','html','css','php','py','java','json','xml','sql'],
    };
    const exts = new Set(extMap[category] || []);
    return data.filter(f => {
      const name = f.original_name || f.file_name || '';
      const ext = name.split('.').pop().toLowerCase();
      return exts.has(ext);
    });
  }

  return data || [];
}

// ---- Rename file ----
export async function renameFile(fileId, newName) {
  const { error } = await sb.from('files')
    .update({ original_name: newName, updated_at: new Date().toISOString() })
    .eq('id', fileId);
  if (error) throw error;
  await logActivity('rename', fileId, null, { new_name: newName });
  toast.success('File renamed');
}

// ---- Soft delete (move to trash) ----
export async function deleteFile(fileId) {
  const { error } = await sb.from('files')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', fileId);
  if (error) throw error;
  await logActivity('delete', fileId);
  toast.success('Moved to Trash', {
    label: 'Undo',
    fn: () => restoreFile(fileId)
  });
}

// ---- Restore from trash ----
export async function restoreFile(fileId) {
  const { error } = await sb.from('files')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', fileId);
  if (error) throw error;
  await logActivity('restore', fileId);
  toast.success('File restored');
}

// ---- Permanent delete ----
export async function permanentDelete(fileId, storagePath) {
  await sb.storage.from(BUCKET).remove([storagePath]);
  const { error } = await sb.from('files').delete().eq('id', fileId);
  if (error) throw error;
  toast.success('File permanently deleted');
}

// ---- Toggle star ----
export async function toggleStar(fileId, currentState) {
  const { error } = await sb.from('files')
    .update({ is_starred: !currentState })
    .eq('id', fileId);
  if (error) throw error;
  toast.info(!currentState ? 'Added to Starred' : 'Removed from Starred');
}

// ---- Move file to folder ----
export async function moveFile(fileId, targetFolderId) {
  const { error } = await sb.from('files')
    .update({ folder_id: targetFolderId, updated_at: new Date().toISOString() })
    .eq('id', fileId);
  if (error) throw error;
  await logActivity('move', fileId, targetFolderId);
  toast.success('File moved');
}

// ---- Download file ----
export async function downloadFile(storagePath, originalName) {
  try {
    const { data, error } = await sb.storage.from(BUCKET).download(storagePath);
    if (error) throw error;
    const url = URL.createObjectURL(data);
    const a   = document.createElement('a');
    a.href = url; a.download = originalName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await logActivity('download', null, null, { path: storagePath });
    toast.success(`Downloading "${originalName}"`);
  } catch (err) {
    toast.error('Download failed');
  }
}

// ---- Get public URL ----
export async function getPublicUrl(storagePath) {
  const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl;
}

// ---- Get signed URL (temporary) ----
export async function getSignedUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ============================================================
//   RENDER FUNCTIONS
// ============================================================

// ---- Render Grid View ----
export function renderGrid(files, folders, container, opts = {}) {
  container.innerHTML = '';

  if (!folders.length && !files.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><span class="material-symbols-outlined">folder_open</span></div>
        <h3>${opts.emptyTitle || 'Nothing here yet'}</h3>
        <p>${opts.emptyMsg || 'Upload files or create a folder to get started.'}</p>
        ${opts.showUpload ? `<button class="btn btn-primary" id="empty-upload-btn">
          <span class="material-symbols-outlined">upload</span>Upload Files</button>` : ''}
      </div>`;
    document.getElementById('empty-upload-btn')?.addEventListener('click',
      () => document.getElementById('file-input')?.click());
    return;
  }

  // Render folder section
  if (folders.length) {
    const sec = el('div', '');
    sec.innerHTML = `<div class="section-header"><span class="section-title">Folders</span></div>`;
    const grid = el('div', 'files-grid');
    folders.forEach(f => grid.appendChild(renderFolderCard(f, opts)));
    sec.appendChild(grid);
    container.appendChild(sec);
  }

  // Render file section
  if (files.length) {
    const sec = el('div', '');
    sec.innerHTML = `<div class="section-header" style="margin-top:${folders.length?'16px':'0'}"><span class="section-title">Files</span></div>`;
    const grid = el('div', 'files-grid');
    files.forEach(f => grid.appendChild(renderFileCard(f, opts)));
    sec.appendChild(grid);
    container.appendChild(sec);
  }
}

// ---- Render List View ----
export function renderList(files, folders, container, opts = {}) {
  container.innerHTML = '';

  if (!folders.length && !files.length) {
    renderGrid([], [], container, opts); return;
  }

  const listWrap = el('div', 'files-list');

  // Header
  const header = el('div', 'list-header');
  header.innerHTML = `
    <span class="sort-header" data-sort="name">Name</span>
    <span class="sort-header" data-sort="owner">Owner</span>
    <span class="sort-header" data-sort="size">Size</span>
    <span class="sort-header" data-sort="date">Modified</span>
    <span>Actions</span>`;
  listWrap.appendChild(header);

  folders.forEach(f => listWrap.appendChild(renderFolderListItem(f, opts)));
  files.forEach(f   => listWrap.appendChild(renderFileListItem(f, opts)));
  container.appendChild(listWrap);
}

// ---- File Card (grid) ----
function renderFileCard(file, opts = {}) {
  const ext  = getExt(file.original_name || file.file_name);
  const icon = getFileIcon(ext);
  const cls  = getIconClass(ext);
  const card = el('div', `file-card`);
  card.dataset.id = file.id;

  const showThumb = isImage(ext) || isPDF(ext);

  card.innerHTML = `
    <div class="card-header">
      <div class="card-icon"><span class="material-symbols-outlined ${cls}" style="font-size:18px">${icon}</span></div>
      <div class="card-title" title="${file.original_name}">${file.original_name}</div>
      <button class="btn-icon btn-sm" data-action="more" title="More">
        <span class="material-symbols-outlined" style="font-size:18px">more_vert</span>
      </button>
    </div>
    <div class="file-thumb ${ext}">
      ${showThumb ? `<img src="" data-path="${file.storage_path}" data-type="${ext}" alt="${file.original_name}" loading="lazy" class="lazy-img">`
        : `<span class="material-symbols-outlined file-thumb-icon ${cls}">${icon}</span>`}
      <div class="file-thumb-overlay">
        <div class="thumb-action" data-action="preview" title="Preview">
          <span class="material-symbols-outlined" style="font-size:16px">visibility</span></div>
        <div class="thumb-action" data-action="download" title="Download">
          <span class="material-symbols-outlined" style="font-size:16px">download</span></div>
      </div>
      <div class="file-checkbox"><span class="material-symbols-outlined">check</span></div>
      <div class="file-star ${file.is_starred ? 'starred' : ''}" data-action="star">
        <span class="material-symbols-outlined${file.is_starred ? ' icon-fill' : ''}">star</span>
      </div>
    </div>
    <div class="card-footer">
      ${avatarHtml(file.users || {name:'Me'}, 'sm')}
      <div class="card-footer-text">You uploaded • ${formatDate(file.created_at, 'relative')}</div>
    </div>`;

  // Lazy load image
  const img = card.querySelector('.lazy-img');
  if (img) lazyLoadImage(img, file.storage_path);

  // Action handlers
  card.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) {
      if (e.target.closest('.file-checkbox')) { toggleSelectCard(card, file); return; }
      handleFileAction('preview', file); return;
    }
    e.stopPropagation();
    handleFileAction(action, file, card, e);
  });

  // Right-click context menu
  card.addEventListener('contextmenu', e => {
    e.preventDefault();
    showFileContextMenu(e.clientX, e.clientY, file);
  });

  return card;
}

// ---- Folder Card (grid) ----
function renderFolderCard(folder, opts = {}) {
  const card = el('div', 'folder-card');
  card.dataset.id = folder.id;
  card.innerHTML = `
    <span class="material-symbols-outlined folder-icon icon-fill">folder</span>
    <div class="folder-info">
      <div class="folder-name" title="${folder.folder_name}">${folder.folder_name}</div>
      <div class="folder-meta">${formatDate(folder.created_at, 'relative')}</div>
    </div>
    <div class="folder-more dropdown">
      <button class="btn-icon btn-sm" id="folder-more-${folder.id}">
        <span class="material-symbols-outlined" style="font-size:18px">more_vert</span>
      </button>
    </div>`;

  card.addEventListener('dblclick', () => {
    if (opts.onFolderOpen) opts.onFolderOpen(folder);
    else window.location.href = `folder.html?id=${folder.id}&name=${encodeURIComponent(folder.folder_name)}`;
  });

  card.addEventListener('click', e => {
    if (e.target.closest('.folder-more')) {
      e.stopPropagation();
      showFolderContextMenu(e.clientX, e.clientY, folder);
    }
  });

  card.addEventListener('contextmenu', e => {
    e.preventDefault();
    showFolderContextMenu(e.clientX, e.clientY, folder);
  });

  return card;
}

// ---- File List Item ----
function renderFileListItem(file, opts = {}) {
  const ext  = getExt(file.original_name || file.file_name);
  const icon = getFileIcon(ext);
  const cls  = getIconClass(ext);
  const row  = el('div', 'list-item');
  row.dataset.id = file.id;
  row.innerHTML = `
    <div class="list-item-name">
      <span class="material-symbols-outlined list-icon ${cls}" style="font-size:22px">${icon}</span>
      <span class="label truncate">${file.original_name}</span>
      ${file.is_starred ? '<span class="material-symbols-outlined icon-fill" style="font-size:16px;color:var(--warning);flex-shrink:0">star</span>' : ''}
    </div>
    <span class="list-col">${file.users?.name || 'Me'}</span>
    <span class="list-col">${formatSize(file.file_size)}</span>
    <span class="list-col">${formatDate(file.updated_at)}</span>
    <div class="list-actions">
      <button class="btn-icon btn-sm" data-action="download" title="Download">
        <span class="material-symbols-outlined" style="font-size:18px">download</span></button>
      <button class="btn-icon btn-sm" data-action="rename" title="Rename">
        <span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
      <button class="btn-icon btn-sm" data-action="share" title="Share">
        <span class="material-symbols-outlined" style="font-size:18px">share</span></button>
      <button class="btn-icon btn-sm" data-action="more" title="More">
        <span class="material-symbols-outlined" style="font-size:18px">more_vert</span></button>
    </div>`;

  row.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action) { e.stopPropagation(); handleFileAction(action, file, row, e); return; }
    handleFileAction('preview', file);
  });
  row.addEventListener('contextmenu', e => { e.preventDefault(); showFileContextMenu(e.clientX, e.clientY, file); });
  return row;
}

// ---- Folder List Item ----
function renderFolderListItem(folder, opts = {}) {
  const row = el('div', 'list-item');
  row.dataset.id = folder.id;
  row.innerHTML = `
    <div class="list-item-name">
      <span class="material-symbols-outlined list-icon folder-c icon-fill" style="font-size:22px">folder</span>
      <span class="label truncate">${folder.folder_name}</span>
    </div>
    <span class="list-col">Me</span>
    <span class="list-col">—</span>
    <span class="list-col">${formatDate(folder.created_at)}</span>
    <div class="list-actions">
      <button class="btn-icon btn-sm" data-action="rename-folder" title="Rename">
        <span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
      <button class="btn-icon btn-sm" data-action="delete-folder" title="Delete">
        <span class="material-symbols-outlined" style="font-size:18px">delete</span></button>
    </div>`;

  row.addEventListener('dblclick', () => {
    window.location.href = `folder.html?id=${folder.id}&name=${encodeURIComponent(folder.folder_name)}`;
  });
  return row;
}

// ---- File Actions ----
export function handleFileAction(action, file, card, e) {
  const { showRenameModal }  = window.__fileModals || {};
  const { showShareModal }   = window.__shareModals || {};
  const { showPreview }      = window.__preview || {};

  switch (action) {
    case 'preview':   previewFile(file);         break;
    case 'download':  downloadFile(file.storage_path, file.original_name); break;
    case 'star':      starAction(file, card);    break;
    case 'rename':    showRenameFileModal(file, card); break;
    case 'share':     showShareFileModal(file);  break;
    case 'delete':    softDeleteAction(file, card); break;
    case 'more':      showFileContextMenu(e?.clientX || 100, e?.clientY || 100, file); break;
  }
}

// ---- Star Action ----
async function starAction(file, card) {
  await toggleStar(file.id, file.is_starred);
  file.is_starred = !file.is_starred;
  const starEl = card?.querySelector('.file-star');
  if (starEl) {
    starEl.classList.toggle('starred', file.is_starred);
    starEl.querySelector('.material-symbols-outlined').className =
      `material-symbols-outlined${file.is_starred ? ' icon-fill' : ''}`;
  }
}

// ---- Soft Delete ----
async function softDeleteAction(file, card) {
  await deleteFile(file.id);
  card?.remove();
}

// ---- Rename Modal ----
export function showRenameFileModal(file, card) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <span class="modal-title">Rename File</span>
        <button class="btn-icon" id="rename-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">New name</label>
          <input class="form-control" id="rename-input" value="${file.original_name}" placeholder="File name">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outlined" id="rename-cancel">Cancel</button>
        <button class="btn btn-primary" id="rename-save">Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#rename-input');
  input.select();

  const close = () => overlay.remove();
  overlay.querySelector('#rename-close').addEventListener('click', close);
  overlay.querySelector('#rename-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const save = async () => {
    const val = input.value.trim();
    if (!val || val === file.original_name) { close(); return; }
    try {
      await renameFile(file.id, val);
      file.original_name = val;
      if (card) {
        const nameEl = card.querySelector('.file-name,.label');
        if (nameEl) nameEl.textContent = val;
      }
      close();
    } catch (err) { toast.error('Rename failed'); }
  };

  overlay.querySelector('#rename-save').addEventListener('click', save);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
}

// ---- Share Modal (stub — full impl in share.js) ----
export function showShareFileModal(file) {
  import('./share.js').then(m => m.openShareModal(file));
}

// ---- Context Menus ----
export function showFileContextMenu(x, y, file) {
  const { showContextMenu } = window.__app || {};
  if (!showContextMenu) return;
  showContextMenu(x, y, [
    { icon:'visibility',    label:'Preview',         fn: () => previewFile(file) },
    { icon:'download',      label:'Download',         fn: () => downloadFile(file.storage_path, file.original_name) },
    { icon:'edit',          label:'Rename',           fn: () => showRenameFileModal(file) },
    { icon:'share',         label:'Share',            fn: () => showShareFileModal(file) },
    { icon:'star',          label: file.is_starred ? 'Unstar' : 'Star', fn: () => toggleStar(file.id, file.is_starred) },
    'divider',
    { icon:'delete',        label:'Move to Trash',    fn: () => deleteFile(file.id),         danger: true },
  ]);
}

export function showFolderContextMenu(x, y, folder) {
  const { showContextMenu } = window.__app || {};
  if (!showContextMenu) return;
  showContextMenu(x, y, [
    { icon:'open_in_new',   label:'Open',             fn: () => { window.location.href = `folder.html?id=${folder.id}&name=${encodeURIComponent(folder.folder_name)}`; } },
    { icon:'edit',          label:'Rename',           fn: () => { import('./folders.js').then(m => m.showRenameFolderModal(folder)); } },
    'divider',
    { icon:'delete',        label:'Delete Folder',    fn: () => { import('./folders.js').then(m => m.deleteFolderAction(folder)); }, danger: true },
  ]);
}

// ---- Lazy image loader / Thumbnail ----
async function lazyLoadImage(imgEl, storagePath) {
  try {
    const { data } = await sb.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
    if (!data?.signedUrl) return;
    
    if (imgEl.dataset.type === 'pdf') {
      const dataUrl = await generatePDFThumbnail(data.signedUrl);
      imgEl.src = dataUrl;
    } else {
      imgEl.src = data.signedUrl;
    }
  } catch {}
}

async function generatePDFThumbnail(pdfUrl) {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  }
  
  const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.8);
}

// ============================================================
//   PREVIEW
// ============================================================
export async function previewFile(file) {
  const ext = getExt(file.original_name || file.file_name);
  let url;
  try {
    const { data } = await sb.storage.from(BUCKET).createSignedUrl(file.storage_path, 3600);
    url = data?.signedUrl;
  } catch { toast.error('Cannot preview this file'); return; }

  if (!url) { downloadFile(file.storage_path, file.original_name); return; }

  if (isImage(ext)) {
    showImageLightbox(url, file.original_name); return;
  }
  if (isVideo(ext)) {
    showMediaModal(url, 'video', file.original_name); return;
  }
  if (isAudio(ext)) {
    showMediaModal(url, 'audio', file.original_name); return;
  }
  if (isPDF(ext)) {
    showPDFModal(url, file.original_name); return;
  }
  // Default: download
  downloadFile(file.storage_path, file.original_name);
}

function showImageLightbox(src, name) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lightbox-close"><span class="material-symbols-outlined">close</span></div>
    <img class="lightbox-img" src="${src}" alt="${name}">
    <div class="lightbox-caption">${name}</div>`;
  document.body.appendChild(lb);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox-close')) lb.remove(); });
}

function showMediaModal(src, type, name) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay media-modal';
  const tag = type === 'video' ? 'video' : 'audio';
  overlay.innerHTML = `
    <div class="modal" style="max-width:${type==='video'?'640px':'400px'}">
      <div class="modal-header">
        <span class="modal-title">${name}</span>
        <button class="btn-icon" id="media-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body" style="padding:0 0 16px">
        <${tag} class="media-player" src="${src}" controls ${type==='video'?'style="width:100%"':''}></${tag}>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#media-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function showPDFModal(src, name) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:90vw;max-height:90vh">
      <div class="modal-header">
        <span class="modal-title">${name}</span>
        <button class="btn-icon" id="pdf-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body" style="padding:0">
        <iframe class="pdf-frame" src="${src}"></iframe>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#pdf-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ---- Selection handling ----
function toggleSelectCard(card, file) {
  card.classList.toggle('selected');
  updateSelectionBar();
}

function updateSelectionBar() {
  const selected = document.querySelectorAll('.file-card.selected, .list-item.selected');
  let bar = document.getElementById('selection-bar');
  if (!selected.length) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'selection-bar';
    bar.className = 'selection-bar';
    document.body.appendChild(bar);
  }
  bar.innerHTML = `
    <button class="btn-icon" id="sel-clear"><span class="material-symbols-outlined">close</span></button>
    <span class="selection-count">${selected.length} selected</span>
    <button class="btn btn-outlined btn-sm" id="sel-download">
      <span class="material-symbols-outlined">download</span>Download</button>
    <button class="btn btn-danger btn-sm" id="sel-delete">
      <span class="material-symbols-outlined">delete</span>Delete</button>`;
  bar.querySelector('#sel-clear').addEventListener('click', clearSelection);
}

function clearSelection() {
  document.querySelectorAll('.file-card.selected, .list-item.selected').forEach(c => c.classList.remove('selected'));
  document.getElementById('selection-bar')?.remove();
}

// ---- Skeleton Loaders ----
export function renderSkeletons(container, count = 8) {
  container.innerHTML = '';
  const grid = el('div', 'files-grid');
  for (let i = 0; i < count; i++) {
    grid.innerHTML += `
      <div class="skeleton-card">
        <div class="skeleton skeleton-thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line" style="width:80%"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>`;
  }
  container.appendChild(grid);
}
