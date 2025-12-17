"use client";

import { useEffect, useRef } from 'react';

export interface GameScene {
    init(ctx: CanvasRenderingContext2D, width: number, height: number): void;
    update(dt: number): void;
    draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
    cleanup(): void;
    onClick?(x: number, y: number): void;
    onMouseMove?(x: number, y: number): void;
    onKeyDown?(key: string): void;
    onKeyUp?(key: string): void;
}

interface GameCanvasProps {
    scene: GameScene;
}

export default function GameCanvas({ scene }: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high DPI displays
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            scene.init(ctx, window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', resize);
        resize(); // Initial sizing

        const loop = (time: number) => {
            // Delta time in seconds, capped at 0.1s to prevent huge jumps
            const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
            lastTimeRef.current = time;

            scene.update(dt);

            // Clear canvas (using logical coordinates due to scale)
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            scene.draw(ctx, window.innerWidth, window.innerHeight);

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', resize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            scene.cleanup();
        };
    }, [scene]);

    // Input handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => scene.onKeyDown?.(e.code);
        const handleKeyUp = (e: KeyboardEvent) => scene.onKeyUp?.(e.code);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [scene]);

    return (
        <canvas
            ref={canvasRef}
            className="block fixed inset-0 z-0 bg-neutral-900"
            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                scene.onClick?.(e.clientX - rect.left, e.clientY - rect.top);
            }}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                scene.onMouseMove?.(e.clientX - rect.left, e.clientY - rect.top);
            }}
        />
    );
}
