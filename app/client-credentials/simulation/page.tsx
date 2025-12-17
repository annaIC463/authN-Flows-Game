"use client";

import { useMemo } from "react";
import GameCanvas from "@/components/game/GameCanvas";
import { ClientCredentialsConstellation } from "@/lib/game/ClientCredentialsConstellation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ClientCredentialsSimulationPage() {
    const scene = useMemo(() => new ClientCredentialsConstellation(), []);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
                <Link
                    href="/client-credentials"
                    className="pointer-events-auto flex items-center text-neutral-400 hover:text-white transition-colors bg-neutral-900/50 p-2 rounded-lg backdrop-blur-sm"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Selection
                </Link>

                <div className="bg-neutral-900/50 p-4 rounded-xl backdrop-blur-sm border border-neutral-800 text-right max-w-sm pointer-events-auto">
                    <h2 className="text-xl font-bold text-white mb-1">
                        Simulation Mode
                    </h2>
                    <p className="text-sm text-neutral-400">
                        Connect the components: <span className="text-blue-400">App</span> &rarr; <span className="text-blue-400">Tenant</span> &rarr; <span className="text-blue-400">API</span>.
                    </p>
                </div>
            </div>

            <GameCanvas scene={scene} />
        </div>
    );
}
