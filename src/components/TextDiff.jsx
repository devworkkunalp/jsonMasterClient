import { useState, useRef, useEffect, useCallback } from 'react'

export default function TextDiff() {
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
                console.error('Worker error:', err);
                setError(`Worker caught error: ${err.message}`);
                setLoading(false);
                setLoadingMessage('');
                worker.terminate();
            };

            worker.postMessage({ file1, file2 });

        } catch (err) {
            console.error(err)
            setError(`Error: ${err.message}`)
            setLoading(false)
            setLoadingMessage('')
        }
    }

    // Handle Resize
    useEffect(() => {
        if (!scrollContainerRef.current) return
        const rect = scrollContainerRef.current.getBoundingClientRect()
        if (rect.height > 0) setContainerHeight(rect.height)

        const observer = new ResizeObserver(entries => {
             for (let entry of entries) {
                 if (entry.contentRect.height > 0) setContainerHeight(entry.contentRect.height)
             }
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

        if (!line) return <div style={style} className="bg-gray-900" />

        const sourceLine = line.source || {}
        const targetLine = line.target || {}

        const sType = (sourceLine.changeType || '').toLowerCase()
        const tType = (targetLine.changeType || '').toLowerCase()

        return (
            <div style={style} className="flex hover:bg-gray-800/50 font-mono text-sm border-b border-gray-800/20">
                {/* Source Column */}
                <div className={`w-1/2 flex border-r border-gray-700 ${
                    sType === 'removed' ? 'bg-red-900/30' :
                    sType === 'modified' ? 'bg-yellow-900/20' :
                    sType === 'added' ? 'bg-gray-900/50' : ''
                }`}>
                    <span className="text-gray-500 select-none w-12 flex-shrink-0 text-right pr-3 py-0.5 border-r border-gray-800 bg-gray-950/30">
                        {sourceLine.lineNumber || ''}
                    </span>
                    <div className={`flex-1 px-2 py-0.5 whitespace-pre truncate ${
                        sType === 'removed' ? 'text-red-300' :
                        sType === 'modified' ? 'text-yellow-200' :
                        sType === 'added' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                        {sType === 'added' ? '' : (sourceLine.content || ' ')}
                    </div>
                </div>

                {/* Target Column */}
                <div className={`w-1/2 flex ${
                    tType === 'added' ? 'bg-green-900/30' :
                    tType === 'modified' ? 'bg-yellow-900/20' :
                    tType === 'removed' ? 'bg-gray-900/50' : ''
                }`}>
                     <span className="text-gray-500 select-none w-12 flex-shrink-0 text-right pr-3 py-0.5 border-r border-gray-800 bg-gray-950/30">
                        {targetLine.lineNumber || ''}
                    </span>
                    <div className={`flex-1 px-2 py-0.5 whitespace-pre truncate ${
                         tType === 'added' ? 'text-green-300' :
                        tType === 'modified' ? 'text-yellow-200' :
                        tType === 'removed' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                         {tType === 'removed' ? '' : (targetLine.content || ' ')}
                    </div>
                </div>
            </div>
        )
    }

    const isCompactMode = !!stats

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 shrink-0">
                {!isCompactMode ? (
                    <>
                        <h2 className="text-xl font-semibold mb-4 text-purple-300">Text Diff (Client-Side)</h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Source File</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFile1(e.target.files[0])}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                                />
                                {file1 && <p className="text-xs text-gray-500 mt-1">{file1.name} ({(file1.size / 1024 / 1024).toFixed(2)} MB)</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Target File</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFile2(e.target.files[0])}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20"
                                />
                                {file2 && <p className="text-xs text-gray-500 mt-1">{file2.name} ({(file2.size / 1024 / 1024).toFixed(2)} MB)</p>}
                            </div>
                        </div>
                        <button
                            onClick={handleCompare}
                            disabled={!file1 || !file2 || loading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-6 py-2 rounded font-medium transition-colors min-w-[140px]"
                        >
                            {loading ? (loadingMessage || 'Analyzing...') : 'Compare Files'}
                        </button>
                    </>
                ) : (
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <h2 className="text-lg font-semibold text-purple-300">Text Diff Results</h2>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="bg-blue-900/30 text-blue-200 px-2 py-1 rounded border border-blue-800">
                                    Source: <span className="font-bold text-white">{file1?.name}</span>
                                </span>
                                <span className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded border border-purple-800">
                                    Target: <span className="font-bold text-white">{file2?.name}</span>
                                </span>
                            </div>
                            <div className="text-sm text-gray-400 border-l border-gray-600 pl-6">
                                Differences: <span className="text-yellow-400 font-bold">{stats.totalDifferences.toLocaleString()}</span>
                                <span className="mx-2">|</span>
                                Lines: <span className="text-white font-bold">{stats.totalLines.toLocaleString()}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setStats(null)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded transition-colors"
                        >
                            New Comparison
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 bg-red-900/30 border border-red-700 rounded p-3 text-red-300 mx-4">{error}</div>
            )}

            {stats && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-2 bg-gray-900 border-b border-gray-700 text-[10px] font-bold uppercase tracking-widest text-gray-500 sticky top-0 z-10 shrink-0">
                        <div className="px-4 py-2 border-r border-gray-700">SOURCE: {file1?.name}</div>
                        <div className="px-4 py-2">TARGET: {file2?.name}</div>
                    </div>
                    
                    <div 
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto relative custom-scrollbar bg-gray-950"
                    >
                        <div style={{ height: totalContentHeight, width: '1px' }}></div>
                        {visibleRows.map(index => <Row key={index} index={index} top={index * rowHeight} />)}
                    </div>
                </div>
            )}
        </div>
    )
}
