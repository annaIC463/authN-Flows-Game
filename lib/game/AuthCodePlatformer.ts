import { GameScene } from "@/components/game/GameCanvas";

// Collectable types
type Collectable = { x: number, y: number, w: number, h: number, type: 'code', collected: boolean };

// Projectile Type
type Projectile = { x: number, y: number, tx: number, ty: number, speed: number, type: 'request' | 'response', active: boolean };

export class AuthCodePlatformer implements GameScene {
    // Platformer State
    private player = { x: 50, y: 100, width: 30, height: 30, vx: 0, vy: 0, grounded: false, hasCode: false, hasToken: false, facingRight: true };
    private keys = { left: false, right: false, up: false };
    private platforms: { x: number, y: number, w: number, h: number, type?: 'ground' | 'app' | 'auth' | 'api' }[] = [];
    private items: Collectable[] = []; // Only the Code is an item for now
    private projectiles: Projectile[] = []; // New: Projectiles for back-channel
    private winState: boolean = false;
    private message: string = "Go to Auth0 Cloud (Purple) to Login";
    private exchangeInProgress: boolean = false; // Prevent double exchange

    init(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.initPlatformer(width, height);
    }

    initPlatformer(width: number, height: number) {
        // Layout:
        // App Base (Left Bottom)
        // Auth Cloud (High Center)
        // API Vault (Right Bottom)

        this.platforms = [
            { x: 0, y: height - 50, w: width, h: 50, type: 'ground' }, // Floor
            { x: 50, y: height - 150, w: 200, h: 20, type: 'app' }, // App Base

            // Steps up to Cloud
            { x: 300, y: height - 250, w: 100, h: 20 },
            { x: 450, y: height - 350, w: 100, h: 20 },

            { x: 600, y: height - 500, w: 200, h: 20, type: 'auth' }, // Auth Cloud (High up)

            // Steps down to API
            { x: 900, y: height - 250, w: 150, h: 20 },
            { x: width - 200, y: height - 150, w: 150, h: 20, type: 'api' }, // API Vault
        ];

        // Items - Code spawns on the Auth Cloud
        this.items = [
            { x: 700, y: height - 540, w: 20, h: 30, type: 'code', collected: false }
        ];

        this.projectiles = [];
        this.player.x = 100;
        this.player.y = height - 200;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.hasCode = false;
        this.player.hasToken = false;
        this.winState = false;
        this.exchangeInProgress = false;
        this.message = "Jump to the Auth Cloud to Login!";
    }

    update(dt: number) {
        if (this.winState) return;
        this.updatePlatformer(dt);
    }

