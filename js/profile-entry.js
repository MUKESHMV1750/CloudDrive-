
  import { initApp } from './app.js';
  import { initProfile } from './profile.js';
(async function() {


  const user = await initApp();
  await initProfile(user);


})();

