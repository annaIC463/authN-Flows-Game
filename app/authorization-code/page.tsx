import Link from "next/link";
import { Gamepad2, Network, ArrowLeft } from "lucide-react";

export default function AuthCodeSelectionPage() {
    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-3xl opacity-40 animate-pulse" />
            </div>

            <div className="z-10 w-full max-w-4xl text-center">
                <div className="mb-12">
                    <Link
                        href="/"
                        className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft className="mr-2" size={20} /> Back to Menu
                    </Link>
                    <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Authorization Code Flow
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        The standard for modern web apps. Learn how to securely authenticate users without exposing tokens to the browser.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Simulation Mode */}
                    <Link href="/authorization-code/simulation" className="group">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 hover:border-purple-500 transition-all duration-300 h-full flex flex-col items-center text-center hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]">
                            <div className="p-4 bg-purple-500/10 rounded-full mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                                <Network size={48} />
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-white">Simulation Mode</h2>
                            <p className="text-neutral-400">
                                Visualize the invisible. See how the User, Browser, and Server interact to exchange codes for tokens via the back-channel.
                            </p>
                        </div>
                    </Link>

                    {/* Platformer Mode */}
                    <Link href="/authorization-code/platformer" className="group">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 hover:border-pink-500 transition-all duration-300 h-full flex flex-col items-center text-center hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)]">
                            <div className="p-4 bg-pink-500/10 rounded-full mb-6 text-pink-400 group-hover:scale-110 transition-transform">
                                <Gamepad2 size={48} />
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-white">Platformer Mode</h2>
                            <p className="text-neutral-400">
                                The journey of the User Agent. Physically travel to the Auth Server, get the code, and bring it back safely.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </main>
    );
}
