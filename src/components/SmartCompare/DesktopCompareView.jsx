import { useRef, useEffect } from 'react'
import { DiffEditor } from '@monaco-editor/react'

export function DesktopCompareView({
    isCompactMode,
    file1,
    setFile1,
    file2,
    setFile2,
    keyField,
    setKeyField,
    ignoredFields,
    setIgnoredFields,
    handleCompare,
    loading,
    loadingMessage,
    result,
    filter,
    setFilter,
    handleDownloadReport,
    setResult,
    error,
    filteredRecords,
    searchTerm,
    setSearchTerm,
    selectedIndex,
    setSelectedIndex,
    visibleCount,
    setVisibleCount,
    currentRecord,
    originalJson,
    modifiedJson,
    monacoTheme,
    isMobile
}) {
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
    return (
        <>
            <div className="glass-header p-6 shrink-0 transition-all duration-300">
                {!isCompactMode ? (
                    <>
                        <div className="flex items-center gap-3 mb-6 md:mb-0">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-sm">
                                <span className="text-xl">💎</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight transition-colors">Smart Logic Comparator</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest transition-colors">Advanced Diffing Engine</p>
                            </div>
                        </div>

                        {/* Desktop Setup Inputs */}
                        <div className="hidden md:block mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Source Dataset</label>
                                    <div className="space-y-1">
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={(e) => setFile1(e.target.files[0])}
                                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-500/10 file:text-blue-600 hover:file:bg-blue-500/20 bg-white border border-slate-200 rounded-xl px-4 py-2 transition-all group-hover:border-blue-500/20"
                                            />
                                        </div>
                                        {file1 && <div className="text-[10px] font-black text-green-600 ml-1 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-300">✓ Ready</div>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Target Dataset</label>
                                    <div className="space-y-1">
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={(e) => setFile2(e.target.files[0])}
                                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-purple-500/10 file:text-purple-600 hover:file:bg-purple-500/20 bg-white border border-slate-200 rounded-xl px-4 py-2 transition-all group-hover:border-purple-500/20"
                                            />
                                        </div>
                                        {file2 && <div className="text-[10px] font-black text-green-600 ml-1 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-300">✓ Ready</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="w-full md:w-1/3 space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Correlation ID (Key Field)</label>
                                    <input
                                        type="text"
                                        value={keyField}
                                        onChange={(e) => setKeyField(e.target.value)}
                                        placeholder="e.g. id, workOrderId"
                                        className="w-full bg-white text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500/50 focus:outline-none transition-all placeholder-slate-400 font-medium"
                                    />
                                </div>
                                <div className="w-full md:flex-1 space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Optimization (Ignore Fields)</label>
                                    <input
                                        type="text"
                                        value={ignoredFields}
                                        onChange={(e) => setIgnoredFields(e.target.value)}
                                        placeholder="Fields to skip (comma separated)"
                                        className="w-full bg-white text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500/50 focus:outline-none transition-all placeholder-slate-400 font-medium"
                                    />
                                </div>
                                <button
                                    onClick={handleCompare}
                                    disabled={!file1 || !file2 || loading}
                                    className="w-full md:w-auto bg-blue-600 hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all h-[46px] min-w-[180px] glow-blue"
                                >
                                    {loading ? (loadingMessage || 'Analyzing...') : 'Run Analysis'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-sm">
                                <span className="text-xl">💎</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tighter transition-colors">Smart DiffResult</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest -mt-1 transition-colors">Logic Analysis</p>
                            </div>
                        </div>

                        {!isMobile && (
                            <div className="flex-1 flex items-center justify-center gap-6 overflow-hidden">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Source</span>
                                        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
                                            <span className="text-[11px] font-black text-slate-600 max-w-[150px] truncate">{file1?.name}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-slate-300 italic mt-4">VS</span>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target</span>
                                        <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(139,92,246,0.3)]"></div>
                                            <span className="text-[11px] font-black text-slate-600 max-w-[150px] truncate">{file2?.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 border-l border-slate-200 pl-6 ml-2">
                                    <div className="flex flex-col items-center px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
                                        <span className="text-xs font-black text-slate-900">{result.summary.totalRecords}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total</span>
                                    </div>
                                    <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border shadow-sm transition-all cursor-pointer ${filter === 'modified' ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'}`} onClick={() => setFilter('modified')}>
                                        <span className="text-xs font-black text-yellow-600">{result.summary.modifiedCount}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Mod</span>
                                    </div>
                                    <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border shadow-sm transition-all cursor-pointer ${filter === 'added' ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'}`} onClick={() => setFilter('added')}>
                                        <span className="text-xs font-black text-green-600">{result.summary.addedCount}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Add</span>
                                    </div>
                                    <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border shadow-sm transition-all cursor-pointer ${filter === 'removed' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'}`} onClick={() => setFilter('removed')}>
                                        <span className="text-xs font-black text-red-600">{result.summary.removedCount}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Del</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={handleDownloadReport}
                                className="text-[10px] font-black uppercase tracking-[0.15em] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-3 rounded-xl transition-all flex items-center gap-2 glow-blue shadow-lg border border-blue-500/20"
                            >
                                📥 Download Report
                            </button>
                            <button
                                onClick={() => setResult(null)}
                                className="text-[10px] font-black uppercase tracking-[0.15em] bg-slate-900 hover:bg-black active:scale-95 text-white/90 px-5 py-3 rounded-xl transition-all shadow-xl hover:shadow-2xl border border-white/10"
                            >
                                New Analysis
                            </button>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs font-bold shadow-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Desktop Split View Body (Results) */}
            {isCompactMode && (
                <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500">
                    <div className="flex-1 bg-white overflow-hidden relative border-t border-slate-200 flex flex-row">
                        {/* LEFT SIDEBAR: Record List */}
                        <div className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0 overflow-hidden">
                            <div className="p-4 border-b border-slate-50 bg-white space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Records ({filteredRecords.length})</span>
                                    {searchTerm && <span className="text-[9px] font-black text-blue-600 uppercase">Search active</span>}
                                </div>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Search records..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all placeholder-slate-400 shadow-sm pr-10 font-bold"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                                {filteredRecords.slice(0, visibleCount).map((item, idx) => (
                                    <button
                                        key={`${item.type}-${idx}`}
                                        onClick={() => setSelectedIndex(idx)}
                                        className={`w-full text-left px-6 py-5 border-b border-slate-50 hover:bg-white transition-all flex items-center justify-between group relative overflow-hidden ${
                                            selectedIndex === idx ? 'bg-white shadow-sm' : ''
                                        }`}
                                    >
                                        {selectedIndex === idx && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />}
                                        <div className="overflow-hidden">
                                            <div className={`text-sm font-black truncate transition-colors ${selectedIndex === idx ? 'text-blue-600' : 'text-slate-600 group-hover:text-blue-600'}`} title={item.label}>
                                                {item.label}
                                            </div>
                                            <div className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-2 font-black uppercase tracking-widest transition-colors">
                                                <span className={`px-2.5 py-1 rounded-lg border text-[8px] font-black tracking-widest ${
                                                    item.type === 'modified' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    item.type === 'added' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`text-blue-600 transition-all transform flex items-center justify-center w-8 h-8 rounded-full bg-blue-50/0 group-hover:bg-blue-50 ${selectedIndex === idx ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}>
                                            →
                                        </span>
                                    </button>
                                ))}

                                {visibleCount < filteredRecords.length && (
                                    <button
                                        onClick={() => setVisibleCount(prev => prev + 50)}
                                        className="w-full py-5 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all border-t border-slate-100 bg-white"
                                    >
                                        Load More ({filteredRecords.length - visibleCount})
                                    </button>
                                )}

                                {filteredRecords.length === 0 && (
                                    <div className="p-12 text-[11px] font-black text-slate-300 text-center uppercase tracking-[0.2em] animate-pulse">
                                        No matching results
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT PANE: Diff Editor */}
                        <div className="flex-1 bg-white flex flex-col min-w-0 transition-all">
                            {currentRecord ? (
                                <>
                                    <div className="bg-white p-3 border-b border-slate-100 flex justify-between items-center px-6 h-16 shrink-0 transition-all">
                                        <div className="flex overflow-hidden items-center">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-3 shrink-0">Comparing</span>
                                            <span className="text-xs font-black text-blue-600 font-mono truncate bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-500/10">
                                                {currentRecord.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {currentRecord.differences && (
                                                <span className="text-[9px] font-black uppercase text-yellow-600 bg-yellow-50/50 px-3 py-1.5 rounded-full border border-yellow-200/50 transition-all shadow-sm">
                                                    {currentRecord.differences.length} changes detected
                                                </span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const content = currentRecord.target || currentRecord.source;
                                                    if (content) { navigator.clipboard.writeText(JSON.stringify(content, null, 2)) }
                                                }}
                                                className="text-[10px] bg-white hover:bg-blue-600 border border-slate-200 hover:border-blue-600 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 group font-black uppercase tracking-widest shadow-sm hover:shadow-lg active:scale-95"
                                            >
                                                <span className="text-sm">📋</span> {isMobile ? 'Copy' : 'Copy Result'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative">
                                        <DiffEditor
                                            height="100%"
                                            original={originalJson}
                                            modified={modifiedJson}
                                            language="json"
                                            theme={monacoTheme}
                                            onMount={handleEditorMount}
                                            options={{
                                                originalEditable: false,
                                                readOnly: true,
                                                renderSideBySide: true,
                                                minimap: { enabled: false },
                                                scrollBeyondLastLine: false,
                                                fontSize: 13,
                                                automaticLayout: true,
                                                contextmenu: false,
                                                lineNumbersMinChars: 3,
                                                padding: { top: 20, bottom: 20 }
                                            }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6 bg-white">
                                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-xl overflow-hidden relative group">
                                        <div className="absolute inset-0 bg-blue-500/5 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full"></div>
                                        <span className="text-4xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">🔍</span>
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Select a record to analyze changes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
