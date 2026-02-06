import React, { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { CheckCircle2 } from 'lucide-react'

export default function FormatJson({ theme }) {
    const [input, setInput] = useState('')
    const [formatted, setFormatted] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef(null)
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

    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs'

    const handleFormat = () => {
        setLoading(true)
        setError(null)
        
        setTimeout(() => {
            try {
                if (!input.trim()) {
                    setFormatted('')
                    setLoading(false)
                    return
                }
                const parsed = JSON.parse(input)
                setFormatted(JSON.stringify(parsed, null, 2))
            } catch (err) {
                setError(err.message)
                setFormatted('')
            } finally {
                setLoading(false)
            }
        }, 100)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(formatted)
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        setLoading(true)
        setError(null)
        setFormatted('')
        
        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target.result
            setInput(text)
            setLoading(false)
        }
        reader.onerror = () => {
            setError('Failed to read file')
            setLoading(false)
        }
        reader.readAsText(file)
    }

    const handleDownload = () => {
        if (!formatted) return
        const blob = new Blob([formatted], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `formatted-${new Date().getTime()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="h-full flex flex-col gap-6 bg-white transition-colors duration-300">
            <div className="glass-header p-6 shrink-0 transition-all duration-500 rounded-b-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-sm">
                        <span className="text-xl">✨</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight transition-colors">Format & Validate JSON</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest transition-colors transition-all">Prettify and Cleanse Data</p>
                    </div>
                </div>

                <div className="hidden md:block">
                    <div className="flex items-center justify-between mb-6">
                         <div className="w-[400px] space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Source File (Optional)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".json,.txt"
                                    onChange={handleFileUpload}
                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-orange-500/10 file:text-orange-600 hover:file:bg-orange-500/20 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 transition-all group-hover:border-orange-500/20"
                                />
                            </div>
                        </div>
                        <div className="pb-0.5"> {/* Spacer for visual alignment with input box */}
                            <button
                                onClick={handleFormat}
                                disabled={loading || !input.trim()}
                                className="bg-blue-600 hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all glow-blue shadow-md h-[42px] min-w-[160px]"
                            >
                                {loading ? 'Processing...' : 'Prettify JSON'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-6 min-h-0 px-6 pb-6 pt-0 overflow-y-auto md:overflow-hidden">
                {/* Mobile Controls (Scrollable) */}
                <div className="md:hidden pb-6 border-b border-slate-100 mb-6">
                    <div className="grid grid-cols-1 gap-4 mb-4">
                         <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors">Source File (Optional)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".json,.txt"
                                    onChange={handleFileUpload}
                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-orange-500/10 file:text-orange-600 hover:file:bg-orange-500/20 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 transition-all group-hover:border-orange-500/20"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 flex-wrap">
                        <button
                            onClick={handleCopy}
                            disabled={!formatted || loading}
                            className="w-full bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-30 text-slate-600 px-6 py-3 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-widest transition-all shadow-sm h-[42px]"
                        >
                            Copy Output
                        </button>
                        <button
                            onClick={handleFormat}
                            disabled={loading || !input.trim()}
                            className="w-full bg-blue-600 hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 text-white px-12 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all glow-blue shadow-md h-[42px]"
                        >
                            {loading ? 'Processing...' : 'Prettify JSON'}
                        </button>
                    </div>
                </div>
                {/* Left: Input */}
                <div className="flex flex-col h-full relative group min-h-[300px] md:min-h-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2 transition-colors">Dirty Input</label>
                    {isMobile ? (
                        <div className="flex-1 w-full bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-inner">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                <span className="text-3xl">📄</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-700 mb-1">
                                {input ? 'Content Loaded Ready' : 'Waiting for Input'}
                            </h3>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                {input ? `${(new Blob([input]).size / 1024).toFixed(2)} KB Raw Data` : 'Upload or Paste JSON'}
                            </p>
                            {input && (
                                <div className="mt-4 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold border border-green-100">
                                    Ready to Format
                                </div>
                            )}
                        </div>
                    ) : (
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste messy, unformatted JSON here..."
                        className="flex-1 w-full bg-slate-50 text-slate-900 p-6 rounded-3xl border border-slate-200 focus:border-blue-500/50 focus:outline-none font-mono text-sm resize-none transition-all placeholder-slate-400 custom-scrollbar shadow-sm"
                        spellCheck={false}
                    />
                    )}
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center rounded-3xl z-10 transition-all">
                            <div className="text-blue-600 font-bold text-xs uppercase tracking-[0.5em] animate-pulse">Parsing Dataset...</div>
                        </div>
                    )}
                </div>

                {/* Desktop Output */}
                <div className="hidden md:flex flex-col h-full relative min-h-[300px] md:min-h-0">
                    <div className="flex items-center justify-between mb-3 ml-2 mr-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest transition-colors">Pristine Output</label>
                        <button
                            onClick={handleCopy}
                            disabled={!formatted || loading}
                            className="bg-slate-100 hover:bg-white active:scale-95 disabled:opacity-30 text-slate-500 hover:text-blue-600 px-3 py-1 rounded-lg border border-slate-200 hover:border-blue-200 text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                        >
                            <span>📋</span> Copy Output
                        </button>
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden relative shadow-sm">
                         {error ? (
                            <div className="absolute inset-0 p-8 text-red-600 dark:text-red-400 bg-red-500/5 dark:bg-red-900/10 font-mono text-sm overflow-auto custom-scrollbar transition-all">
                                <div className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Validation Error</div>
                                <pre className="whitespace-pre-wrap leading-relaxed">{error}</pre>
                            </div>
                        ) : (
                            !isMobile && (
                            <Editor
                                height="100%"
                                language="json"
                                theme={monacoTheme}
                                value={formatted}
                                onMount={handleEditorMount}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    padding: { top: 20, bottom: 20 },
                                    glyphMargin: false,
                                    folding: true,
                                    scrollbar: { vertical: 'hidden' }
                                }}
                            />
                            )
                        )}

                    </div>
                </div>

                {/* Mobile Result Card */}
                <div className="md:hidden flex flex-col items-center justify-center p-4">
                    {formatted ? (
                        <div className="w-full glass-card rounded-3xl p-8 text-center animate-in fade-in zoom-in duration-300 border-green-500/20 shadow-xl">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/5">
                                <CheckCircle2 size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Format Complete!</h3>
                            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-bold italic">
                                Your JSON is now pristine. Tap below to download the formatted file.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="w-full bg-blue-600 hover:scale-[1.02] active:scale-95 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all glow-blue shadow-lg flex items-center justify-center gap-3"
                            >
                                📥 Download Result
                            </button>
                        </div>
                    ) : (
                        <div className="text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
                            Waiting for Input
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
