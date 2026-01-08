"use client";

import { useState, useMemo } from "react";
import GameCanvas from "@/components/game/GameCanvas";
import { AuthCodeConstellation, GameState } from "@/lib/game/AuthCodeConstellation";
import Link from "next/link";
import { ArrowLeft, Skull } from "lucide-react";

export default function AuthCodePKCEPage() {
    const [gameState, setGameState] = useState<GameState>('IDLE');

    const scene = useMemo(() => new AuthCodeConstellation('pkce', (state) => setGameState(state)), []);

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

                <div className="flex flex-col items-end gap-4 pointer-events-auto">
                    <div className="bg-neutral-900/50 p-4 rounded-xl backdrop-blur-sm border border-neutral-800 text-right max-w-sm">
                        <h2 className="text-xl font-bold text-white mb-1">
                            PKCE Training
                        </h2>
                        <p className="text-sm text-neutral-400">
                            <span className="text-yellow-400">1. Generate Keys</span> &rarr; <span className="text-purple-400">Send Hash</span> &rarr; <span className="text-blue-400">Exchange with Secret</span>.
                        </p>
                    </div>

                    {/* Threat Scenarios Control */}
                    {gameState === 'COMPLETE' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => scene.startTokenTheft()}
                                className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 rounded-lg backdrop-blur-sm transition-all animate-fade-in text-sm"
                            >
                                <Skull size={16} />
                                Theft
                            </button>
                            <button
                                onClick={() => scene.startRefreshRotation()}
                                className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 text-purple-200 rounded-lg backdrop-blur-sm transition-all animate-fade-in text-sm"
                            >
                                <Skull size={16} />
                                Refresh Theft
                            </button>
                        </div>
                    )}
                    {gameState === 'ATTACK_THEFT' && (
                        <div className="px-4 py-2 bg-red-900/50 border border-red-500 text-red-100 rounded-lg animate-pulse">
                            ⚠ Scenario: Token Theft
                        </div>
                    )}
                    {gameState === 'ATTACK_REFRESH' && (
                        <div className="px-4 py-2 bg-purple-900/50 border border-purple-500 text-purple-100 rounded-lg animate-pulse">
                            ⚠ Scenario: Refresh Token Theft
                        </div>
                    )}
                    {gameState === 'REVOKED' && (
                        <div className="px-4 py-2 bg-red-950/90 border border-red-500 text-red-500 font-bold rounded-lg animate-bounce text-center">
                            ⛔ ACCESS REVOKED <br /> <span className="text-xs font-normal text-red-300">Refresh Token Reuse Detected</span>
                        </div>
                    )}
                </div>
            </div>

            <GameCanvas scene={scene} />
        </div>
    );
}
