(() => {
  // js/supabase.js
  var SUPABASE_URL = "https://qzponjtndrbsjdpplelr.supabase.co";
  var SUPABASE_ANON = "sb_publishable_DyXzJOxsa42WDRB5x_1Ivg_DZ13u0m7";
  var { createClient } = supabase;
  var sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  var STORAGE_LIMIT = 15 * 1024 * 1024 * 1024;

  // js/app.js
  function initTheme() {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
  }

  // js/404-entry.js
  (async function() {
    initTheme();
  })();
})();
