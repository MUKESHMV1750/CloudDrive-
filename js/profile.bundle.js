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
  var BUCKET = "drive-storage";
  var STORAGE_LIMIT = 15 * 1024 * 1024 * 1024;

  // js/notification.js
  var container = null;
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
  var toast = {
    success: (msg, action) => showToast(msg, "success", 3e3, action),
    error: (msg, action) => showToast(msg, "error", 4e3, action),
    warning: (msg, action) => showToast(msg, "warning", 3500, action),
    info: (msg, action) => showToast(msg, "info", 3e3, action)
  };

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

  // js/auth.js
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
  async function updatePassword(newPassword) {
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error)
      throw new Error(error.message);
  }

  // js/app.js
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
    document.querySelectorAll("[data-theme-icon]").forEach((el) => {
      el.textContent = theme === "dark" ? "light_mode" : "dark_mode";
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

  // js/profile.js
  var currentUser2 = null;
  async function initProfile(user) {
    currentUser2 = user;
    renderProfileForm(user);
    renderStorageInfo(user);
    initAvatarUpload(user);
    initPasswordChange();
  }
  function renderProfileForm(user) {
    const nameEl = document.getElementById("profile-name");
    const emailEl = document.getElementById("profile-email");
    const roleEl = document.getElementById("profile-role");
    const joinEl = document.getElementById("profile-joined");
    const avatarEl = document.getElementById("profile-avatar");
    if (nameEl)
      nameEl.value = user.name || "";
    if (emailEl)
      emailEl.value = user.email || "";
    if (roleEl)
      roleEl.textContent = user.role === "admin" ? "Administrator" : "User";
    if (joinEl)
      joinEl.textContent = `Member since ${formatDate(user.created_at)}`;
    if (avatarEl) {
      const init = getInitials(user.name || user.email);
      if (user.photo) {
        avatarEl.innerHTML = "";
        const img = document.createElement("img");
        img.className = "avatar avatar-xl";
        img.alt = init;
        img.onerror = function() {
          avatarEl.innerHTML = `<div class="avatar avatar-xl">${init}</div>`;
        };
        img.src = user.photo;
        avatarEl.appendChild(img);
      } else {
        avatarEl.innerHTML = `<div class="avatar avatar-xl">${init}</div>`;
      }
    }
    document.getElementById("save-profile-btn")?.addEventListener("click", async () => {
      const newName = nameEl?.value.trim();
      if (!newName) {
        toast.error("Name is required");
        return;
      }
      try {
        await sb.from("users").update({ name: newName }).eq("id", user.id);
        await sb.auth.updateUser({ data: { name: newName } });
        currentUser2.name = newName;
        toast.success("Profile updated");
      } catch {
        toast.error("Update failed");
      }
    });
  }
  function renderStorageInfo(user) {
    const limit = user.storage_limit || 15 * 1024 * 1024 * 1024;
    const used = user.storage_used || 0;
    const pct = Math.min(used / limit * 100, 100).toFixed(1);
    const usedEl = document.getElementById("storage-used-val");
    const limitEl = document.getElementById("storage-limit-val");
    const fillEl = document.getElementById("storage-fill-profile");
    const pctEl = document.getElementById("storage-pct");
    if (usedEl)
      usedEl.textContent = formatSize(used);
    if (limitEl)
      limitEl.textContent = formatSize(limit);
    if (pctEl)
      pctEl.textContent = `${pct}%`;
    if (fillEl) {
      fillEl.style.width = `${pct}%`;
      fillEl.className = `progress-bar${pct > 90 ? " danger" : pct > 70 ? " warning" : ""}`;
    }
  }
  function initAvatarUpload(user) {
    const changeBtn = document.getElementById("change-avatar-btn");
    if (!changeBtn)
      return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);
    changeBtn.addEventListener("click", () => input.click());
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file)
        return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be under 5 MB");
        return;
      }
      const path = `${user.id}/avatar/${Date.now()}.${file.name.split(".").pop()}`;
      try {
        const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true });
        if (error)
          throw error;
        const { data: signedData } = await sb.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        const photoUrl = signedData.signedUrl;
        await sb.from("users").update({ photo: photoUrl }).eq("id", user.id);
        await sb.auth.updateUser({ data: { photo: photoUrl } });
        const avatarEl = document.getElementById("profile-avatar");
        if (avatarEl) {
          avatarEl.innerHTML = "";
          const img = document.createElement("img");
          img.className = "avatar avatar-xl";
          img.alt = getInitials(user.name || user.email);
          img.onerror = function() {
            avatarEl.innerHTML = `<div class="avatar avatar-xl">${getInitials(user.name || user.email)}</div>`;
          };
          img.src = URL.createObjectURL(file);
          avatarEl.appendChild(img);
        }
        toast.success("Profile photo updated");
      } catch (err) {
        toast.error("Failed to upload photo");
      }
      e.target.value = "";
    });
  }
  function initPasswordChange() {
    const form = document.getElementById("password-form");
    if (!form)
      return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const current = document.getElementById("current-pass")?.value;
      const newPass = document.getElementById("new-pass")?.value;
      const confirm = document.getElementById("confirm-pass")?.value;
      if (newPass !== confirm) {
        toast.error("Passwords do not match");
        return;
      }
      if (newPass.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      try {
        await updatePassword(newPass);
        toast.success("Password changed successfully");
        form.reset();
      } catch (err) {
        toast.error(err.message);
      }
    });
  }

  // js/profile-entry.js
  (async function() {
    const user = await initApp();
    await initProfile(user);
  })();
})();
