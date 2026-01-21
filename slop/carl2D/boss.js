/* ============================================
   BOSS.JS - SUN BOSS FIGHT SYSTEM
   ============================================ */

"use strict";

// ========== SUN BOSS ==========
class SunBoss extends Enemy {
    constructor(x, y) {
        super('sunboss', x, y);
        this.size = 150 * SCALE;
        this.health = 20;
        this.maxHealth = 20;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.attackCooldown = 0;
        this.rays = [];
        for (let i = 0; i < 16; i++) {
            this.rays.push({
                angle: (TWO_PI / 16) * i,
                length: random(0.8, 1.2)
            });
        }
        this.bobAmount = 20 * scaleY;
        this.baseY = y;
        this.phase = 1; // Boss phases based on health
    }
    
    update() {
        this.animFrame += 0.05;
        this.y = this.baseY + sin(this.animFrame * 2) * this.bobAmount;
        
        // Don't update attack logic or move horizontally during intro
        if (this.introMode) {
            // Animate rays during intro
            for (let ray of this.rays) {
                ray.length += random(-0.02, 0.02);
                ray.length = constrain(ray.length, 0.7, 1.3);
            }
            return; // Skip the rest of the update during intro
        }
        
        // Move toward center of screen horizontally
        let targetX = width / 2;
        this.x = lerp(this.x, targetX, 0.02);
        
        // Update phase based on health
        if (this.health > 13) this.phase = 1;
        else if (this.health > 6) this.phase = 2;
        else this.phase = 3;
        
        // Invincibility frames
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }
        
        // Attack patterns
        this.attackCooldown--;
        if (this.attackCooldown <= 0) {
            this.attack();
            // Faster attacks in later phases
            if (this.phase === 1) this.attackCooldown = 120;
            else if (this.phase === 2) this.attackCooldown = 80;
            else this.attackCooldown = 60;
        }
        
        // Animate rays
        for (let ray of this.rays) {
            ray.length += random(-0.02, 0.02);
            ray.length = constrain(ray.length, 0.7, 1.3);
        }
        
        // Check if boss is defeated
        if (this.health <= 0) {
            this.toRemove = true;
            winGame();
        }
    }
    
    attack() {
        // Phase 1: Shoot fireballs toward Carl
        if (this.phase === 1) {
            let angle = atan2(carl.y - this.y, carl.x - this.x);
            enemies.push(new Fireball(this.x, this.y, angle));
        }
        // Phase 2: Shoot 3 fireballs in a spread
        else if (this.phase === 2) {
            let baseAngle = atan2(carl.y - this.y, carl.x - this.x);
            for (let i = -1; i <= 1; i++) {
                let angle = baseAngle + i * 0.3;
                enemies.push(new Fireball(this.x, this.y, angle));
            }
        }
        // Phase 3: Shoot 5 fireballs in a wide spread
        else {
            let baseAngle = atan2(carl.y - this.y, carl.x - this.x);
            for (let i = -2; i <= 2; i++) {
                let angle = baseAngle + i * 0.25;
                enemies.push(new Fireball(this.x, this.y, angle));
            }
        }
    }
    
    checkCollision(carl) {
        // Boss body doesn't damage Carl directly
        return false;
    }
    
    takeDamage() {
        if (!this.invincible) {
            this.health--;
            this.invincible = true;
            this.invincibleTimer = 30;
            // Create hit particles
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(this.x, this.y, 'hit'));
            }
        }
    }
    
    draw() {
        push(); translate(this.x, this.y - game.cameraY);
        
        // Flashing when invincible
        if (this.invincible && frameCount % 6 < 3) {
            pop();
            return;
        }
        
        // Glow effect
        let glowSize = this.size * 1.8 + sin(this.animFrame * 4) * 10 * SCALE;
        fill(255, 200, 0, 60);
        noStroke();
        circle(0, 0, glowSize);
        fill(255, 220, 50, 80);
        circle(0, 0, glowSize * 0.8);
        
        // Sun rays
        for (let i = 0; i < this.rays.length; i++) {
            let ray = this.rays[i];
            let angle = ray.angle + this.animFrame;
            let len = this.size * 0.7 * ray.length;
            
            push();
            rotate(angle);
            fill(255, 220, 0);
            beginShape();
            vertex(this.size * 0.5, 0);
            vertex(this.size * 0.5 + len, -len * 0.2);
            vertex(this.size * 0.5 + len * 1.5, 0);
            vertex(this.size * 0.5 + len, len * 0.2);
            endShape(CLOSE);
            pop();
        }
        
        // Main sun body
        let gradient = drawingContext.createRadialGradient(0, 0, 0, 0, 0, this.size * 0.6);
        gradient.addColorStop(0, '#FFF9E6');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(1, '#FF8C00');
        drawingContext.fillStyle = gradient;
        noStroke();
        circle(0, 0, this.size);
        
        // Angry face gets angrier each phase
        fill(100, 50, 0);
        // Eyes
        push();
        let eyeAngle = this.phase === 1 ? -0.1 : (this.phase === 2 ? -0.2 : -0.3);
        rotate(eyeAngle);
        ellipse(-this.size * 0.2, -this.size * 0.15, this.size * 0.15, this.size * 0.1);
        pop();
        push();
        rotate(-eyeAngle);
        ellipse(this.size * 0.2, -this.size * 0.15, this.size * 0.15, this.size * 0.1);
        pop();
        
        // Angry mouth
        stroke(100, 50, 0);
        strokeWeight(6 * SCALE);
        noFill();
        if (this.phase === 1) {
            arc(0, this.size * 0.1, this.size * 0.4, this.size * 0.3, 0, PI);
        } else if (this.phase === 2) {
            arc(0, this.size * 0.15, this.size * 0.5, this.size * 0.35, 0, PI);
        } else {
            arc(0, this.size * 0.2, this.size * 0.6, this.size * 0.4, 0, PI);
        }
        
        pop();
        
        // Health bar above boss
        push();
        translate(this.x, this.y - game.cameraY - this.size);
        let barWidth = 200 * SCALE;
        let barHeight = 20 * SCALE;
        
        // Background
        fill(50, 50, 50);
        noStroke();
        rect(-barWidth / 2, 0, barWidth, barHeight);
        
        // Health
        let healthPercent = this.health / this.maxHealth;
        let healthColor = healthPercent > 0.5 ? color(0, 255, 0) : (healthPercent > 0.25 ? color(255, 255, 0) : color(255, 0, 0));
        fill(healthColor);
        rect(-barWidth / 2, 0, barWidth * healthPercent, barHeight);
        
        // Border
        noFill();
        stroke(255);
        strokeWeight(2);
        rect(-barWidth / 2, 0, barWidth, barHeight);
        
        pop();
    }
}

