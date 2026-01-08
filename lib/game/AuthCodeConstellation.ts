import { GameScene } from "@/components/game/GameCanvas";

type Point = { x: number, y: number, label: string, id: string, radius: number, type: 'user' | 'server' | 'auth' | 'resource' | 'attacker' };
type Connection = { from: Point, to: Point, progress: number, type: 'redirect' | 'code' | 'exchange' | 'token' | 'access', label: string };
export type GameState = 'IDLE' | 'GENERATING_KEYS' | 'REDIRECTING' | 'LOGIN_REQUIRED' | 'RETURNING_CODE' | 'EXCHANGING' | 'VERIFYING_PKCE' | 'AUTHORIZED' | 'ACCESSING' | 'COMPLETE' | 'ATTACK_THEFT' | 'ATTACK_REFRESH' | 'REVOKED';

export class AuthCodeConstellation implements GameScene {
    private nodes: Point[] = [];
    private connections: Connection[] = [];
    private activeNode: Point | null = null;
    private mousePos: { x: number, y: number } | null = null;
    private time: number = 0;
    private state: GameState = 'IDLE';
    private message: string = "Step 1: User visits the App to Log In";
    private variant: 'standard' | 'pkce';

    // PKCE State
    private hasKeys: boolean = false; // User has generated Verifier/Challenge

    // Callback for UI
    public onStateChange?: (state: GameState) => void;

    constructor(variant: 'standard' | 'pkce' = 'standard', onStateChange?: (state: GameState) => void) {
        this.variant = variant;
        this.onStateChange = onStateChange;
        // PKCE now starts same as standard: User initiates
        this.message = "Step 1: User visits the App to Log In";
    }

    // Stars background
    private stars: { x: number, y: number, size: number, speed: number }[] = [];

