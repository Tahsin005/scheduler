import { useEffect, useState } from "react";
import { dummyGenerationData } from "../assets/assets";
import { ArrowRightIcon, HistoryIcon, Loader2Icon } from "lucide-react";

const AIComposer = () => {
    const [prompt, setPrompt] = useState("")
    const [tone, setTone] = useState("Professional");
    const [generateImage, setGenerateImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generations, setGenerations] = useState<any[]>([]);

    const [activeSchedular, setActiveScheduler] = useState<any>(null);
    const [selectedPlatform, setSelectedPlatforms] = useState<string[]>([]);
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState(false);

    const fetchGenetations = async () => {
        setGenerations(dummyGenerationData);
    };

    useEffect(() => {
        fetchGenetations();
    }, []);

    const handleGenerate = async () => {
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
        }, 2000);
    }

    const tones = ["Professional", "Creative", "Funny", "Minimalist", "Excited"];

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            <div className="space-y-6 text-center mt-20">
                <h1 className="text-3xl text-slate-700 tracking-tight">What should we create today?</h1>
                <div className="relative group mt-12">
                    <textarea className="w-full px-6 py-6 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition resize-none h-40" placeholder="Share your idea... (e.g. A post about the launch of our new eco-friendly coffee beans)" value={prompt} onChange={(e) => setPrompt(e.target.value)} />

                    <div className="absolute bottom-4 right-2.5 flex items-center gap-3 text-sm">
                        <button className="flex items-center gap-3 bg-red-50 py-2 px-3 rounded-lg" onClick={() => setGenerateImage(!generateImage)}>
                            <span className={`text-xs transition-colors ${generateImage ? "text-red-500" : "text-slate-900"}`}>AI Image</span>
                            <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${generateImage ? "bg-red-500" : "bg-slate-200"}`}>
                                <span className={`pointer-events-none size-4 transform translate-y-0.5 rounded-full bg-white transition ${generateImage ? "translate-x-4.5" : "translate-x-0.5"}`} />
                            </div>
                        </button>

                        <button onClick={handleGenerate} className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 px-4 py-2 rounded-lg" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2Icon className="size-4 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    Generate
                                    <ArrowRightIcon className="size-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                    {tones.map((t) => (
                        <button key={t} onClick={() => setTone(t)} className={`py-1.5 px-4 rounded-full border text-sm transition-all ${tone === t ? "bg-red-500 border-red-500 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6 pt-12 border-t border-slate-100">
                <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                        <HistoryIcon className="size-5" />
                        <h2 className="text-xl">Recent Generations</h2>
                    </div>
                    <span className="text-sm text-slate-500 bg-slate-50 py-2">{generations.length} total</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {generations.map((gen) => (
                        <div className="group bg-white rounded-2x1 border border-slate-100 p-5 hover:border-red-200 transition-all relative overflow-hidden" key={gen._id}>
                            <div className="space-y-4 flex  flex-col h-full">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 uppercase tracking-widest">{new Date(gen.createdAt).toLocaleString()}</span>
                                    <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-md">{gen.tone}</span>
                                </div>

                                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1">{gen.content}</p>

                                {gen.mediaUrl && (
                                    <div className="rounded-xl overflow-hidden border border-slate-60 bg-slate-50">
                                        <img src={gen.mediaUrl} className="w-full aspect-video object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Gen" />
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-2">
                                    <button onClick={() => setActiveScheduler(gen)} className="flex-1 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 text-xs py-2.5 rounded-lg transition-all">Schedule Post</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AIComposer;