    updatePlatformer(dt: number) {
        const speed = 300;
        const jump = -750;
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
                // Resolve collision
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

                // 1. App Platform Interaction
                if (plat.type === 'app') {
                    // If we have Code but no Token, start Back-channel exchange!
                    if (this.player.hasCode && !this.player.hasToken && !this.exchangeInProgress) {
                        this.player.hasCode = false; // Hand over code
                        this.exchangeInProgress = true;
                        this.message = "App is exchanging Code for Token via Back-channel...";

                        // Spawn Projectile: App -> Auth
                        // Find App and Auth centers
                        const appPlat = this.platforms.find(p => p.type === 'app')!;
                        const authPlat = this.platforms.find(p => p.type === 'auth')!;

                        this.projectiles.push({
                            x: appPlat.x + appPlat.w / 2,
                            y: appPlat.y,
                            tx: authPlat.x + authPlat.w / 2,
                            ty: authPlat.y + authPlat.h,
                            speed: 400,
                            type: 'request',
                            active: true
                        });
                    }
                }

                // 2. API Platform Interaction
                if (plat.type === 'api') {
                    if (this.player.hasToken) {
                        this.winState = true;
                    }
                }
            }
        }

        // Item Collection (The Code)
        for (const item of this.items) {
            if (!item.collected && this.checkCollision(this.player, item)) {
                item.collected = true;
                this.player.hasCode = true;
                this.message = "Got Authorization Code! Return to App Base.";
            }
        }

        // Update Projectiles
        for (const proj of this.projectiles) {
            if (!proj.active) continue;

            const dx = proj.tx - proj.x;
            const dy = proj.ty - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 10) {
                // Arrived
                proj.active = false;

                if (proj.type === 'request') {
                    // Request reached Auth. Spawn Response (Token) back to App.
                    const appPlat = this.platforms.find(p => p.type === 'app')!;
                    this.projectiles.push({
                        x: proj.tx,
                        y: proj.ty,
                        tx: appPlat.x + appPlat.w / 2,
                        ty: appPlat.y,
                        speed: 400,
                        type: 'response',
                        active: true
                    });
                } else if (proj.type === 'response') {
                    // Token reached App. Grant to Player.
                    this.player.hasToken = true;
                    this.exchangeInProgress = false;
                    this.message = "Token Received! Go access the API!";
                }
            } else {
                // Move
                proj.x += (dx / dist) * proj.speed * dt;
                proj.y += (dy / dist) * proj.speed * dt;
            }
        }

        // Bounds
        if (this.player.y > 2000) {
            this.player.x = 100;
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
            if (plat.type === 'app') ctx.fillStyle = "#3b82f6";
            else if (plat.type === 'auth') ctx.fillStyle = "#a855f7"; // Purple
            else if (plat.type === 'api') ctx.fillStyle = "#10b981";
            else ctx.fillStyle = "#334155";

            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

            // Labels
            if (plat.type) {
                ctx.fillStyle = "white";
                ctx.font = "12px Inter";
                ctx.textAlign = "center";
                ctx.fillText(plat.type.toUpperCase(), plat.x + plat.w / 2, plat.y + plat.h / 2 + 5);
            }

            // Icon for API
            if (plat.type === 'api') {
                this.drawDatabaseIcon(ctx, plat.x + plat.w / 2, plat.y - 30);
            }
        }

        // Draw Projectiles
        for (const proj of this.projectiles) {
            if (!proj.active) continue;

            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);

            if (proj.type === 'request') {
                ctx.fillStyle = "#f87171"; // Red (Request)
            } else {
                ctx.fillStyle = "#facc15"; // Yellow (Token)
            }
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Trail or Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle as string;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw Code Item (Purple Ticket)
        for (const item of this.items) {
            if (!item.collected) {
                ctx.fillStyle = "#d8b4fe"; // Light Purple
                ctx.fillRect(item.x, item.y, item.w, item.h);
                // "Code" text lines
                ctx.fillStyle = "#6b21a8";
                ctx.fillRect(item.x + 4, item.y + 5, 12, 2);
                ctx.fillRect(item.x + 4, item.y + 10, 12, 2);
                ctx.fillRect(item.x + 4, item.y + 15, 8, 2);

                ctx.fillStyle = "white";
                ctx.font = "10px Inter";
                ctx.textAlign = "center";
                ctx.fillText("CODE", item.x + item.w / 2, item.y - 5);
            }
        }

        // Draw Player
        // Color depends on state
        if (this.player.hasToken) ctx.fillStyle = "#facc15"; // Yellow (Super)
        else ctx.fillStyle = "#60a5fa"; // Blue (Normal)

        ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Draw "Backpack" item if carrying code
        if (this.player.hasCode) {
            ctx.fillStyle = "#d8b4fe";
            ctx.fillRect(this.player.x + 5, this.player.y + 5, 20, 20);
        }

        // Win State Overlay
        if (this.winState) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "#4ade80";
            ctx.font = "bold 40px Inter";
            ctx.textAlign = "center";
            ctx.fillText("AUTHORIZED!", width / 2, height / 2);
            ctx.font = "20px Inter";
            ctx.fillStyle = "white";
            ctx.fillText("User authenticated via Redirection Flow.", width / 2, height / 2 + 40);
        } else {
            // HUD
            const hudY = 100;
            ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
            ctx.fillRect(20, hudY, 280, 80);
            ctx.strokeStyle = "#334155";
            ctx.strokeRect(20, hudY, 280, 80);

            ctx.fillStyle = "white";
            ctx.font = "bold 16px Inter";
            ctx.textAlign = "center";
            ctx.fillText(this.message, 20 + 140, hudY + 30);

            // Status Icons
            // Code Icon
            if (this.player.hasCode) {
                ctx.fillStyle = "#d8b4fe";
                ctx.fillRect(30, hudY + 40, 20, 15);
            } else {
                ctx.strokeStyle = "#475569";
                ctx.strokeRect(30, hudY + 40, 20, 15);
            }
            ctx.fillStyle = "white"; ctx.font = "12px Inter"; ctx.fillText("Code", 40, hudY + 70);

            // Token Icon
            if (this.player.hasToken) {
                ctx.fillStyle = "#facc15";
                ctx.beginPath();
                ctx.arc(80, hudY + 48, 8, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.strokeStyle = "#475569";
                ctx.beginPath();
                ctx.arc(80, hudY + 48, 8, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = "white"; ctx.fillText("Token", 80, hudY + 70);
        }
    }

    drawDatabaseIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.fillStyle = "#34d399"; // Light Green
        const w = 40;
        const h = 10;
        const gap = 5;

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
