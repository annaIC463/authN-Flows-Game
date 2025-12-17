"use client";

import { useMemo } from "react";
import GameCanvas from "@/components/game/GameCanvas";
import { AuthCodeConstellation } from "@/lib/game/AuthCodeConstellation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthCodeSimulationPage() {
    const scene = useMemo(() => new AuthCodeConstellation(), []);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
                <Link
                    href="/authorization-code"
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
                        Flow: <span className="text-purple-400">User</span> &rarr; <span className="text-blue-400">App</span> &rarr; <span className="text-yellow-400">Auth0</span> &rarr; <span className="text-purple-400">User</span> &rarr; <span className="text-blue-400">App</span> (Back-channel) &rarr; <span className="text-green-400">API</span>.
                    </p>
                </div>
            </div>

            <GameCanvas scene={scene} />
        </div>
    );
}
