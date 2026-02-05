import { useState } from 'react'
import { Home } from 'lucide-react'
import FormatJson from './components/FormatJson'
import QuickCompare from './components/QuickCompare'
import SmartCompare from './components/SmartCompare'
import TextDiff from './components/TextDiff'
import LandingPage from './components/LandingPage'

function App() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-900 text-white">
      {/* Header Bar */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 shrink-0">
        <div className="container mx-auto flex justify-between items-center">
          <button 
            onClick={() => setActiveTab('home')}
            className="text-left hover:scale-[1.02] transition-transform"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              JsonMaster
            </h1>
            <p className="text-xs text-gray-400">Compare JSON files with precision</p>
          </button>

          {/* Navigation Tabs (Moved to Header) */}
          <nav className="flex gap-2 items-center">
             {activeTab !== 'home' && (
                <button
                    onClick={() => setActiveTab('home')}
                    className="mr-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                    title="Back to Home"
                >
                    <Home size={20} />
                </button>
            )}
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === 'text'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              Text Diff
            </button>
            <button
              onClick={() => setActiveTab('smart')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === 'smart'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              Smart Compare
            </button>
            <button
              onClick={() => setActiveTab('quick')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === 'quick'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              Quick Compare
            </button>
            <button
              onClick={() => setActiveTab('format')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === 'format'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              Format JSON
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative min-h-0">
        <div className="container mx-auto h-full flex flex-col p-4 min-h-0">
          {activeTab === 'home' ? (
            <LandingPage onNavigate={setActiveTab} />
          ) : activeTab === 'text' ? (
            <TextDiff />
          ) : activeTab === 'smart' ? (
            <SmartCompare />
          ) : activeTab === 'format' ? (
            <FormatJson />
          ) : activeTab === 'quick' ? (
            <QuickCompare />
          ) : null}
        </div>
      </main>
    </div>
  )
}

export default App
