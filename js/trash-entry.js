
  import { initApp }  from './app.js';
  import { fetchTrashFiles, renderTrash, restoreAll, emptyTrash, setUser } from './trash.js';
  import { confirmDialog } from './utils.js';
  import { toast } from './notification.js';

(async function() {




  const user = await initApp();
  setUser(user);

  let trashFiles = [];

  async function load() {
    const c = document.getElementById('trash-content');
    c.innerHTML = '<div style="text-align:center;padding:40px"><div class="loading-spinner" style="margin:auto"></div></div>';
    trashFiles = await fetchTrashFiles();
    renderTrash(trashFiles, c, load);
  }

  document.getElementById('restore-all-btn').addEventListener('click', () => {
    if (!trashFiles.length) return;
    confirmDialog('Restore All', `Restore all ${trashFiles.length} file(s)?`, async () => {
      await restoreAll(trashFiles); load();
    }, false);
  });

  document.getElementById('empty-trash-btn').addEventListener('click', () => {
    if (!trashFiles.length) return;
    confirmDialog('Empty Trash', 'Permanently delete all files in trash? This cannot be undone.', async () => {
      await emptyTrash(trashFiles); load();
    });
  });

  load();


})();

