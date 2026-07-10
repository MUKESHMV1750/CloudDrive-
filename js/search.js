// ============================================================
// search.js — Search & Filter Module
// ============================================================
import { sb }    from './supabase.js';
import { toast } from './notification.js';

let currentUser = null;
export function setUser(u) { currentUser = u; }

/**
 * Search files by query + optional filters
 */
export async function searchFiles({
  query = '',
  category = '',    // image|video|audio|doc|xls|ppt|archive|code|text
  dateFrom = null,
  dateTo   = null,
  minSize  = null,
  maxSize  = null,
  folderId = null,
  sortBy   = 'date_desc',
  limit    = 100
} = {}) {

  let q = sb.from('files')
    .select('*, users:user_id(name, email, photo)')
    .eq('is_deleted', false)
    .eq('user_id', currentUser.id);

  // Text search on original_name
  if (query.trim()) {
    q = q.ilike('original_name', `%${query.trim()}%`);
  }

  // Category filter via file extension
  if (category) {
    const extMap = {
      image:   ['jpg','jpeg','png','gif','svg','webp','bmp'],
      video:   ['mp4','avi','mov','mkv','webm'],
      audio:   ['mp3','wav','ogg','flac','aac'],
      pdf:     ['pdf'],
      doc:     ['doc','docx'],
      xls:     ['xls','xlsx','csv'],
      ppt:     ['ppt','pptx'],
      archive: ['zip','rar','7z','tar','gz'],
      code:    ['js','ts','html','css','php','py','java','json','xml','sql'],
      text:    ['txt','md','log'],
    };
    const exts = extMap[category];
    if (exts) {
      q = q.or(exts.map(e => `file_ext.eq.${e}`).join(','));
    }
  }

  // Date range
  if (dateFrom) q = q.gte('created_at', new Date(dateFrom).toISOString());
  if (dateTo)   q = q.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString());

  // Size range (in bytes)
  if (minSize !== null) q = q.gte('file_size', minSize);
  if (maxSize !== null) q = q.lte('file_size', maxSize);

  // Folder filter
  if (folderId) q = q.eq('folder_id', folderId);

  // Sorting
  const sortMap = {
    date_desc:  { col: 'created_at',   asc: false },
    date_asc:   { col: 'created_at',   asc: true  },
    name_asc:   { col: 'original_name',asc: true  },
    name_desc:  { col: 'original_name',asc: false },
    size_desc:  { col: 'file_size',    asc: false },
    size_asc:   { col: 'file_size',    asc: true  },
  };
  const sort = sortMap[sortBy] || sortMap.date_desc;
  q = q.order(sort.col, { ascending: sort.asc }).limit(limit);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// ---- Search folders ----
export async function searchFolders(query) {
  if (!query.trim()) return [];
  const { data, error } = await sb.from('folders')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('is_deleted', false)
    .ilike('folder_name', `%${query.trim()}%`)
    .order('folder_name')
    .limit(20);
  if (error) return [];
  return data || [];
}

// ---- Render search results ----
export function renderSearchResults(files, folders, container) {
  const { renderGrid } = window.__files || {};
  if (renderGrid) renderGrid(files, folders, container, {
    emptyTitle: 'No results found',
    emptyMsg: 'Try different search terms or adjust your filters.'
  });
}

// ---- Filter chips ----
export function initFilterChips(onChange) {
  document.querySelectorAll('.filter-chip[data-category]').forEach(chip => {
    chip.addEventListener('click', () => {
      const active = chip.classList.contains('active');
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      if (!active) chip.classList.add('active');
      onChange(active ? '' : chip.dataset.category);
    });
  });
}

// ---- Sort select ----
export function initSortDropdown(onChange) {
  const sel = document.getElementById('sort-select');
  if (sel) sel.addEventListener('change', () => onChange(sel.value));
}
