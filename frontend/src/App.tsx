import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ProjectPage } from './pages/ProjectPage';
import { UploadPage } from './pages/UploadPage';
import { EditorPage } from './pages/EditorPage';
import { PreviewPage } from './pages/PreviewPage';

function AppSwitcher() {
  const location = useLocation();
  const isVideoSub = location.pathname.includes('/video-sub');
  
  // Mute the menu slightly when inside an editor so it doesn't distract, but still accessible
  const isEditor = location.pathname.includes('/editor') || location.pathname.includes('/preview');

  return (
    <div className={`fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex gap-1 p-1 bg-black/60 backdrop-blur-xl rounded-full shadow-2xl border border-white/10 transition-opacity duration-300 ${isEditor ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
      <Link 
        to="/" 
        className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors ${!isVideoSub ? 'bg-amber-500 text-black' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
      >
        🎤 KARAOKE STUDIO
      </Link>
      <Link 
        to="/video-sub" 
        className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors ${isVideoSub ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
      >
        🎬 VIDEO SUB AI
      </Link>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppSwitcher />
      <Routes>
        {/* Karaoke Studio */}
        <Route path="/" element={<UploadPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/preview/:id" element={<PreviewPage />} />
        
        {/* Video Sub AI */}
        <Route path="/video-sub" element={<Dashboard />} />
        <Route path="/video-sub/project/:id" element={<ProjectPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
