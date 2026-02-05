import React, { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'

export default function FormatJson() {
    const inputRef = useRef(null)
    const [formatted, setFormatted] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef(null)

    const handleFormat = () => {
        setLoading(true)
        setError(null)
        
        // Use setTimeout to allow UI to render loading state before heavy parsing blocks main thread
        setTimeout(() => {
            try {
                const inputValue = inputRef.current.value
                if (!inputValue.trim()) {
                    setFormatted('')
                    setLoading(false)
                    return
                }
                const parsed = JSON.parse(inputValue)
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
            if (inputRef.current) {
                inputRef.current.value = text // Set text without re-render
            }
            setLoading(false)
        }
        reader.onerror = () => {
            setError('Failed to read file')
            setLoading(false)
        }
        reader.readAsText(file)
    }

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex justify-between items-center shrink-0">
                <h2 className="text-xl font-semibold text-purple-300">Format & Validate JSON</h2>
                <div className="flex gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json,.txt"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors border border-gray-600"
                    >
                        📂 Upload File
                    </button>
                    <button
                        onClick={handleFormat}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-wait text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        {loading ? 'Processing...' : 'Format'}
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={!formatted || loading}
                        className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm font-medium transition-colors border border-gray-600"
                    >
                        Copy Result
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* Left: Input */}
                <div className="flex flex-col h-full relative">
                    <label className="text-sm font-medium text-gray-400 mb-2">Raw JSON Input</label>
                    <textarea
                        ref={inputRef}
                        defaultValue=""
                        placeholder="Paste your messy JSON here or upload a file..."
                        className="flex-1 w-full bg-gray-800 text-gray-200 p-4 rounded border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-sm resize-none"
                        spellCheck={false}
                    />
                    {loading && (
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center rounded z-10">
                            <div className="text-blue-400 font-semibold animate-pulse">Processing Large File...</div>
                        </div>
                    )}
                </div>

                {/* Right: Output */}
                <div className="flex flex-col h-full relative">
                    <label className="text-sm font-medium text-gray-400 mb-2">Formatted Output</label>
                    <div className="flex-1 border border-gray-700 rounded overflow-hidden relative bg-[#1e1e1e]">
                         {error ? (
                            <div className="absolute inset-0 p-4 text-red-400 bg-red-900/20 font-mono text-sm overflow-auto">
                                <strong>Error Parsing JSON:</strong>
                                <pre className="mt-2 whitespace-pre-wrap">{error}</pre>
                            </div>
                        ) : (
                            <Editor
                                height="100%"
                                language="json"
                                theme="vs-dark"
                                value={formatted}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
