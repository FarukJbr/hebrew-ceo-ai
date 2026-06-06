-- ===================================================
-- Hebrew CEO AI — Supabase Database Setup
-- Run this ONCE in Supabase Dashboard → SQL Editor
-- ===================================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.instructions (
  id         UUID        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.board_decisions (
  id         UUID        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.instructions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_decisions  ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing policies (safe to re-run)
DROP POLICY IF EXISTS "Users manage own instructions"    ON public.instructions;
DROP POLICY IF EXISTS "Users manage own board_decisions" ON public.board_decisions;

-- 4. Create RLS policies — authenticated users can only touch their own rows
CREATE POLICY "Users manage own instructions"
  ON public.instructions
  FOR ALL
  TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

CREATE POLICY "Users manage own board_decisions"
  ON public.board_decisions
  FOR ALL
  TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- Done! Both tables are ready.
