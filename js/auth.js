// ============================================================
// auth.js — Authentication Module
// ============================================================
import { sb } from './supabase.js';
import { toast } from './notification.js';
import { logActivity } from './utils.js';

// ---- Get current session user ----
export async function getCurrentUser() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;

  const { data: profile } = await sb.from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return profile;
}

// ---- Auth guard — redirect to login if not authenticated ----
export async function requireAuth(adminOnly = false) {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (user.is_disabled) {
    await sb.auth.signOut();
    window.location.href = 'login.html?err=disabled';
    return null;
  }
  if (adminOnly && user.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return null;
  }
  return user;
}

// ---- Login ----
export async function login(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  // Check if user is disabled
  const { data: profile } = await sb.from('users')
    .select('is_disabled, role')
    .eq('id', data.user.id)
    .single();

  if (profile?.is_disabled) {
    await sb.auth.signOut();
    throw new Error('Your account has been disabled. Contact your administrator.');
  }

  await logActivity('login');
  return { user: data.user, profile };
}

// ---- Logout ----
export async function logout() {
  try { await logActivity('logout'); } catch {}
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

// ---- Forgot Password ----
export async function sendPasswordReset(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login.html?mode=reset`
  });
  if (error) throw new Error(error.message);
}

// ---- Update Password ----
export async function updatePassword(newPassword) {
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// ---- Admin: Create new user ----
export async function adminCreateUser(name, email, role = 'user') {
  // Use Supabase admin API via Edge Function or direct insert
  // We use signUp and immediately set role via DB
  const tempPass = Math.random().toString(36).slice(2, 10) + 'Aa1!';
  const { data, error } = await sb.auth.admin.createUser({
    email, password: tempPass,
    user_metadata: { name, role },
    email_confirm: true
  });
  if (error) throw new Error(error.message);

  // Upsert profile
  await sb.from('users').upsert({
    id: data.user.id, name, email, role
  });

  return { user: data.user, tempPassword: tempPass };
}

// ---- Listen to auth state changes ----
export function onAuthChange(callback) {
  return sb.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
