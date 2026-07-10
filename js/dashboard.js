// ============================================================
// dashboard.js — My Drive Page Controller
// ============================================================
import { initApp, initViewToggle, initGlobalSearch, showContextMenu } from './app.js';
import { initUpload }   from './upload.js';
import { fetchFiles, renderGrid, renderList, renderSkeletons, setUser as setFilesUser } from './files.js';
import { fetchFolders, showNewFolderModal, setUser as setFoldersUser } from './folders.js';
import { searchFiles, searchFolders, initFilterChips } from './search.js';
import { setUser as setShareUser } from './share.js';
import { debounce } from './utils.js';

// Expose context menu globally for files.js
window.__app = { showContextMenu };

let user    = null;
let viewMode = 'grid';
let sortBy   = 'date_desc';
let filter   = '';

async function main() {
  user = await initApp();
  if (!user) return;

  // Set user for modules
  setFilesUser(user);
  setFoldersUser(user);
  setShareUser(user);

  // Init upload
  initUpload(user, () => loadDrive());

  // View toggle
  viewMode = initViewToggle(mode => { viewMode = mode; renderContent(window.__files__, window.__folders__); });

  // Global search
  initGlobalSearch(debounce(async q => {
    if (!q) { loadDrive(); return; }
    const [files, folders] = await Promise.all([searchFiles({ query: q, sortBy }), searchFolders(q)]);
    renderContent(files, folders);
  }, 300));

  // Sort
  document.getElementById('sort-select')?.addEventListener('change', e => {
    sortBy = e.target.value;
    loadDrive();
  });

  // Filter chips
  initFilterChips(cat => { filter = cat; loadDrive(); });

  // New Folder button
  document.getElementById('new-folder-btn')?.addEventListener('click', () => {
    showNewFolderModal(null, folder => {
      loadDrive();
    });
  });

  // Load initial data
  await loadDrive();
}

async function loadDrive() {
  const container = document.getElementById('content-area');
  if (!container) return;
  renderSkeletons(container);

  try {
    const [files, folders] = await Promise.all([
      fetchFiles({ sortBy, category: filter }),
      fetchFolders()
    ]);
    window.__files__   = files;
    window.__folders__ = folders;
    renderContent(files, folders);
  } catch (err) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon"><span class="material-symbols-outlined">error</span></div>
      <h3>Error loading files</h3><p>${err.message}</p></div>`;
  }
}

function renderContent(files, folders) {
  const container = document.getElementById('content-area');
  if (!container || !files || !folders) return;

  if (viewMode === 'grid') {
    renderGrid(files, folders, container, {
      emptyTitle: 'Your Drive is empty',
      emptyMsg: 'Drop files here or click Upload to get started.',
      showUpload: true
    });
  } else {
    renderList(files, folders, container);
  }
}

main();
