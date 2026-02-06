export function MobileCompareView({
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
    handleDownloadReport,
    setResult
}) {
    return (
        <div className="flex-1 p-6 overflow-y-auto bg-white">
            <div className="grid grid-cols-1 gap-6 mb-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Source Dataset</label>
                    <div className="space-y-1">
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".json"
                                onChange={(e) => setFile1(e.target.files[0])}
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-500/10 file:text-blue-600 hover:file:bg-blue-500/20 bg-white border border-slate-200 rounded-xl px-4 py-2 transition-all group-hover:border-blue-500/20 shadow-sm"
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
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-purple-500/10 file:text-purple-600 hover:file:bg-purple-500/20 bg-white border border-slate-200 rounded-xl px-4 py-2 transition-all group-hover:border-purple-500/20 shadow-sm"
                            />
                        </div>
                        {file2 && <div className="text-[10px] font-black text-green-600 ml-1 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-300">✓ Ready</div>}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-8">
                <div className="w-full space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Correlation ID (Key Field)</label>
                    <input
                        type="text"
                        value={keyField}
                        onChange={(e) => setKeyField(e.target.value)}
                        placeholder="e.g. id, workOrderId"
                        className="w-full bg-white text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500/50 focus:outline-none transition-all placeholder-slate-400 font-medium shadow-sm"
                    />
                </div>
                <div className="w-full space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Optimization (Ignore Fields)</label>
                    <input
                        type="text"
                        value={ignoredFields}
                        onChange={(e) => setIgnoredFields(e.target.value)}
                        placeholder="Fields to skip (comma separated)"
                        className="w-full bg-white text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500/50 focus:outline-none transition-all placeholder-slate-400 font-medium shadow-sm"
                    />
                </div>
                <button
                    onClick={handleCompare}
                    disabled={!file1 || !file2 || loading}
                    className="w-full bg-blue-600 hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all glow-blue shadow-lg"
                >
                    {loading ? (loadingMessage || 'Analyzing...') : 'Run Analysis'}
                </button>
            </div>

            {isCompactMode && result && (
                <div className="space-y-4 pt-6 border-t border-slate-200 animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Results</h3>
                        <button
                            onClick={() => setResult(null)}
                            className="text-[10px] font-bold uppercase tracking-widest bg-white hover:bg-slate-50 active:scale-95 text-slate-500 hover:text-slate-900 px-4 py-2 rounded-xl border border-slate-200 transition-all shadow-sm"
                        >
                            Reset
                        </button>
                    </div>
                    
                    {result.summary.totalRecords > 0 ? (
                        <div className="space-y-4">
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center">
                                <div className="text-3xl font-black text-slate-900 mb-1">{result.summary.totalRecords}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Differences</div>
                            </div>
                            <button
                                onClick={handleDownloadReport}
                                className="w-full text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-5 rounded-2xl transition-all flex items-center justify-center gap-2 glow-blue shadow-xl"
                            >
                                <span>📥</span> Download Full Report
                            </button>
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
                            <div className="text-4xl mb-3 grayscale opacity-30">✨</div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1">No Differences Found</h4>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">The files are identical</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
