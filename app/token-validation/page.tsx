"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, ShieldAlert, Clock, Lock } from "lucide-react";

// --- Types ---
type Scope = "read:users" | "write:users" | "delete:users" | "read:orders" | "write:orders" | "admin";

interface TokenPayload {
    sub: string;
    exp: number;        // Expiration Timestamp
    scope: Scope[];     // List of scopes
    aud: string;        // Audience (must be 'api.myapp.com')
}

interface Request {
    id: string;
    method: "GET" | "POST" | "DELETE";
    path: string;
    requiredScope: Scope;
    token: {
        header: { alg: "HS256", typ: "JWT" };
        payload: TokenPayload;
        signature: "valid" | "invalid";
    };
    avatar: string; // Emoji
    timestamp: number; // The current time when request was made
}

// --- Logic ---
const VALID_AUDIENCE = "api.myapp.com";
const SCOPES: Scope[] = ["read:users", "write:users", "delete:users", "read:orders", "write:orders", "admin"];
const NAMES = ["Alice", "Bob", "Charlie", "Dave", "Eve", "Mallory", "Trent"];

// Helper to generate a random request
const generateRequest = (currentTime: number): Request => {
    const isBad = Math.random() < 0.6; // 60% chance of something being wrong (gameplay balance)

    // 1. Basic Request Data
    const method = Math.random() > 0.6 ? "POST" : (Math.random() > 0.3 ? "GET" : "DELETE");
    const path = Math.random() > 0.5 ? "/users" : "/orders";

    // Determine Required Scope based on method/path
    let requiredScope: Scope = "read:users";
    if (path === "/users") {
        if (method === "GET") requiredScope = "read:users";
        if (method === "POST") requiredScope = "write:users";
        if (method === "DELETE") requiredScope = "delete:users";
    } else {
        if (method === "GET") requiredScope = "read:orders";
        if (method === "POST") requiredScope = "write:orders";
        if (method === "DELETE") requiredScope = "admin";
    }

    // 2. Token Generation
    let exp = currentTime + 3600; // Valid by default (1 hour future)
    let sig: "valid" | "invalid" = "valid";
    let aud = VALID_AUDIENCE;
    const currentScopes: Scope[] = [];

    // Add random scopes (at least one)
    const numScopes = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numScopes; i++) {
        const s = SCOPES[Math.floor(Math.random() * SCOPES.length)];
        if (!currentScopes.includes(s)) currentScopes.push(s);
    }
    // Ensure we have the required scope if it's a GOOD token
    if (!currentScopes.includes(requiredScope) && !isBad) {
        currentScopes.push(requiredScope);
    }

    // 3. Introduce Defects if BAD
    let defectType = "none";
    if (isBad) {
        const defectRoll = Math.random();
        if (defectRoll < 0.33) {
            // EXPIRED
            exp = currentTime - 300;
            defectType = "expired";
        } else if (defectRoll < 0.66) {
            // BAD SIGNATURE
            sig = "invalid";
            defectType = "signature";
        } else {
            // MISSING SCOPE
            // Remove required scope if present
            const idx = currentScopes.indexOf(requiredScope);
            if (idx > -1) currentScopes.splice(idx, 1);
            defectType = "scope";
        }
    }

    return {
        id: Math.random().toString(36).substring(7),
        method,
        path,
        requiredScope,
        token: {
            header: { alg: "HS256", typ: "JWT" },
            payload: {
                sub: NAMES[Math.floor(Math.random() * NAMES.length)],
                exp,
                scope: currentScopes,
                aud
            },
            signature: sig
        },
        avatar: ["👤", "🤖", "🦊", "👽", "🐱"][Math.floor(Math.random() * 5)],
        timestamp: currentTime
    };
};

