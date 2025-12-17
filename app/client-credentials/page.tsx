import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ClientCredentialsPage() {
    // Use useMemo ensures the scene is only created once
    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center p-8">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
                <Link
                    href="/"
                    className="pointer-events-auto flex items-center text-neutral-400 hover:text-white transition-colors bg-neutral-900/50 p-2 rounded-lg backdrop-blur-sm"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Menu
                </Link>
            </div>

            <div className="z-20 text-center max-w-4xl w-full">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-purple-600">
                    Client Credentials Flow
                </h1>
                <p className="text-xl text-neutral-400 mb-12">
                    Choose your training simulation mode
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl mx-auto">
                    {/* Simulation Mode */}
                    <Link
                        href="/client-credentials/simulation"
                        className="group relative p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] text-left flex flex-col h-80"
                    >
                        <div className="flex-grow flex flex-col justify-center items-center mb-6 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><line x1="3" y1="3" x2="21" y2="21" /><line x1="21" y1="3" x2="3" y2="21" /></svg>
                            </div>
                            <h3 className="text-2xl font-semibold text-white group-hover:text-blue-200">Simulation</h3>
                        </div>
                        <p className="text-sm text-neutral-400 text-center">
                            Interactive diagram. Connect the components to understand the flow relationships.
                        </p>
                    </Link>

                    {/* Platformer Mode */}
                    <Link
                        href="/client-credentials/platformer"
                        className="group relative p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] text-left flex flex-col h-80"
                    >
                        <div className="flex-grow flex flex-col justify-center items-center mb-6 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                            <h3 className="text-2xl font-semibold text-white group-hover:text-purple-200">Platformer</h3>
                        </div>
                        <p className="text-sm text-neutral-400 text-center">
                            Action challenges. Jump and dash through the data stream to acquire tokens.
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
