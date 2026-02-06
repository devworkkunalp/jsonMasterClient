import { useState, useRef, useEffect, useCallback } from 'react'
import { CheckCircle2 } from 'lucide-react'

export default function TextDiff({ theme }) {
    const [file1, setFile1] = useState(null)
    const [file2, setFile2] = useState(null)
    const [lineData, setLineData] = useState([])
    const [stats, setStats] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState('')

    // Custom Virtual Scroll State
    const scrollContainerRef = useRef(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(800)
    const rowHeight = 24

    const handleCompare = () => {
        if (!file1 || !file2) {
            setError('Please select both files')
            return
        }

        setLoading(true)
        setError(null)
        setStats(null)
        setLineData([])
        setLoadingMessage('Initializing worker...')
        
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
        setScrollTop(0)

        try {
            const worker = new Worker(new URL('../utils/text.worker.js', import.meta.url), { type: 'module' });

            worker.onmessage = (e) => {
                const { type, stats, processedLines, message, error } = e.data;
                
                if (type === 'PROGRESS') {
                    setLoadingMessage(message);
                } else if (type === 'COMPLETE') {
                    setStats(stats);
                    setLineData(processedLines);
                    setLoading(false);
                    setLoadingMessage('');
                    worker.terminate();
                } else if (type === 'ERROR') {
                    setError(`Worker Error: ${error}`);
                    setLoading(false);
                    setLoadingMessage('');
                    worker.terminate();
                }
            };

            worker.onerror = (err) => {
                setError(`Worker caught error: ${err.message}`);
                setLoading(false);
                setLoadingMessage('');
                worker.terminate();
            };

            worker.postMessage({ file1, file2 });

        } catch (err) {
            setError(`Error: ${err.message}`)
            setLoading(false)
            setLoadingMessage('')
        }
    }

    const handleDownloadReport = () => {
        if (!stats) return

        let content = `TEXT COMPARISON REPORT\n` +
                      `Generated: ${new Date().toLocaleString()}\n` +
                      `Source: ${file1?.name}\n` +
                      `Target: ${file2?.name}\n\n` +
                      `SUMMARY\n` +
                      `Total Lines: ${stats.totalLines}\n` +
                      `Total Differences: ${stats.totalDifferences}\n\n` +
                      `DETAILS\n`

        lineData.forEach((line, index) => {
             const sType = line.source?.changeType || 'Unchanged'
             const tType = line.target?.changeType || 'Unchanged'
             
             if (sType !== 'Unchanged' || tType !== 'Unchanged') {
                 content += `Line ${index + 1}: [${sType} -> ${tType}]\n`
                 if (line.source?.content) content += `  < ${line.source.content}\n`
                 if (line.target?.content) content += `  > ${line.target.content}\n`
                 content += '\n'
             }
        })

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `diff-report-${new Date().getTime()}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Handle Resize
    useEffect(() => {
        if (!scrollContainerRef.current) return
        const rect = scrollContainerRef.current.getBoundingClientRect()
        if (rect.height > 0) setContainerHeight(rect.height)

        const observer = new ResizeObserver(entries => {
            window.requestAnimationFrame(() => {
                if (!Array.isArray(entries) || !entries.length) return;
                for (let entry of entries) {
                    if (entry.contentRect.height > 0) setContainerHeight(entry.contentRect.height)
                }
            });
        })
        observer.observe(scrollContainerRef.current)
        return () => observer.disconnect()
    }, [stats])

    const handleScroll = (e) => {
        setScrollTop(e.target.scrollTop)
    }

    const totalContentHeight = stats ? stats.totalLines * rowHeight : 0
    const overscan = 10
    let startIndex = Math.floor(scrollTop / rowHeight) - overscan
    if (startIndex < 0) startIndex = 0
    
    let stopIndex = Math.floor((scrollTop + containerHeight) / rowHeight) + overscan
    if (stats && stopIndex >= stats.totalLines) stopIndex = stats.totalLines - 1

    const visibleRows = []
    if (stats) {
        for (let i = startIndex; i <= stopIndex; i++) {
            visibleRows.push(i)
        }
    }

    const Row = ({ index, top }) => {
        const line = lineData[index]
        const style = {
            position: 'absolute',
            top: `${top}px`,
            left: 0,
            width: '100%',
            height: `${rowHeight}px`
        }

        if (!line) return <div style={style} className="bg-white transition-colors" />

        const sourceLine = line.source || {}
        const targetLine = line.target || {}

        const sType = (sourceLine.changeType || '').toLowerCase()
        const tType = (targetLine.changeType || '').toLowerCase()

        return (
            <div style={style} className="flex hover:bg-slate-50 font-mono text-[13px] border-b border-slate-50 transition-colors">
                {/* Source Column */}
                <div className={`w-1/2 flex border-r border-slate-100 transition-colors pl-10 ${
                    sType === 'removed' ? 'bg-red-50' :
                    sType === 'modified' ? 'bg-yellow-50' :
                    sType === 'added' ? 'bg-slate-50/50' : ''
                }`}>
                    <span className="text-slate-400 select-none w-10 flex-shrink-0 text-right pr-3 py-0.5 border-r border-slate-100 bg-slate-50/50 transition-colors mr-4">
                        {sourceLine.lineNumber || ''}
                    </span>
                    <div className={`flex-1 px-4 py-0.5 whitespace-pre truncate transition-colors ${
                        sType === 'removed' ? 'text-red-600' :
                        sType === 'modified' ? 'text-yellow-600' :
                        sType === 'added' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                        {sType === 'added' ? '' : (sourceLine.content || ' ')}
                    </div>
                </div>

                {/* Target Column */}
                <div className={`w-1/2 flex transition-colors pl-10 ${
                    tType === 'added' ? 'bg-green-50' :
                    tType === 'modified' ? 'bg-yellow-50' :
                    tType === 'removed' ? 'bg-slate-50/50' : ''
                }`}>
                     <span className="text-slate-400 select-none w-10 flex-shrink-0 text-right pr-3 py-0.5 border-r border-slate-100 bg-slate-50/50 transition-colors mr-4">
                        {targetLine.lineNumber || ''}
                    </span>
                    <div className={`flex-1 px-4 py-0.5 whitespace-pre truncate transition-colors ${
                         tType === 'added' ? 'text-green-600' :
                        tType === 'modified' ? 'text-yellow-600' :
                        tType === 'removed' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                         {tType === 'removed' ? '' : (targetLine.content || ' ')}
                    </div>
                </div>
            </div>
        )
    }

    const isCompactMode = !!stats

    return (
        <div className="h-full flex flex-col bg-white transition-colors duration-300">
            <div className="glass-header px-10 py-8 shrink-0 transition-all duration-500 border-b border-slate-200">
                {!isCompactMode ? (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm transition-colors">
                                <span className="text-xl">📄</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Classic Text Comparison</h2>
                                <p className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">Line-by-Line Differential</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Source File</label>
                                <div className="space-y-1">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            onChange={(e) => setFile1(e.target.files[0])}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-500/10 file:text-blue-600 hover:file:bg-blue-500/20 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 transition-all group-hover:border-blue-500/20"
                                        />
                                    </div>
                                    {file1 && <div className="text-[10px] font-black text-green-600 ml-1 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-300">✓ Ready to Analyze</div>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Target File</label>
                                <div className="space-y-1">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            onChange={(e) => setFile2(e.target.files[0])}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-purple-500/10 file:text-purple-600 hover:file:bg-purple-500/20 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 transition-all group-hover:border-purple-500/20"
                                        />
                                    </div>
                                    {file2 && <div className="text-[10px] font-black text-green-600 ml-1 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-300">✓ Ready to Analyze</div>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleCompare}
                                disabled={!file1 || !file2 || loading}
                                className="w-full md:w-auto bg-blue-600 hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 text-white px-12 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all h-[46px] min-w-[200px] glow-blue shadow-md"
                            >
                                {loading ? (loadingMessage || 'Comparing...') : 'Start Comparison'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
                         <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter transition-colors leading-tight">Line Analysis</h2>
                                <p className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5 transition-colors">Synchronized Diff</p>
                            </div>
                             <div className="flex flex-wrap items-center gap-3">
                                 <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 transition-colors shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
                                    <span className="text-[10px] font-bold text-slate-600 max-w-[120px] truncate">{file1?.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 italic transition-colors">VS</span>
                                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 transition-colors shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]"></div>
                                    <span className="text-[10px] font-bold text-slate-600 max-w-[120px] truncate">{file2?.name}</span>
                                </div>
                            </div>
                            <div className="flex gap-6 border-l-0 md:border-l border-black/10 dark:border-white/10 md:pl-8 transition-colors">
                                <div className="text-left md:text-center">
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-tighter transition-colors">Lines</div>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter leading-none transition-colors">{stats?.totalLines || 0}</div>
                                </div>
                                <div className="text-left md:text-center">
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-tighter transition-colors">Diffs</div>
                                    <div className="text-xl font-bold text-yellow-600 dark:text-yellow-500 tracking-tighter leading-none transition-colors">{stats?.totalDifferences || 0}</div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setLineData([])
                                setStats(null)
                                setFile1(null)
                                setFile2(null)
                                setScrollTop(0)
                            }}
                            className="w-full md:w-auto text-[10px] font-black uppercase tracking-widest bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white px-8 py-3 rounded-xl border border-black/5 dark:border-white/5 transition-all shadow-sm"
                        >
                            Reset Engine
                        </button>
                    </div>
                )}
                {!stats && !loading && (
                    <div className="hidden md:flex flex-1 items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse transition-colors min-h-[200px] border-t border-slate-200">
                        System Ready
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 bg-red-500/10 dark:bg-red-900/30 border border-red-500/20 dark:border-red-700 rounded-xl p-3 text-red-600 dark:text-red-300 mx-6 transition-colors shadow-sm">{error}</div>
            )}

            {stats && (
                <>
                    {/* Desktop Result View */}
                    <div className="hidden md:flex flex-1 overflow-hidden flex-col transition-colors">
                         <div className="bg-white overflow-hidden flex flex-col transition-all h-full">
                            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 sticky top-0 z-10 shrink-0 transition-colors">
                                <div className="px-10 py-5 border-r border-slate-100 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.3)]"></div>
                                    SOURCE: {file1?.name}
                                </div>
                                <div className="px-10 py-5 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(139,92,246,0.3)]"></div>
                                    TARGET: {file2?.name}
                                </div>
                            </div>
                            
                            <div 
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto relative custom-scrollbar bg-slate-50/50"
                            >
                                <div style={{ height: totalContentHeight, width: '1px' }}></div>
                                {visibleRows.map(index => <Row key={index} index={index} top={index * rowHeight} />)}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Result Card */}
                    <div className="md:hidden flex-1 flex items-center justify-center p-4">
                        <div className="w-full glass-card rounded-3xl p-8 text-center animate-in fade-in zoom-in duration-300 border-green-500/20 shadow-xl">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/5">
                                <CheckCircle2 size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Analysis Success!</h3>
                            <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all">
                                <div className="text-center">
                                    <div className="text-xs font-black text-slate-900">{stats.totalLines}</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Lines</div>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                    <div className="text-xs font-black text-yellow-600">{stats.totalDifferences}</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Diffs</div>
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadReport}
                                className="w-full bg-blue-600 hover:scale-[1.02] active:scale-95 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all glow-blue shadow-lg flex items-center justify-center gap-3"
                            >
                                📥 Download Diff Report
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
