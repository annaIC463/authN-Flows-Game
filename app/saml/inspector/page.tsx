"use client";

import SAMLInspector from "@/components/game/SAMLInspector";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SAMLInspectorPage() {
    return (
        <div className="min-h-screen bg-neutral-950 p-8 flex flex-col">
            <div className="max-w-6xl mx-auto w-full mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">SAML Inspector</h1>
                    <p className="text-neutral-400">verify the integrity of the SAML Response by identifying the core XML elements.</p>
                </div>
                <Link
                    href="/"
                    className="flex items-center text-neutral-400 hover:text-white transition-colors bg-neutral-900/50 px-4 py-2 rounded-lg border border-neutral-800"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to HQ
                </Link>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <SAMLInspector />
            </div>
        </div>
    );
}
