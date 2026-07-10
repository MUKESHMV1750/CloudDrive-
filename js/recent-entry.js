
  import { initApp, initViewToggle } from './app.js';
  import { fetchFiles, renderGrid, renderList, renderSkeletons, setUser } from './files.js';

(async function() {


  const user = await initApp();
  setUser(user);

  let viewMode = initViewToggle(mode => { viewMode = mode; load(); });

  async function load() {
    const c = document.getElementById('content-area');
    renderSkeletons(c);
    const files = await fetchFiles({ recent: true, limit: 50 });
    if (viewMode === 'grid') renderGrid(files, [], c, {
      emptyTitle: 'No recent files',
      emptyMsg: 'Files you open or edit will appear here.'
    });
    else renderList(files, [], c);
  }

  load();


})();

