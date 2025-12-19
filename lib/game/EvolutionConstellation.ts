import { GameScene } from "@/components/game/GameCanvas";

type NodeType = 'user' | 'server' | 'auth' | 'attacker';
type Point = { x: number, y: number, label: string, id: string, radius: number, type: NodeType };
type GameState = 'INTRO' | 'PLAYING' | 'FAILED' | 'SUCCESS';
type Stage = 'BASIC_AUTH' | 'SESSION' | 'IMPLICIT' | 'COMPLETE';

export class EvolutionConstellation implements GameScene {
    // General
    private width: number = 0;
    private height: number = 0;
    private time: number = 1; // Start at 1 to avoid /0
    private state: GameState = 'INTRO';
    private currentStage: Stage = 'BASIC_AUTH';
    private message: string = "";
    private subMessage: string = "";
    private failureReason: string = "";
    public onComplete?: () => void;

    // Visuals (Constellation Theme)
    private nodes: Point[] = [];
    private stars: { x: number, y: number, size: number, speed: number }[] = [];

    // Input
    private mousePos: { x: number, y: number } | null = null;
    private isDragging: boolean = false;
    private dragTarget: any | null = null;

    // Stage 1: Basic Auth
    private basicPacket: { x: number, y: number, radius: number, label: string } | null = null;
    private eavesdroppers: { x: number, y: number, radius: number, speedX: number, speedY: number }[] = [];

    // Stage 2: Session
    private flame: { size: number, maxRadius: number, fuel: number } | null = null; // Attached to Server Node
    private shadow: { x: number, y: number, radius: number, speed: number } | null = null;
    private sessionTimer: number = 0;
    private sessionGoal: number = 10;

    // Stage 3: Implicit
    private implicitPacket: { x: number, y: number, radius: number, label: string, type: 'TOKEN' | 'CODE' } | null = null;
    private xssBots: { angle: number, radius: number, speed: number, offset: number }[] = [];
    private hasFailedImplicit: boolean = false;

