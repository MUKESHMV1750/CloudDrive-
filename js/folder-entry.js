
  import { initApp, initViewToggle, showContextMenu } from './app.js';
  import { initUpload }  from './upload.js';
  import { fetchFiles, renderGrid, renderList, renderSkeletons, setUser as setFilesUser } from './files.js';
  import { fetchFolders, showNewFolderModal, getBreadcrumb, renderBreadcrumb, setUser as setFoldersUser } from './folders.js';
  import { setUser as setShareUser } from './share.js';

(async function() {





  window.__app = { showContextMenu };

  const params   = new URLSearchParams(window.location.search);
  const folderId = params.get('id');
  const folderName = decodeURIComponent(params.get('name') || 'Folder');

  if (!folderId) { window.location.href = 'dashboard.html'; }

  const user = await initApp();
  setFilesUser(user); setFoldersUser(user); setShareUser(user);

  document.getElementById('folder-title').textContent = folderName;
  document.title = `${folderName} — CloudDrive`;

  // Breadcrumb
  const crumbs = await getBreadcrumb(folderId);
  renderBreadcrumb(crumbs, document.getElementById('breadcrumb-container'));

  // Upload into this folder
  initUpload(user, () => load());
  import('./upload.js').then(m => m.setCurrentUploadFolder(folderId));
  
  let viewMode = initViewToggle(mode => { viewMode = mode; load(); });

  async function load() {
    const c = document.getElementById('content-area');
    renderSkeletons(c);
    const [files, folders] = await Promise.all([
      fetchFiles({ folderId }),
      fetchFolders({ parentId: folderId })
    ]);
    if (viewMode === 'grid') renderGrid(files, folders, c, {
      emptyTitle: 'This folder is empty',
      emptyMsg: 'Upload files or create a subfolder.',
      showUpload: true
    });
    else renderList(files, folders, c);
  }

  document.getElementById('new-subfolder-btn').addEventListener('click', () => {
    showNewFolderModal(folderId, () => load());
  });

  load();


})();

