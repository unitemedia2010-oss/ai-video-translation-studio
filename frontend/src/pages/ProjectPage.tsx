import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
    fetchSubtitles();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `project_id=eq.${id}` }, (payload) => {
        console.log('Job updated:', payload);
        fetchProject(); // Refresh project state if needed
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_stages' }, (payload) => {
        console.log('Stage updated:', payload);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchProject = async () => {
    const { data } = await supabase.from('projects').select('*').eq('id', id).single();
    if (data) setProject(data);
    
    // Check for media
    const { data: media } = await supabase.from('media_files').select('*').eq('project_id', id).single();
    if (media) {
      const { data: urlData } = supabase.storage.from('projects').getPublicUrl(media.storage_path);
      setVideoUrl(urlData.publicUrl);
    }
  };
  
  const fetchSubtitles = async () => {
    const { data } = await supabase.from('subtitles').select('*').eq('project_id', id).order('start_time', { ascending: true });
    if (data) setSubtitles(data);
  }

  const handleUpload = async () => {
    if (!file || !id) return;
    setUploading(true);
    
    const filePath = `${id}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from('projects').upload(filePath, file);
    
    if (uploadError) {
      console.error(uploadError);
      alert('Upload failed');
      setUploading(false);
      return;
    }
    
    await supabase.from('media_files').insert([{
      project_id: id,
      file_name: file.name,
      storage_path: filePath
    }]);
    
    fetchProject();
    setUploading(false);
  };
  
  const processVideo = async () => {
    await supabase.from('jobs').insert([{
      project_id: id,
      status: 'QUEUED'
    }]);
    await supabase.from('projects').update({ status: 'PROCESSING' }).eq('id', id);
    alert('Job queued! Worker should pick it up.');
    fetchProject();
  };

  if (!project) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white flex flex-col md:flex-row gap-8">
      {/* Left Panel: Video & Controls */}
      <div className="w-full md:w-1/2 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-400">Status: {project.status}</p>
        
        {!videoUrl ? (
          <div className="border-2 border-dashed border-gray-600 p-8 rounded flex flex-col items-center gap-4">
            <input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
            <button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <video src={videoUrl} controls className="w-full rounded bg-black" />
            <button 
              onClick={processVideo}
              disabled={project.status === 'PROCESSING'}
              className="bg-green-600 px-4 py-2 rounded font-bold disabled:opacity-50"
            >
              PROCESS VIDEO
            </button>
          </div>
        )}
      </div>

      {/* Right Panel: Subtitles */}
      <div className="w-full md:w-1/2 bg-gray-800 p-4 rounded h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Subtitles</h2>
        {subtitles.length === 0 ? (
          <p className="text-gray-500">No subtitles yet. Upload and process the video.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {subtitles.map(sub => (
              <div key={sub.id} className="p-3 bg-gray-700 rounded text-sm">
                <div className="text-xs text-gray-400 mb-1">{sub.start_time} - {sub.end_time}</div>
                <div className="mb-1">{sub.original_text}</div>
                <div className="text-yellow-400">{sub.translated_text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
