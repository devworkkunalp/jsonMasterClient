import React from 'react'
import { FileDiff, Zap, FileJson, FileText, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function LandingPage({ onNavigate }) {
    
    const features = [
        {
            id: 'smart',
            title: "Smart Compare",
            icon: <FileDiff size={28} className="text-purple-600" />,
            desc: "Semantic object-level comparison for structured data.",
            bestFor: "Complex configs, nested lists, ID-matching",
            badge: "PRO TOOL",
            color: "border-purple-500/20 hover:border-purple-500"
        },
        {
            id: 'quick',
            title: "Quick Compare",
            icon: <Zap size={28} className="text-orange-600" />,
            desc: "Instant side-by-side diffing for snippets and notes.",
            bestFor: "API responses, quick fixes, temporary snippets",
            badge: "FASTEST",
            color: "border-yellow-500/20 hover:border-yellow-500"
        },
        {
            id: 'text',
            title: "Text Diff",
            icon: <FileText size={28} className="text-blue-600" />,
            desc: "Standard line-by-line comparison for any file type.",
            bestFor: "Logs, TXT/XML/YAML, format-agnostic diffs",
            badge: "CLASSIC",
            color: "border-blue-500/20 hover:border-blue-500"
        },
        {
            id: 'format',
            title: "Format JSON",
            icon: <FileJson size={28} className="text-green-600" />,
            desc: "Validate and beautify messy or minified JSON data.",
            bestFor: "Beautifying payloads, syntax checking",
            badge: "UTILITY",
            color: "border-green-500/20 hover:border-green-500"
        }
    ]

    return (
        <div className="h-full flex flex-col items-center p-4 md:p-8 overflow-y-auto relative no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {/* Hero Section - COMPACT */}
            <div className="text-center mb-10 shrink-0 animate-float pt-4">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-600 text-[9px] font-black uppercase tracking-[0.3em] mb-4 animate-pulse-soft">
                    Now Supporting 100MB+ Files Locally
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tighter leading-tight transition-colors">
                    Precision Comparison.<br/>
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Zero Latency.</span>
                </h1>
                <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto leading-relaxed font-bold transition-colors">
                    The ultra-fast, privacy-first JSON toolkit designed for <span className="text-blue-600">massive datasets</span> and high-stakes debugging.
                </p>
            </div>

            {/* AI Cost Warning Banner - Refined & Compact */}
            <div className="w-full shrink-0 mb-12 px-0 md:px-4 max-w-6xl">
                <div className="md:glass-card md:rounded-2xl bg-white border-y md:border border-red-500/10 hover:border-red-500/40 transition-all group overflow-hidden relative shadow-sm hover:shadow-xl flex flex-col md:flex-row items-center justify-between">
                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center gap-5 p-6 relative z-10 w-full justify-between">
                        <div className="flex items-center gap-5">
                            <div className="bg-red-500/10 p-3 rounded-xl ring-1 ring-red-500/20 group-hover:scale-110 transition-transform shadow-inner">
                                <Zap size={24} className="text-red-500" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 mb-0.5 transition-colors">Stop Wasting LLM Tokens</h4>
                                <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed font-bold italic transition-colors">
                                    "JsonMaster runs entirely in your browser. 
                                    <span className="text-blue-600"> 100x faster than a chat window.</span>"
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0 text-right">
                            <div className="text-[9px] text-slate-400 uppercase tracking-[0.4em] mb-1 font-black">Architecture</div>
                            <div className="text-2xl font-black text-green-600 tracking-tighter">SERVERLESS</div>
                        </div>
                    </div>

                    {/* Mobile Marquee Layout */}
                    <div className="md:hidden w-full py-4 relative z-10 marquee-container overflow-hidden">
                        <div className="flex animate-marquee whitespace-nowrap items-center gap-12">
                            <span className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-700">
                                <Zap size={14} className="text-red-500" /> Stop Wasting LLM Tokens — JsonMaster runs entirely in your browser. 100x faster than a chat window. 
                                <span className="text-green-600 ml-4">• ARCHITECTURE: SERVERLESS</span>
                            </span>
                            <span className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-700">
                                <Zap size={14} className="text-red-500" /> Stop Wasting LLM Tokens — JsonMaster runs entirely in your browser. 100x faster than a chat window. 
                                <span className="text-green-600 ml-4">• ARCHITECTURE: SERVERLESS</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Grid - Enhanced Clarity */}
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 shrink-0 px-4">
                {features.map(f => (
                    <button
                        key={f.id}
                        onClick={() => onNavigate(f.id)}
                        className={`group relative glass-card p-6 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:bg-white text-left hover:shadow-2xl flex-col h-[340px] ${f.id === 'quick' ? 'hidden md:flex' : 'flex'}`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-slate-100 rounded-xl ring-1 ring-slate-200 group-hover:glow-blue transition-all duration-500 shadow-sm">
                                {f.icon}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 transition-colors uppercase tracking-widest">{f.badge}</span>
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-45">
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-all">{f.title}</h3>
                        <p className="text-[11px] text-slate-500 mb-6 font-medium leading-relaxed line-clamp-2 transition-colors">{f.desc}</p>
                        
                        <div className="mt-auto rounded-xl p-5 bg-blue-50/50 border border-blue-100 group-hover:border-blue-500/30 transition-all">
                            <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em] mb-2 block">Best for</span>
                            <p className="text-[11px] font-bold text-slate-800 leading-snug transition-colors">
                                {f.bestFor}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            <footer className="mt-auto pb-8 text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] transition-colors">
                Engineered for Performance • v2.1.0
            </footer>
        </div>
    )
}