export default function TokenValidationGame() {
    const [currentTime, setCurrentTime] = useState(1735689600); // Start at some fixed epoch
    const [score, setScore] = useState(0);
    const [request, setRequest] = useState<Request | null>(null);
    const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "failure" } | null>(null);
    const [feedbackTimer, setFeedbackTimer] = useState<NodeJS.Timeout | null>(null);

    // Initial Load
    useEffect(() => {
        newRequest();
    }, []);

    // Timer Tick
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const newRequest = () => {
        setRequest(generateRequest(currentTime));
    };

    const handleDecision = (decision: "approve" | "deny") => {
        if (!request) return;

        // Determine if request is effectively valid
        const isExpired = request.token.payload.exp < currentTime;
        const isSigInvalid = request.token.signature === "invalid";
        const hasScope = request.token.payload.scope.includes(request.requiredScope);

        const isValid = !isExpired && !isSigInvalid && hasScope;

        let points = 0;
        let msg = "";
        let type: "success" | "failure" = "success";

        if (decision === "approve") {
            if (isValid) {
                points = 10;
                msg = "Access Granted. Good job.";
            } else {
                points = -50;
                type = "failure";
                if (isExpired) msg = "SECURITY BREACH! Token was EXPIRED!";
                else if (isSigInvalid) msg = "SECURITY BREACH! Invalid SIGNATURE!";
                else if (!hasScope) msg = "SECURITY BREACH! Insufficient SCOPE!";
            }
        } else {
            // Decision: Deny
            if (!isValid) {
                points = 10;
                msg = "Threat Neutralized. Request Blocked.";
            } else {
                points = -10;
                type = "failure";
                msg = "False Alarm. That token was valid!";
            }
        }

        setScore(s => s + points);
        setFeedback({ msg, type });

        // Clear feedback after 2s
        if (feedbackTimer) clearTimeout(feedbackTimer);
        const timer = setTimeout(() => setFeedback(null), 2500);
        setFeedbackTimer(timer);

        newRequest();
    };

    if (!request) return <div className="text-white">Loading shift...</div>;



    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-4 flex flex-col items-center">
            {/* Header / HUD */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                <Link href="/" className="flex items-center text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Back
                </Link>
                <div className="flex items-center space-x-6 text-xl">
                    <div className="flex items-center">
                        <Clock size={20} className="mr-2 text-blue-400" />
                        <span className="text-blue-100">{currentTime}</span>
                    </div>
                    <div className="flex items-center">
                        <ShieldAlert size={20} className={`mr-2 ${score < 0 ? 'text-red-500' : 'text-green-500'}`} />
                        <span className={score < 0 ? 'text-red-400' : 'text-green-400'}>Score: {score}</span>
                    </div>
                </div>
            </div>

            {/* Main Game Area: The Booth */}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left: The Incoming Request (Manifest) */}
                <div className="bg-neutral-900 border-2 border-dashed border-neutral-800 p-6 rounded-lg relative">
                    <div className="absolute top-4 right-4 text-6xl opacity-20 filter grayscale">{request.avatar}</div>
                    <h2 className="text-xl font-bold text-neutral-400 mb-4 border-b border-neutral-800 pb-2">INCOMING REQUEST</h2>

                    <div className="space-y-4">
                        <div className="bg-black p-4 rounded border border-neutral-800 font-mono text-sm">
                            <span className={`font-bold ${request.method === 'DELETE' ? 'text-red-500' : 'text-blue-400'}`}>{request.method}</span> {request.path}
                        </div>

                        <div className="bg-neutral-800/50 p-4 rounded border border-neutral-700">
                            <h3 className="text-xs text-neutral-500 uppercase font-bold mb-2">Required Permission</h3>
                            <div className="flex items-center text-amber-300 bg-amber-900/20 px-3 py-1 rounded w-fit border border-amber-900/50">
                                <Lock size={14} className="mr-2" />
                                {request.requiredScope}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: The Token (Passport) */}
                <div className="bg-neutral-100 text-neutral-900 p-1 rounded-lg shadow-2xl transform rotate-1 transition-transform hover:rotate-0">
                    {/* Passport Header */}
                    <div className="bg-blue-900 text-white p-4 rounded-t-lg flex justify-between items-center">
                        <span className="font-bold tracking-widest text-sm opacity-80">JWT PASSPORT</span>
                        <div className="w-8 h-8 bg-amber-400 rounded-full border-2 border-white opacity-90" />
                    </div>

                    {/* Passport Body */}
                    <div className="p-6 space-y-4 font-mono text-sm">
                        {/* Header Section */}
                        <div className="border-b border-neutral-300 pb-2">
                            <div className="text-xs text-neutral-500 mb-1">HEADER</div>
                            <div className="text-red-700 break-all leading-tight">
                                {"{"} "alg": "HS256", "typ": "JWT" {"}"}
                            </div>
                        </div>

                        {/* Payload Section (The most important part) */}
                        <div className="border-b border-neutral-300 pb-2">
                            <div className="text-xs text-neutral-500 mb-1">PAYLOAD</div>
                            <div className="text-purple-700 space-y-1">
                                <div className="flex justify-between">
                                    <span>"sub": "{request.token.payload.sub}",</span>
                                </div>
                                <div className="flex justify-between items-center bg-yellow-50 -mx-1 px-1">
                                    <span>"exp": <span className="font-bold">{request.token.payload.exp}</span>,</span>
                                    {request.token.payload.exp < currentTime && (
                                        <span className="text-xs bg-red-100 text-red-600 px-1 rounded border border-red-200 font-bold">EXPIRED</span>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    <span>"aud": "{request.token.payload.aud}",</span>
                                </div>
                                <div>
                                    "scope": [
                                    <div className="pl-4 text-neutral-600 italic grid grid-cols-1 gap-1 my-1">
                                        {request.token.payload.scope.map(s => (
                                            <span key={s} className={s === request.requiredScope ? "bg-green-100 text-green-800 px-1 w-fit font-bold" : ""}>
                                                "{s}"
                                            </span>
                                        ))}
                                    </div>
                                    ]
                                </div>
                            </div>
                        </div>

                        {/* Signature Section */}
                        <div>
                            <div className="text-xs text-neutral-500 mb-1">SIGNATURE</div>
                            <div className="text-cyan-600 text-xs break-all opacity-50">
                                HM ACSHA256( base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
                            </div>
                            <div className="mt-2 flex items-center">
                                Status:
                                <div className={`ml-2 px-2 py-0.5 rounded text-xs font-bold border ${request.token.signature === 'valid' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
                                    {request.token.signature.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Controls */}
            <div className="fixed bottom-0 left-0 w-full bg-neutral-900 border-t border-neutral-800 p-6 flex justify-center space-x-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                <button
                    onClick={() => handleDecision("deny")}
                    className="flex flex-col items-center group"
                >
                    <div className="w-20 h-20 bg-red-900/20 border-2 border-red-600 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                        <X size={40} className="text-red-500 group-hover:text-white" />
                    </div>
                    <span className="mt-2 text-red-500 font-bold tracking-widest group-hover:text-red-400">DENY (401)</span>
                </button>

                <div className="w-px bg-neutral-800 mx-4" />

                <button
                    onClick={() => handleDecision("approve")}
                    className="flex flex-col items-center group"
                >
                    <div className="w-20 h-20 bg-green-900/20 border-2 border-green-600 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                        <Check size={40} className="text-green-500 group-hover:text-white" />
                    </div>
                    <span className="mt-2 text-green-500 font-bold tracking-widest group-hover:text-green-400">APPROVE (200)</span>
                </button>
            </div>

            {/* Feedback Overlay */}
            {feedback && (
                <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-8 py-6 rounded-xl border-4 shadow-2xl z-50 animate-bounce-in text-center ${feedback.type === 'success'
                    ? 'bg-green-900/90 border-green-400 text-green-50'
                    : 'bg-red-900/90 border-red-500 text-red-50'
                    }`}>
                    <h2 className="text-3xl font-bold mb-2">{feedback.type === 'success' ? 'PERFECT' : 'VIOLATION'}</h2>
                    <p className="text-xl">{feedback.msg}</p>
                    <div className={`mt-4 text-sm font-bold opacity-75 ${feedback.type === 'success' ? 'text-green-200' : 'text-red-200'}`}>
                        {feedback.type === 'success' ? '+10 Credits' : score < 0 ? 'Penalty Applied' : '-10 Credits'}
                    </div>
                </div>
            )}
        </main>
    );
}
