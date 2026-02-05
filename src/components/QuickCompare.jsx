import React, { useState, useRef } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { handleStream } from '../utils/streamHandler'

export default function QuickCompare() {
    const [json1, setJson1] = useState('')
    const [json2, setJson2] = useState('')
    const [mode, setMode] = useState('smart') // 'smart' | 'text'
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    
    // Smart Diff State
    const [smartResult, setSmartResult] = useState(null)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [keyField, setKeyField] = useState('workOrderId')
    
    // Text Diff State
    const [textDiffs, setTextDiffs] = useState([]) // For legacy text diff compatibility
    const [status, setStatus] = useState('')

    const handleCompare = async () => {
        if (!json1 || !json2) {
            setError("Please paste content in both windows.")
            return
        }
        
        setLoading(true)
        setError(null)
        setSmartResult(null)
        setTextDiffs([])

        // Helper to handle partial JSON snippets
        const prepareJson = (text) => {
            try {
                JSON.parse(text)
                return text // It's valid
            } catch (e) {
                // Try wrapping in brackets
                try {
                    const wrapped = `{${text}}`
                    JSON.parse(wrapped)
                    return wrapped // It works as a fragment
                } catch (e2) {
                    return text // Return original to let backend or text diff handle/fail
                }
            }
        }

        try {
            if (mode === 'smart') {
                // Smart Diff Logic - Auto-wrap fragments
                const processed1 = prepareJson(json1)
                const processed2 = prepareJson(json2)

                const file1 = new File([processed1], "source.json", { type: "application/json" })
                const file2 = new File([processed2], "target.json", { type: "application/json" })
                
                const formData = new FormData()
                formData.append('files', file1)
                formData.append('files', file2)
                formData.append('keyField', keyField)
                
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/compare/smart`, {
                    method: 'POST',
                    body: formData,
                })
                
                const data = await response.json()
                if (!response.ok) throw new Error(data.error || 'Comparison failed')
                
                setSmartResult(data)
                setIsCollapsed(true)
                
            } else {
                // Text Diff Logic
                const formData = new FormData()
                formData.append('json1', json1)
                formData.append('json2', json2)
                
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/compare`, {
                    method: 'POST',
                    body: formData,
                })
                 
                await handleStream(response, setTextDiffs, setStatus, () => {})
                setIsCollapsed(true)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Helper for Smart Result Display
    const getSmartDiffContent = () => {
        if (!smartResult) return { original: '', modified: '', allItems: [], current: null }
        
        const mapItem = (item, type, index) => {
            const kv = item.keyValue || 'N/A';
            return {
                ...item,
                type,
                label: kv !== 'N/A' ? `${keyField}: ${kv}` : `${type.toUpperCase()} #${index + 1}`
            };
        }

        const allItems = [
            ...(smartResult.modified || []).map((i, idx) => mapItem(i, 'modified', idx)),
            ...(smartResult.added || []).map((i, idx) => mapItem(i, 'added', idx)),
            ...(smartResult.removed || []).map((i, idx) => mapItem(i, 'removed', idx))
        ]
        
        const current = allItems[selectedIndex]
        return {
            original: current?.source ? JSON.stringify(current.source, null, 2) : '',
            modified: current?.target ? JSON.stringify(current.target, null, 2) : '',
            allItems,
            current
        }
    }

    const smartContent = getSmartDiffContent()

    return (
        <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
             {/* Collapsible Input Section */}
            <div className={`shrink-0 border-b border-gray-700 bg-gray-800 transition-all duration-300 flex flex-col ${isCollapsed ? 'h-16' : 'h-1/2 min-h-[300px]'}`}>
                
                {/* Header / Controls */}
                <div className="flex justify-between items-center p-4 h-16 shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-purple-300">Quick Compare</h2>
                        <div className="bg-gray-700 p-1 rounded-lg flex text-xs">
                            <button 
                                onClick={() => setMode('smart')}
                                className={`px-3 py-1 rounded transition-colors ${mode === 'smart' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Smart Diff
                            </button>
                            <button 
                                onClick={() => setMode('text')}
                                className={`px-3 py-1 rounded transition-colors ${mode === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Text Diff
                            </button>
                        </div>
                         {mode === 'smart' && (
                             <input
                                type="text"
                                value={keyField}
                                onChange={(e) => setKeyField(e.target.value)}
                                placeholder="Key Field (e.g. id)"
                                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white w-40 focus:border-blue-500 outline-none"
                            />
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                         {isCollapsed && (
                            <button 
                                onClick={() => setIsCollapsed(false)}
                                className="text-sm text-gray-400 hover:text-white underline"
                            >
                                Edit Inputs
                            </button>
                        )}
                        <button
                            onClick={handleCompare}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-6 py-1.5 rounded font-medium transition-colors"
                        >
                            {loading ? 'Comparing...' : 'Run Compare'}
                        </button>
                    </div>
                </div>

                {/* Input Text Areas (Hidden when collapsed) */}
                {!isCollapsed && (
                    <div className="flex-1 flex gap-4 p-4 pt-0 min-h-0">
                        <div className="flex-1 flex flex-col">
                            <label className="text-xs font-semibold text-gray-400 mb-2 uppercase">Source JSON</label>
                            <textarea
                                value={json1}
                                onChange={(e) => setJson1(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded p-4 text-sm font-mono focus:border-blue-500 outline-none resize-none"
                                placeholder="Paste source JSON here..."
                                spellCheck={false}
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="text-xs font-semibold text-gray-400 mb-2 uppercase">Target JSON</label>
                            <textarea
                                value={json2}
                                onChange={(e) => setJson2(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded p-4 text-sm font-mono focus:border-blue-500 outline-none resize-none"
                                placeholder="Paste target JSON here..."
                                spellCheck={false}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Results Section */}
            <div className="flex-1 bg-gray-900 relative flex overflow-hidden">
                {error && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/80">
                         <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg">
                             {error}
                             <button onClick={() => setError(null)} className="ml-4 underline hover:text-white">Close</button>
                         </div>
                    </div>
                )}

                {/* Content depends on Mode */}
                {mode === 'smart' && smartResult ? (
                    <div className="flex-1 flex w-full h-full">
                         {/* Sidebar List */}
                        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
                            <div className="p-2 border-b border-gray-700 text-xs font-semibold text-gray-400">
                                Changed Items ({smartContent.allItems.length})
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {smartContent.allItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedIndex(idx)}
                                        className={`w-full text-left px-3 py-2 border-b border-gray-700/50 text-xs truncate transition-colors ${
                                            selectedIndex === idx ? 'bg-blue-600/20 text-blue-200 border-l-2 border-l-blue-500' : 'text-gray-400 hover:bg-gray-700'
                                        }`}
                                    >
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                            item.type === 'added' ? 'bg-green-500' : item.type === 'removed' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}></span>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Diff Editor Container */}
                        <div className="flex-1 min-w-0 flex flex-col relative group" key={smartContent.current?.label || selectedIndex}>
                             {/* Floating Copy Button */}
                             <button
                                onClick={() => {
                                    const content = smartContent.current?.target || smartContent.current?.source;
                                    if (content) {
                                        navigator.clipboard.writeText(JSON.stringify(content, null, 2))
                                    }
                                }}
                                title="Copy Modified JSON"
                                className="absolute top-2 right-4 z-10 bg-gray-800/80 hover:bg-blue-600 text-gray-300 hover:text-white px-3 py-1 rounded text-xs border border-gray-600 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                            >
                                Copy Result
                            </button>

                             <DiffEditor
                                height="100%"
                                original={smartContent.original}
                                modified={smartContent.modified}
                                language="json"
                                theme="vs-dark"
                                options={{ 
                                    readOnly: true, 
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    contextmenu: false 
                                }}
                            />
                        </div>
                    </div>
                ) : mode === 'text' && textDiffs.length > 0 ? (
                    <div className="flex-1 p-4 overflow-auto">
                        {/* Simple Text Diff Visualization */}
                         {textDiffs.map((diff, index) => (
                            <div key={index} className="mb-2 p-2 bg-gray-800 rounded border border-gray-700">
                                <span className={`font-mono text-sm ${diff.type === 'added' ? 'text-green-400' : diff.type === 'removed' ? 'text-red-400' : 'text-gray-300'}`}>
                                    {diff.type === 'added' ? '+ ' : diff.type === 'removed' ? '- ' : '  '}
                                    {diff.text}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Empty State
                    <div className="flex-1 flex items-center justify-center text-gray-600">
                        {isCollapsed ? 'Select an item to view diff' : 'Enhance your workflow with split-pane comparison'}
                    </div>
                )}
            </div>
        </div>
    )
}
