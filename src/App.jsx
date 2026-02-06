import React, { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import SmartCompare from './components/SmartCompare'
import TextDiff from './components/TextDiff'
import QuickCompare from './components/QuickCompare'
import FormatJson from './components/FormatJson'
import { Menu, X, Home } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [theme] = useState('light') // Forced to light mode
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Theme Sync - Always Light
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('jsonmaster_theme', 'light')
  }, [])

  // Automatic Cache Busting / Auto-Update Logic
  useEffect(() => {
    const checkVersion = async () => {
      // Don't check during local development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;

      try {
        const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
          cache: 'no-store'
        });
        
        if (!response.ok) return; 
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return; // Ignore if not JSON (e.g. 404 HTML page)
        }

        const data = await response.json();
        const serverTimestamp = data.timestamp;
        const localTimestamp = localStorage.getItem('jsonmaster_version');

        if (localTimestamp && serverTimestamp && String(serverTimestamp) !== String(localTimestamp)) {
          console.log('New version detected, reloading...');
          localStorage.setItem('jsonmaster_version', serverTimestamp);
          window.location.reload(true);
        } else if (serverTimestamp) {
          localStorage.setItem('jsonmaster_version', serverTimestamp);
        }
      } catch (err) {
        console.error('Failed to check version:', err);
      }
    };

    checkVersion();
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white text-slate-900 transition-colors duration-300">
      {/* Header Bar */}
      <header className="glass-header p-4 shrink-0 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center px-2">
          <button 
            onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }}
            className="text-left hover:scale-[1.02] active:scale-95 transition-all outline-none"
          >
            <h1 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent filter drop-shadow-sm leading-tight">
              JsonMaster
            </h1>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] -mt-0.5">Professional Suite</p>
          </button>

          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-1 items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200">
                {activeTab !== 'home' && (
                  <button
                      onClick={() => setActiveTab('home')}
                      className="mr-1 p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-90"
                      title="Back to Home"
                  >
                      <Home size={18} />
                  </button>
              )}
              {[
                { id: 'text', label: 'Text Diff' },
                { id: 'smart', label: 'Smart Compare' },
                { id: 'quick', label: 'Quick Compare' },
                { id: 'format', label: 'Format JSON' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 uppercase tracking-wider ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg glow-blue scale-[1.05]'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-white'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile Hamburger */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 shadow-sm active:scale-90 transition-all"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] transition-opacity duration-300 ease-in-out md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed top-0 right-0 h-full w-[280px] bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-out flex flex-col md:hidden ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="font-extrabold text-blue-600 text-lg">Menu</div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          {[
            { id: 'home', label: 'Dashboard', icon: '🏠' },
            { id: 'text', label: 'Text Diff', icon: '📝' },
            { id: 'smart', label: 'Smart Compare', icon: '💎' },
            { id: 'format', label: 'Format JSON', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all uppercase tracking-widest ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg glow-blue translate-x-2'
                : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-6 text-center border-t border-slate-100 bg-slate-50/30">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">JsonMaster v1.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative min-h-0">
        <div className="container mx-auto h-full flex flex-col p-4 min-h-0">
          {activeTab === 'home' ? (
            <LandingPage onNavigate={setActiveTab} theme={theme} />
          ) : activeTab === 'text' ? (
            <TextDiff theme={theme} />
          ) : activeTab === 'smart' ? (
            <SmartCompare theme={theme} />
          ) : activeTab === 'format' ? (
            <FormatJson theme={theme} />
          ) : activeTab === 'quick' ? (
            <QuickCompare theme={theme} />
          ) : null}
        </div>
      </main>
    </div>
  )
}

export default App
