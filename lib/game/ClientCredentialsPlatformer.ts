import { GameScene } from "@/components/game/GameCanvas";

type Collectable = { x: number, y: number, w: number, h: number, type: 'id' | 'secret', collected: boolean };

export class ClientCredentialsPlatformer implements GameScene {
    // Platformer State
    private player = { x: 50, y: 100, width: 30, height: 30, vx: 0, vy: 0, grounded: false, hasToken: false, facingRight: true };
    private keys = { left: false, right: false, up: false };
    private platforms: { x: number, y: number, w: number, h: number, type?: 'ground' | 'app' | 'tenant' | 'api' }[] = [];
    private items: Collectable[] = [];
    private winState: boolean = false;

    init(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.initPlatformer(width, height);
    }

    initPlatformer(width: number, height: number) {
        this.platforms = [
            { x: 0, y: height - 50, w: width, h: 50, type: 'ground' }, // Floor
            { x: 100, y: height - 150, w: 100, h: 20, type: 'app' }, // Start
            { x: 400, y: height - 250, w: 150, h: 20 }, // Mid 1
            { x: 600, y: height - 350, w: 100, h: 20, type: 'tenant' }, // High platform (Auth0)
            { x: 800, y: height - 200, w: 150, h: 20 }, // Mid 2
            { x: width - 150, y: height - 150, w: 100, h: 20, type: 'api' }, // End
        ];

        // Items logic
        // Only spawn if not collected (but on init we reset)
        this.items = [
            { x: 420, y: height - 290, w: 20, h: 20, type: 'id', collected: false },
            { x: 820, y: height - 240, w: 20, h: 20, type: 'secret', collected: false }
        ];

        this.player.x = 120;
        this.player.y = height - 200;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.hasToken = false;
        this.winState = false;
    }

    update(dt: number) {
        if (this.winState) return;
        this.updatePlatformer(dt);
    }

    updatePlatformer(dt: number) {
        const speed = 300;
        const jump = -750; // Increased from -600 to make jumps possible
        const gravity = 1500;

        // Hoz movement
        if (this.keys.left) {
            this.player.vx = -speed;
            this.player.facingRight = false;
        } else if (this.keys.right) {
            this.player.vx = speed;
            this.player.facingRight = true;
        } else {
            this.player.vx = 0;
        }

        // Vert movement
        this.player.vy += gravity * dt;
        if (this.keys.up && this.player.grounded) {
            this.player.vy = jump;
            this.player.grounded = false;
        }

        // Apply velocity
        this.player.x += this.player.vx * dt;
        this.player.y += this.player.vy * dt;

        // Platform Collision
        this.player.grounded = false;
        for (const plat of this.platforms) {
            if (this.checkCollision(this.player, plat)) {
                // Resolve collision (Same as before)
                const overlapX = (this.player.width / 2 + plat.w / 2) - Math.abs((this.player.x + this.player.width / 2) - (plat.x + plat.w / 2));
                const overlapY = (this.player.height / 2 + plat.h / 2) - Math.abs((this.player.y + this.player.height / 2) - (plat.y + plat.h / 2));

                if (overlapY < overlapX) {
                    if (this.player.vy > 0 && this.player.y < plat.y) {
                        this.player.y = plat.y - this.player.height;
                        this.player.vy = 0;
                        this.player.grounded = true;
                    } else if (this.player.vy < 0 && this.player.y > plat.y) {
                        this.player.y = plat.y + plat.h;
                        this.player.vy = 0;
                    }
                } else {
                    if (this.player.vx > 0) this.player.x = plat.x - this.player.width;
                    else if (this.player.vx < 0) this.player.x = plat.x + plat.w;
                }

                // Interactions
                if (plat.type === 'tenant') {
                    // Exchange: Need ID & Secret -> Receive Token
                    const hasId = this.items.find(i => i.type === 'id')?.collected;
                    const hasSecret = this.items.find(i => i.type === 'secret')?.collected;

                    if (hasId && hasSecret && !this.player.hasToken) {
                        this.player.hasToken = true;
                        // Optional: Visual effect of exchange?
                    }
                }

                if (plat.type === 'api') {
                    if (this.player.hasToken) {
                        this.winState = true;
                    }
                }
            }
        }

        // Item Collection
        for (const item of this.items) {
            if (!item.collected && this.checkCollision(this.player, item)) {
                item.collected = true;
            }
        }

        // Bounds
        if (this.player.y > 2000) { // Fell off world
            this.player.x = 120;
            this.player.y = 100;
            this.player.vy = 0;
        }
    }

    checkCollision(a: { x: number, y: number, width: number, height: number }, b: { x: number, y: number, w: number, h: number }) {
        return a.x < b.x + b.w && a.x + a.width > b.x && a.y < b.y + b.h && a.y + a.height > b.y;
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.drawPlatformer(ctx, width, height);
    }

