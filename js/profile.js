// ============================================================
// profile.js — User Profile Module
// ============================================================
import { sb, BUCKET }  from './supabase.js';
import { toast }       from './notification.js';
import { updatePassword } from './auth.js';
import { formatSize, formatDate, getInitials } from './utils.js';

let currentUser = null;

export async function initProfile(user) {
  currentUser = user;
  renderProfileForm(user);
  renderStorageInfo(user);
  initAvatarUpload(user);
  initPasswordChange();
}

// ---- Render form ----
function renderProfileForm(user) {
  const nameEl  = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const roleEl  = document.getElementById('profile-role');
  const joinEl  = document.getElementById('profile-joined');
  const avatarEl = document.getElementById('profile-avatar');

  if (nameEl)  nameEl.value = user.name  || '';
  if (emailEl) emailEl.value = user.email || '';
  if (roleEl)  roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'User';
  if (joinEl)  joinEl.textContent = `Member since ${formatDate(user.created_at)}`;

  if (avatarEl) {
    const init = getInitials(user.name || user.email);
    if (user.photo) {
      avatarEl.innerHTML = '';
      const img = document.createElement('img');
      img.className = 'avatar avatar-xl';
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

  // Save name
  document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const newName = nameEl?.value.trim();
    if (!newName) { toast.error('Name is required'); return; }
    try {
      await sb.from('users').update({ name: newName }).eq('id', user.id);
      await sb.auth.updateUser({ data: { name: newName } });
      currentUser.name = newName;
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
  });
}

// ---- Storage Info ----
function renderStorageInfo(user) {
  const limit    = user.storage_limit || (15 * 1024 * 1024 * 1024);
  const used     = user.storage_used  || 0;
  const pct      = Math.min((used / limit) * 100, 100).toFixed(1);

  const usedEl   = document.getElementById('storage-used-val');
  const limitEl  = document.getElementById('storage-limit-val');
  const fillEl   = document.getElementById('storage-fill-profile');
  const pctEl    = document.getElementById('storage-pct');

  if (usedEl)  usedEl.textContent  = formatSize(used);
  if (limitEl) limitEl.textContent = formatSize(limit);
  if (pctEl)   pctEl.textContent   = `${pct}%`;
  if (fillEl)  {
    fillEl.style.width = `${pct}%`;
    fillEl.className   = `progress-bar${pct > 90 ? ' danger' : pct > 70 ? ' warning' : ''}`;
  }
}

// ---- Avatar Upload ----
function initAvatarUpload(user) {
  const changeBtn = document.getElementById('change-avatar-btn');
  if (!changeBtn) return;

  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*'; input.style.display = 'none';
  document.body.appendChild(input);

  changeBtn.addEventListener('click', () => input.click());

  input.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5 MB'); return; }

    const path = `${user.id}/avatar/${Date.now()}.${file.name.split('.').pop()}`;
    try {
      const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (error) throw error;

      // Create a long-lived signed URL (10 years) since the bucket might be private
      const { data: signedData } = await sb.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      const photoUrl = signedData.signedUrl;

      await sb.from('users').update({ photo: photoUrl }).eq('id', user.id);
      await sb.auth.updateUser({ data: { photo: photoUrl } });

      const avatarEl = document.getElementById('profile-avatar');
      if (avatarEl) {
        avatarEl.innerHTML = '';
        const img = document.createElement('img');
        img.className = 'avatar avatar-xl';
        img.alt = getInitials(user.name || user.email);
        img.onerror = function() {
          avatarEl.innerHTML = `<div class="avatar avatar-xl">${getInitials(user.name || user.email)}</div>`;
        };
        // Use local object URL for instant, reliable preview
        img.src = URL.createObjectURL(file);
        avatarEl.appendChild(img);
      }
      toast.success('Profile photo updated');
    } catch (err) { toast.error('Failed to upload photo'); }
    e.target.value = '';
  });
}

// ---- Password Change ----
function initPasswordChange() {
  const form = document.getElementById('password-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const current  = document.getElementById('current-pass')?.value;
    const newPass  = document.getElementById('new-pass')?.value;
    const confirm  = document.getElementById('confirm-pass')?.value;

    if (newPass !== confirm) { toast.error('Passwords do not match'); return; }
    if (newPass.length < 8)  { toast.error('Password must be at least 8 characters'); return; }

    try {
      await updatePassword(newPass);
      toast.success('Password changed successfully');
      form.reset();
    } catch (err) { toast.error(err.message); }
  });
}