// ========== FIREBALL PROJECTILE ==========
class Fireball extends Enemy {
    constructor(x, y, angle) {
        super('fireball', x, y);
        this.size = 30 * SCALE;
        this.speed = 8 * SCALE;
        this.vx = cos(angle) * this.speed;
        this.vy = sin(angle) * this.speed;
        this.life = 300; // Frames before despawning
    }
    
    update() {
        this.animFrame += 0.2;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        if (this.life <= 0 || this.x < -100 || this.x > width + 100 || this.y > game.seaLevel + 100) {
            this.toRemove = true;
        }
    }
    
    draw() {
        push();
        translate(this.x, this.y - game.cameraY);
        rotate(this.animFrame);
        
        // Fireball trail
        fill(255, 100, 0, 100);
        noStroke();
        circle(0, 0, this.size * 1.5);
        
        // Main fireball
        let gradient = drawingContext.createRadialGradient(0, 0, 0, 0, 0, this.size * 0.6);
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.5, '#FF8C00');
        gradient.addColorStop(1, '#FF4500');
        drawingContext.fillStyle = gradient;
        circle(0, 0, this.size);
        
        // Inner core
        fill(255, 255, 200);
        circle(0, 0, this.size * 0.4);
        
        pop();
    }
}

// ========== BOSS PLATFORM GENERATION ==========
function generateBossPlatforms() {
    // Don't use procedural generation - platforms are created manually in initGame
    return;
}

function createBossPlatforms() {
    // Create manual static platforms above water that don't despawn
    // These are thin platforms arranged for jumping gameplay
    
    // Layer 1: Low platforms just above water (easy to reach)
    platforms.push(new Platform(100 * scaleX, game.surfaceGoal - 100 * scaleY, 120 * scaleX, 20 * scaleY));
    platforms.push(new Platform(width - 220 * scaleX, game.surfaceGoal - 100 * scaleY, 120 * scaleX, 20 * scaleY));
    platforms.push(new Platform(width / 2 - 60 * scaleX, game.surfaceGoal - 80 * scaleY, 120 * scaleX, 20 * scaleY));
    
    // Layer 2: Mid-height platforms
    platforms.push(new Platform(200 * scaleX, game.surfaceGoal - 250 * scaleY, 100 * scaleX, 20 * scaleY));
    platforms.push(new Platform(width - 300 * scaleX, game.surfaceGoal - 280 * scaleY, 100 * scaleX, 20 * scaleY));
    platforms.push(new Platform(width / 2 - 50 * scaleX, game.surfaceGoal - 220 * scaleY, 100 * scaleX, 20 * scaleY));
    
    // Layer 3: Higher platforms
    platforms.push(new Platform(150 * scaleX, game.surfaceGoal - 400 * scaleY, 100 * scaleX, 20 * scaleY));
    platforms.push(new Platform(width - 250 * scaleX, game.surfaceGoal - 420 * scaleY, 100 * scaleX, 20 * scaleY));
    platforms.push(new Platform(width / 2 - 50 * scaleX, game.surfaceGoal - 380 * scaleY, 100 * scaleX, 20 * scaleY));
    
    // Layer 4: High platforms near boss level
    platforms.push(new Platform(250 * scaleX, game.surfaceGoal - 550 * scaleY, 90 * scaleX, 20 * scaleY));
    platforms.push(new Platform(width - 340 * scaleX, game.surfaceGoal - 530 * scaleY, 90 * scaleX, 20 * scaleY));
    
    // Layer 5: Top platforms (at boss height)
    platforms.push(new Platform(width / 4, game.surfaceGoal - 650 * scaleY, 100 * scaleX, 20 * scaleY));
    platforms.push(new Platform(width * 3 / 4 - 100 * scaleX, game.surfaceGoal - 650 * scaleY, 100 * scaleX, 20 * scaleY));
    
    // Mark all boss platforms as permanent (don't despawn)
    for (let platform of platforms) {
        platform.bossPlatform = true;
    }
}
