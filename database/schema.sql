-- ============================================================
-- Google Drive Clone — Supabase Database Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  photo       TEXT DEFAULT NULL,
  is_disabled BOOLEAN DEFAULT FALSE,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 16106127360, -- 15 GB in bytes
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: folders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.folders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  folder_name   TEXT NOT NULL,
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: files
-- ============================================================
CREATE TABLE IF NOT EXISTS public.files (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  folder_id     UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  file_name     TEXT NOT NULL,
  original_name TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  file_size     BIGINT NOT NULL DEFAULT 0,
  file_type     TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_ext      TEXT GENERATED ALWAYS AS (
    lower(split_part(file_name, '.', array_length(string_to_array(file_name, '.'), 1)))
  ) STORED,
  is_starred    BOOLEAN DEFAULT FALSE,
  is_deleted    BOOLEAN DEFAULT FALSE,
  deleted_at    TIMESTAMPTZ DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: shares
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shares (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id       UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_with   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  public_link   BOOLEAN DEFAULT FALSE,
  link_token    TEXT UNIQUE DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: activity_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN ('login','logout','upload','download','delete','rename','share','restore','create_folder','move')),
  file_id     UUID REFERENCES public.files(id) ON DELETE SET NULL,
  folder_id   UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_files_user_id       ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id     ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_is_deleted    ON public.files(is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_is_starred    ON public.files(is_starred);
CREATE INDEX IF NOT EXISTS idx_files_created_at    ON public.files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_folders_user_id     ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id   ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_shares_file_id      ON public.shares(file_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with  ON public.shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_logs_user_id        ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at     ON public.activity_logs(created_at DESC);

-- ============================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at   BEFORE UPDATE ON public.users   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at   BEFORE UPDATE ON public.files   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Auto-update storage_used on file insert/delete
-- ============================================================
CREATE OR REPLACE FUNCTION update_storage_used()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET storage_used = storage_used + NEW.file_size WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET storage_used = GREATEST(0, storage_used - OLD.file_size) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_storage_insert AFTER INSERT ON public.files FOR EACH ROW EXECUTE FUNCTION update_storage_used();
CREATE TRIGGER trigger_storage_delete AFTER DELETE ON public.files FOR EACH ROW EXECUTE FUNCTION update_storage_used();

-- ============================================================
-- FUNCTION: Handle new Supabase Auth user → insert into public.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