    drawPlatformer(ctx: CanvasRenderingContext2D, width: number, height: number) {
        // Draw Platforms
        for (const plat of this.platforms) {
            // Colors
            if (plat.type === 'tenant') ctx.fillStyle = "#f59e0b"; // Gold (Auth Server)
            else if (plat.type === 'api') ctx.fillStyle = "#10b981"; // Green (Resource Server)
            else ctx.fillStyle = "#334155";

            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

            // Platform Labels (Optional but helpful)
            if (plat.type) {
                ctx.fillStyle = "white";
                ctx.font = "12px Inter";
                ctx.textAlign = "center";
                ctx.fillText(plat.type.toUpperCase(), plat.x + plat.w / 2, plat.y + plat.h / 2 + 5);
            }

            // Draw Database Icon on API Platform
            if (plat.type === 'api') {
                this.drawDatabaseIcon(ctx, plat.x + plat.w / 2, plat.y - 30);
            }
        }

        // Draw Collectables
        for (const item of this.items) {
            if (!item.collected) {
                if (item.type === 'id') {
                    // Draw Card Logic
                    ctx.fillStyle = "#3b82f6";
                    ctx.fillRect(item.x, item.y, item.w, item.h);
                    ctx.fillStyle = "white";
                    ctx.fillRect(item.x + 4, item.y + 4, item.w - 8, item.h / 2 - 4);
                } else {
                    // Draw Key Logic (Simplified as red box with text for now)
                    ctx.fillStyle = "#ef4444";
                    ctx.fillRect(item.x, item.y, item.w, item.h);
                }

                // Label
                ctx.fillStyle = "white";
                ctx.font = "10px Inter";
                ctx.fillText(item.type.toUpperCase(), item.x + item.w / 2, item.y - 5);
            }
        }

        // Draw Player
        ctx.fillStyle = this.player.hasToken ? "#f59e0b" : "#60a5fa";
        ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Win State Overlay
        if (this.winState) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "#4ade80";
            ctx.font = "bold 40px Inter";
            ctx.textAlign = "center";
            ctx.fillText("ACCESS GRANTED!", width / 2, height / 2);
            ctx.font = "20px Inter";
            ctx.fillStyle = "white";
            ctx.fillText("You successfully authenticated and accessed the resource.", width / 2, height / 2 + 40);
        } else {

            // HUD / Inventory
            const hudY = 100;
            ctx.fillStyle = "rgba(15, 23, 42, 0.8)"; // Darker, more distinct bg
            ctx.fillRect(20, hudY, 280, 110);
            ctx.strokeStyle = "#334155";
            ctx.strokeRect(20, hudY, 280, 110);

            ctx.fillStyle = "white";
            ctx.font = "bold 16px Inter";
            ctx.textAlign = "left";
            ctx.fillText("Inventory", 35, hudY + 25);

            const hasId = this.items.find(i => i.type === 'id')?.collected;
            const hasSecret = this.items.find(i => i.type === 'secret')?.collected;

            // ID STATUS
            ctx.fillStyle = hasId ? "#4ade80" : "#94a3b8"; // Green if collected, Grey if not
            ctx.fillText("Client ID:", 35, hudY + 55);
            if (hasId) {
                // Draw mini card
                ctx.fillStyle = "#3b82f6";
                ctx.fillRect(150, hudY + 42, 20, 15);
            } else {
                ctx.strokeStyle = "#475569";
                ctx.strokeRect(150, hudY + 42, 20, 15);
            }

            // SECRET STATUS
            ctx.fillStyle = hasSecret ? "#4ade80" : "#94a3b8";
            ctx.fillText("Client Secret:", 35, hudY + 80);
            if (hasSecret) {
                // Draw mini secret
                ctx.fillStyle = "#ef4444";
                ctx.fillRect(150, hudY + 68, 20, 15);
            } else {
                ctx.strokeStyle = "#475569";
                ctx.strokeRect(150, hudY + 68, 20, 15);
            }

            // TOKEN STATUS
            ctx.fillStyle = this.player.hasToken ? "#f59e0b" : "#94a3b8";
            ctx.fillText("Access Token:", 35, hudY + 105);
            if (this.player.hasToken) {
                // Draw mini token (Circle)
                ctx.fillStyle = "#f59e0b";
                ctx.beginPath();
                ctx.arc(160, hudY + 100, 8, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.strokeStyle = "#475569";
                ctx.beginPath();
                ctx.arc(160, hudY + 100, 8, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Current Goal Text
            ctx.fillStyle = "#cbd5e1";
            ctx.textAlign = "center";
            ctx.font = "bold 16px Inter";

            let goalText = "Goal: Find Client ID and Secret";
            if (hasId && hasSecret && !this.player.hasToken) goalText = "Goal: Bring Credentials to Tenant";
            if (this.player.hasToken) goalText = "Goal: Access the API";

            ctx.fillText(goalText, width / 2, 85);
        }
    }

    drawDatabaseIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.fillStyle = "#34d399"; // Light Green
        const w = 40;
        const h = 10;
        const gap = 5;

        // Stack of 3 cylinders
        for (let i = 0; i < 3; i++) {
            const cy = y + (i * (h + gap));
            ctx.beginPath();
            ctx.ellipse(x, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillRect(x - w / 2, cy, w, h);

            ctx.beginPath();
            ctx.ellipse(x, cy + h, w / 2, h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

    }

    onKeyDown(key: string) {
        if (key === 'ArrowLeft') this.keys.left = true;
        if (key === 'ArrowRight') this.keys.right = true;
        if (key === 'ArrowUp') this.keys.up = true;
    }

    onKeyUp(key: string) {
        if (key === 'ArrowLeft') this.keys.left = false;
        if (key === 'ArrowRight') this.keys.right = false;
        if (key === 'ArrowUp') this.keys.up = false;
    }

    cleanup() {
        this.platforms = [];
        this.items = [];
    }
}
