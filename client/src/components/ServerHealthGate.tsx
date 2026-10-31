import { useEffect, useState, useCallback, type ReactNode } from "react";
import axios from "axios";
import api from "../api/axios";
import { Server } from "lucide-react";

interface ServerHealthGateProps {
    children: ReactNode;
}

export default function ServerHealthGate({ children }: ServerHealthGateProps) {
    const [isReady, setIsReady] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [errorNote, setErrorNote] = useState<string | null>(null);

    const pingServer = useCallback(async (): Promise<boolean> => {
        try {
            const res = await api.get(`/health?_t=${Date.now()}`, {
                timeout: 30000,
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            });

            if (res.status === 200 && (res.data?.status === "ok" || res.statusText === "OK")) {
                setErrorNote(null);
                return true;
            }
            return false;
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.code === "ECONNABORTED") {
                    setErrorNote("Request timed out while waiting for server startup.");
                } else if (!err.response) {
                    setErrorNote("Connecting to instance... instance is waking up.");
                } else {
                    setErrorNote(`Server responded with ${err.response.status}. Still initializing...`);
                }
            } else {
                setErrorNote("Failed to connect to server. Retrying...");
            }
            return false;
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;
        let retryTimeout: ReturnType<typeof setTimeout> | null = null;

        const runPollCycle = async () => {
            if (isCancelled) return;

            setAttempts((prev) => prev + 1);

            const ok = await pingServer();

            await new Promise((resolve) => setTimeout(resolve, 2000));

            if (isCancelled) return;

            if (ok) {
                setIsReady(true);
                return;
            }

            retryTimeout = setTimeout(() => {
                if (!isCancelled) {
                    void runPollCycle();
                }
            }, 2500);
        };

        void runPollCycle();

        return () => {
            isCancelled = true;
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
        };
    }, [pingServer]);

    useEffect(() => {
        if (isReady) return;
        const interval = setInterval(() => {
            setElapsed((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isReady]);

    if (isReady) {
        return <>{children}</>;
    }

    const progressEstimate = Math.min(95, Math.max(8, Math.round((elapsed / 50) * 100)));

    return (
        <div
            className="fixed inset-0 z-[999999] w-screen h-screen min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
            role="alertdialog"
            aria-modal="true"
            aria-label="Server waking up"
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-b from-red-100/50 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 left-0 w-80 h-80 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />

            <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <img src="/favicon.svg" alt="Scheduler" className="size-8 object-contain" />
                    <span className="text-xl sm:text-2xl font-serif font-bold text-slate-800 tracking-tight">
                        Scheduler
                    </span>
                </div>
            </header>

            <main className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center my-auto py-6">
                <div className="relative mb-6 sm:mb-8 flex items-center justify-center">
                    <div className="size-24 sm:size-28 rounded-3xl bg-white flex items-center justify-center relative z-10 p-5">
                        <img
                            src="/favicon.svg"
                            alt="Scheduler Logo"
                            className="size-16 sm:size-18 object-contain animate-pulse"
                        />
                    </div>

                    <span className="absolute -bottom-1 -right-1 size-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center z-20 shadow-md">
                        <Server className="size-3.5 text-white" />
                    </span>
                </div>

                <div className="w-full max-w-md bg-slate-100 rounded-full h-3 overflow-hidden mb-3 relative shadow-inner border border-slate-200/50">
                    <div
                        className="bg-gradient-to-r from-red-500 via-rose-500 to-orange-400 h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressEstimate}%` }}
                    />
                </div>

                {errorNote && attempts > 1 && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200/80 mb-5 max-w-md truncate">
                        {errorNote}
                    </p>
                )}
            </main>

            <footer className="relative z-10 w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 border-t border-slate-200/60 pt-4">
                <div>Scheduler &copy; {new Date().getFullYear()}</div>
            </footer>
        </div>
    );
}
