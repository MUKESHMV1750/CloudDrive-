(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };

  // js/supabase.js
  var SUPABASE_URL, SUPABASE_ANON, createClient, sb, BUCKET, STORAGE_LIMIT;
  var init_supabase = __esm({
    "js/supabase.js"() {
      SUPABASE_URL = "https://qzponjtndrbsjdpplelr.supabase.co";
      SUPABASE_ANON = "sb_publishable_DyXzJOxsa42WDRB5x_1Ivg_DZ13u0m7";
      ({ createClient } = supabase);
      sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });
      BUCKET = "drive-storage";
      STORAGE_LIMIT = 15 * 1024 * 1024 * 1024;
    }
  });

  // js/notification.js
  function getContainer() {
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }
  function showToast(message, type = "", duration = 3e3, action = null) {
    const c = getContainer();
    const icons = { success: "check_circle", error: "error", warning: "warning", info: "info", "": "notifications" };
    const icon = icons[type] || "notifications";
    const toast2 = document.createElement("div");
    toast2.className = `toast${type ? " " + type : ""}`;
    toast2.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span class="toast-text">${message}</span>
    ${action ? `<button class="toast-action">${action.label}</button>` : ""}
    <span class="material-symbols-outlined" style="font-size:18px;cursor:pointer;opacity:.7" data-close>close</span>
  `;
    c.appendChild(toast2);
    if (action) {
      toast2.querySelector(".toast-action").addEventListener("click", () => {
        action.fn();
        remove();
      });
    }
    toast2.querySelector("[data-close]").addEventListener("click", remove);
    const timer = setTimeout(remove, duration);
    function remove() {
      clearTimeout(timer);
      toast2.style.opacity = "0";
      toast2.style.transform = "translateY(8px)";
      toast2.style.transition = "0.3s ease";
      setTimeout(() => {
        if (toast2.parentNode)
          toast2.parentNode.removeChild(toast2);
      }, 300);
    }
    return { remove };
  }
  var container, toast;
  var init_notification = __esm({
    "js/notification.js"() {
      container = null;
      toast = {
        success: (msg, action) => showToast(msg, "success", 3e3, action),
        error: (msg, action) => showToast(msg, "error", 4e3, action),
        warning: (msg, action) => showToast(msg, "warning", 3500, action),
        info: (msg, action) => showToast(msg, "info", 3e3, action)
      };
    }
  });

  // js/utils.js
  function formatSize(bytes) {
    if (!bytes || bytes === 0)
      return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }
  function formatDate(dateStr, style = "medium") {
    if (!dateStr)
      return "\u2014";
    const d = new Date(dateStr);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 6e4);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (style === "relative") {
      if (diffMin < 1)
        return "Just now";
      if (diffMin < 60)
        return `${diffMin}m ago`;
      if (diffHour < 24)
        return `${diffHour}h ago`;
      if (diffDay < 7)
        return `${diffDay}d ago`;
    }
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  }
  function getExt(filename) {
    return filename.split(".").pop().toLowerCase();
  }
  function getFileCategory(ext) {
    const cats = {
      image: ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico"],
      video: ["mp4", "avi", "mov", "mkv", "webm", "flv"],
      audio: ["mp3", "wav", "ogg", "flac", "aac", "m4a"],
      pdf: ["pdf"],
      doc: ["doc", "docx"],
      xls: ["xls", "xlsx", "csv"],
      ppt: ["ppt", "pptx"],
      archive: ["zip", "rar", "7z", "tar", "gz"],
      code: ["js", "ts", "html", "css", "php", "py", "java", "json", "xml", "sql", "sh", "yaml", "yml"],
      text: ["txt", "md", "log"],
      apk: ["apk", "exe", "dmg"]
    };
    for (const [cat, exts] of Object.entries(cats)) {
      if (exts.includes(ext))
        return cat;
    }
    return "other";
  }
  function getFileIcon(ext) {
    const icons = {
      pdf: "picture_as_pdf",
      doc: "article",
      docx: "article",
      xls: "table_chart",
      xlsx: "table_chart",
      csv: "table_chart",
      ppt: "slideshow",
      pptx: "slideshow",
      jpg: "image",
      jpeg: "image",
      png: "image",
      gif: "image",
      svg: "image",
      webp: "image",
      mp4: "movie",
      avi: "movie",
      mov: "movie",
      mkv: "movie",
      mp3: "music_note",
      wav: "music_note",
      ogg: "music_note",
      flac: "music_note",
      zip: "folder_zip",
      rar: "folder_zip",
      "7z": "folder_zip",
      js: "code",
      ts: "code",
      html: "code",
      css: "code",
      php: "code",
      py: "code",
      java: "code",
      json: "data_object",
      xml: "code",
      txt: "description",
      md: "description",
      log: "description",
      apk: "android",
      exe: "apps"
    };
    return icons[ext] || "insert_drive_file";
  }
  function getIconClass(ext) {
    const cat = getFileCategory(ext);
    const map = {
      pdf: "ft-pdf",
      doc: "ft-doc",
      xls: "ft-xls",
      ppt: "ft-ppt",
      image: "ft-img",
      video: "ft-vid",
      audio: "ft-aud",
      archive: "ft-zip",
      code: "ft-code",
      text: "ft-txt"
    };
    return map[cat] || "ft-other";
  }
  function getInitials(name = "") {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  }
  async function logActivity(action, fileId = null, folderId = null, metadata = {}) {
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user)
        return;
      await sb.from("activity_logs").insert({
        user_id: user.id,
        action,
        file_id: fileId || null,
        folder_id: folderId || null,
        metadata
      });
    } catch {
    }
  }
  function el(tag, cls = "", attrs = {}) {
    const e = document.createElement(tag);
    if (cls)
      e.className = cls;
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }
  function confirmDialog(title, message, onConfirm, danger = true) {
    const overlay = el("div", "modal-overlay");
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
        <button class="btn ${danger ? "btn-danger" : "btn-primary"}" id="confirm-ok">Confirm</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelectorAll(".cancel-btn").forEach((b) => b.addEventListener("click", () => overlay.remove()));
    overlay.querySelector("#confirm-ok").addEventListener("click", () => {
      overlay.remove();
      onConfirm();
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        overlay.remove();
    });
  }
  var init_utils = __esm({
    "js/utils.js"() {
      init_supabase();
    }
  });

  // js/app.js
  init_supabase();

  // js/auth.js
  init_supabase();
  init_notification();
  init_utils();
  async function getCurrentUser() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session)
      return null;
    const { data: profile } = await sb.from("users").select("*").eq("id", session.user.id).single();
    return profile;
  }
  async function requireAuth(adminOnly = false) {
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
      return null;
    }
    if (user.is_disabled) {
      await sb.auth.signOut();
      window.location.href = "login.html?err=disabled";
      return null;
    }
    if (adminOnly && user.role !== "admin") {
      window.location.href = "dashboard.html";
      return null;
    }
    return user;
  }
  async function logout() {
    try {
      await logActivity("logout");
    } catch {
    }
    await sb.auth.signOut();
    window.location.href = "login.html";
  }

  // js/app.js
  init_notification();
  init_utils();
  var currentUser = null;
  async function initApp(opts = {}) {
    const { adminOnly = false } = opts;
    initTheme();
    setupKeyboardShortcuts();
    currentUser = await requireAuth(adminOnly);
    if (!currentUser)
      return null;
    initSidebar(currentUser);
    initTopbar(currentUser);
    markActiveNav();
    initStorageMeter(currentUser);
    return currentUser;
  }
  function initTheme() {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcons(next);
  }
  function updateThemeIcons(theme) {
    document.querySelectorAll("[data-theme-icon]").forEach((el2) => {
      el2.textContent = theme === "dark" ? "light_mode" : "dark_mode";
    });
  }
  function initSidebar(user) {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar)
      return;
    if (user.role === "admin") {
      const adminNav = sidebar.querySelector(".admin-nav");
      if (adminNav)
        adminNav.classList.remove("hidden");
    }
  }
  function markActiveNav() {
    const path = window.location.pathname.split("/").pop() || "dashboard.html";
    document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
      if (item.dataset.page === path)
        item.classList.add("active");
    });
  }
  function initTopbar(user) {
    const avatarBtn = document.getElementById("user-avatar-btn");
    const avatarMenu = document.getElementById("user-menu");
    const nameEl = document.getElementById("user-display-name");
    const emailEl = document.getElementById("user-display-email");
    const avatarEl = document.getElementById("topbar-avatar");
    if (nameEl)
      nameEl.textContent = user.name || "User";
    if (emailEl)
      emailEl.textContent = user.email || "";
    if (avatarEl) {
      const init = getInitials(user.name || user.email || "?");
      if (user.photo) {
        avatarEl.innerHTML = `<img src="${user.photo}" class="avatar" alt="${init}">`;
      } else {
        avatarEl.textContent = init;
      }
    }
    if (avatarBtn && avatarMenu) {
      avatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        avatarMenu.classList.toggle("hidden");
      });
      document.addEventListener("click", () => avatarMenu?.classList.add("hidden"));
    }
    document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        await logout();
      });
    });
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((btn) => {
      btn.addEventListener("click", toggleTheme);
      const theme = localStorage.getItem("theme") || "light";
      updateThemeIcons(theme);
    });
    const ham = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (ham && sidebar) {
      ham.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay?.classList.toggle("visible");
      });
      overlay?.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("visible");
      });
    }
  }
  async function initStorageMeter(user) {
    const fill = document.getElementById("storage-fill");
    const used = document.getElementById("storage-used");
    const free = document.getElementById("storage-free");
    if (!fill)
      return;
    const limit = user.storage_limit || 15 * 1024 * 1024 * 1024;
    const usedByte = user.storage_used || 0;
    const pct = Math.min(usedByte / limit * 100, 100);
    fill.style.width = `${pct}%`;
    fill.className = "storage-fill" + (pct > 90 ? " danger" : pct > 70 ? " warning" : "");
    if (used)
      used.textContent = formatSize(usedByte);
    if (free)
      free.textContent = formatSize(limit - usedByte);
  }
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName))
        return;
      if (e.key === "/" || e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay").forEach((m) => m.remove());
        document.querySelectorAll(".dropdown-menu").forEach((d) => d.remove());
        document.querySelectorAll(".context-menu").forEach((d) => d.remove());
      }
      if (e.key === "u" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.getElementById("upload-trigger")?.click();
      }
    });
  }

  // js/trash.js
  init_supabase();
  init_notification();
  init_utils();

  // js/files.js
  init_supabase();
  init_notification();
  init_utils();
  async function restoreFile(fileId) {
    const { error } = await sb.from("files").update({ is_deleted: false, deleted_at: null }).eq("id", fileId);
    if (error)
      throw error;
    await logActivity("restore", fileId);
    toast.success("File restored");
  }
  async function permanentDelete(fileId, storagePath) {
    await sb.storage.from(BUCKET).remove([storagePath]);
    const { error } = await sb.from("files").delete().eq("id", fileId);
    if (error)
      throw error;
    toast.success("File permanently deleted");
  }

  // js/trash.js
  var currentUser2 = null;
  function setUser(u) {
    currentUser2 = u;
  }
  async function fetchTrashFiles() {
    let q = sb.from("files").select("*, users:user_id(name, email)").eq("is_deleted", true).order("deleted_at", { ascending: false });
    if (currentUser2.role !== "admin")
      q = q.eq("user_id", currentUser2.id);
    const { data, error } = await q;
    if (error)
      throw error;
    return data || [];
  }
  async function restoreAll(files) {
    for (const f of files)
      await restoreFile(f.id);
    toast.success(`${files.length} file(s) restored`);
  }
  async function emptyTrash(files) {
    for (const f of files) {
      await sb.storage.from(BUCKET).remove([f.storage_path]).catch(() => {
      });
    }
    if (currentUser2.role === "admin") {
      await sb.from("files").delete().eq("is_deleted", true);
    } else {
      await sb.from("files").delete().eq("is_deleted", true).eq("user_id", currentUser2.id);
    }
    toast.success("Trash emptied");
  }
  function renderTrash(files, container2, onRefresh) {
    container2.innerHTML = "";
    if (!files.length) {
      container2.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><span class="material-symbols-outlined">delete</span></div>
        <h3>Trash is empty</h3>
        <p>Items deleted from Drive will appear here.</p>
      </div>`;
      return;
    }
    const grid = document.createElement("div");
    grid.className = "files-grid";
    files.forEach((file) => {
      const ext = getExt(file.original_name || file.file_name);
      const icon = getFileIcon(ext);
      const cls = getIconClass(ext);
      const card = document.createElement("div");
      card.className = "file-card";
      card.style.opacity = "0.85";
      card.innerHTML = `
      <div class="file-thumb ${ext}">
        <span class="material-symbols-outlined file-thumb-icon ${cls}">${icon}</span>
      </div>
      <div class="file-info">
        <div class="file-name" title="${file.original_name}">${file.original_name}</div>
        <div class="file-meta">
          <span>${formatSize(file.file_size)}</span>
          <span>\xB7</span>
          <span>Deleted ${formatDate(file.deleted_at, "relative")}</span>
        </div>
      </div>
      <div class="file-actions" style="opacity:1">
        <button class="btn btn-outlined btn-sm restore-btn" style="flex:1">
          <span class="material-symbols-outlined" style="font-size:14px">restore</span>Restore</button>
        <button class="btn btn-danger btn-sm perm-del-btn">
          <span class="material-symbols-outlined" style="font-size:14px">delete_forever</span></button>
      </div>`;
      card.querySelector(".restore-btn").addEventListener("click", async (e) => {
        e.stopPropagation();
        await restoreFile(file.id);
        card.remove();
        onRefresh?.();
      });
      card.querySelector(".perm-del-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        confirmDialog(
          "Delete Forever",
          `Permanently delete "<strong>${file.original_name}</strong>"? This cannot be undone.`,
          async () => {
            await permanentDelete(file.id, file.storage_path);
            card.remove();
            onRefresh?.();
          }
        );
      });
      grid.appendChild(card);
    });
    container2.appendChild(grid);
  }

  // js/trash-entry.js
  init_utils();
  init_notification();
  (async function() {
    const user = await initApp();
    setUser(user);
    let trashFiles = [];
    async function load() {
      const c = document.getElementById("trash-content");
      c.innerHTML = '<div style="text-align:center;padding:40px"><div class="loading-spinner" style="margin:auto"></div></div>';
      trashFiles = await fetchTrashFiles();
      renderTrash(trashFiles, c, load);
    }
    document.getElementById("restore-all-btn").addEventListener("click", () => {
      if (!trashFiles.length)
        return;
      confirmDialog("Restore All", `Restore all ${trashFiles.length} file(s)?`, async () => {
        await restoreAll(trashFiles);
        load();
      }, false);
    });
    document.getElementById("empty-trash-btn").addEventListener("click", () => {
      if (!trashFiles.length)
        return;
      confirmDialog("Empty Trash", "Permanently delete all files in trash? This cannot be undone.", async () => {
        await emptyTrash(trashFiles);
        load();
      });
    });
    load();
  })();
})();