    init(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const isPKCE = this.variant === 'pkce';
        this.nodes = [
            // PKCE: App is a Public Client (SPA/Mobile) -> Lives in Unsafe Zone (Red)
            // Standard: App is a Confidential Client (Server) -> Lives in Secure Zone (Green)
            {
                x: width * 0.2,
                y: isPKCE ? height * 0.82 : height * 0.5,
                label: isPKCE ? "Mobile App" : "Client App",
                id: "app",
                radius: 30,
                type: 'server'
            },
            { x: width * 0.5, y: height * 0.3, label: "Identity Provider", id: "auth", radius: 35, type: 'auth' },
            { x: width * 0.8, y: height * 0.5, label: "API", id: "api", radius: 30, type: 'resource' },

            // User is always in Unsafe Zone
            { x: width * 0.5, y: height * 0.82, label: "User / Browser", id: "user", radius: 25, type: 'user' }
        ];

        // Stars
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.1
            });
        }
    }

    update(dt: number) {
        this.time += dt;
        this.updateConstellation(dt);
    }

    updateConstellation(dt: number) {
        // State Machine Logic for Connections
        for (let i = this.connections.length - 1; i >= 0; i--) {
            const conn = this.connections[i];

            // Move packet
            if (conn.progress < 1) {
                conn.progress += dt * 0.3;
            } else {
                // Packet arrived
                this.handlePacketArrival(conn);
                this.connections.splice(i, 1); // Remove completed connection
            }
        }
    }

    handlePacketArrival(conn: Connection) {
        if (conn.type === 'redirect' && conn.to.id === 'app') {
            // User visited App.

            // PKCE: Pause for Generation
            if (this.variant === 'pkce' && !this.hasKeys) {
                this.state = 'GENERATING_KEYS';
                this.message = "App received request. Click App to Generate PKCE Keys.";
                return;
            }

            // Standard or Keys Ready: Respond to User with 302
            this.state = 'REDIRECTING';
            this.message = "App responds: '302 Found' with Redirect URL.";

            setTimeout(() => {
                const user = this.nodes.find(n => n.id === 'user');
                const app = this.nodes.find(n => n.id === 'app');
                if (user && app) {
                    this.connections.push({
                        from: app,
                        to: user,
                        progress: 0,
                        type: 'redirect',
                        label: this.variant === 'pkce' ? '302 + Challenge' : '302 Redirect'
                    });
                }
            }, 1000);
        }
        else if (conn.type === 'redirect' && conn.to.id === 'user') {
            // User received 302 Redirect. Auto-follow to IdP.
            this.message = "Browser follows Redirect URL to Identity Provider...";

            setTimeout(() => {
                const user = this.nodes.find(n => n.id === 'user');
                const auth = this.nodes.find(n => n.id === 'auth');
                if (user && auth) {
                    this.connections.push({
                        from: user,
                        to: auth,
                        progress: 0,
                        type: 'redirect',
                        label: this.variant === 'pkce' ? 'Visit + Challenge' : 'Visit IdP'
                    });
                }
            }, 1000);
        }
        else if (conn.type === 'redirect' && conn.to.id === 'auth') {
            // User arrived at Auth Server (Step 1 Complete)
            this.state = 'LOGIN_REQUIRED';
            this.message = "Step 2: User Logs In & Grants Consent";

            // Auto-trigger "Login" effect then send code back
            setTimeout(() => {
                const auth = this.nodes.find(n => n.id === 'auth');
                const user = this.nodes.find(n => n.id === 'user');
                if (auth && user) {
                    this.state = 'RETURNING_CODE';
                    this.message = "Step 3: Identity Provider redirects User back with Code";
                    this.connections.push({
                        from: auth,
                        to: user,
                        progress: 0,
                        type: 'code',
                        label: 'Auth Code' // Visible Code
                    });
                }
            }, 1000);
        }
        else if (conn.type === 'code' && conn.to.id === 'user') {
            // User has code, needs to give to App
            const user = this.nodes.find(n => n.id === 'user');
            const app = this.nodes.find(n => n.id === 'app');
            if (user && app) {
                this.connections.push({
                    from: user,
                    to: app,
                    progress: 0,
                    type: 'code',
                    label: 'Auth Code'
                });
            }
        }
        else if (conn.type === 'code' && conn.to.id === 'app') {
            // App received code. Now Back-channel exchange.
            this.state = 'EXCHANGING';
            this.message = this.variant === 'pkce'
                ? "Step 4: App exchanges Code + Verifier (Secret) for Token"
                : "Step 4: App exchanges Code for Token (Back-channel)";

            setTimeout(() => {
                const app = this.nodes.find(n => n.id === 'app');
                const auth = this.nodes.find(n => n.id === 'auth');
                if (app && auth) {
                    this.connections.push({
                        from: app,
                        to: auth,
                        progress: 0,
                        type: 'exchange',
                        label: this.variant === 'pkce' ? 'Code + Verifier' : 'Code + Secret'
                    });
                    this.message = this.variant === 'pkce'
                        ? "Public Client Exchange: No Secret used (only Verifier)."
                        : "Back-channel Exchange: Token stays on the Server.";
                }
            }, 500);
        }
        else if (conn.type === 'exchange' && conn.to.id === 'auth') {
            // Auth received valid code + secret. 

            // PKCE: Explicit Verification Step
            if (this.variant === 'pkce') {
                this.state = 'VERIFYING_PKCE';
                this.message = "Server received Keys. Click Auth Server to Verify Hash.";
                return; // Stop here, wait for click
            }

            // Standard: Auto-token return
            this.sendTokenBack();
        }
        else if (conn.type === 'token' && conn.to.id === 'app') {
            // App has token!
            this.state = 'AUTHORIZED';
            this.message = "Success! Token is safe from the Browser.";
        }
        else if (conn.type === 'access' && conn.to.id === 'api') {
            this.state = 'COMPLETE';
            this.message = "Flow Complete! API Accepted Token.";
        }
        else if (conn.to.id === 'thief') {
            // Thief got the token!
            this.message = "Thief tries to use Token at API...";
            setTimeout(() => {
                const thief = this.nodes.find(n => n.id === 'thief');
                const api = this.nodes.find(n => n.id === 'api');
                if (thief && api) {
                    this.connections.push({
                        from: thief,
                        to: api,
                        progress: 0,
                        type: 'access',
                        label: 'Access Request'
                    });
                }
            }, 1000);
        }
        else if (conn.from.id === 'thief' && conn.to.id === 'api') {
            // API received stolen token
            this.message = "API Check: Token Expired! (Short Lifetime)";
            // Visual feedback handled in draw (maybe red flash)
        }
        else if (conn.type === 'token' && conn.label.includes('Refresh') && conn.to.id === 'thief') {
            // Thief got Refresh Token
            this.message = "Thief uses Stolen Refresh Token to get new Access Token...";
            setTimeout(() => {
                const thief = this.nodes.find(n => n.id === 'thief');
                const auth = this.nodes.find(n => n.id === 'auth');
                if (thief && auth) {
                    this.connections.push({
                        from: thief,
                        to: auth,
                        progress: 0,
                        type: 'exchange',
                        label: 'Stolen Refresh Token'
                    });
                }
            }, 1000);
        }
        else if (conn.type === 'exchange' && conn.from.id === 'thief' && conn.to.id === 'auth') {
            // Auth Server received reused Refresh Token
            this.state = 'REVOKED';
            this.message = "🚨 SECURITY ALERT: Refresh Token Reuse Detected! Family Revoked. 🚨";
        }

        // Notify UI of state change whenever state changes (could be optimized)
        if (this.state !== 'IDLE') this.notifyStateChange();
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.drawConstellation(ctx);
    }

    drawConstellation(ctx: CanvasRenderingContext2D) {
        // Background Stars
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        this.stars.forEach(star => {
            const opacity = 0.5 + Math.sin(this.time * star.speed) * 0.5;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw Front-End / Back-End Zones
        const zoneY = ctx.canvas.height * 0.60;

        // Separator Line
        ctx.beginPath();
        ctx.moveTo(0, zoneY);
        ctx.lineTo(ctx.canvas.width, zoneY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // Zone Labels
        ctx.font = "bold 14px Inter";
        ctx.fillStyle = "rgba(34, 197, 94, 0.5)"; // Green
        ctx.textAlign = "left";
        ctx.fillText("🔒 SECURE BACKEND / SERVER", 20, zoneY - 15);

        ctx.fillStyle = "rgba(239, 68, 68, 0.5)"; // Red
        ctx.fillText("⚠ UNSAFE FRONTEND / BROWSER", 20, zoneY + 25);

        // Colorize Backgrounds
        // Top (Secure)
        ctx.fillStyle = "rgba(34, 197, 94, 0.05)";
        ctx.fillRect(0, 0, ctx.canvas.width, zoneY);

        // Bottom (Unsafe)
        ctx.fillStyle = "rgba(239, 68, 68, 0.05)";
        ctx.fillRect(0, zoneY, ctx.canvas.width, ctx.canvas.height - zoneY);


        // Draw State/Message
        ctx.font = "bold 24px Inter, sans-serif";
        ctx.textAlign = "center";

        if (this.state === 'COMPLETE') ctx.fillStyle = "#4ade80";
        else if (this.state === 'AUTHORIZED') ctx.fillStyle = "#facc15";
        else ctx.fillStyle = "#e879f9";

        ctx.fillText(this.message, ctx.canvas.width / 2, 150);

        // Connections & Packets
        this.connections.forEach(conn => {
            // Draw Line
            ctx.beginPath();
            ctx.moveTo(conn.from.x, conn.from.y);
            ctx.lineTo(conn.to.x, conn.to.y);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Packet
            const currentX = conn.from.x + (conn.to.x - conn.from.x) * conn.progress;
            const currentY = conn.from.y + (conn.to.y - conn.from.y) * conn.progress;

            // Packet Color
            let glowColor = "rgba(255, 255, 255, 1)";
            if (conn.type === 'code') glowColor = "rgba(168, 85, 247, 1)"; // Purple
            if (conn.type === 'token') glowColor = "rgba(250, 204, 21, 1)"; // Yellow
            if (conn.from.id === 'thief') glowColor = "rgba(239, 68, 68, 1)"; // Red (Malicious)

            // Packet Glow
            const glow = ctx.createRadialGradient(currentX, currentY, 5, currentX, currentY, 20);
            glow.addColorStop(0, glowColor);
            glow.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(currentX, currentY, 20, 0, Math.PI * 2);
            ctx.fill();

            // Packet Label
            ctx.fillStyle = "#ffffff";
            ctx.font = "12px Inter";
            ctx.fillText(conn.label, currentX, currentY - 20);
        });

        // Draw Drag Line
        if (this.activeNode && this.mousePos) {
            ctx.beginPath();
            ctx.moveTo(this.activeNode.x, this.activeNode.y);
            ctx.lineTo(this.mousePos.x, this.mousePos.y);
            ctx.strokeStyle = "#ffffff";
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Nodes
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        this.nodes.forEach(node => {
            // Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

            // Dynamic node coloring
            let color = "#334155";
            let glowColor = "rgba(148, 163, 184, 0.5)";

            // App Pulse on Redirect
            if (this.state === 'REDIRECTING' && node.id === 'app') {
                // Red Pulse
                glowColor = "rgba(239, 68, 68, 0.8)";
                color = "#ef4444";
            }

            if (node.type === 'user') {
                color = "#a855f7";
                glowColor = "rgba(168, 85, 247, 0.5)";
            }
            if (node.type === 'auth') {
                color = "#f59e0b";
                glowColor = "rgba(245, 158, 11, 0.5)";
            }
            if (node.type === 'server') {
                color = "#3b82f6";
                glowColor = "rgba(59, 130, 246, 0.5)";
            }
            if (node.type === 'attacker') {
                color = "#ef4444"; // Red
                glowColor = "rgba(185, 28, 28, 0.8)";
            }

            // PKCE Verify Pulse / Generation Pulse
            if ((this.state === 'VERIFYING_PKCE' || this.state === 'GENERATING_KEYS') && node.id === 'auth') {
                glowColor = "rgba(245, 158, 11, 0.8)";
                color = "#f59e0b";
            }

            // Glow animation
            const glowSize = 10 + Math.sin(this.time * 3) * 5;
            const gradient = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, node.radius + glowSize);
            gradient.addColorStop(0, glowColor);
            gradient.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = gradient;
            ctx.fill();

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

            // Subtitle for PKCE App
            if (this.variant === 'pkce' && node.id === 'app') {
                ctx.fillStyle = "#94a3b8"; // darker gray
                ctx.font = "10px Inter";
                ctx.fillText("(Native / SPA)", node.x, node.y + node.radius + 35);
            }

            // Initials
            ctx.fillStyle = "white";
            ctx.font = "bold 12px Inter";
            const initial = node.label.substring(0, 2);
            ctx.fillText(initial, node.x, node.y);

            // Draw "302" Text if Redirecting
            if (this.state === 'REDIRECTING' && node.id === 'app') {
                ctx.fillStyle = "#ef4444";
                ctx.font = "bold 16px Inter";
                ctx.fillText("302 Found", node.x, node.y - 40);
            }

            // PKCE: Draw Keys on App (Server) if generated
            if (this.variant === 'pkce' && node.id === 'app' && this.hasKeys) {
                ctx.fillStyle = "#facc15"; // Yellow/Gold
                ctx.font = "bold 10px monospace";
                // Move text down further to avoid overlapping with node label
                ctx.fillText("🔑 KEYS READY", node.x, node.y + 85);
            }
        });

        // Instructions
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "left";
        ctx.font = "14px Inter";
        if (this.state === 'GENERATING_KEYS') {
            ctx.fillText("Instructions: Click Client App to Generate Keys.", 20, ctx.canvas.height - 30);
        } else if (this.state === 'VERIFYING_PKCE') {
            ctx.fillText("Instructions: Click Auth Server to Verify.", 20, ctx.canvas.height - 30);
        } else {
            ctx.fillText("Instructions: Drag from User to App to start.", 20, ctx.canvas.height - 30);
        }
    }

    onClick(x: number, y: number) {
        if (this.state !== 'IDLE' && this.state !== 'AUTHORIZED' && this.state !== 'VERIFYING_PKCE' && this.state !== 'GENERATING_KEYS') return; // Only allow interations at specific points

        const clickedNode = this.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return (dx * dx + dy * dy) < (node.radius * 2 * node.radius * 2);
        });

        if (clickedNode) {
            if (!this.activeNode) {
                // START DRAG
                // Rule 1: IDLE -> Start at User (simulating user clicking "Login")
                if (this.state === 'IDLE' && clickedNode.id === 'user') {
                    this.activeNode = clickedNode;
                }
                // Rule 2: AUTHORIZED -> Start at App
                else if (this.state === 'AUTHORIZED' && clickedNode.id === 'app') {
                    this.activeNode = clickedNode;
                }
                // Rule 3: VERIFYING_PKCE -> Click Auth to verify
                else if (this.state === 'VERIFYING_PKCE' && clickedNode.id === 'auth') {
                    // explicit step-by-step verification
                    this.message = "1. Server hashes the received Verifier...";

                    setTimeout(() => {
                        this.message = "2. Comparing: SHA256(Verifier) == Stored Challenge";

                        setTimeout(() => {
                            this.message = "3. Match! Challenge Solved.";
                            this.sendTokenBack();
                        }, 2000);
                    }, 2000);
                }
                // Rule 4: GENERATING_KEYS -> Click App to generate
                else if (this.state === 'GENERATING_KEYS' && clickedNode.id === 'app') {
                    this.message = "1. App Generates 'Verifier' (Secret)...";

                    setTimeout(() => {
                        this.message = "2. App Hashes Secret -> Challenge...";
                        setTimeout(() => {
                            this.hasKeys = true;
                            this.message = "3. Ready! Sending Redirect to Browser...";
                            this.startRedirect();
                        }, 1500);
                    }, 1500);
                }
            } else {
                // END DRAG
                if (this.activeNode !== clickedNode) {
                    let validMove = false;
                    let packetLabel = "";
                    let packetType: Connection['type'] = 'redirect';

                    // Rule 1: User -> App (Starts flow)
                    if (this.state === 'IDLE' &&
                        this.activeNode.id === 'user' &&
                        clickedNode.id === 'app') {

                        validMove = true;

                        // IF PKCE, we don't start redirect yet. We must GENERATE KEYS first.
                        if (this.variant === 'pkce') {
                            this.state = 'GENERATING_KEYS';
                            this.message = "App Needs to Generate PKCE Keys first. Click App Node.";
                            this.activeNode = null;
                            return;
                        }

                        // Standard Flow
                        this.startRedirect();
                        this.activeNode = null;
                        return;
                    }

                    // Rule 2: App -> API (Final Step)
                    if (this.state === 'AUTHORIZED' &&
                        this.activeNode.id === 'app' &&
                        clickedNode.id === 'api') {
                        validMove = true;
                        packetLabel = "Access Token";
                        packetType = 'access';
                        this.state = 'ACCESSING';
                    }

                    if (validMove) {
                        this.connections.push({
                            from: this.activeNode,
                            to: clickedNode,
                            progress: 0,
                            type: packetType,
                            label: packetLabel
                        });
                    }
                    this.activeNode = null;
                } else {
                    this.activeNode = null; // Cancel
                }
            }
        } else {
            this.activeNode = null;
        }
    }

    onMouseMove(x: number, y: number) {
        this.mousePos = { x, y };
    }

    cleanup() {
        this.nodes = [];
        this.connections = [];
    }

    sendTokenBack() {
        setTimeout(() => {
            const app = this.nodes.find(n => n.id === 'app');
            const auth = this.nodes.find(n => n.id === 'auth');
            if (app && auth) {
                this.connections.push({
                    from: auth,
                    to: app,
                    progress: 0,
                    type: 'token',
                    label: 'Access Token'
                });
            }
        }, 500);
    }

    startTokenTheft() {
        console.log("Starting Token Theft Scenario...");
        if (this.state !== 'COMPLETE') return;
        this.state = 'ATTACK_THEFT';
        this.notifyStateChange();
        this.message = "Scenario: Attacker steals Token from Unsafe Device!";

        // Spawn Thief Node
        this.nodes.push({
            x: this.nodes[0].x + 120, // To the right of App
            y: this.nodes[0].y,       // Same level (avoiding text below)
            label: "Malware / Thief",
            id: "thief",
            radius: 25,
            type: 'attacker' // Use user color or maybe make it red/black
        });

        // Send Token from App to Thief
        const app = this.nodes.find(n => n.id === 'app');
        const thief = this.nodes.find(n => n.id === 'thief');
        if (app && thief) {
            this.connections.push({
                from: app,
                to: thief,
                progress: 0,
                type: 'token',
                label: 'Stolen Token'
            });
        }
    }

    startRefreshRotation() {
        console.log("Starting Refresh Rotation Scenario...");
        if (this.state !== 'COMPLETE') return;
        this.state = 'ATTACK_REFRESH';
        this.notifyStateChange();
        this.message = "Scenario: Attacker steals Refresh Token!";

        // Spawn Thief Node (Reuse logic if possible, but distinct call)
        // If thief doesn't exist, spawn it
        if (!this.nodes.find(n => n.id === 'thief')) {
            this.nodes.push({
                x: this.nodes[0].x + 120,
                y: this.nodes[0].y,
                label: "Malware / Thief",
                id: "thief",
                radius: 25,
                type: 'attacker'
            });
        }

        // Send Refresh Token from App to Thief
        const app = this.nodes.find(n => n.id === 'app');
        const thief = this.nodes.find(n => n.id === 'thief');
        if (app && thief) {
            this.connections.push({
                from: app,
                to: thief,
                progress: 0,
                type: 'token', // Reuse token visual
                label: 'Stolen Refresh Token'
            });
        }
    }

    private notifyStateChange() {
        if (this.onStateChange) this.onStateChange(this.state);
    }

    startRedirect() {
        // This is called when keys are generated (PKCE) or initially (Standard)
        // It should simulate the "App runs logic then responds"

        // In this architecture, we trigger the packet arrival logic for the App manually 
        // OR we just spawn the next packet.

        // Let's spawn the "App Responds" packet directly since we are already AT the app.
        const app = this.nodes.find(n => n.id === 'app');
        const user = this.nodes.find(n => n.id === 'user');

        if (app && user) {
            this.state = 'REDIRECTING';
            this.message = "App responds: '302 Found' with Redirect URL.";

            this.connections.push({
                from: app,
                to: user,
                progress: 0,
                type: 'redirect',
                label: this.variant === 'pkce' ? '302 + Challenge' : '302 Redirect'
            });
        }
    }
}
