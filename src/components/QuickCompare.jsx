import React, { useState, useRef, useEffect } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { CheckCircle2 } from 'lucide-react'

export default function QuickCompare({ theme }) {
    const [showMobileHint, setShowMobileHint] = useState(true)
    const [json1, setJson1] = useState('')
    const [json2, setJson2] = useState('')
    const [mode, setMode] = useState('smart') // 'smart' | 'text'
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState('')
    const [error, setError] = useState(null)
    
    const [smartResult, setSmartResult] = useState(null)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [keyField, setKeyField] = useState('id')
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs'
    const [textDiffs, setTextDiffs] = useState([])
    const [textStats, setTextStats] = useState(null)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
    const editorRef = useRef(null);

    useEffect(() => {
        return () => {
            if (editorRef.current) {
                editorRef.current = null;
            }
        };
    }, []);

    const handleEditorMount = (editor) => {
        editorRef.current = editor;
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

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

    const handleCompare = async () => {
        if (!json1 || !json2) {
            setError("Please paste content in both windows.")
            return
        }
        
        setLoading(true)
        setError(null)
        setSmartResult(null)
        setTextDiffs([])
        setTextStats(null)
        setLoadingMessage('Initializing...')

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
                        setTextStats(stats);
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

    const handleDownloadReport = () => {
        if (!smartResult && !textDiffs.length) return

        let content = ''
        const filename = `comparison-report-${new Date().getTime()}.txt`

        if (mode === 'smart' && smartResult) {
            content = `SMART COMPARISON REPORT\n` +
                      `Generated: ${new Date().toLocaleString()}\n` +
                      `Summary: ${smartResult.summary.totalRecords} records, ${smartResult.summary.modifiedCount} modified, ${smartResult.summary.addedCount} added, ${smartResult.summary.removedCount} removed\n\n` +
                      `MODIFIED ITEMS:\n` +
                      smartResult.modified.map(item => `[${item.keyValue || 'N/A'}] Changes: ${item.differences.length}`).join('\n')
        } else if (mode === 'text' && textStats) {
            content = `TEXT DIFF REPORT\n` +
                      `Generated: ${new Date().toLocaleString()}\n` +
                      `Summary: ${textStats.totalLines} lines, ${textStats.totalDifferences} differences\n`
        }

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden transition-colors duration-300">
            <div className={`glass-header shrink-0 transition-all duration-500 flex flex-col rounded-b-3xl ${isCollapsed ? 'h-20' : 'h-auto min-h-[300px]'}`}>
                {/* Mobile Hint Banner */}
                {showMobileHint && (
                    <div className="md:hidden bg-blue-50/50 border-b border-blue-100 p-3 flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">🖥️</span>
                            <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wide leading-tight">
                                For the best comparison experience,<br/>use a desktop screen.
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowMobileHint(false)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center p-6 gap-4 md:h-20 shrink-0">
                    <div className="flex items-center justify-between w-full md:w-auto gap-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm transition-colors">
                                <span className="text-xl">⚡</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Quick Diff</h2>
                                <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest transition-colors">Instant Snippet Comparison</p>
                            </div>
                        </div>
                        <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex text-[10px] font-bold uppercase tracking-widest transition-colors">
                            <button onClick={() => setMode('smart')} className={`px-4 py-2 rounded-lg transition-all ${mode === 'smart' ? 'bg-blue-600 text-white shadow-lg glow-blue' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}>Smart Diff</button>
                            <button onClick={() => setMode('text')} className={`px-4 py-2 rounded-lg transition-all ${mode === 'text' ? 'bg-blue-600 text-white shadow-lg glow-blue' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}>Text Diff</button>
                        </div>
                         {mode === 'smart' && (
                             <div className="relative group">
                                 <input 
                                    type="text" 
                                    value={keyField} 
                                    onChange={(e) => setKeyField(e.target.value)} 
                                    placeholder="Correlation Key" 
                                    className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-700 w-40 outline-none focus:border-blue-500/50 transition-all placeholder-slate-400" 
                                />
                             </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                         {isCollapsed && (
                                <button 
                                    onClick={() => setIsCollapsed(false)} 
                                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                Edit Snippets
                            </button>
                        )}
                        <button 
                            onClick={handleCompare} 
                            disabled={loading || !json1.trim() || !json2.trim()} 
                            className="bg-blue-600 hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all w-full md:w-auto min-w-[160px] glow-blue shadow-md"
                        >
                            {loading ? (loadingMessage || 'Comparing...') : 'Run Analysis'}
                        </button>
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 pt-0 min-h-0 overflow-y-auto md:overflow-hidden">
                         <div className="flex-1 flex flex-col min-h-[250px] md:min-h-0">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2 transition-colors">Source Snippet</label>
                            <textarea 
                                value={json1} 
                                onChange={(e) => setJson1(e.target.value)} 
                                className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 text-sm font-mono text-slate-900 focus:border-blue-500/50 outline-none resize-none transition-all placeholder-slate-400 custom-scrollbar shadow-sm" 
                                placeholder="Paste source JSON or text code..." 
                                spellCheck={false} 
                            />
                        </div>
                        <div className="flex-1 flex flex-col min-h-[250px] md:min-h-0">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2 transition-colors">Target Snippet</label>
                            <textarea 
                                value={json2} 
                                onChange={(e) => setJson2(e.target.value)} 
                                className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 text-sm font-mono text-slate-900 focus:border-purple-500/50 outline-none resize-none transition-all placeholder-slate-400 custom-scrollbar shadow-sm" 
                                placeholder="Paste target JSON or text code..." 
                                spellCheck={false} 
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 bg-white dark:bg-darker-slate relative flex overflow-hidden p-6 gap-6 pt-0 transition-colors">
                {error && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-darker-slate/80 backdrop-blur-sm transition-all duration-500">
                         <div className="glass-card border-red-500/30 px-8 py-6 rounded-2xl text-red-600 font-bold flex flex-col items-center gap-4 shadow-2xl">
                             <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 shadow-inner">❌ ERROR</div>
                             <p className="text-sm">{error}</p>
                             <button onClick={() => setError(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Dismiss</button>
                         </div>
                    </div>
                )}

                {/* Desktop Results Area */}
                <div className="hidden md:flex flex-1 overflow-hidden gap-6 h-full">
                    {mode === 'smart' && smartResult ? (
                        <div className="flex-1 flex gap-6 w-full h-full">
                            <div className="w-72 glass-card rounded-3xl flex flex-col shrink-0 overflow-hidden shadow-sm transition-all">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors">Modified Items ({smartContent.allItems.length})</div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {smartContent.allItems.map((item, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => setSelectedIndex(idx)} 
                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-tight truncate transition-all flex items-center justify-between ${selectedIndex === idx ? 'bg-blue-600 text-white shadow-lg glow-blue translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-sm ${item.type === 'added' ? 'bg-green-500' : item.type === 'removed' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                            {selectedIndex === idx && <span>→</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div className="flex-1 min-w-0 flex flex-col relative group glass-card rounded-3xl overflow-hidden shadow-sm transition-all">
                                 <button onClick={() => { const content = smartContent.current?.target || smartContent.current?.source; if (content) navigator.clipboard.writeText(JSON.stringify(content, null, 2)) }} className="absolute top-4 right-6 z-10 bg-slate-100 hover:bg-blue-600 text-xs font-black text-slate-900 hover:text-white px-4 py-2 rounded-xl backdrop-blur-xl border border-slate-200 transition-all opacity-0 group-hover:opacity-100 shadow-xl">Copy Result</button>
                                 {!isMobile && (
                                 <DiffEditor 
                                    height="100%" 
                                    original={smartContent.original} 
                                    modified={smartContent.modified} 
                                    language="json" 
                                    onMount={handleEditorMount}
                                    theme={monacoTheme} 
                                    options={{ 
                                        readOnly: true, 
                                        minimap: { enabled: false }, 
                                        automaticLayout: true, 
                                        contextmenu: false,
                                        fontSize: 13,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        renderSideBySide: true,
                                        padding: { top: 20, bottom: 20 }
                                    }} 
                                 />
                                 )}
                            </div>
                        </div>
                    ) : mode === 'text' && textDiffs.length > 0 ? (
                        <div className="flex-1 glass-card rounded-3xl p-8 overflow-auto custom-scrollbar bg-slate-50 font-mono text-sm shadow-sm transition-all">
                             {textDiffs.map((diff, index) => (
                                <div key={index} className={`mb-2 p-3 rounded-xl border flex items-start gap-4 transition-all hover:bg-black/5 ${diff.type === 'added' ? 'bg-green-500/5 border-green-500/10 text-green-700 shadow-sm' : 'bg-red-500/5 border-red-500/10 text-red-700 shadow-sm'}`}>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest transition-all ${diff.type === 'added' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>{diff.type === 'added' ? 'ADD' : 'DEL'}</span>
                                    <span className="flex-1 whitespace-pre-wrap">{diff.text}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse transition-colors">
                            {isCollapsed ? 'Select item to view' : 'System Ready for Comparison'}
                        </div>
                    )}
                </div>

                {/* Mobile Result Card */}
                <div className="md:hidden flex-1 flex items-center justify-center">
                    {(smartResult || textDiffs.length > 0) ? (
                        <div className="w-full glass-card rounded-3xl p-8 text-center animate-in fade-in zoom-in duration-300 border-green-500/20 shadow-xl mx-2">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/5">
                                <CheckCircle2 size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Analysis Success!</h3>
                            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-bold italic">
                                Comparison computed locally. To keep your mobile experience neat, detailed data is available via download.
                            </p>
                            <button
                                onClick={handleDownloadReport}
                                className="w-full bg-blue-600 hover:scale-[1.02] active:scale-95 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all glow-blue shadow-lg flex items-center justify-center gap-3"
                            >
                                📥 Download Report
                            </button>
                        </div>
                    ) : (
                        <div className="text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
                            System Ready
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
