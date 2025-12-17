import { GameScene } from "@/components/game/GameCanvas";

type Point = { x: number, y: number, label: string, id: string, radius: number };
type Connection = { from: Point, to: Point, progress: number, type: 'request' | 'response' | 'access', label: string };
type GameState = 'IDLE' | 'REQUESTING' | 'ISSUING' | 'AUTHORIZED' | 'ACCESSING' | 'COMPLETE';

export class ClientCredentialsConstellation implements GameScene {
    private nodes: Point[] = [];
    private connections: Connection[] = [];
    private activeNode: Point | null = null;
    private mousePos: { x: number, y: number } | null = null;
    private time: number = 0;
    private state: GameState = 'IDLE';
    private message: string = "Step 1: Connect App to Tenant to send Credentials";

    // Stars background
    private stars: { x: number, y: number, size: number, speed: number }[] = [];

    init(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.nodes = [
            { x: width * 0.2, y: height * 0.6, label: "M2M App", id: "app", radius: 25 },
            { x: width * 0.5, y: height * 0.3, label: "Auth0 Tenant", id: "tenant", radius: 30 },
            { x: width * 0.8, y: height * 0.6, label: "API", id: "api", radius: 25 }
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
            // Slower speed for better readability (0.8 -> 0.3)
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
        if (conn.type === 'request' && conn.to.id === 'tenant') {
            // Step 1 Complete: Tenant received credentials
            this.state = 'ISSUING';
            this.message = "Step 2: Tenant validates and issues Access Token";
            // Auto-send response back to app
            setTimeout(() => {
                const app = this.nodes.find(n => n.id === 'app');
                const tenant = this.nodes.find(n => n.id === 'tenant');
                if (app && tenant) {
                    this.connections.push({
                        from: tenant,
                        to: app,
                        progress: 0,
                        type: 'response',
                        label: 'Access Token'
                    });
                }
            }, 500);
        }
        else if (conn.type === 'response' && conn.to.id === 'app') {
            // Step 2 Complete: App received token
            this.state = 'AUTHORIZED';
            this.message = "Step 3: Connect App to API to use the Token";
        }
        else if (conn.type === 'access' && conn.to.id === 'api') {
            // Step 3 Complete: API received token
            this.state = 'COMPLETE';
            this.message = "Flow Complete! Resource Accessed Successfully.";
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

        // Draw State/Message (Top Center)
        ctx.font = "bold 24px Inter, sans-serif";
        ctx.textAlign = "center";

        // Dynamic color based on state
        if (this.state === 'COMPLETE') ctx.fillStyle = "#4ade80"; // Green
        else if (this.state === 'AUTHORIZED') ctx.fillStyle = "#facc15"; // Yellow
        else ctx.fillStyle = "#60a5fa"; // Blue

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

            // Packet Glow
            const glow = ctx.createRadialGradient(currentX, currentY, 5, currentX, currentY, 20);
            glow.addColorStop(0, "rgba(255, 255, 255, 1)");
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
            let color = "#334155"; // Default Slate
            let glowColor = "rgba(59, 130, 246, 0.5)"; // Blue

            // Highlight source node for current step
            if (this.state === 'IDLE' && node.id === 'app') {
                color = "#3b82f6"; // Blue
                glowColor = "rgba(59, 130, 246, 0.8)";
            } else if (this.state === 'AUTHORIZED' && node.id === 'app') {
                color = "#f59e0b"; // Amber (has token)
                glowColor = "rgba(245, 158, 11, 0.8)";
            } else if (node.id === 'api' && this.state === 'COMPLETE') {
                color = "#22c55e"; // Green
                glowColor = "rgba(34, 197, 94, 0.8)";
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

            // Icon/Text inside node
            ctx.fillStyle = "white";
            ctx.font = "bold 12px Inter";
            // Simple Initials
            const initial = node.label.split(' ').map(w => w[0]).join('');
            ctx.fillText(initial, node.x, node.y);
        });

        // Instructions (Moved to Bottom Left, smaller)
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "left";
        ctx.font = "14px Inter";
        ctx.fillText("Instructions: Click and drag to connect nodes.", 20, ctx.canvas.height - 30);
    }

    onClick(x: number, y: number) {
        // Prevent interaction if animating
        if (this.state === 'REQUESTING' || this.state === 'ISSUING') return;
        if (this.state === 'COMPLETE') return;

        const clickedNode = this.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return (dx * dx + dy * dy) < (node.radius * 2 * node.radius * 2);
        });

        if (clickedNode) {
            if (!this.activeNode) {
                // START DRAG
                // Enforce Start Node based on State
                if (this.state === 'IDLE' && clickedNode.id === 'app') {
                    this.activeNode = clickedNode;
                } else if (this.state === 'AUTHORIZED' && clickedNode.id === 'app') {
                    this.activeNode = clickedNode;
                }
            } else {
                // END DRAG
                if (this.activeNode !== clickedNode) {
                    // Check Logic
                    let validMove = false;
                    let packetLabel = "";
                    let packetType: Connection['type'] = 'request';

                    // Rule 1: Idle -> Connect App to Tenant
                    if (this.state === 'IDLE' &&
                        this.activeNode.id === 'app' &&
                        clickedNode.id === 'tenant') {
                        validMove = true;
                        packetLabel = "ID + Secret";
                        packetType = 'request';
                        this.state = 'REQUESTING';
                    }

                    // Rule 2: Authorized -> Connect App to API
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
            this.activeNode = null; // Click empty space to cancel
        }
    }

    onMouseMove(x: number, y: number) {
        this.mousePos = { x, y };
    }

    cleanup() {
        this.nodes = [];
        this.stars = [];
    }
}
