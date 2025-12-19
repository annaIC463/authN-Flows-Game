import Link from "next/link";
import { Play, Shield, Server, FileCheck } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-neutral-950 text-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-3xl opacity-50 animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-3xl opacity-50 animate-pulse delay-1000" />
            </div>

            <div className="z-10 text-center max-w-4xl w-full">
                <div className="mb-12 space-y-4">
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-500">
                        Auth Mechanics
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        Master the protocols that power the web. Select a flow to begin your training.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {/* Level 0: Evolution of Auth */}
                    <Link
                        href="/evolution"
                        className="group relative p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)] text-left flex flex-col h-64"
                    >
                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
                                <Shield size={24} />
                            </div>
                            <div className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full border border-amber-500/20">
                                IN PROGRESS
                            </div>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2 text-white group-hover:text-yellow-200 transition-colors">
                            The Evolution
                        </h3>
                        <p className="text-sm text-neutral-400 mb-6 flex-grow">
                            Experience the history of auth. From Basic Auth to Cookies to Modern OIDC.
                        </p>
                        <div className="flex items-center text-sm font-medium text-yellow-400 group-hover:translate-x-1 transition-transform">
                            Travel Back in Time <Play size={16} className="ml-2 fill-current" />
                        </div>
                    </Link>
                    {/* Level 1: Client Credentials */}
                    <Link
                        href="/client-credentials"
                        className="group relative p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] text-left flex flex-col h-64"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                <Server size={24} />
                            </div>
                            <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                                UNLOCKED
                            </div>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2 text-white group-hover:text-blue-200 transition-colors">
                            Client Credentials
                        </h3>
                        <p className="text-sm text-neutral-400 mb-6 flex-grow">
                            Machine-to-machine authentication. Validate app credentials and secure API access.
                        </p>
                        <div className="flex items-center text-sm font-medium text-blue-400 group-hover:translate-x-1 transition-transform">
                            Start Simulation <Play size={16} className="ml-2 fill-current" />
                        </div>
                    </Link>

                    {/* Level 2: Authorization Code (Unlocked) */}
                    <Link
                        href="/authorization-code"
                        className="group relative p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] text-left flex flex-col h-64"
                    >
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                                <Shield size={24} />
                            </div>
                            <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                                UNLOCKED
                            </div>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2 text-white group-hover:text-purple-200 transition-colors">
                            Authorization Code
                        </h3>
                        <p className="text-sm text-neutral-400 mb-6 flex-grow">
                            User authentication flow. Exchange codes for tokens securely via back-channel.
                        </p>
                        <div className="flex items-center text-sm font-medium text-purple-400 group-hover:translate-x-1 transition-transform">
                            Start Simulation <Play size={16} className="ml-2 fill-current" />
                        </div>
                    </Link>

                    {/* Level 3: Device Flow (Locked) */}
                    {/* Level 3: Token Validation (Unlocked) */}
                    <Link
                        href="/token-validation"
                        className="group relative p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-amber-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)] text-left flex flex-col h-64"
                    >
                        <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                                <FileCheck size={24} />
                            </div>
                            <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                                UNLOCKED
                            </div>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2 text-white group-hover:text-amber-200 transition-colors">
                            The Gatekeeper
                        </h3>
                        <p className="text-sm text-neutral-400 mb-6 flex-grow">
                            API Security. Validate tokens, check signatures, and enforce scopes in "Papers, Please" style.
                        </p>
                        <div className="flex items-center text-sm font-medium text-amber-400 group-hover:translate-x-1 transition-transform">
                            Start Shift <Play size={16} className="ml-2 fill-current" />
                        </div>
                    </Link>

                    {/* SAML Inspector */}
                    <Link
                        href="/saml/inspector"
                        className="group relative p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-red-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] text-left flex flex-col h-64"
                    >
                        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                                <Shield size={24} />
                            </div>
                            <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                                UNLOCKED
                            </div>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2 text-white group-hover:text-red-200 transition-colors">
                            SAML Inspector
                        </h3>
                        <p className="text-sm text-neutral-400 mb-6 flex-grow">
                            Analyze XML assertions. Identify the Issuer, NameID, and Signature to verify identity.
                        </p>
                        <div className="flex items-center text-sm font-medium text-red-400 group-hover:translate-x-1 transition-transform">
                            Start Analysis <Play size={16} className="ml-2 fill-current" />
                        </div>
                    </Link>

                </div>
            </div>
        </main>
    );
}
