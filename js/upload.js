// ============================================================
// upload.js — File Upload Module
// ============================================================
import { sb, BUCKET }    from './supabase.js';
import { toast }         from './notification.js';
import { logActivity, getStoragePath, formatSize, getExt } from './utils.js';
import { createFolder } from './folders.js';

let currentUser = null;
let onUploadDone = null;
let currentFolderId = null;

export function setCurrentUploadFolder(id) {
  currentFolderId = id;
}

export function initUpload(user, onDone) {
  currentUser  = user;
  onUploadDone = onDone;

  setupDragDrop();
  setupFileInput();
  setupUploadBtn();
}

// ---- File Input ----
function setupFileInput() {
  let input = document.getElementById('file-input');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.id   = 'file-input';
    input.multiple = true;
    input.style.display = 'none';
    document.body.appendChild(input);
  }
  input.addEventListener('change', e => {
    if (e.target.files?.length) uploadFiles([...e.target.files], currentFolderId);
    e.target.value = '';
  });

  // Trigger from upload buttons (page header + topbar)
  document.getElementById('upload-trigger')?.addEventListener('click', () => input.click());
  document.getElementById('upload-trigger-topbar')?.addEventListener('click', () => input.click());
}

// ---- Upload Button (FAB) ----
function setupUploadBtn() {
  const fab = document.getElementById('fab-upload');
  if (fab) fab.addEventListener('click', () => document.getElementById('file-input')?.click());
}

// ---- Drag & Drop ----
function setupDragDrop() {
  const zone   = document.getElementById('drop-zone');
  const body   = document.body;

  // Highlight drop zone on drag-over body
  body.addEventListener('dragover', e => {
    e.preventDefault();
    zone?.classList.add('drag-over');
    if (zone && !zone.classList.contains('active')) zone.style.display = 'flex';
  });

  body.addEventListener('dragleave', e => {
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
      zone?.classList.remove('drag-over');
    }
  });

  body.addEventListener('drop', async e => {
    e.preventDefault();
    zone?.classList.remove('drag-over');
    
    const items = e.dataTransfer.items;
    if (items && items.length > 0 && items[0].webkitGetAsEntry) {
      showUploadPanel();
      const promises = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            promises.push(processEntry(entry, currentFolderId));
          } else {
            const file = item.getAsFile();
            if (file) promises.push(uploadSingleFile(file, currentFolderId));
          }
        }
      }
      await Promise.all(promises);
    } else {
      const files = [...(e.dataTransfer.files || [])];
      if (files.length) uploadFiles(files, currentFolderId);
    }
  });

  zone?.addEventListener('click', () => document.getElementById('file-input')?.click());
}

async function processEntry(entry, parentFolderId) {
  if (entry.isFile) {
    return new Promise(resolve => {
      entry.file(async file => {
        await uploadSingleFile(file, parentFolderId);
        resolve();
      });
    });
  } else if (entry.isDirectory) {
    try {
      const folder = await createFolder(entry.name, parentFolderId);
      return new Promise((resolve) => {
        const reader = entry.createReader();
        reader.readEntries(async (entries) => {
          const promises = entries.map(e => processEntry(e, folder.id));
          await Promise.all(promises);
          resolve();
        });
      });
    } catch (err) {
      toast.error(`Failed to create folder: ${entry.name}`);
    }
  }
}

// ---- Upload Queue ----
export async function uploadFiles(files, folderId = null) {
  if (!currentUser) return;
  if (!files.length) return;

  showUploadPanel();

  for (const file of files) {
    await uploadSingleFile(file, folderId);
  }
}

async function uploadSingleFile(file, folderId) {
  const itemId   = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ext      = getExt(file.name);
  const path     = getStoragePath(currentUser.id, file.name);

  addUploadItem(itemId, file.name, file.size);
  updateUploadStatus(itemId, 'Uploading…', 0);

  try {
    // Upload to Supabase Storage
    const { data: storageData, error: storageErr } = await sb.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (storageErr) throw storageErr;

    updateUploadStatus(itemId, 'Saving…', 90);

    // Insert file record
    const { data: fileRec, error: dbErr } = await sb.from('files').insert({
      user_id:       currentUser.id,
      folder_id:     folderId || null,
      file_name:     path.split('/').pop(),
      original_name: file.name,
      storage_path:  path,
      file_size:     file.size,
      file_type:     file.type || 'application/octet-stream',
    }).select().single();

    if (dbErr) throw dbErr;

    updateUploadStatus(itemId, 'Done', 100, true);
    await logActivity('upload', fileRec.id, folderId, { name: file.name, size: file.size });
    toast.success(`"${file.name}" uploaded`);

    if (onUploadDone) onUploadDone(fileRec);

  } catch (err) {
    updateUploadStatus(itemId, `Error: ${err.message}`, 0, false, true);
    toast.error(`Upload failed: ${file.name}`);
    console.error('Upload error:', err);
  }
}

// ---- Upload Panel UI ----
function showUploadPanel() {
  let panel = document.getElementById('upload-panel');
  if (panel) return;

  panel = document.createElement('div');
  panel.id        = 'upload-panel';
  panel.className = 'upload-panel';
  panel.innerHTML = `
    <div class="upload-panel-header">
      <span class="upload-panel-title">Uploading files</span>
      <button class="btn-icon" style="color:#fff" id="upload-panel-close">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div id="upload-panel-body"></div>
  `;
  document.body.appendChild(panel);

  document.getElementById('upload-panel-close').addEventListener('click', () => {
    panel.remove();
  });
}

function addUploadItem(id, name, size) {
  const body = document.getElementById('upload-panel-body');
  if (!body) return;

  const item = document.createElement('div');
  item.id        = id;
  item.className = 'upload-item';
  item.innerHTML = `
    <div class="upload-item-icon" style="background:var(--bg-hover)">
      <span class="material-symbols-outlined" style="color:var(--primary)">upload_file</span>
    </div>
    <div class="upload-item-info">
      <div class="upload-item-name">${name}</div>
      <div class="progress upload-item-progress"><div class="progress-bar" style="width:0%"></div></div>
      <div class="upload-item-status text-muted">${formatSize(size)}</div>
    </div>
  `;
  body.appendChild(item);
}

function updateUploadStatus(id, status, pct, done = false, error = false) {
  const item = document.getElementById(id);
  if (!item) return;
  const bar  = item.querySelector('.progress-bar');
  const stat = item.querySelector('.upload-item-status');
  if (bar)  { bar.style.width = `${pct}%`; bar.className = `progress-bar${error?' danger':done?' success':''}`; }
  if (stat) { stat.textContent = status; stat.className = `upload-item-status ${error?'text-danger':done?'text-success':'text-muted'}`; }
}
