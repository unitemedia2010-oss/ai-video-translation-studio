import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (data) setProjects(data);
  };

  const createProject = async () => {
    const { data } = await supabase
      .from('projects')
      .insert([{ name: 'New Video Project' }])
      .select()
      .single();
    if (data) {
      navigate(`/video-sub/project/${data.id}`);
    }
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white pt-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AI Video Translation Studio</h1>
        <button onClick={createProject} className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-500 transition-colors">
          + New Project
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map(p => (
          <div key={p.id} className="bg-gray-800 p-4 rounded cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700 hover:border-blue-500" onClick={() => navigate(`/video-sub/project/${p.id}`)}>
            <h2 className="text-xl font-semibold mb-2">{p.name}</h2>
            <p className="text-sm text-gray-400">Status: <span className="text-blue-400">{p.status}</span></p>
            <p className="text-sm text-gray-500 mt-2 text-xs">Created: {new Date(p.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
