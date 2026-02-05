import React from 'react'
import { FileDiff, Zap, FileJson, FileText, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function LandingPage({ onNavigate }) {
    
    const features = [
        {
            id: 'smart',
            title: "Smart Compare",
            icon: <FileDiff size={32} className="text-purple-400" />,
            desc: "Deep semantic comparison for structured JSON files.",
            whenToUse: [
                "Comparing large configuration files",
                "Analyzing complex nested structures",
                "Need to match items by ID (e.g. WorkOrders)"
            ],
            color: "border-purple-500/30 hover:border-purple-500"
        },
        {
            id: 'quick',
            title: "Quick Compare",
            icon: <Zap size={32} className="text-yellow-400" />,
            desc: "Instant split-pane comparison for snippets.",
            whenToUse: [
                "Copy-pasting small JSON blocks",
                "Comparing API responses on the fly",
                "Don't want to save files to disk"
            ],
            color: "border-yellow-500/30 hover:border-yellow-500"
        },
        {
            id: 'text',
            title: "Text Diff",
            icon: <FileText size={32} className="text-blue-400" />,
            desc: "Classic line-by-line text difference viewer.",
            whenToUse: [
                "Non-JSON files (XML, YAML, TXT)",
                "Checking whitespace or formatting changes",
                "Simple structure-agnostic diffs"
            ],
            color: "border-blue-500/30 hover:border-blue-500"
        },
        {
            id: 'format',
            title: "Format JSON",
            icon: <FileJson size={32} className="text-green-400" />,
            desc: "Clean, validate, and beautify messy JSON.",
            whenToUse: [
                "Validating raw API payloads",
                "Beautifying minified JSON",
                "Checking for syntax errors"
            ],
            color: "border-green-500/30 hover:border-green-500"
        }
    ]

    return (
        <div className="h-full flex flex-col items-center bg-gray-900 p-4 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {/* Hero Section */}
            <div className="text-center mb-8 shrink-0 animate-fade-in-down pt-4">
                <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4 filter drop-shadow-lg">
                    Process 100MB+ Files Instantly
                </h1>
                <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    The ultimate developer toolkit to <span className="text-blue-400 font-semibold">compare</span>, <span className="text-purple-400 font-semibold">validate</span>, and <span className="text-pink-400 font-semibold">analyze</span> massive JSON datasets without lag.
                </p>
            </div>

            {/* AI Cost Warning Banner - Moved to Top */}
            <div className="w-full max-w-4xl shrink-0 mb-12 animate-fade-in-up">
                <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 hover:border-red-500/50 transition-colors shadow-lg shadow-red-900/10">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-500/10 p-3 rounded-full hidden md:block">
                            <Zap size={24} className="text-red-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-red-200 mb-1">Stop Burning Tokens on simple diffs!</h4>
                            <p className="text-sm text-gray-400">
                                AI models charge by the token. Pasting a 50MB JSON into a chat window? <span className="text-white font-semibold underline decoration-red-500/50">That's expensive.</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right md:text-left shrink-0 border-l border-red-500/20 pl-6 hidden md:block">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Local Processing</div>
                        <div className="text-2xl font-bold text-green-400">FREE & FAST</div>
                    </div>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 shrink-0">
                {features.map(f => (
                    <button
                        key={f.id}
                        onClick={() => onNavigate(f.id)}
                        className={`group relative bg-gray-800/40 backdrop-blur-md p-6 rounded-xl border ${f.color} transition-all duration-300 hover:bg-gray-800 hover:scale-[1.01] text-left hover:shadow-2xl hover:shadow-purple-900/10 flex flex-col h-full`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2.5 bg-gray-900/80 rounded-lg ring-1 ring-white/10">
                                {f.icon}
                            </div>
                            <span className="text-gray-500 group-hover:text-white transition-transform duration-300 group-hover:translate-x-1">
                                <ArrowRight size={20} />
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{f.title}</h3>
                        <p className="text-sm text-gray-400 mb-4 font-medium">{f.desc}</p>
                        
                        <div className="mt-auto bg-gray-900/50 rounded-lg p-3 border border-white/5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Best Used For:</span>
                            <ul className="space-y-1.5">
                                {f.whenToUse.map((item, i) => (
                                    <li key={i} className="flex items-center text-xs text-gray-400 group-hover:text-gray-300">
                                        <CheckCircle2 size={12} className="mr-2 text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </button>
                ))}
            </div>


            
            <footer className="mt-8 text-gray-600 text-xs shrink-0 font-medium">
                JsonMaster v2.0 • Zero Cloud Uploads • 100% Privacy
            </footer>
        </div>
    )
}
