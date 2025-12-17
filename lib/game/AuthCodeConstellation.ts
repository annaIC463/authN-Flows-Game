import { GameScene } from "@/components/game/GameCanvas";

type Point = { x: number, y: number, label: string, id: string, radius: number, type: 'user' | 'server' | 'auth' | 'resource' };
type Connection = { from: Point, to: Point, progress: number, type: 'redirect' | 'code' | 'exchange' | 'token' | 'access', label: string };
type GameState = 'IDLE' | 'REDIRECTING' | 'LOGIN_REQUIRED' | 'RETURNING_CODE' | 'EXCHANGING' | 'AUTHORIZED' | 'ACCESSING' | 'COMPLETE';

export class AuthCodeConstellation implements GameScene {
    private nodes: Point[] = [];
    private connections: Connection[] = [];
    private activeNode: Point | null = null;
    private mousePos: { x: number, y: number } | null = null;
    private time: number = 0;
    private state: GameState = 'IDLE';
    private message: string = "Step 1: User visits the App to Log In";

    // Stars background
    private stars: { x: number, y: number, size: number, speed: number }[] = [];

    init(ctx: CanvasRenderingContext2D, width: number, height: number) {
        // Layout: Diamond Shape
        // User (Bottom), App (Left), Auth (Top), API (Right) - roughly
        // Actually, clearer: 
        // User (Bottom Center)
        // App (Left Center)
        // Auth (Right Center) -> No, Auth should be distinct.
        // Let's do:
        // App (Left), Auth (Right), API (Far Right)
        // User (Bottom Center)

        this.nodes = [
            { x: width * 0.2, y: height * 0.5, label: "Client App", id: "app", radius: 30, type: 'server' },
            { x: width * 0.5, y: height * 0.3, label: "Auth0 Tenant", id: "auth", radius: 35, type: 'auth' },
            { x: width * 0.8, y: height * 0.5, label: "API", id: "api", radius: 30, type: 'resource' },
            { x: width * 0.5, y: height * 0.75, label: "User / Browser", id: "user", radius: 25, type: 'user' }
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
            // User visited App. App responds with 302 Redirect.
            // Visual effect: App pulses
            this.state = 'REDIRECTING';
            this.message = "App responds: '302 Found'. Redirecting Browser to Auth0...";

            setTimeout(() => {
                const auth = this.nodes.find(n => n.id === 'auth');
                const user = this.nodes.find(n => n.id === 'user');
                if (auth && user) {
                    this.connections.push({
                        from: user, // Browser follows redirect
                        to: auth,
                        progress: 0,
                        type: 'redirect',
                        label: 'Browser Redirect'
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
                    this.message = "Step 3: Auth Server redirects User back with Code";
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
            this.message = "Step 4: App exchanges Code for Token (Back-channel)";
            setTimeout(() => {
                const app = this.nodes.find(n => n.id === 'app');
                const auth = this.nodes.find(n => n.id === 'auth');
                if (app && auth) {
                    this.connections.push({
                        from: app,
                        to: auth,
                        progress: 0,
                        type: 'exchange',
                        label: 'Code + Secret'
                    });
                }
            }, 500);
        }
        else if (conn.type === 'exchange' && conn.to.id === 'auth') {
            // Auth received valid code + secret. Return Token.
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
        else if (conn.type === 'token' && conn.to.id === 'app') {
            // App has token!
            this.state = 'AUTHORIZED';
            this.message = "Step 5: App uses Token to access API";
        }
        else if (conn.type === 'access' && conn.to.id === 'api') {
            this.state = 'COMPLETE';
            this.message = "Flow Complete! Secure User Access Granted.";
        }
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
        const zoneY = ctx.canvas.height * 0.65;

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
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.textAlign = "left";
        ctx.fillText("BACK-END (Trusted Zone)", 20, zoneY - 15);
        ctx.fillText("FRONT-END (Untrusted Zone)", 20, zoneY + 25);


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
        });

        // Instructions
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "left";
        ctx.font = "14px Inter";
        ctx.fillText("Instructions: Drag from User to App to start.", 20, ctx.canvas.height - 30);
    }

    onClick(x: number, y: number) {
        if (this.state !== 'IDLE' && this.state !== 'AUTHORIZED') return; // Only allow interations at specific points


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
                        // Start the chain
                        this.connections.push({
                            from: this.activeNode,
                            to: clickedNode,
                            progress: 0,
                            type: 'redirect',
                            label: 'Visit App'
                        });

                        this.activeNode = null;
                        return; // Logic handled in handlePacketArrival now
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
}
