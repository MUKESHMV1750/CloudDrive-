-- ============================================================
-- Google Drive Clone — Supabase RLS Policies
-- Run this AFTER schema.sql in Supabase → SQL Editor
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: Check if current user is admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- POLICIES: users table
-- ============================================================

-- Admins can see all users; users can see their own row + shared-with info
CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin()
    OR id IN (SELECT shared_with FROM public.shares WHERE owner_id = auth.uid())
    OR id IN (SELECT owner_id FROM public.shares WHERE shared_with = auth.uid())
  );

-- Only admin can insert new users (via handle_new_user trigger uses SECURITY DEFINER)
CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update any user; users can update only themselves
CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Only admin can delete users
CREATE POLICY "users_delete" ON public.users FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- POLICIES: folders table
-- ============================================================

CREATE POLICY "folders_select" ON public.folders FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "folders_insert" ON public.folders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "folders_update" ON public.folders FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "folders_delete" ON public.folders FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- POLICIES: files table
-- ============================================================

CREATE POLICY "files_select" ON public.files FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR id IN (
      SELECT file_id FROM public.shares
      WHERE shared_with = auth.uid()
    )
    OR id IN (
      SELECT file_id FROM public.shares
      WHERE public_link = TRUE
    )
  );

CREATE POLICY "files_insert" ON public.files FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "files_update" ON public.files FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR id IN (
      SELECT file_id FROM public.shares
      WHERE shared_with = auth.uid() AND permission = 'edit'
    )
  );

CREATE POLICY "files_delete" ON public.files FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- POLICIES: shares table
-- ============================================================

CREATE POLICY "shares_select" ON public.shares FOR SELECT
  USING (
    owner_id = auth.uid()
    OR shared_with = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "shares_insert" ON public.shares FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "shares_update" ON public.shares FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "shares_delete" ON public.shares FOR DELETE
  USING (owner_id = auth.uid() OR public.is_admin());

-- ============================================================
-- POLICIES: activity_logs table
-- ============================================================

CREATE POLICY "logs_select" ON public.activity_logs FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "logs_insert" ON public.activity_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only admin can delete logs
CREATE POLICY "logs_delete" ON public.activity_logs FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- STORAGE: drive-storage bucket policies
-- NOTE: Create bucket named "drive-storage" in Supabase Dashboard first
-- Then add these policies in Storage → Policies
-- ============================================================

-- Allow authenticated users to upload their own files
INSERT INTO storage.buckets (id, name, public)
VALUES ('drive-storage', 'drive-storage', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_select" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'drive-storage'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
      OR name IN (
        SELECT storage_path FROM public.files f
        JOIN public.shares s ON s.file_id = f.id
        WHERE s.shared_with = auth.uid() OR s.public_link = TRUE
      )
    )
  );

CREATE POLICY "storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'drive-storage'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'drive-storage'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'drive-storage'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );
