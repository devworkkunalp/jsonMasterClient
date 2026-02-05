import { useState, useRef, useEffect, useCallback } from 'react'
// import { List } from 'react-window' // REMOVED: Broken in this env
// import { AutoSizer } from 'react-virtualized-auto-sizer' // REMOVED

export default function TextDiff() {
    const [file1, setFile1] = useState(null)
    const [file2, setFile2] = useState(null)
    // Store lines as an object { [index]: { source, target } } for sparse loading
    const [lineData, setLineData] = useState({})
    const [stats, setStats] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const [sessionId, setSessionId] = useState(null)
    const pageSize = 500

    // Custom Virtual Scroll State
    const scrollContainerRef = useRef(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(800) // Default to non-zero to show content immediately
    const rowHeight = 24

    // Track which pages we are currently fetching to prevent duplicates
    const fetchingPages = useRef(new Set())

    const loadPage = useCallback(async (page) => {
        if (!file1 || !file2) return
        if (fetchingPages.current.has(page)) return

        fetchingPages.current.add(page)
        const isFirstPage = page === 1
        
        if (isFirstPage) {
            setLoading(true)
            setLineData({})
        }
        
        setError(null)

        const formData = new FormData()
        if (isFirstPage) {
            formData.append('files', file1)
            formData.append('files', file2)
        } else if (sessionId) {
            formData.append('sessionId', sessionId)
        } else {
             fetchingPages.current.delete(page)
             return
        }
        
        formData.append('page', page.toString())
        formData.append('pageSize', pageSize.toString())

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/compare/text`, {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Comparison failed')
                setLoading(false)
                fetchingPages.current.delete(page)
                return
            }

            if (isFirstPage) {
                setStats({
                    totalLines: data.totalLines,
                    totalDifferences: data.totalDifferences,
                    sourceSize: data.sourceSize,
                    targetSize: data.targetSize,
                    totalPages: data.totalPages
                })
                if (data.sessionId) setSessionId(data.sessionId)
            }
            
            // Merge new lines into state at correct indices
            setLineData(prev => {
                const newData = { ...prev }
                const startIndex = (page - 1) * pageSize
                
                const sLines = data.sourceLines || []
                const tLines = data.targetLines || []
                
                const count = Math.max(sLines.length, tLines.length)
                
                for (let i = 0; i < count; i++) {
                    const absIndex = startIndex + i
                    newData[absIndex] = {
                        source: sLines[i] || null,
                        target: tLines[i] || null
                    }
                }
                return newData
            })

            setCurrentPage(page)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setError(`Error: ${err.message}`)
            setLoading(false)
        } finally {
            fetchingPages.current.delete(page)
        }
    }, [file1, file2, pageSize, sessionId])

    const handleCompare = () => {
        setLineData({})
        setCurrentPage(0)
        setSessionId(null)
        setStats(null)
        fetchingPages.current.clear()
        // Reset scroll position
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
        setScrollTop(0)
        
        loadPage(1)
    }

    // Handle Resize for clean container height
    useEffect(() => {
        if (!scrollContainerRef.current) return
        
        // Immediate measure
        const rect = scrollContainerRef.current.getBoundingClientRect()
        if (rect.height > 0) {
            setContainerHeight(rect.height)
        }

        const observer = new ResizeObserver(entries => {
             for (let entry of entries) {
                 if (entry.contentRect.height > 0) {
                    setContainerHeight(entry.contentRect.height)
                 }
             }
        })
        observer.observe(scrollContainerRef.current)
        return () => observer.disconnect()
    }, [stats])

    // Scroll Handler
    const handleScroll = (e) => {
        const currentScrollTop = e.target.scrollTop
        setScrollTop(currentScrollTop)

        if (!stats) return

        // Calculate visible range
        const startIndex = Math.floor(currentScrollTop / rowHeight)
        const visibleCount = Math.ceil(containerHeight / rowHeight)
        const stopIndex = startIndex + visibleCount

        // Load data logic (buffer of 100 rows)
        const buffer = 100
        const checkIndex = stopIndex + buffer
        
        // Calculate which page we need
        const neededPage = Math.floor(checkIndex / pageSize) + 1

        if (neededPage <= stats.totalPages && !fetchingPages.current.has(neededPage)) {
             // Check if we strictly need data (simple check: is the start of that page missing?)
             const pageStartIndex = (neededPage - 1) * pageSize
             if (!lineData[pageStartIndex]) {
                 console.log(`Custom Virtual: Scrolling to ${currentScrollTop}, loading page ${neededPage}`)
                 loadPage(neededPage)
             }
        }
    }

    // Render Logic calculation
    const totalContentHeight = stats ? stats.totalLines * rowHeight : 0
    
    // Only render visible items + buffer
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
        
        // Debug first few modifications to check changeType
        if (index > 30 && index < 35 && line) {
             console.log(`Row ${index}:`, line)
        }

        const style = {
            position: 'absolute',
            top: `${top}px`,
            left: 0,
            width: '100%',
            height: `${rowHeight}px`
        }

        if (!line) {
             return (
                <div style={style} className="flex border-b border-gray-800 bg-gray-900/50">
                    <div className="w-1/2 p-2 text-gray-600 italic text-sm">Loading line {index + 1}...</div>
                    <div className="w-1/2 p-2 border-l border-gray-800 text-gray-600 italic text-sm">Loading...</div>
                </div>
            )
        }

        const sourceLine = line.source || {}
        const targetLine = line.target || {}

        const sType = (sourceLine.changeType || '').toLowerCase()
        const tType = (targetLine.changeType || '').toLowerCase()

        return (
            <div style={style} className="flex hover:bg-gray-800/50 font-mono text-sm">
                {/* Source Column */}
                <div className={`w-1/2 flex border-r border-gray-700 ${
                    sType === 'removed' ? 'bg-red-900/50' :
                    sType === 'modified' ? 'bg-yellow-900/40' :
                    sType === 'added' ? 'bg-green-800/20' : ''
                }`}>
                    <span className="text-gray-500 select-none w-12 flex-shrink-0 text-right pr-3 py-0.5 border-r border-gray-800 bg-gray-900/50">
                        {sourceLine.lineNumber}
                    </span>
                    <div className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-all overflow-hidden ${
                        sType === 'removed' ? 'text-red-200 font-semibold' :
                        sType === 'modified' ? 'text-yellow-200 font-semibold' :
                        sType === 'added' ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                        {sType === 'added' ? ' ' : (sourceLine.content || ' ')}
                    </div>
                </div>

                {/* Target Column */}
                <div className={`w-1/2 flex ${
                    tType === 'added' ? 'bg-green-900/50' :
                    tType === 'modified' ? 'bg-yellow-900/40' :
                    tType === 'removed' ? 'bg-red-800/20' : ''
                }`}>
                     <span className="text-gray-500 select-none w-12 flex-shrink-0 text-right pr-3 py-0.5 border-r border-gray-800 bg-gray-900/50">
                        {targetLine.lineNumber}
                    </span>
                    <div className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-all overflow-hidden ${
                         tType === 'added' ? 'text-green-200 font-semibold' :
                        tType === 'modified' ? 'text-yellow-200 font-semibold' :
                        tType === 'removed' ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                         {tType === 'removed' ? ' ' : (targetLine.content || ' ')}
                    </div>
                </div>
            </div>
        )
    }

    const isCompactMode = !!stats
    // console.log('TextDiff Render', { stats, hasFile1: !!file1, hasFile2: !!file2, isCompactMode })

    return (
        <div className="h-full flex flex-col bg-gray-900">
            {/* Header Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 shrink-0 transition-all duration-300">
                {!isCompactMode ? (
                    // FULL HEADER (Initial State)
                    <>
                        <h2 className="text-xl font-semibold mb-4">Text Diff - Virtualized Comparison (Custom)</h2>
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
                        <div className="flex gap-4 items-center">
                            <button
                                onClick={handleCompare}
                                disabled={!file1 || !file2 || loading}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium transition-colors"
                            >
                                {loading ? 'Comparing...' : 'Compare Files'}
                            </button>
                        </div>
                    </>
                ) : (
                    // COMPACT HEADER (Result State)
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <h2 className="text-lg font-semibold text-gray-300">Text Diff</h2>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="bg-blue-900/30 text-blue-200 px-2 py-1 rounded border border-blue-800">
                                    Source: <span className="font-bold text-white">{file1?.name}</span>
                                </span>
                                <span className="text-gray-500">vs</span>
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
                            onClick={handleCompare} // Reset logic is inside handleCompare or we can make a specific reset
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded transition-colors"
                        >
                            New Comparison
                        </button>
                    </div>
                )}
            </div>

                {error && (
                    <div className="mt-4 bg-red-900/30 border border-red-700 rounded p-3 text-red-300 mx-4">
                        {error}
                    </div>
                )}

            {/* Virtualized Diff View */}
            {stats && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-2 bg-gray-900 border-b border-gray-700 text-xs font-semibold uppercase tracking-wider text-gray-500 sticky top-0 z-10 shrink-0">
                        <div className="px-4 py-2 border-r border-gray-700">Source: {file1?.name}</div>
                        <div className="px-4 py-2">Target: {file2?.name}</div>
                    </div>
                    
                    <div 
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto relative"
                    >
                        {/* Scroll Spacer to give the scrollbar correct height */}
                        <div style={{ height: totalContentHeight, width: '1px' }}></div>
                        
                        {/* Visible Rows */}
                        {visibleRows.map(index => (
                            <Row key={index} index={index} top={index * rowHeight} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
