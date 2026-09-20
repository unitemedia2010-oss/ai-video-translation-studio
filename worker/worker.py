import os
import sys
import time
import json
import traceback
from pathlib import Path
import tempfile
import subprocess
from dotenv import load_dotenv

load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    print("Vui long cai dat: pip install supabase faster-whisper openai ffmpeg-python python-dotenv")
    sys.exit(1)

from faster_whisper import WhisperModel

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")
WORKER_ID = os.environ.get("WORKER_ID", f"video-worker-{os.getpid()}")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Chua cau hinh SUPABASE_URL hoac SUPABASE_SECRET_KEY!")

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def download_file(supabase: Client, bucket: str, path: str, local_path: Path):
    res = supabase.storage.from_(bucket).download(path)
    local_path.write_bytes(res)
    return local_path

def extract_audio(video_path: Path, audio_path: Path):
    print(f"Extracting audio to {audio_path}...")
    cmd = [
        "ffmpeg", "-y", "-i", str(video_path), 
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", 
        str(audio_path)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def transcribe_audio(audio_path: Path) -> list:
    print("Transcribing audio with faster-whisper...")
    model_size = "base" # Use base for fast MVP, switch to large-v3 for prod
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    
    segments, info = model.transcribe(str(audio_path), beam_size=5, word_timestamps=True)
    
    results = []
    for segment in segments:
        results.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text
        })
    return results

def translate_text(text: str, target_lang: str) -> str:
    # MVP Mock Translation (Append [VI] or use actual API if OPENAI_API_KEY is present)
    # Using a simple mock since we don't have OPENAI_API_KEY guaranteed
    import urllib.request
    import urllib.parse
    
    # Very simple mock, in a real app use OpenAI or DeepL
    print(f"Translating: {text} -> {target_lang}")
    return f"[{target_lang.upper()}] {text}"

def process_job(supabase: Client, job: dict):
    job_id = job["id"]
    project_id = job["project_id"]
    
    # 1. Fetch Media File
    media_res = supabase.table("media_files").select("*").eq("project_id", project_id).execute()
    if not media_res.data:
        raise ValueError(f"No media found for project {project_id}")
    
    media = media_res.data[0]
    storage_path = media["storage_path"]
    
    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        local_video = temp_dir / "input.mp4"
        local_audio = temp_dir / "audio.wav"
        
        # 2. Download Video
        supabase.table("job_stages").insert({
            "job_id": job_id, "stage_name": "DOWNLOAD", "status": "PROCESSING"
        }).execute()
        
        print("Downloading video...")
        download_file(supabase, "projects", storage_path, local_video)
        
        # 3. Audio Extraction
        supabase.table("job_stages").insert({
            "job_id": job_id, "stage_name": "AUDIO_EXTRACTION", "status": "PROCESSING"
        }).execute()
        
        extract_audio(local_video, local_audio)
        
        # 4. ASR (Whisper)
        supabase.table("job_stages").insert({
            "job_id": job_id, "stage_name": "ASR", "status": "PROCESSING"
        }).execute()
        
        transcript = transcribe_audio(local_audio)
        
        # 5. Translation & Save Subtitles
        supabase.table("job_stages").insert({
            "job_id": job_id, "stage_name": "TRANSLATION_SUBTITLES", "status": "PROCESSING"
        }).execute()
        
        subtitles_data = []
        for seg in transcript:
            translated = translate_text(seg["text"], "vi")
            subtitles_data.append({
                "project_id": project_id,
                "start_time": seg["start"],
                "end_time": seg["end"],
                "original_text": seg["text"],
                "translated_text": translated,
                "status": "AUTO"
            })
            
        if subtitles_data:
            supabase.table("subtitles").insert(subtitles_data).execute()
        
        supabase.table("projects").update({"status": "COMPLETED"}).eq("id", project_id).execute()
        supabase.table("jobs").update({"status": "COMPLETED"}).eq("id", job_id).execute()
        print(f"✅ Job {job_id} completed successfully.")

def run_worker_loop():
    print(f"🚀 AI Video Translation Worker Started (ID: {WORKER_ID})")
    supabase = get_supabase()
    
    while True:
        try:
            jobs_res = supabase.table("jobs").select("*").eq("status", "QUEUED").order("created_at").limit(1).execute()
            if jobs_res.data and len(jobs_res.data) > 0:
                job = jobs_res.data[0]
                job_id = job["id"]
                
                supabase.table("jobs").update({
                    "status": "PROCESSING",
                    "worker_id": WORKER_ID
                }).eq("id", job_id).execute()
                
                try:
                    process_job(supabase, job)
                except Exception as exc:
                    print(f"❌ Error processing job {job_id}: {exc}")
                    traceback.print_exc()
                    supabase.table("jobs").update({"status": "FAILED", "error": str(exc)}).eq("id", job_id).execute()
                    supabase.table("projects").update({"status": "FAILED"}).eq("id", job["project_id"]).execute()
            else:
                time.sleep(3)
        except Exception as exc:
            print(f"Loop error: {exc}")
            time.sleep(5)

if __name__ == "__main__":
    run_worker_loop()
