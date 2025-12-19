"use client";

import { useMemo, useEffect } from "react";
import GameCanvas from "@/components/game/GameCanvas";
import { EvolutionConstellation } from "@/lib/game/EvolutionConstellation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EvolutionPage() {
    const router = useRouter();
    const scene = useMemo(() => {
        const s = new EvolutionConstellation();
        s.onComplete = () => {
            router.push("/authorization-code");
        };
        return s;
    }, [router]);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
                <Link
                    href="/"
                    className="pointer-events-auto flex items-center text-neutral-400 hover:text-white transition-colors bg-neutral-900/50 p-2 rounded-lg backdrop-blur-sm"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Menu
                </Link>

                <div className="bg-neutral-900/50 p-4 rounded-xl backdrop-blur-sm border border-neutral-800 text-right max-w-sm pointer-events-auto">
                    <h2 className="text-xl font-bold text-white mb-1">
                        Evolution of Auth
                    </h2>
                    <p className="text-sm text-neutral-400">
                        Experience the history of authentication mechanics.
                    </p>
                </div>
            </div>

            <GameCanvas scene={scene} />
        </div>
    );
}
