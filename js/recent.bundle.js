(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
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
  function avatarHtml(user, size = "") {
    const cls = `avatar${size ? " avatar-" + size : ""}`;
    const init = getInitials(user.name || user.email || "?");
    if (user.photo) {
      return `<img src="${user.photo}" class="${cls}" alt="${init}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="${cls}" style="display:none">${init}</div>`;
    }
    return `<div class="${cls}">${init}</div>`;
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
  function isImage(ext) {
    return getFileCategory(ext) === "image";
  }
  function isVideo(ext) {
    return getFileCategory(ext) === "video";
  }
  function isAudio(ext) {
    return getFileCategory(ext) === "audio";
  }
  function isPDF(ext) {
    return ext === "pdf";
  }
  var init_utils = __esm({
    "js/utils.js"() {
      init_supabase();
    }
  });

  // js/share.js
  var share_exports = {};
  __export(share_exports, {
    generatePublicLink: () => generatePublicLink,
    getFileShares: () => getFileShares,
    openShareModal: () => openShareModal,
    removeShare: () => removeShare,
    setUser: () => setUser,
    shareWithUser: () => shareWithUser,
    updateSharePermission: () => updateSharePermission
  });
  function setUser(u) {
    currentUser2 = u;
  }
  async function getFileShares(fileId) {
    const { data, error } = await sb.from("shares").select("*, shared_user:shared_with(id, name, email, photo)").eq("file_id", fileId).eq("owner_id", currentUser2.id);
    if (error)
      throw error;
    return data || [];
  }
  async function shareWithUser(fileId, email, permission = "view") {
    const { data: target, error: userErr } = await sb.from("users").select("id, name, email").eq("email", email.trim().toLowerCase()).single();
    if (userErr || !target)
      throw new Error("User not found with that email address.");
    if (target.id === currentUser2.id)
      throw new Error("You cannot share a file with yourself.");
    const { data: existing } = await sb.from("shares").select("id").eq("file_id", fileId).eq("shared_with", target.id).single();
    if (existing) {
      await sb.from("shares").update({ permission }).eq("id", existing.id);
      toast.success(`Permission updated for ${target.name || email}`);
      return;
    }
    const { error } = await sb.from("shares").insert({
      file_id: fileId,
      owner_id: currentUser2.id,
      shared_with: target.id,
      permission
    });
    if (error)
      throw error;
    await logActivity("share", fileId, null, { with: email, permission });
    toast.success(`Shared with ${target.name || email}`);
    return target;
  }
  async function updateSharePermission(shareId, permission) {
    const { error } = await sb.from("shares").update({ permission }).eq("id", shareId);
    if (error)
      throw error;
    toast.success("Permission updated");
  }
  async function removeShare(shareId) {
    const { error } = await sb.from("shares").delete().eq("id", shareId);
    if (error)
      throw error;
    toast.success("Access removed");
  }
  async function generatePublicLink(fileId) {
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const { data, error } = await sb.from("shares").upsert({
      file_id: fileId,
      owner_id: currentUser2.id,
      public_link: true,
      link_token: token,
      shared_with: null,
      permission: "view"
    }, { onConflict: "link_token" }).select().single();
    if (error)
      throw error;
    return `${window.location.origin}/shared-link.html?token=${token}`;
  }
  async function openShareModal(file) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
    <div class="modal" style="max-width:520px">
      <div class="modal-header">
        <span class="modal-title">Share "${file.original_name}"</span>
        <button class="btn-icon" id="share-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <input class="form-control" id="share-email" placeholder="Add people by email" type="email" style="flex:1">
          <select class="form-control" id="share-perm" style="width:90px">
            <option value="view">View</option>
            <option value="edit">Edit</option>
          </select>
          <button class="btn btn-primary" id="share-send">Share</button>
        </div>
        <div id="share-list"><div class="loading-spinner"></div></div>
        <div class="divider"></div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:13px;font-weight:500">Public link</div>
            <div style="font-size:12px;color:var(--text-secondary)">Anyone with link can view</div>
          </div>
          <button class="btn btn-outlined btn-sm" id="copy-link">
            <span class="material-symbols-outlined" style="font-size:16px">link</span>Copy link</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector("#share-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        close();
    });
    loadShareList(file.id, overlay.querySelector("#share-list"));
    overlay.querySelector("#share-send").addEventListener("click", async () => {
      const email = overlay.querySelector("#share-email").value.trim();
      const perm = overlay.querySelector("#share-perm").value;
      if (!email)
        return;
      try {
        await shareWithUser(file.id, email, perm);
        overlay.querySelector("#share-email").value = "";
        loadShareList(file.id, overlay.querySelector("#share-list"));
      } catch (err) {
        toast.error(err.message);
      }
    });
    overlay.querySelector("#copy-link").addEventListener("click", async () => {
      try {
        const link = await generatePublicLink(file.id);
        await navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard");
      } catch (err) {
        toast.error("Failed to copy link");
      }
    });
  }
  async function loadShareList(fileId, container2) {
    try {
      const shares = await getFileShares(fileId);
      if (!shares.length) {
        container2.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">Not shared with anyone yet.</p>';
        return;
      }
      container2.innerHTML = `<div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px">SHARED WITH</div>
      <div class="share-user-list">
        ${shares.map((s) => `
          <div class="share-user-row" data-share-id="${s.id}">
            ${avatarHtml(s.shared_user || {}, "sm")}
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500">${s.shared_user?.name || "\u2014"}</div>
              <div style="font-size:12px;color:var(--text-secondary)">${s.shared_user?.email || ""}</div>
            </div>
            <select class="share-perm-select" data-share="${s.id}">
              <option value="view" ${s.permission === "view" ? "selected" : ""}>View</option>
              <option value="edit" ${s.permission === "edit" ? "selected" : ""}>Edit</option>
            </select>
            <button class="btn-icon btn-sm remove-share" data-share="${s.id}" style="color:var(--danger)">
              <span class="material-symbols-outlined" style="font-size:18px">person_remove</span></button>
          </div>`).join("")}
      </div>`;
      container2.querySelectorAll(".share-perm-select").forEach((sel) => {
        sel.addEventListener("change", () => updateSharePermission(sel.dataset.share, sel.value));
      });
      container2.querySelectorAll(".remove-share").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await removeShare(btn.dataset.share);
          loadShareList(fileId, container2);
        });
      });
    } catch {
      container2.innerHTML = '<p class="text-danger">Failed to load shares.</p>';
    }
  }
  var currentUser2;
  var init_share = __esm({
    "js/share.js"() {
      init_supabase();
      init_notification();
      init_utils();
      currentUser2 = null;
    }
  });

  // js/folders.js
  var folders_exports = {};
  __export(folders_exports, {
    createFolder: () => createFolder,
    deleteFolder: () => deleteFolder,
    deleteFolderAction: () => deleteFolderAction,
    fetchFolder: () => fetchFolder,
    fetchFolders: () => fetchFolders,
    getAllFolders: () => getAllFolders,
    getBreadcrumb: () => getBreadcrumb,
    renameFolder: () => renameFolder,
    renderBreadcrumb: () => renderBreadcrumb,
    setUser: () => setUser2,
    showNewFolderModal: () => showNewFolderModal,
    showRenameFolderModal: () => showRenameFolderModal
  });
  function setUser2(u) {
    currentUser3 = u;
  }
  async function fetchFolders({ parentId = null, userId = null } = {}) {
    let q = sb.from("folders").select("*").eq("is_deleted", false).order("folder_name", { ascending: true });
    if (userId)
      q = q.eq("user_id", userId);
    else
      q = q.eq("user_id", currentUser3.id);
    if (parentId)
      q = q.eq("parent_id", parentId);
    else
      q = q.is("parent_id", null);
    const { data, error } = await q;
    if (error)
      throw error;
    return data || [];
  }
  async function fetchFolder(folderId) {
    const { data, error } = await sb.from("folders").select("*").eq("id", folderId).single();
    if (error)
      throw error;
    return data;
  }
  async function createFolder(name, parentId = null) {
    if (!name?.trim())
      throw new Error("Folder name is required");
    const { data, error } = await sb.from("folders").insert({
      user_id: currentUser3.id,
      folder_name: name.trim(),
      parent_id: parentId || null
    }).select().single();
    if (error)
      throw error;
    await logActivity("create_folder", null, data.id, { name });
    toast.success(`Folder "${name}" created`);
    return data;
  }
  async function renameFolder(folderId, newName) {
    if (!newName?.trim())
      throw new Error("Name is required");
    const { error } = await sb.from("folders").update({ folder_name: newName.trim(), updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", folderId);
    if (error)
      throw error;
    toast.success("Folder renamed");
  }
  async function deleteFolder(folderId) {
    await sb.from("files").update({ is_deleted: true, deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("folder_id", folderId);
    const { error } = await sb.from("folders").update({ is_deleted: true }).eq("id", folderId);
    if (error)
      throw error;
    toast.success("Folder deleted");
  }
  async function getBreadcrumb(folderId) {
    const crumbs = [];
    let id = folderId;
    while (id) {
      const { data } = await sb.from("folders").select("id, folder_name, parent_id").eq("id", id).single();
      if (!data)
        break;
      crumbs.unshift(data);
      id = data.parent_id;
    }
    return crumbs;
  }
  async function getAllFolders() {
    const { data } = await sb.from("folders").select("id, folder_name, parent_id").eq("user_id", currentUser3.id).eq("is_deleted", false).order("folder_name");
    return data || [];
  }
  function showNewFolderModal(parentId = null, onCreated) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
    <div class="modal" style="max-width:360px">
      <div class="modal-header">
        <span class="modal-title">New Folder</span>
        <button class="btn-icon" id="nf-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Folder name</label>
          <input class="form-control" id="nf-input" value="Untitled folder" placeholder="Folder name">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outlined" id="nf-cancel">Cancel</button>
        <button class="btn btn-primary" id="nf-create">Create</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#nf-input");
    input.select();
    const close = () => overlay.remove();
    overlay.querySelector("#nf-close").addEventListener("click", close);
    overlay.querySelector("#nf-cancel").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        close();
    });
    const create = async () => {
      const val = input.value.trim();
      if (!val) {
        input.focus();
        return;
      }
      const btn = overlay.querySelector("#nf-create");
      btn.disabled = true;
      btn.textContent = "Creating\u2026";
      try {
        const folder = await createFolder(val, parentId);
        close();
        if (onCreated)
          onCreated(folder);
      } catch (err) {
        toast.error(err.message);
        btn.disabled = false;
        btn.textContent = "Create";
      }
    };
    overlay.querySelector("#nf-create").addEventListener("click", create);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        create();
    });
  }
  function showRenameFolderModal(folder, onRenamed) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
    <div class="modal" style="max-width:360px">
      <div class="modal-header">
        <span class="modal-title">Rename Folder</span>
        <button class="btn-icon" id="rf-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">New name</label>
          <input class="form-control" id="rf-input" value="${folder.folder_name}" placeholder="Folder name">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outlined" id="rf-cancel">Cancel</button>
        <button class="btn btn-primary" id="rf-save">Save</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#rf-input");
    input.select();
    const close = () => overlay.remove();
    overlay.querySelector("#rf-close").addEventListener("click", close);
    overlay.querySelector("#rf-cancel").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        close();
    });
    const save = async () => {
      const val = input.value.trim();
      if (!val || val === folder.folder_name) {
        close();
        return;
      }
      try {
        await renameFolder(folder.id, val);
        folder.folder_name = val;
        close();
        if (onRenamed)
          onRenamed(folder);
      } catch (err) {
        toast.error(err.message);
      }
    };
    overlay.querySelector("#rf-save").addEventListener("click", save);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        save();
    });
  }
  function deleteFolderAction(folder, onDeleted) {
    confirmDialog(
      "Delete Folder",
      `Delete "<strong>${folder.folder_name}</strong>" and all its contents? This moves files to Trash.`,
      async () => {
        try {
          await deleteFolder(folder.id);
          if (onDeleted)
            onDeleted(folder.id);
        } catch (err) {
          toast.error(err.message);
        }
      }
    );
  }
  function renderBreadcrumb(crumbs, container2, onNavigate) {
    if (!container2)
      return;
    container2.innerHTML = `
    <a class="breadcrumb-item" href="dashboard.html" data-page="home">
      <span class="material-symbols-outlined" style="font-size:18px">home</span>My Drive
    </a>`;
    crumbs.forEach((c, i) => {
      container2.innerHTML += `<span class="breadcrumb-sep material-symbols-outlined" style="font-size:18px">chevron_right</span>`;
      if (i === crumbs.length - 1) {
        container2.innerHTML += `<span class="breadcrumb-item active">${c.folder_name}</span>`;
      } else {
        const a = document.createElement("a");
        a.className = "breadcrumb-item";
        a.textContent = c.folder_name;
        a.href = `folder.html?id=${c.id}&name=${encodeURIComponent(c.folder_name)}`;
        container2.appendChild(a);
      }
    });
  }
  var currentUser3;
  var init_folders = __esm({
    "js/folders.js"() {
      init_supabase();
      init_notification();
      init_utils();
      currentUser3 = null;
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
  function initViewToggle(onViewChange) {
    const gridBtn = document.getElementById("view-grid");
    const listBtn = document.getElementById("view-list");
    const saved = localStorage.getItem("viewMode") || "grid";
    const setView = (mode) => {
      localStorage.setItem("viewMode", mode);
      gridBtn?.classList.toggle("active", mode === "grid");
      listBtn?.classList.toggle("active", mode === "list");
      if (onViewChange)
        onViewChange(mode);
    };
    setView(saved);
    gridBtn?.addEventListener("click", () => setView("grid"));
    listBtn?.addEventListener("click", () => setView("list"));
    return saved;
  }

  // js/files.js
  init_supabase();
  init_notification();
  init_utils();
  var currentUser4 = null;
  function setUser3(u) {
    currentUser4 = u;
  }
  async function fetchFiles({
    folderId = null,
    userId = null,
    starred = false,
    deleted = false,
    shared = false,
    recent = false,
    limit = 100,
    offset = 0,
    sortBy = "date_desc",
    category = "",
    allFiles = false
  } = {}) {
    let q = sb.from("files").select(`*, users:user_id(name, email, photo)`);
    if (deleted) {
      q = q.eq("is_deleted", true);
    } else if (shared) {
      const { data: shareRows } = await sb.from("shares").select("file_id").eq("shared_with", currentUser4.id);
      const ids = (shareRows || []).map((r) => r.file_id);
      if (!ids.length)
        return [];
      q = q.in("id", ids).eq("is_deleted", false);
    } else {
      q = q.eq("is_deleted", false);
      if (starred)
        q = q.eq("is_starred", true);
      if (!allFiles) {
        if (userId)
          q = q.eq("user_id", userId);
        else
          q = q.eq("user_id", currentUser4.id);
        q = folderId ? q.eq("folder_id", folderId) : q.is("folder_id", null);
      }
    }
    if (recent) {
      q = q.order("updated_at", { ascending: false });
    } else {
      const sortMap = {
        date_desc: { col: "created_at", asc: false },
        date_asc: { col: "created_at", asc: true },
        name_asc: { col: "original_name", asc: true },
        name_desc: { col: "original_name", asc: false },
        size_desc: { col: "file_size", asc: false },
        size_asc: { col: "file_size", asc: true }
      };
      const sort = sortMap[sortBy] || sortMap.date_desc;
      q = q.order(sort.col, { ascending: sort.asc });
    }
    q = q.range(offset, offset + limit - 1);
    const { data, error } = await q;
    if (error)
      throw error;
    if (category && data) {
      const extMap = {
        image: ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"],
        video: ["mp4", "avi", "mov", "mkv", "webm"],
        audio: ["mp3", "wav", "ogg", "flac", "aac"],
        doc: ["doc", "docx", "pdf", "txt", "md"],
        archive: ["zip", "rar", "7z", "tar", "gz"],
        code: ["js", "ts", "html", "css", "php", "py", "java", "json", "xml", "sql"]
      };
      const exts = new Set(extMap[category] || []);
      return data.filter((f) => {
        const name = f.original_name || f.file_name || "";
        const ext = name.split(".").pop().toLowerCase();
        return exts.has(ext);
      });
    }
    return data || [];
  }
  async function renameFile(fileId, newName) {
    const { error } = await sb.from("files").update({ original_name: newName, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", fileId);
    if (error)
      throw error;
    await logActivity("rename", fileId, null, { new_name: newName });
    toast.success("File renamed");
  }
  async function deleteFile(fileId) {
    const { error } = await sb.from("files").update({ is_deleted: true, deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", fileId);
    if (error)
      throw error;
    await logActivity("delete", fileId);
    toast.success("Moved to Trash", {
      label: "Undo",
      fn: () => restoreFile(fileId)
    });
  }
  async function restoreFile(fileId) {
    const { error } = await sb.from("files").update({ is_deleted: false, deleted_at: null }).eq("id", fileId);
    if (error)
      throw error;
    await logActivity("restore", fileId);
    toast.success("File restored");
  }
  async function toggleStar(fileId, currentState) {
    const { error } = await sb.from("files").update({ is_starred: !currentState }).eq("id", fileId);
    if (error)
      throw error;
    toast.info(!currentState ? "Added to Starred" : "Removed from Starred");
  }
  async function downloadFile(storagePath, originalName) {
    try {
      const { data, error } = await sb.storage.from(BUCKET).download(storagePath);
      if (error)
        throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await logActivity("download", null, null, { path: storagePath });
      toast.success(`Downloading "${originalName}"`);
    } catch (err) {
      toast.error("Download failed");
    }
  }
  function renderGrid(files, folders, container2, opts = {}) {
    container2.innerHTML = "";
    if (!folders.length && !files.length) {
      container2.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><span class="material-symbols-outlined">folder_open</span></div>
        <h3>${opts.emptyTitle || "Nothing here yet"}</h3>
        <p>${opts.emptyMsg || "Upload files or create a folder to get started."}</p>
        ${opts.showUpload ? `<button class="btn btn-primary" id="empty-upload-btn">
          <span class="material-symbols-outlined">upload</span>Upload Files</button>` : ""}
      </div>`;
      document.getElementById("empty-upload-btn")?.addEventListener(
        "click",
        () => document.getElementById("file-input")?.click()
      );
      return;
    }
    if (folders.length) {
      const sec = el("div", "");
      sec.innerHTML = `<div class="section-header"><span class="section-title">Folders</span></div>`;
      const grid = el("div", "files-grid");
      folders.forEach((f) => grid.appendChild(renderFolderCard(f, opts)));
      sec.appendChild(grid);
      container2.appendChild(sec);
    }
    if (files.length) {
      const sec = el("div", "");
      sec.innerHTML = `<div class="section-header" style="margin-top:${folders.length ? "16px" : "0"}"><span class="section-title">Files</span></div>`;
      const grid = el("div", "files-grid");
      files.forEach((f) => grid.appendChild(renderFileCard(f, opts)));
      sec.appendChild(grid);
      container2.appendChild(sec);
    }
  }
  function renderList(files, folders, container2, opts = {}) {
    container2.innerHTML = "";
    if (!folders.length && !files.length) {
      renderGrid([], [], container2, opts);
      return;
    }
    const listWrap = el("div", "files-list");
    const header = el("div", "list-header");
    header.innerHTML = `
    <span class="sort-header" data-sort="name">Name</span>
    <span class="sort-header" data-sort="owner">Owner</span>
    <span class="sort-header" data-sort="size">Size</span>
    <span class="sort-header" data-sort="date">Modified</span>
    <span>Actions</span>`;
    listWrap.appendChild(header);
    folders.forEach((f) => listWrap.appendChild(renderFolderListItem(f, opts)));
    files.forEach((f) => listWrap.appendChild(renderFileListItem(f, opts)));
    container2.appendChild(listWrap);
  }
  function renderFileCard(file, opts = {}) {
    const ext = getExt(file.original_name || file.file_name);
    const icon = getFileIcon(ext);
    const cls = getIconClass(ext);
    const card = el("div", `file-card`);
    card.dataset.id = file.id;
    const showThumb = isImage(ext) || isPDF(ext);
    card.innerHTML = `
    <div class="card-header">
      <div class="card-icon"><span class="material-symbols-outlined ${cls}" style="font-size:18px">${icon}</span></div>
      <div class="card-title" title="${file.original_name}">${file.original_name}</div>
      <button class="btn-icon btn-sm" data-action="more" title="More">
        <span class="material-symbols-outlined" style="font-size:18px">more_vert</span>
      </button>
    </div>
    <div class="file-thumb ${ext}">
      ${showThumb ? `<img src="" data-path="${file.storage_path}" data-type="${ext}" alt="${file.original_name}" loading="lazy" class="lazy-img">` : `<span class="material-symbols-outlined file-thumb-icon ${cls}">${icon}</span>`}
      <div class="file-thumb-overlay">
        <div class="thumb-action" data-action="preview" title="Preview">
          <span class="material-symbols-outlined" style="font-size:16px">visibility</span></div>
        <div class="thumb-action" data-action="download" title="Download">
          <span class="material-symbols-outlined" style="font-size:16px">download</span></div>
      </div>
      <div class="file-checkbox"><span class="material-symbols-outlined">check</span></div>
      <div class="file-star ${file.is_starred ? "starred" : ""}" data-action="star">
        <span class="material-symbols-outlined${file.is_starred ? " icon-fill" : ""}">star</span>
      </div>
    </div>
    <div class="card-footer">
      ${avatarHtml(file.users || { name: "Me" }, "sm")}
      <div class="card-footer-text">You uploaded \u2022 ${formatDate(file.created_at, "relative")}</div>
    </div>`;
    const img = card.querySelector(".lazy-img");
    if (img)
      lazyLoadImage(img, file.storage_path);
    card.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (!action) {
        if (e.target.closest(".file-checkbox")) {
          toggleSelectCard(card, file);
          return;
        }
        handleFileAction("preview", file);
        return;
      }
      e.stopPropagation();
      handleFileAction(action, file, card, e);
    });
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showFileContextMenu(e.clientX, e.clientY, file);
    });
    return card;
  }
  function renderFolderCard(folder, opts = {}) {
    const card = el("div", "folder-card");
    card.dataset.id = folder.id;
    card.innerHTML = `
    <span class="material-symbols-outlined folder-icon icon-fill">folder</span>
    <div class="folder-info">
      <div class="folder-name" title="${folder.folder_name}">${folder.folder_name}</div>
      <div class="folder-meta">${formatDate(folder.created_at, "relative")}</div>
    </div>
    <div class="folder-more dropdown">
      <button class="btn-icon btn-sm" id="folder-more-${folder.id}">
        <span class="material-symbols-outlined" style="font-size:18px">more_vert</span>
      </button>
    </div>`;
    card.addEventListener("dblclick", () => {
      if (opts.onFolderOpen)
        opts.onFolderOpen(folder);
      else
        window.location.href = `folder.html?id=${folder.id}&name=${encodeURIComponent(folder.folder_name)}`;
    });
    card.addEventListener("click", (e) => {
      if (e.target.closest(".folder-more")) {
        e.stopPropagation();
        showFolderContextMenu(e.clientX, e.clientY, folder);
      }
    });
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showFolderContextMenu(e.clientX, e.clientY, folder);
    });
    return card;
  }
  function renderFileListItem(file, opts = {}) {
    const ext = getExt(file.original_name || file.file_name);
    const icon = getFileIcon(ext);
    const cls = getIconClass(ext);
    const row = el("div", "list-item");
    row.dataset.id = file.id;
    row.innerHTML = `
    <div class="list-item-name">
      <span class="material-symbols-outlined list-icon ${cls}" style="font-size:22px">${icon}</span>
      <span class="label truncate">${file.original_name}</span>
      ${file.is_starred ? '<span class="material-symbols-outlined icon-fill" style="font-size:16px;color:var(--warning);flex-shrink:0">star</span>' : ""}
    </div>
    <span class="list-col">${file.users?.name || "Me"}</span>
    <span class="list-col">${formatSize(file.file_size)}</span>
    <span class="list-col">${formatDate(file.updated_at)}</span>
    <div class="list-actions">
      <button class="btn-icon btn-sm" data-action="download" title="Download">
        <span class="material-symbols-outlined" style="font-size:18px">download</span></button>
      <button class="btn-icon btn-sm" data-action="rename" title="Rename">
        <span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
      <button class="btn-icon btn-sm" data-action="share" title="Share">
        <span class="material-symbols-outlined" style="font-size:18px">share</span></button>
      <button class="btn-icon btn-sm" data-action="more" title="More">
        <span class="material-symbols-outlined" style="font-size:18px">more_vert</span></button>
    </div>`;
    row.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (action) {
        e.stopPropagation();
        handleFileAction(action, file, row, e);
        return;
      }
      handleFileAction("preview", file);
    });
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showFileContextMenu(e.clientX, e.clientY, file);
    });
    return row;
  }
  function renderFolderListItem(folder, opts = {}) {
    const row = el("div", "list-item");
    row.dataset.id = folder.id;
    row.innerHTML = `
    <div class="list-item-name">
      <span class="material-symbols-outlined list-icon folder-c icon-fill" style="font-size:22px">folder</span>
      <span class="label truncate">${folder.folder_name}</span>
    </div>
    <span class="list-col">Me</span>
    <span class="list-col">\u2014</span>
    <span class="list-col">${formatDate(folder.created_at)}</span>
    <div class="list-actions">
      <button class="btn-icon btn-sm" data-action="rename-folder" title="Rename">
        <span class="material-symbols-outlined" style="font-size:18px">edit</span></button>
      <button class="btn-icon btn-sm" data-action="delete-folder" title="Delete">
        <span class="material-symbols-outlined" style="font-size:18px">delete</span></button>
    </div>`;
    row.addEventListener("dblclick", () => {
      window.location.href = `folder.html?id=${folder.id}&name=${encodeURIComponent(folder.folder_name)}`;
    });
    return row;
  }
  function handleFileAction(action, file, card, e) {
    const { showRenameModal } = window.__fileModals || {};
    const { showShareModal } = window.__shareModals || {};
    const { showPreview } = window.__preview || {};
    switch (action) {
      case "preview":
        previewFile(file);
        break;
      case "download":
        downloadFile(file.storage_path, file.original_name);
        break;
      case "star":
        starAction(file, card);
        break;
      case "rename":
        showRenameFileModal(file, card);
        break;
      case "share":
        showShareFileModal(file);
        break;
      case "delete":
        softDeleteAction(file, card);
        break;
      case "more":
        showFileContextMenu(e?.clientX || 100, e?.clientY || 100, file);
        break;
    }
  }
  async function starAction(file, card) {
    await toggleStar(file.id, file.is_starred);
    file.is_starred = !file.is_starred;
    const starEl = card?.querySelector(".file-star");
    if (starEl) {
      starEl.classList.toggle("starred", file.is_starred);
      starEl.querySelector(".material-symbols-outlined").className = `material-symbols-outlined${file.is_starred ? " icon-fill" : ""}`;
    }
  }
  async function softDeleteAction(file, card) {
    await deleteFile(file.id);
    card?.remove();
  }
  function showRenameFileModal(file, card) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <span class="modal-title">Rename File</span>
        <button class="btn-icon" id="rename-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">New name</label>
          <input class="form-control" id="rename-input" value="${file.original_name}" placeholder="File name">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outlined" id="rename-cancel">Cancel</button>
        <button class="btn btn-primary" id="rename-save">Save</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#rename-input");
    input.select();
    const close = () => overlay.remove();
    overlay.querySelector("#rename-close").addEventListener("click", close);
    overlay.querySelector("#rename-cancel").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        close();
    });
    const save = async () => {
      const val = input.value.trim();
      if (!val || val === file.original_name) {
        close();
        return;
      }
      try {
        await renameFile(file.id, val);
        file.original_name = val;
        if (card) {
          const nameEl = card.querySelector(".file-name,.label");
          if (nameEl)
            nameEl.textContent = val;
        }
        close();
      } catch (err) {
        toast.error("Rename failed");
      }
    };
    overlay.querySelector("#rename-save").addEventListener("click", save);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        save();
    });
  }
  function showShareFileModal(file) {
    Promise.resolve().then(() => (init_share(), share_exports)).then((m) => m.openShareModal(file));
  }
  function showFileContextMenu(x, y, file) {
    const { showContextMenu } = window.__app || {};
    if (!showContextMenu)
      return;
    showContextMenu(x, y, [
      { icon: "visibility", label: "Preview", fn: () => previewFile(file) },
      { icon: "download", label: "Download", fn: () => downloadFile(file.storage_path, file.original_name) },
      { icon: "edit", label: "Rename", fn: () => showRenameFileModal(file) },
      { icon: "share", label: "Share", fn: () => showShareFileModal(file) },
      { icon: "star", label: file.is_starred ? "Unstar" : "Star", fn: () => toggleStar(file.id, file.is_starred) },
      "divider",
      { icon: "delete", label: "Move to Trash", fn: () => deleteFile(file.id), danger: true }
    ]);
  }
  function showFolderContextMenu(x, y, folder) {
    const { showContextMenu } = window.__app || {};
    if (!showContextMenu)
      return;
    showContextMenu(x, y, [
      { icon: "open_in_new", label: "Open", fn: () => {
        window.location.href = `folder.html?id=${folder.id}&name=${encodeURIComponent(folder.folder_name)}`;
      } },
      { icon: "edit", label: "Rename", fn: () => {
        Promise.resolve().then(() => (init_folders(), folders_exports)).then((m) => m.showRenameFolderModal(folder));
      } },
      "divider",
      { icon: "delete", label: "Delete Folder", fn: () => {
        Promise.resolve().then(() => (init_folders(), folders_exports)).then((m) => m.deleteFolderAction(folder));
      }, danger: true }
    ]);
  }
  async function lazyLoadImage(imgEl, storagePath) {
    try {
      const { data } = await sb.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
      if (!data?.signedUrl)
        return;
      if (imgEl.dataset.type === "pdf") {
        const dataUrl = await generatePDFThumbnail(data.signedUrl);
        imgEl.src = dataUrl;
      } else {
        imgEl.src = data.signedUrl;
      }
    } catch {
    }
  }
  async function generatePDFThumbnail(pdfUrl) {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
    }
    const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.8);
  }
  async function previewFile(file) {
    const ext = getExt(file.original_name || file.file_name);
    let url;
    try {
      const { data } = await sb.storage.from(BUCKET).createSignedUrl(file.storage_path, 3600);
      url = data?.signedUrl;
    } catch {
      toast.error("Cannot preview this file");
      return;
    }
    if (!url) {
      downloadFile(file.storage_path, file.original_name);
      return;
    }
    if (isImage(ext)) {
      showImageLightbox(url, file.original_name);
      return;
    }
    if (isVideo(ext)) {
      showMediaModal(url, "video", file.original_name);
      return;
    }
    if (isAudio(ext)) {
      showMediaModal(url, "audio", file.original_name);
      return;
    }
    if (isPDF(ext)) {
      showPDFModal(url, file.original_name);
      return;
    }
    downloadFile(file.storage_path, file.original_name);
  }
  function showImageLightbox(src, name) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `
    <div class="lightbox-close"><span class="material-symbols-outlined">close</span></div>
    <img class="lightbox-img" src="${src}" alt="${name}">
    <div class="lightbox-caption">${name}</div>`;
    document.body.appendChild(lb);
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.closest(".lightbox-close"))
        lb.remove();
    });
  }
  function showMediaModal(src, type, name) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay media-modal";
    const tag = type === "video" ? "video" : "audio";
    overlay.innerHTML = `
    <div class="modal" style="max-width:${type === "video" ? "640px" : "400px"}">
      <div class="modal-header">
        <span class="modal-title">${name}</span>
        <button class="btn-icon" id="media-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body" style="padding:0 0 16px">
        <${tag} class="media-player" src="${src}" controls ${type === "video" ? 'style="width:100%"' : ""}></${tag}>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#media-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        overlay.remove();
    });
  }
  function showPDFModal(src, name) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
    <div class="modal" style="max-width:90vw;max-height:90vh">
      <div class="modal-header">
        <span class="modal-title">${name}</span>
        <button class="btn-icon" id="pdf-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body" style="padding:0">
        <iframe class="pdf-frame" src="${src}"></iframe>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#pdf-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        overlay.remove();
    });
  }
  function toggleSelectCard(card, file) {
    card.classList.toggle("selected");
    updateSelectionBar();
  }
  function updateSelectionBar() {
    const selected = document.querySelectorAll(".file-card.selected, .list-item.selected");
    let bar = document.getElementById("selection-bar");
    if (!selected.length) {
      bar?.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "selection-bar";
      bar.className = "selection-bar";
      document.body.appendChild(bar);
    }
    bar.innerHTML = `
    <button class="btn-icon" id="sel-clear"><span class="material-symbols-outlined">close</span></button>
    <span class="selection-count">${selected.length} selected</span>
    <button class="btn btn-outlined btn-sm" id="sel-download">
      <span class="material-symbols-outlined">download</span>Download</button>
    <button class="btn btn-danger btn-sm" id="sel-delete">
      <span class="material-symbols-outlined">delete</span>Delete</button>`;
    bar.querySelector("#sel-clear").addEventListener("click", clearSelection);
  }
  function clearSelection() {
    document.querySelectorAll(".file-card.selected, .list-item.selected").forEach((c) => c.classList.remove("selected"));
    document.getElementById("selection-bar")?.remove();
  }
  function renderSkeletons(container2, count = 8) {
    container2.innerHTML = "";
    const grid = el("div", "files-grid");
    for (let i = 0; i < count; i++) {
      grid.innerHTML += `
      <div class="skeleton-card">
        <div class="skeleton skeleton-thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line" style="width:80%"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>`;
    }
    container2.appendChild(grid);
  }

  // js/recent-entry.js
  (async function() {
    const user = await initApp();
    setUser3(user);
    let viewMode = initViewToggle((mode) => {
      viewMode = mode;
      load();
    });
    async function load() {
      const c = document.getElementById("content-area");
      renderSkeletons(c);
      const files = await fetchFiles({ recent: true, limit: 50 });
      if (viewMode === "grid")
        renderGrid(files, [], c, {
          emptyTitle: "No recent files",
          emptyMsg: "Files you open or edit will appear here."
        });
      else
        renderList(files, [], c);
    }
    load();
  })();
})();
