
// ... imports
import { useState, useMemo, useEffect } from 'react'
import { DiffEditor } from '@monaco-editor/react'

export default function SmartCompare() {
    // ... existing state
    const [file1, setFile1] = useState(null)
    const [file2, setFile2] = useState(null)
    const [keyField, setKeyField] = useState('workOrderId') 
    const [ignoredFields, setIgnoredFields] = useState('')
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [filter, setFilter] = useState('all') // 'all', 'modified', 'added', 'removed'
    const [visibleCount, setVisibleCount] = useState(50)
    const [searchTerm, setSearchTerm] = useState('')

    // Reset pagination when filter or result changes
    useEffect(() => {
        setVisibleCount(50)
        setSelectedIndex(0)
    }, [result, filter, searchTerm])

    // ... existing handleCompare ...
    const handleCompare = async () => {
        // ... (keep exact existing logic)
        if (!file1 || !file2) {
            setError('Please select both files')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        const formData = new FormData()
        formData.append('files', file1)
        formData.append('files', file2)
        formData.append('keyField', keyField)
        formData.append('ignoredFields', ignoredFields)

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/compare/smart`, {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Comparison failed')
                setLoading(false)
                return
            }

            setResult(data)
            setLoading(false)
            // selectedIndex reset handled by useEffect
        } catch (err) {
            console.error(err)
            setError(`Error: ${err.message}`)
            setLoading(false)
        }
    }

    // ... existing filteredRecords memo ...
    const filteredRecords = useMemo(() => {
        if (!result) return []

        const mapItem = (item, type, index) => {
            const kv = item.keyValue || 'N/A';
            return {
                ...item,
                type,
                displayKeyValue: kv,
                label: kv !== 'N/A' ? `${keyField}: ${kv}` : `${type.toUpperCase()} #${index + 1}`
            };
        }

        const modified = (result.modified || []).map((i, idx) => mapItem(i, 'modified', idx))
        const added = (result.added || []).map((i, idx) => mapItem(i, 'added', idx))
        const removed = (result.removed || []).map((i, idx) => mapItem(i, 'removed', idx))

        let list = []
        if (filter === 'all') list = [...modified, ...added, ...removed]
        else if (filter === 'modified') list = modified
        else if (filter === 'added') list = added
        else if (filter === 'removed') list = removed
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(item => 
                item.label.toLowerCase().includes(term) ||
                (item.keyValue && item.keyValue.toString().toLowerCase().includes(term))
            );
        }

        return list
    }, [result, filter, keyField, searchTerm])

    const currentRecord = filteredRecords[selectedIndex]

    // ... existing json stringify ...
    const originalJson = currentRecord?.source ? JSON.stringify(currentRecord.source, null, 2) : ''
    const modifiedJson = currentRecord?.target ? JSON.stringify(currentRecord.target, null, 2) : ''

    const handleDownloadReport = () => {
        if (!result) return

        const report = {
            summary: result.summary,
            sourceFile: file1?.name,
            targetFile: file2?.name,
            generatedAt: new Date().toLocaleString(),
            // Simplified changes list for user readability
            changes: filteredRecords.map(item => ({
                status: item.type.toUpperCase(),
                key: item.keyValue || 'N/A',
                label: item.label,
                // Only include diffs if modified, otherwise full item if added/removed might be too big but let's include it for "smartness"
                // Actually user said "simple show the comparison". Let's keep it metadata heavy.
                sourceSnippet: item.source,
                targetSnippet: item.target
            }))
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `smart-comparison-report-${new Date().getTime()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const isCompactMode = !!result



    return (
        <div className="h-full flex flex-col bg-gray-900">
             {/* ... Header Section (keep exactly same) ... */}
            <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 shrink-0 transition-all duration-300">
                {!isCompactMode ? (
                    // FULL HEADER (Initial)
                    <>
                        <h2 className="text-xl font-semibold mb-4 text-purple-300">Smart JSON Comparator</h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Source JSON</label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => setFile1(e.target.files[0])}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Target JSON</label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => setFile2(e.target.files[0])}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-end">
                             <div className="w-1/3">
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Match By Field (Correlation ID)
                                </label>
                                <input
                                    type="text"
                                    value={keyField}
                                    onChange={(e) => setKeyField(e.target.value)}
                                    placeholder="e.g. id, workOrderId, uuid"
                                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Ignore Fields (Comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={ignoredFields}
                                    onChange={(e) => setIgnoredFields(e.target.value)}
                                    placeholder="e.g. timestamp, validationDetails, auditLog"
                                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                                />
                            </div>
                            <button
                                onClick={handleCompare}
                                disabled={!file1 || !file2 || loading}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium transition-colors h-[42px]"
                            >
                                {loading ? 'Analyzing...' : 'Compare JSON'}
                            </button>
                        </div>
                    </>
                ) : (
                    // COMPACT HEADER (Result)
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <h2 className="text-lg font-semibold text-purple-300">Smart DiffResult</h2>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="bg-blue-900/30 text-blue-200 px-2 py-1 rounded border border-blue-800">
                                    Source: <span className="font-bold text-white">{file1?.name}</span>
                                </span>
                                <span className="text-gray-500">vs</span>
                                <span className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded border border-purple-800">
                                    Target: <span className="font-bold text-white">{file2?.name}</span>
                                </span>
                            </div>
                             <div className="text-sm text-gray-400 border-l border-gray-600 pl-6 flex gap-3">
                                <button onClick={() => setFilter('all')} className={`px-2 py-0.5 rounded ${filter === 'all' ? 'bg-gray-700 text-white' : 'hover:text-white'}`}>
                                    Total: {result.summary.totalRecords}
                                </button>
                                <button onClick={() => setFilter('modified')} className={`px-2 py-0.5 rounded ${filter === 'modified' ? 'bg-yellow-900/40 text-yellow-200' : 'text-yellow-500 hover:text-yellow-200'}`}>
                                    Mod: {result.summary.modifiedCount}
                                </button>
                                <button onClick={() => setFilter('added')} className={`px-2 py-0.5 rounded ${filter === 'added' ? 'bg-green-900/40 text-green-200' : 'text-green-500 hover:text-green-200'}`}>
                                    Add: {result.summary.addedCount}
                                </button>
                                <button onClick={() => setFilter('removed')} className={`px-2 py-0.5 rounded ${filter === 'removed' ? 'bg-red-900/40 text-red-200' : 'text-red-500 hover:text-red-200'}`}>
                                    Del: {result.summary.removedCount}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button
                                onClick={handleDownloadReport}
                                className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                            >
                                <span>📥</span> Download Report
                            </button>
                            <button
                                onClick={() => setResult(null)}
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded transition-colors"
                            >
                                New Analysis
                            </button>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="mt-4 bg-red-900/30 border border-red-700 rounded p-3 text-red-300">
                        {error}
                    </div>
                )}
            </div>

            {/* Split View Body */}
            {isCompactMode && (
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT SIDEBAR: Record List */}
                    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
                        <div className="p-3 border-b border-gray-700 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Records ({filteredRecords.length})</span>
                                {searchTerm && <span className="text-[10px] text-blue-400">Filtered</span>}
                            </div>
                            <input 
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredRecords.slice(0, visibleCount).map((item, idx) => (
                                <button
                                    key={`${item.type}-${idx}`}
                                    onClick={() => setSelectedIndex(idx)}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700 transition-colors flex items-center justify-between group ${
                                        selectedIndex === idx ? 'bg-gray-700 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="text-sm font-medium text-gray-200 truncate" title={item.label}>
                                            {item.label}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                            <span className={`uppercase font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                                item.type === 'modified' ? 'bg-yellow-900/50 text-yellow-500' :
                                                item.type === 'added' ? 'bg-green-900/50 text-green-500' :
                                                'bg-red-900/50 text-red-500'
                                            }`}>
                                                {item.type}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-gray-500 ${selectedIndex === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        →
                                    </span>
                                </button>
                            ))}
                            
                            {visibleCount < filteredRecords.length && (
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 50)}
                                    className="w-full py-3 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-700/50 transition-colors border-t border-gray-700/50"
                                >
                                    Load More ({filteredRecords.length - visibleCount} remaining)
                                </button>
                            )}

                            {filteredRecords.length === 0 && (
                                <div className="p-4 text-sm text-gray-500 text-center italic">
                                    No records found matching filter.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE: Diff Editor */}
                    <div className="flex-1 bg-gray-900 relative flex flex-col min-w-0" key={currentRecord?.label || selectedIndex}>
                         {currentRecord ? (
                            <>
                                <div className="bg-gray-900/50 p-2 border-b border-gray-700 flex justify-between items-center px-4 h-12 shrink-0">
                                     <span className="text-sm text-gray-400">
                                         Comparing: <span className="text-white font-mono ml-2">{currentRecord.label}</span>
                                     </span>
                                     <div className="flex items-center gap-3">
                                         {currentRecord.differences && (
                                             <span className="text-xs text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-900/50">
                                                 {currentRecord.differences.length} changes detected
                                             </span>
                                         )}
                                         <button
                                            onClick={() => {
                                                const content = currentRecord.target || currentRecord.source;
                                                if (content) {
                                                    navigator.clipboard.writeText(JSON.stringify(content, null, 2))
                                                }
                                            }}
                                            title="Copy Result JSON"
                                            className="text-xs bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded border border-blue-500/30 transition-all flex items-center gap-1.5 group font-medium"
                                        >
                                            <span className="group-hover:scale-110 transition-transform">📋</span> Copy Result
                                        </button>
                                     </div>
                                </div>
                                <div className="flex-1">
                                    <DiffEditor
                                        height="100%"
                                        original={originalJson}
                                        modified={modifiedJson}
                                        language="json"
                                        theme="vs-dark"
                                        options={{
                                            originalEditable: false,
                                            readOnly: true,
                                            renderSideBySide: true,
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            fontSize: 13,
                                            automaticLayout: true,
                                            contextmenu: false
                                        }}
                                    />
                                </div>
                            </>
                         ) : (
                             <div className="flex-1 flex items-center justify-center text-gray-500 italic">
                                 Select a record to view details
                             </div>
                         )}
                    </div>
                </div>
            )}
        </div>
    )
}
