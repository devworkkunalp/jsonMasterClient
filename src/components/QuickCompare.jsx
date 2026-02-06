import React, { useState, useRef } from 'react'
import { DiffEditor } from '@monaco-editor/react'

export default function QuickCompare() {
    const [json1, setJson1] = useState('')
    const [json2, setJson2] = useState('')
    const [mode, setMode] = useState('smart') // 'smart' | 'text'
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState('')
    const [error, setError] = useState(null)
    
    // Smart Diff State
    const [smartResult, setSmartResult] = useState(null)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [keyField, setKeyField] = useState('workOrderId')
    
    // Text Diff State
    const [textDiffs, setTextDiffs] = useState([]) 

    const handleCompare = async () => {
        if (!json1 || !json2) {
            setError("Please paste content in both windows.")
            return
        }
        
        setLoading(true)
        setError(null)
        setSmartResult(null)
        setTextDiffs([])
        setLoadingMessage('Initializing...')

const prepareJson = (text) => {
    if (!text) return text;
    try { 
        JSON.parse(text); 
        return text; 
    } catch {
        // Try wrapping in braces if it's a property list
        try { 
            const wrapped = `{${text}}`; 
            JSON.parse(wrapped); 
            return wrapped; 
        } catch { 
            return text; 
        }
    }
}

        try {
            if (mode === 'smart') {
                const processed1 = prepareJson(json1)
                const processed2 = prepareJson(json2)
                const file1 = new File([processed1], "source.json", { type: "application/json" })
                const file2 = new File([processed2], "target.json", { type: "application/json" })
                
                const worker = new Worker(new URL('../utils/compare.worker.js', import.meta.url), { type: 'module' });
                worker.onmessage = (e) => {
                    const { type, result, message, error: workerErr } = e.data;
                    if (type === 'PROGRESS') setLoadingMessage(message);
                    else if (type === 'COMPLETE') {
                        setSmartResult(result);
                        setLoading(false);
                        setIsCollapsed(true);
                        worker.terminate();
                    } else if (type === 'ERROR') {
                        setError(`Worker Error: ${workerErr}`);
                        setLoading(false);
                        worker.terminate();
                    }
                };
                worker.postMessage({ file1, file2, keyField, ignoredFields: "" });
            } else {
                const file1 = new File([json1], "source.txt", { type: "text/plain" })
                const file2 = new File([json2], "target.txt", { type: "text/plain" })
                
                const worker = new Worker(new URL('../utils/text.worker.js', import.meta.url), { type: 'module' });
                worker.onmessage = (e) => {
                    const { type, stats, processedLines, message, error: workerErr } = e.data;
                    if (type === 'PROGRESS') setLoadingMessage(message);
                    else if (type === 'COMPLETE') {
                        // Adapt processedLines to the simple visualization format expected by Text Diff mode in QuickCompare
                        const adaptedDiffs = processedLines
                            .filter(l => l.source?.changeType !== 'same' || l.target?.changeType !== 'same')
                            .map(l => {
                                if (l.source?.changeType === 'removed') return { type: 'removed', text: l.source.content };
                                if (l.target?.changeType === 'added') return { type: 'added', text: l.target.content };
                                if (l.source?.changeType === 'modified') {
                                    return [
                                        { type: 'removed', text: l.source.content },
                                        { type: 'added', text: l.target.content }
                                    ];
                                }
                                return null;
                            }).flat().filter(d => d);

                        setTextDiffs(adaptedDiffs);
                        setLoading(false);
                        setIsCollapsed(true);
                        worker.terminate();
                    } else if (type === 'ERROR') {
                        setError(`Worker Error: ${workerErr}`);
                        setLoading(false);
                        worker.terminate();
                    }
                };
                worker.postMessage({ file1, file2 });
            }
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

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
            <div className={`shrink-0 border-b border-gray-700 bg-gray-800 transition-all duration-300 flex flex-col ${isCollapsed ? 'h-16' : 'h-1/2 min-h-[300px]'}`}>
                <div className="flex justify-between items-center p-4 h-16 shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-purple-300">Quick Compare</h2>
                        <div className="bg-gray-700 p-1 rounded-lg flex text-xs">
                            <button onClick={() => setMode('smart')} className={`px-3 py-1 rounded transition-colors ${mode === 'smart' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Smart Diff</button>
                            <button onClick={() => setMode('text')} className={`px-3 py-1 rounded transition-colors ${mode === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Text Diff</button>
                        </div>
                         {mode === 'smart' && (
                             <input type="text" value={keyField} onChange={(e) => setKeyField(e.target.value)} placeholder="Key Field" className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white w-40 outline-none focus:border-blue-500" />
                        )}
                    </div>
                    <div className="flex gap-3">
                         {isCollapsed && <button onClick={() => setIsCollapsed(false)} className="text-sm text-gray-400 hover:text-white underline">Edit Inputs</button>}
                        <button onClick={handleCompare} disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-6 py-1.5 rounded font-medium transition-colors min-w-[140px]">
                            {loading ? (loadingMessage || 'Comparing...') : 'Run Compare'}
                        </button>
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="flex-1 flex gap-4 p-4 pt-0 min-h-0">
                        <div className="flex-1 flex flex-col">
                            <label className="text-xs font-semibold text-gray-400 mb-2 uppercase">Source Content</label>
                            <textarea value={json1} onChange={(e) => setJson1(e.target.value)} className="flex-1 bg-gray-900 border border-gray-700 rounded p-4 text-sm font-mono focus:border-blue-500 outline-none resize-none" placeholder="Paste source here..." spellCheck={false} />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="text-xs font-semibold text-gray-400 mb-2 uppercase">Target Content</label>
                            <textarea value={json2} onChange={(e) => setJson2(e.target.value)} className="flex-1 bg-gray-900 border border-gray-700 rounded p-4 text-sm font-mono focus:border-blue-500 outline-none resize-none" placeholder="Paste target here..." spellCheck={false} />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 bg-gray-900 relative flex overflow-hidden">
                {error && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/80">
                         <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg">
                             {error}
                             <button onClick={() => setError(null)} className="ml-4 underline hover:text-white">Close</button>
                         </div>
                    </div>
                )}

                {mode === 'smart' && smartResult ? (
                    <div className="flex-1 flex w-full h-full">
                        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
                            <div className="p-2 border-b border-gray-700 text-[10px] font-bold text-gray-500 uppercase">Changed ({smartContent.allItems.length})</div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {smartContent.allItems.map((item, idx) => (
                                    <button key={idx} onClick={() => setSelectedIndex(idx)} className={`w-full text-left px-3 py-2 border-b border-gray-700/50 text-xs truncate transition-colors ${selectedIndex === idx ? 'bg-blue-600/20 text-blue-200 border-l-2 border-l-blue-500' : 'text-gray-400 hover:bg-gray-700'}`}>
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${item.type === 'added' ? 'bg-green-500' : item.type === 'removed' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col relative group" key={smartContent.current?.label || selectedIndex}>
                             <button onClick={() => { const content = smartContent.current?.target || smartContent.current?.source; if (content) navigator.clipboard.writeText(JSON.stringify(content, null, 2)) }} className="absolute top-2 right-4 z-10 bg-gray-800/80 hover:bg-blue-600 text-gray-300 hover:text-white px-3 py-1 rounded text-xs border border-gray-600 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">Copy Result</button>
                             <DiffEditor height="100%" original={smartContent.original} modified={smartContent.modified} language="json" theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, automaticLayout: true, contextmenu: false }} />
                        </div>
                    </div>
                ) : mode === 'text' && textDiffs.length > 0 ? (
                    <div className="flex-1 p-4 overflow-auto custom-scrollbar bg-gray-950 font-mono text-sm">
                         {textDiffs.map((diff, index) => (
                            <div key={index} className={`mb-1 p-2 rounded border border-gray-800/50 ${diff.type === 'added' ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
                                <span className="opacity-50 mr-2">{diff.type === 'added' ? '+' : '-'}</span>
                                {diff.text}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-600 italic">
                        {isCollapsed ? 'Select an item to view diff' : 'Enhance your workflow with split-pane comparison'}
                    </div>
                )}
            </div>
        </div>
    )
}