    init(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.width = width;
        this.height = height;

        // Init Stars
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.1
            });
        }

        this.startBasicAuth();
    }

    // --- SETUP METHODS ---

    startBasicAuth() {
        this.currentStage = 'BASIC_AUTH';
        this.state = 'INTRO';
        this.message = "1. RAW CREDENTIALS";
        this.subMessage = "Drag 'USER:PASS' to the Server. Watch out for sniffers.";

        this.nodes = [
            { x: this.width * 0.2, y: this.height * 0.6, label: "User / Browser", id: "user", radius: 40, type: 'user' },
            { x: this.width * 0.8, y: this.height * 0.4, label: "App Server", id: "server", radius: 40, type: 'server' }
        ];

        this.basicPacket = {
            x: this.nodes[0].x,
            y: this.nodes[0].y,
            radius: 20,
            label: "Basic b64"
        };

        // Create enemies
        this.eavesdroppers = [];
        for (let i = 0; i < 3; i++) {
            this.eavesdroppers.push({
                x: this.width * (0.4 + i * 0.15),
                y: Math.random() * this.height,
                radius: 15,
                speedX: 0,
                speedY: (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 50)
            });
        }
    }

    startSession() {
        this.currentStage = 'SESSION';
        this.state = 'INTRO';
        this.message = "2. SERVER SESSIONS";
        this.subMessage = "Passwords are gone. Keep the Server Session alive!";

        this.nodes = [
            { x: this.width * 0.5, y: this.height * 0.5, label: "App Server", id: "server", radius: 60, type: 'server' }
        ];

        this.flame = {
            size: 30,
            maxRadius: 60,
            fuel: 100
        };

        this.shadow = {
            x: -100,
            y: Math.random() * this.height,
            radius: 30,
            speed: 50
        };

        this.sessionTimer = 0;
    }

    startImplicit() {
        this.currentStage = 'IMPLICIT';
        this.state = 'INTRO';
        this.message = "3. THE FRONTEND TRAP";
        this.subMessage = "We need scale. Auth Server issues a Token. Deliver it.";
        this.hasFailedImplicit = false;

        this.nodes = [
            { x: this.width * 0.2, y: this.height * 0.5, label: "Auth Server", id: "auth", radius: 50, type: 'auth' },
            { x: this.width * 0.8, y: this.height * 0.5, label: "Browser (JS)", id: "browser", radius: 60, type: 'user' }
        ];

        this.implicitPacket = {
            x: this.nodes[0].x,
            y: this.nodes[0].y,
            radius: 25,
            label: "ACCESS TOKEN",
            type: 'TOKEN'
        };

        // XSS Bots
        this.xssBots = [];
        for (let i = 0; i < 8; i++) {
            this.xssBots.push({
                angle: (i / 8) * Math.PI * 2,
                radius: 90,
                speed: 1 + Math.random(),
                offset: Math.random() * 10
            });
        }
    }

    // --- UPDATE LOOP ---

    update(dt: number) {
        this.time += dt;

        if (this.state === 'INTRO' || this.state === 'FAILED' || this.state === 'SUCCESS') return;

        if (this.currentStage === 'BASIC_AUTH') this.updateBasicAuth(dt);
        if (this.currentStage === 'SESSION') this.updateSession(dt);
        if (this.currentStage === 'IMPLICIT') this.updateImplicit(dt);
    }

    updateBasicAuth(dt: number) {
        // Move eavesdroppers
        this.eavesdroppers.forEach(e => {
            e.y += e.speedY * dt;
            if (e.y < 0 || e.y > this.height) e.speedY *= -1;
        });

        if (this.isDragging && this.basicPacket && this.mousePos) {
            this.basicPacket.x = this.mousePos.x;
            this.basicPacket.y = this.mousePos.y;

            // Collision with Eavesdroppers
            for (const e of this.eavesdroppers) {
                const dist = Math.hypot(e.x - this.basicPacket.x, e.y - this.basicPacket.y);
                if (dist < e.radius + this.basicPacket.radius) {
                    this.fail("Intercepted! Basic Auth is not encrypted on the wire.");
                    return;
                }
            }

            // Win Condition
            const target = this.nodes.find(n => n.id === 'server');
            if (target) {
                const dist = Math.hypot(target.x - this.basicPacket.x, target.y - this.basicPacket.y);
                if (dist < target.radius) {
                    this.state = 'SUCCESS';
                    this.message = "AUTHENTICATED... BUT RISKY";
                    this.subMessage = "Passwords sent every request? Dangerous. We need Sessions.";
                    setTimeout(() => this.startSession(), 3500);
                }
            }
        }
    }

    updateSession(dt: number) {
        if (!this.flame || !this.shadow) return;

        const serverNode = this.nodes.find(n => n.id === 'server');
        if (!serverNode) return;

        this.sessionTimer += dt;
        if (this.sessionTimer >= this.sessionGoal) {
            this.state = 'SUCCESS';
            this.message = "SURVIVED... BUT UN-SCALABLE";
            this.subMessage = "Server state is heavy. We need Stateless Tokens.";
            setTimeout(() => this.startImplicit(), 3500);
            return;
        }

        // Decay
        this.flame.fuel -= 12 * dt;
        this.flame.size = (this.flame.fuel / 100) * this.flame.maxRadius;

        if (this.flame.fuel <= 0) {
            this.fail("Session Timed Out. Users logged out.");
            return;
        }

        // Shadow Logic
        const dx = serverNode.x - this.shadow.x;
        const dy = serverNode.y - this.shadow.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.shadow.x += (dx / dist) * this.shadow.speed * dt;
        this.shadow.y += (dy / dist) * this.shadow.speed * dt;

        if (dist < this.shadow.radius + this.flame.size) {
            this.fail("Session Hijacked! Cookie stolen.");
        }
    }

    updateImplicit(dt: number) {
        if (!this.implicitPacket) return;

        const browserNode = this.nodes.find(n => n.id === 'browser');
        if (browserNode) {
            this.xssBots.forEach(bot => {
                bot.angle += bot.speed * dt;
            });
        }

        if (this.isDragging && this.mousePos) {
            this.implicitPacket.x = this.mousePos.x;
            this.implicitPacket.y = this.mousePos.y;

            if (browserNode) {
                const dist = Math.hypot(browserNode.x - this.implicitPacket.x, browserNode.y - this.implicitPacket.y);

                if (dist < browserNode.radius + 50) {
                    if (this.implicitPacket.type === 'TOKEN') {
                        this.failImplicitly("XSS ATTACK! Token exposed in URL fragment.");
                    } else if (this.implicitPacket.type === 'CODE') {
                        this.state = 'SUCCESS';
                        this.currentStage = 'COMPLETE';
                        this.message = "EVOLUTION COMPLETE";
                        this.subMessage = "The Code is safe. Intermediate Handshake established.";
                    }
                }
            }
        }
    }

    failImplicitly(reason: string) {
        this.state = 'FAILED';
        this.message = "COMPROMISED";
        this.failureReason = reason;
        this.subMessage = "Implicit Flow is dead. Tokens don't belong here.";
        this.isDragging = false;
        this.hasFailedImplicit = true;
    }

    fail(reason: string) {
        this.state = 'FAILED';
        this.message = "FAILURE";
        this.failureReason = reason;
        this.isDragging = false;
        this.subMessage = "Click to retry.";
    }

    // --- DRAWING ---

    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        if (width !== this.width || height !== this.height) {
            this.width = width;
            this.height = height;
        }

        // 1. Background (Dark Space)
        ctx.fillStyle = "#0f172a"; // Slate-950
        ctx.fillRect(0, 0, width, height);

        // 2. Stars
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        this.stars.forEach(star => {
            const opacity = 0.5 + Math.sin(this.time * star.speed) * 0.5;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // 3. Zone Lines (Context specific)
        this.drawZones(ctx);

        // 4. Nodes
        this.drawNodes(ctx);

        // 5. Stage Specifics
        if (this.currentStage === 'BASIC_AUTH') this.drawBasicAuthExtras(ctx);
        if (this.currentStage === 'SESSION') this.drawSessionExtras(ctx);
        if (this.currentStage === 'IMPLICIT') this.drawImplicitExtras(ctx);

        // 6. UI
        this.drawUI(ctx);
    }

    drawZones(ctx: CanvasRenderingContext2D) {
        // Draw dashed line for Frontend/Backend separation
        const zoneY = this.height * 0.5;
        ctx.beginPath();
        // Just a subtle grid or line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        // ctx.moveTo(0, zoneY);
        // ctx.lineTo(this.width, zoneY);
        // ctx.stroke();
    }

    drawNodes(ctx: CanvasRenderingContext2D) {
        ctx.textAlign = "center";

        this.nodes.forEach(node => {
            // Color Logic
            let color = "#334155";
            let glowColor = "rgba(148, 163, 184, 0.5)";

            if (node.type === 'user') {
                color = "#a855f7"; // Purple
                glowColor = "rgba(168, 85, 247, 0.5)";
            }
            if (node.type === 'auth') {
                color = "#f59e0b"; // Amber
                glowColor = "rgba(245, 158, 11, 0.5)";
            }
            if (node.type === 'server') {
                color = "#3b82f6"; // Blue
                glowColor = "rgba(59, 130, 246, 0.5)";
            }

            // Glow
            const glowSize = 10 + Math.sin(this.time * 3) * 5;
            const grad = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, node.radius + glowSize);
            grad.addColorStop(0, glowColor);
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = "#cbd5e1";
            ctx.font = "14px Inter";
            ctx.fillText(node.label, node.x, node.y + node.radius + 20);
        });
    }

    drawBasicAuthExtras(ctx: CanvasRenderingContext2D) {
        // Line
        if (this.nodes.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(this.nodes[0].x, this.nodes[0].y);
            ctx.lineTo(this.nodes[1].x, this.nodes[1].y);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Packet
        if (this.basicPacket) {
            ctx.fillStyle = "#ef4444"; // Red (Insecure)
            ctx.beginPath();
            ctx.arc(this.basicPacket.x, this.basicPacket.y, this.basicPacket.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.font = "bold 10px monospace";
            ctx.fillText("USER:PASS", this.basicPacket.x, this.basicPacket.y + 4);
        }

        // Eavesdroppers (Looking like nasty nodes)
        this.eavesdroppers.forEach(e => {
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fill();
            // Eye
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(e.x, e.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(e.x, e.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawSessionExtras(ctx: CanvasRenderingContext2D) {
        const server = this.nodes[0];
        if (!this.flame || !server) return;

        // Progress Bar
        const progress = Math.min(this.sessionTimer / this.sessionGoal, 1);
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(this.width * 0.3, 80, this.width * 0.4, 6);
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(this.width * 0.3, 80, (this.width * 0.4) * progress, 6);

        // Flame inside Server Node
        const flicker = Math.random() * 5;
        ctx.fillStyle = this.flame.fuel > 30 ? "#f97316" : "#ef4444";

        ctx.beginPath();
        ctx.arc(server.x, server.y, this.flame.size + flicker, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "bold 16px Inter";
        ctx.fillText(`${Math.ceil(this.flame.fuel)}%`, server.x, server.y + 5);

        // Shadow
        if (this.shadow) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.strokeStyle = "#8b5cf6"; // Purple glow
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#8b5cf6";

            ctx.beginPath();
            ctx.arc(this.shadow.x, this.shadow.y, this.shadow.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.fillStyle = "#a855f7";
            ctx.font = "12px Inter";
            ctx.fillText("Session Hijacker", this.shadow.x, this.shadow.y - 40);
        }
    }

    drawImplicitExtras(ctx: CanvasRenderingContext2D) {
        const browser = this.nodes.find(n => n.id === 'browser');
        if (browser) {
            // Bots
            this.xssBots.forEach(bot => {
                const bx = browser.x + Math.cos(bot.angle) * bot.radius;
                const by = browser.y + Math.sin(bot.angle) * bot.radius;

                ctx.fillStyle = "#ef4444";
                ctx.beginPath();
                ctx.arc(bx, by, 4, 0, Math.PI * 2);
                ctx.fill();

                // Trails
                ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
                ctx.beginPath();
                ctx.moveTo(browser.x, browser.y);
                ctx.lineTo(bx, by);
                ctx.stroke();
            });

            ctx.fillStyle = "#ef4444";
            ctx.font = "12px monospace";
            ctx.fillText("UNTRUSTED ZONE", browser.x, browser.y - 100);
        }

        if (this.implicitPacket) {
            if (this.implicitPacket.type === 'TOKEN') {
                ctx.fillStyle = "#facc15"; // Gold
                ctx.shadowColor = "#facc15";
                ctx.shadowBlur = 20;
            } else {
                ctx.fillStyle = "#94a3b8"; // Slate
                ctx.shadowColor = "#94a3b8";
                ctx.shadowBlur = 10;
            }

            ctx.beginPath();
            ctx.arc(this.implicitPacket.x, this.implicitPacket.y, this.implicitPacket.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "black";
            ctx.font = "bold 10px Inter";
            ctx.fillText(this.implicitPacket.type, this.implicitPacket.x, this.implicitPacket.y + 4);
        }
    }

    drawUI(ctx: CanvasRenderingContext2D) {
        ctx.textAlign = "center";

        // Main Message
        ctx.font = "bold 32px Inter";
        ctx.fillStyle = "white";
        ctx.fillText(this.message, this.width / 2, this.height * 0.15);

        // Sub Message
        ctx.font = "18px Inter";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(this.subMessage, this.width / 2, this.height * 0.15 + 35);

        if (this.state === 'INTRO') {
            ctx.fillStyle = "#3b82f6";
            ctx.font = "20px Inter";
            ctx.fillText("[ Click to Start ]", this.width / 2, this.height * 0.85);
        }

        if (this.state === 'FAILED') {
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 24px Inter";
            ctx.fillText(this.failureReason, this.width / 2, this.height * 0.5);

            if (this.currentStage === 'IMPLICIT' && this.hasFailedImplicit) {
                ctx.fillStyle = "#22c55e";
                ctx.font = "bold 20px Inter";
                ctx.fillText("Use 'Auth Code' instead? (Safe)", this.width / 2, this.height * 0.65);
            }

            ctx.fillStyle = "white";
            ctx.font = "16px Inter";
            ctx.fillText("Click to Retry", this.width / 2, this.height * 0.85);
        }
    }

    // --- INPUT ---

    onClick(x: number, y: number) {
        if (this.state === 'INTRO') {
            this.state = 'PLAYING';
            return;
        }

        if (this.state === 'FAILED') {
            if (this.currentStage === 'BASIC_AUTH') this.startBasicAuth();
            if (this.currentStage === 'SESSION') this.startSession();
            if (this.currentStage === 'IMPLICIT') {
                if (this.hasFailedImplicit) {
                    this.startImplicit();
                    this.subMessage = "Sending the Code (Reference) is safe.";
                    if (this.implicitPacket) {
                        this.implicitPacket.type = 'CODE';
                        this.implicitPacket.label = "AUTH CODE";
                    }
                } else {
                    this.startImplicit();
                }
            }
            return;
        }

        if (this.state === 'SUCCESS') {
            if (this.currentStage === 'COMPLETE' && this.onComplete) {
                this.onComplete();
            }
            return;
        }

        // Session Interaction
        if (this.currentStage === 'SESSION' && this.state === 'PLAYING') {
            const server = this.nodes[0];
            if (this.flame && server) {
                const dx = x - server.x;
                const dy = y - server.y;
                if (Math.hypot(dx, dy) < server.radius + 20) {
                    this.flame.fuel = Math.min(this.flame.fuel + 20, 100);

                    // Knockback
                    if (this.shadow) {
                        const sx = this.shadow.x - server.x;
                        const sy = this.shadow.y - server.y;
                        const dist = Math.hypot(sx, sy);
                        if (dist > 0) {
                            this.shadow.x += (sx / dist) * 120;
                            this.shadow.y += (sy / dist) * 120;
                        }
                    }
                }
            }
        }

        // Dragging
        if (!this.isDragging) {
            if (this.currentStage === 'BASIC_AUTH' && this.basicPacket) {
                const dist = Math.hypot(x - this.basicPacket.x, y - this.basicPacket.y);
                if (dist < this.basicPacket.radius * 1.5) {
                    this.isDragging = true;
                    this.dragTarget = 'basicPacket';
                }
            } else if (this.currentStage === 'IMPLICIT' && this.implicitPacket) {
                const dist = Math.hypot(x - this.implicitPacket.x, y - this.implicitPacket.y);
                if (dist < this.implicitPacket.radius * 1.5) {
                    this.isDragging = true;
                    this.dragTarget = 'implicitPacket';
                }
            }
        } else {
            this.isDragging = false;
        }
    }

    onMouseMove(x: number, y: number) {
        this.mousePos = { x, y };
    }

    cleanup() { }
}
