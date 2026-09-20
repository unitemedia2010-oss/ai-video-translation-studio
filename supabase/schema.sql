-- ============================================================================
-- AI VIDEO TRANSLATION STUDIO - SUPABASE DATABASE SCHEMA (V1)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- user_id UUID REFERENCES auth.users(id), -- Bỏ qua RLS user_id cho MVP local/demo
    name TEXT NOT NULL DEFAULT 'Untitled Video',
    source_language TEXT DEFAULT 'auto',
    target_language TEXT DEFAULT 'vi',
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, PROCESSING, COMPLETED, FAILED
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG MEDIA FILES
CREATE TABLE IF NOT EXISTS public.media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- {duration, width, height, fps, etc.}
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. BẢNG JOBS
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, PROCESSING, PAUSED, RETRYING, REVIEW_REQUIRED, COMPLETED, FAILED
    error TEXT,
    worker_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. BẢNG JOB STAGES
CREATE TABLE IF NOT EXISTS public.job_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL, -- UPLOAD, MEDIA_ANALYSIS, AUDIO_EXTRACTION, ASR, TRANSLATION, ALIGNMENT, SUBTITLE_GENERATION, RENDER
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    progress INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT,
    retry_count INT DEFAULT 0,
    output_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BẢNG SUBTITLES
CREATE TABLE IF NOT EXISTS public.subtitles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    start_time NUMERIC(10, 3) NOT NULL,
    end_time NUMERIC(10, 3) NOT NULL,
    original_text TEXT,
    translated_text TEXT,
    speaker TEXT,
    status TEXT DEFAULT 'AUTO', -- AUTO, EDITED, APPROVED
    confidence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_jobs_updated_at ON public.jobs;
CREATE TRIGGER tr_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_job_stages_updated_at ON public.job_stages;
CREATE TRIGGER tr_job_stages_updated_at BEFORE UPDATE ON public.job_stages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_subtitles_updated_at ON public.subtitles;
CREATE TRIGGER tr_subtitles_updated_at BEFORE UPDATE ON public.subtitles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- SUPABASE REALTIME
-- Bỏ comment các dòng này trong lần chạy ĐẦU TIÊN nếu cần.
-- Nếu bạn gặp lỗi "relation already member of publication", hãy bỏ qua vì nó đã được add.
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.job_stages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.subtitles;

-- RLS (Public access cho MVP)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtitles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access projects" ON public.projects;
CREATE POLICY "Public access projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access media_files" ON public.media_files;
CREATE POLICY "Public access media_files" ON public.media_files FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access jobs" ON public.jobs;
CREATE POLICY "Public access jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access job_stages" ON public.job_stages;
CREATE POLICY "Public access job_stages" ON public.job_stages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access subtitles" ON public.subtitles;
CREATE POLICY "Public access subtitles" ON public.subtitles FOR ALL USING (true) WITH CHECK (true);

-- LƯU Ý CHO STORAGE
-- Bạn cần tạo bucket 'projects' trên Supabase Dashboard và thiết lập thành Public.
