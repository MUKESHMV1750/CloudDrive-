// ============================================================
// utils.js — Shared Helper Functions
// ============================================================
import { sb } from './supabase.js';

// ---- Format file size ----
export function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---- Format date ----
export function formatDate(dateStr, style = 'medium') {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (style === 'relative') {
    if (diffMin < 1)   return 'Just now';
    if (diffMin < 60)  return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7)   return `${diffDay}d ago`;
  }
  return d.toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' });
}

// ---- Get file extension ----
export function getExt(filename) {
  return filename.split('.').pop().toLowerCase();
}

// ---- Get file type category ----
export function getFileCategory(ext) {
  const cats = {
    image:    ['jpg','jpeg','png','gif','svg','webp','bmp','ico'],
    video:    ['mp4','avi','mov','mkv','webm','flv'],
    audio:    ['mp3','wav','ogg','flac','aac','m4a'],
    pdf:      ['pdf'],
    doc:      ['doc','docx'],
    xls:      ['xls','xlsx','csv'],
    ppt:      ['ppt','pptx'],
    archive:  ['zip','rar','7z','tar','gz'],
    code:     ['js','ts','html','css','php','py','java','json','xml','sql','sh','yaml','yml'],
    text:     ['txt','md','log'],
    apk:      ['apk','exe','dmg']
  };
  for (const [cat, exts] of Object.entries(cats)) {
    if (exts.includes(ext)) return cat;
  }
  return 'other';
}

// ---- Get Material Icon name for file type ----
export function getFileIcon(ext) {
  const icons = {
    pdf:'picture_as_pdf', doc:'article', docx:'article',
    xls:'table_chart', xlsx:'table_chart', csv:'table_chart',
    ppt:'slideshow', pptx:'slideshow',
    jpg:'image', jpeg:'image', png:'image', gif:'image', svg:'image', webp:'image',
    mp4:'movie', avi:'movie', mov:'movie', mkv:'movie',
    mp3:'music_note', wav:'music_note', ogg:'music_note', flac:'music_note',
    zip:'folder_zip', rar:'folder_zip', '7z':'folder_zip',
    js:'code', ts:'code', html:'code', css:'code', php:'code',
    py:'code', java:'code', json:'data_object', xml:'code',
    txt:'description', md:'description', log:'description',
    apk:'android', exe:'apps',
  };
  return icons[ext] || 'insert_drive_file';
}

// ---- Get icon color class ----
export function getIconClass(ext) {
  const cat = getFileCategory(ext);
  const map = { pdf:'ft-pdf', doc:'ft-doc', xls:'ft-xls', ppt:'ft-ppt',
                 image:'ft-img', video:'ft-vid', audio:'ft-aud',
                 archive:'ft-zip', code:'ft-code', text:'ft-txt' };
  return map[cat] || 'ft-other';
}

// ---- Debounce ----
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ---- Generate initials from name ----
export function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

// ---- Generate unique ID ----
export function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

// ---- Sanitize filename ----
export function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._\-\s]/g, '_').trim();
}

// ---- Generate storage path ----
export function getStoragePath(userId, filename) {
  const ext  = getExt(filename);
  const cat  = getFileCategory(ext);
  const ts   = Date.now();
  const safe = sanitizeFilename(filename.replace(`.${ext}`, ''));
  return `${userId}/${cat}/${ts}_${safe}.${ext}`;
}

// ---- Log activity ----
export async function logActivity(action, fileId = null, folderId = null, metadata = {}) {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from('activity_logs').insert({
      user_id: user.id, action,
      file_id: fileId || null,
      folder_id: folderId || null,
      metadata
    });
  } catch {}
}

// ---- Close all dropdowns ----
export function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.remove());
}

// ---- Close all modals ----
export function closeModal(el) {
  if (el) el.remove();
}

// ---- Create element helper ----
export function el(tag, cls = '', attrs = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

// ---- Build Avatar HTML ----
export function avatarHtml(user, size = '') {
  const cls  = `avatar${size ? ' avatar-' + size : ''}`;
  const init = getInitials(user.name || user.email || '?');
  if (user.photo) {
    return `<img src="${user.photo}" class="${cls}" alt="${init}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` +
           `<div class="${cls}" style="display:none">${init}</div>`;
  }
  return `<div class="${cls}">${init}</div>`;
}

// ---- Confirm dialog (simple) ----
export function confirmDialog(title, message, onConfirm, danger = true) {
  const overlay = el('div', 'modal-overlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="btn-icon cancel-btn"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);font-size:14px">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outlined cancel-btn">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelectorAll('.cancel-btn').forEach(b => b.addEventListener('click', () => overlay.remove()));
  overlay.querySelector('#confirm-ok').addEventListener('click', () => { overlay.remove(); onConfirm(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ---- Is image type ----
export function isImage(ext) { return getFileCategory(ext) === 'image'; }
export function isVideo(ext) { return getFileCategory(ext) === 'video'; }
export function isAudio(ext) { return getFileCategory(ext) === 'audio'; }
export function isPDF(ext)   { return ext === 'pdf'; }
