/* ============================================
   CARL THE URGENT SLUG URCHIN - GAME LOGIC
   Vertical Climbing Edition
   ============================================ */

"use strict";

// ========== GLOBAL GAME STATE ==========
let game = {
    state: 'playing',
    started: false,
    altitude: 0,
    highestAltitude: 0,
    lives: 3,
    cameraY: 0,
    seaLevel: 0,
    surfaceGoal: -20000,
    highScore: 0,
    frameCount: 0,
    flyingUp: false,
    flyTimer: 0
};

let carl;
let enemies = [];
let platforms = [];
let powerups = [];
let particles = [];
let background = { layers: [], bubbles: [] };
let keys = {};
let spacePressed = false;
let sounds = { backgroundMusic: null, jump: null, boost: null, hit: null, death: null, powerup: null, win: null, loaded: false, play(s) { if (this[s] && this.loaded) { try { this[s].play(); } catch (e) {} } }, stop(s) { if (this[s] && this.loaded) { try { this[s].stop(); } catch (e) {} } }, loop(s) { if (this[s] && this.loaded) { try { this[s].loop(); } catch (e) {} } } };
let lastPlatformY = 0;
let platformGap = 600;

class Carl {
    constructor(x, y) {
        this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.size = 50;
        this.rotation = 0; this.animFrame = 0; this.animSpeed = 0.15;
        this.acceleration = 2.5; this.friction = 0.92; this.waterResistance = 0.97;
        this.maxSpeed = 28; this.jumpPower = -18; this.gravity = 0.3;
        this.speedBoost = 1.0; this.boostTimer = 0;
        this.isGrounded = false; this.onPlatform = null;
        this.isInvincible = false; this.invincibleTimer = 0;
        this.tentacles = [];
        for (let i = 0; i < 8; i++) {
            this.tentacles.push({ angle: (TWO_PI / 8) * i, length: 25, wave: random(TWO_PI) });
        }
    }
    
    update() {
        if (game.state === 'playing') {
            let accel = this.acceleration * this.speedBoost;
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) this.vx -= accel;
            if (keys['ArrowRight'] || keys['d'] || keys['D']) this.vx += accel;
            if (keys['ArrowUp'] || keys['w'] || keys['W']) this.vy -= accel;
            if (keys['ArrowDown'] || keys['s'] || keys['S']) this.vy += accel;
        }
        
        this.vx *= this.friction * this.waterResistance;
        this.vy *= this.friction * this.waterResistance;
        this.vy += this.gravity;
        
        let maxSpd = this.maxSpeed * this.speedBoost;
        this.vx = constrain(this.vx, -maxSpd, maxSpd);
        this.vy = constrain(this.vy, -maxSpd * 1.5, maxSpd * 1.5);
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        
        let seabedY = game.seaLevel + 100;
        if (this.y >= seabedY - this.size) {
            this.y = seabedY - this.size;
            this.vy = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        
        this.onPlatform = null;
        for (let platform of platforms) {
            if (this.checkPlatformCollision(platform)) break;
        }
        
        game.altitude = Math.abs(this.y - game.seaLevel);
        if (game.altitude > game.highestAltitude) game.highestAltitude = game.altitude;
        if (game.altitude > game.highScore) {
            game.highScore = game.altitude;
            localStorage.setItem('carlHighScore', Math.floor(game.highScore));
        }
        if (this.y <= game.surfaceGoal && !game.flyingUp) {
            game.flyingUp = true;
            game.flyTimer = 0;
            this.vy = -15;
        }
        
        if (game.flyingUp) {
            game.flyTimer++;
            this.vy = -15;
            this.rotation += 0.1;
            if (game.flyTimer > 120) winGame();
        }
        
        game.cameraY = lerp(game.cameraY, this.y - height / 2, 0.1);
        this.rotation = lerp(this.rotation, this.vx * 0.05, 0.1);
        this.animFrame += this.animSpeed;
        
        if (this.isInvincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.isInvincible = false;
        }
        
        if (this.boostTimer > 0) {
            this.boostTimer--;
            if (this.boostTimer <= 0) this.speedBoost = 1.0;
        }
    }
    
    checkPlatformCollision(platform) {
        let overlap = this.size * 0.5;
        // Landing on top
        if (this.vy >= 0 && this.y + this.size >= platform.y && this.y < platform.y &&
            this.x + overlap > platform.x && this.x - overlap < platform.x + platform.width) {
            this.y = platform.y - this.size;
            this.vy = 0;
            this.onPlatform = platform;
            return true;
        }
        // Hitting underside (when moving up)
        if (this.vy < 0 && this.y - this.size <= platform.y + platform.height && this.y > platform.y + platform.height &&
            this.x + overlap > platform.x && this.x - overlap < platform.x + platform.width) {
            this.y = platform.y + platform.height + this.size;
            this.vy = 0;
            return true;
        }
        // Left side collision
        if (this.vx > 0 && this.x + overlap > platform.x && this.x < platform.x &&
            this.y + this.size > platform.y && this.y - this.size < platform.y + platform.height) {
            this.x = platform.x - overlap;
            this.vx *= -0.5;
            return true;
        }
        // Right side collision
        if (this.vx < 0 && this.x - overlap < platform.x + platform.width && this.x > platform.x + platform.width &&
            this.y + this.size > platform.y && this.y - this.size < platform.y + platform.height) {
            this.x = platform.x + platform.width + overlap;
            this.vx *= -0.5;
            return true;
        }
        return false;
    }
    
    applySpeedBoost(duration) {
        this.speedBoost = 1.8;
        this.boostTimer = duration;
        sounds.play('boost');
        for (let i = 0; i < 20; i++) particles.push(new Particle(this.x, this.y, 'boost'));
    }
    
    draw() {
        push();
        translate(this.x, this.y - game.cameraY);
        rotate(this.rotation);
        
        if (this.isInvincible && frameCount % 10 < 5) { pop(); return; }
        if (this.boostTimer > 0) { fill(255, 255, 0, 100); noStroke(); circle(0, 0, this.size * 2); }
        
        for (let i = 0; i < this.tentacles.length; i++) {
            let t = this.tentacles[i];
            let waveOffset = sin(this.animFrame + t.wave) * 5;
            let tentacleLength = t.length + waveOffset;
            let endX = cos(t.angle) * tentacleLength;
            let endY = sin(t.angle) * tentacleLength;
            let grad = drawingContext.createLinearGradient(0, 0, endX, endY);
            grad.addColorStop(0, '#8b5dbf');
            grad.addColorStop(1, '#c98dd9');
            strokeWeight(6);
            drawingContext.strokeStyle = grad;
            line(0, 0, endX, endY);
            noStroke(); fill(100, 60, 130);
            for (let j = 0; j < 3; j++) {
                let t_pos = (j + 1) / 4;
                circle(endX * t_pos, endY * t_pos, 4);
            }
        }
        
        let bodyGrad = drawingContext.createRadialGradient(0, -5, 5, 0, 0, this.size * 0.6);
        bodyGrad.addColorStop(0, '#b19cd9');
        bodyGrad.addColorStop(0.5, '#8b5dbf');
        bodyGrad.addColorStop(1, '#6b4a9e');
        noStroke();
        drawingContext.fillStyle = bodyGrad;
        ellipse(0, 0, this.size * 1.2, this.size);
        
        stroke(100, 60, 130, 150); strokeWeight(3); noFill();
        for (let i = 0; i < 3; i++) { let offset = i * 8 - 8; arc(offset, 0, 15, 15, 0, PI); }
        
        fill(90, 50, 120); noStroke();
        for (let i = 0; i < 12; i++) {
            let spikeAngle = (PI / 12) * i + PI * 0.3;
            let spikeX = cos(spikeAngle) * (this.size * 0.45);
            let spikeY = sin(spikeAngle) * (this.size * 0.35);
            let spikeSize = 8 + sin(this.animFrame + i) * 2;
            push(); translate(spikeX, spikeY); rotate(spikeAngle);
            triangle(-spikeSize/2, 0, spikeSize/2, 0, 0, -spikeSize * 1.5);
            pop();
        }
        
        fill(255); ellipse(-12, -8, 16, 20); ellipse(12, -8, 16, 20);
        let pupilX = constrain(this.vx * 2, -3, 3);
        let pupilY = constrain(this.vy * 0.5, -3, 3);
        fill(50, 180, 100); ellipse(-12 + pupilX, -8 + pupilY, 8, 10); ellipse(12 + pupilX, -8 + pupilY, 8, 10);
        fill(255, 255, 255, 200); ellipse(-14 + pupilX, -10 + pupilY, 3, 3); ellipse(10 + pupilX, -10 + pupilY, 3, 3);
        stroke(80, 40, 100); strokeWeight(2); noFill(); arc(0, 2, 20, 15, 0, PI);
        strokeWeight(1); line(-6, 2, -6, 6); line(-2, 2, -2, 6); line(2, 2, 2, 6); line(6, 2, 6, 6);
        pop();
    }
    
    hit() {
        if (!this.isInvincible) {
            game.lives--;
            this.isInvincible = true;
            this.invincibleTimer = 96;
            sounds.play('hit');
            for (let i = 0; i < 15; i++) particles.push(new Particle(this.x, this.y, 'hit'));
            if (game.lives <= 0) gameOver();
        }
    }
    
    reset() {
        this.x = width / 2; this.y = game.seaLevel; this.vx = 0; this.vy = 0;
        this.rotation = 0; this.isInvincible = false; this.invincibleTimer = 0;
        this.speedBoost = 1.0; this.boostTimer = 0;
    }
}

class Platform {
    constructor(x, y, width, height, hasEnemies, hasPowerup) {
        this.x = x; this.y = y; this.width = width; this.height = height || 30;
        this.hasEnemies = hasEnemies; this.hasPowerup = hasPowerup; this.toRemove = false;
        this.decorSeed = floor(random(100000));
        if (this.hasEnemies && carl) {
            let enemyCount = floor(random(1, 3));
            let safeRadius = 250;
            for (let i = 0; i < enemyCount; i++) {
                let crabX = this.x + random(50, this.width - 50);
                let crabY = this.y - 30;
                if (dist(crabX, crabY, carl.x, carl.y) > safeRadius) {
                    enemies.push(new Crab(crabX, crabY, this.x, this.x + this.width));
                }
            }
        }
        if (this.hasPowerup) {
            powerups.push(new Powerup(this.x + this.width / 2, this.y - 40, 'speed'));
        }
    }
    
    update() {
        if (this.y - game.cameraY > height + 200) this.toRemove = true;
    }
    
    draw() {
        push(); translate(0, -game.cameraY);
        fill(0, 0, 0, 50); rect(this.x + 5, this.y + 5, this.width, this.height, 5);
        fill(120, 100, 80); noStroke(); rect(this.x, this.y, this.width, this.height, 5);
        fill(80, 140, 60); rect(this.x, this.y, this.width, 8, 5, 5, 0, 0);
        fill(100, 85, 70);
        randomSeed(this.decorSeed);
        for (let i = 0; i < this.width; i += 40) {
            let rockX = this.x + i + random(-5, 5);
            let rockY = this.y + 10 + random(-3, 3);
            ellipse(rockX, rockY, 15, 12);
        }
        randomSeed(frameCount);
        pop();
    }
}

class Enemy {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y; this.toRemove = false; this.animFrame = random(TWO_PI);
    }
    update() {
        this.animFrame += 0.1;
        if (abs(this.y - game.cameraY) > height * 2) this.toRemove = true;
    }
    checkCollision(carl) {
        let d = dist(this.x, this.y, carl.x, carl.y);
        return d < (this.size + carl.size) * 0.7;
    }
}

class Jellyfish extends Enemy {
    constructor(x, y) {
        super('jellyfish', x, y);
        this.size = 40; this.bobSpeed = 0.05; this.bobAmount = 30; this.baseY = y;
    }
    update() {
        super.update();
        this.y = this.baseY + sin(this.animFrame * this.bobSpeed * 50) * this.bobAmount;
    }
    draw() {
        push(); translate(this.x, this.y - game.cameraY);
        fill(255, 150, 200, 200); noStroke(); arc(0, 0, this.size * 1.2, this.size, PI, TWO_PI);
        fill(255, 200, 220, 150); arc(0, -5, this.size * 0.8, this.size * 0.6, PI, TWO_PI);
        stroke(255, 100, 150, 180); strokeWeight(3);
        for (let i = 0; i < 6; i++) {
            let offset = (i - 2.5) * 8;
            let wave = sin(this.animFrame + i) * 10;
            noFill(); beginShape(); vertex(offset, this.size * 0.5);
            bezierVertex(offset + wave, this.size * 0.7, offset - wave, this.size * 0.9, offset + wave * 0.5, this.size * 1.2);
            endShape();
        }
        pop();
    }
}

class Crab extends Enemy {
    constructor(x, y, leftBound, rightBound) {
        super('crab', x, y);
        this.size = 35; this.speed = 1.5;
        this.direction = random() > 0.5 ? 1 : -1;
        this.leftBound = leftBound; this.rightBound = rightBound;
    }
    update() {
        super.update();
        this.x += this.speed * this.direction;
        if (this.x <= this.leftBound + 20 || this.x >= this.rightBound - 20) this.direction *= -1;
    }
    draw() {
        push(); translate(this.x, this.y - game.cameraY);
        if (this.direction < 0) scale(-1, 1);
        fill(220, 80, 60); noStroke(); ellipse(0, 0, this.size, this.size * 0.7);
        stroke(180, 60, 40); strokeWeight(2); noFill();
        for (let i = -1; i <= 1; i++) arc(i * 8, -5, 12, 12, 0, PI);
        fill(240, 100, 80); noStroke();
        push(); translate(-this.size * 0.5, -5);
        ellipse(0, 0, 15, 10); triangle(-5, 0, -12, -8, -8, -3); pop();
        push(); translate(this.size * 0.5, -5);
        ellipse(0, 0, 15, 10); triangle(5, 0, 12, -8, 8, -3); pop();
        stroke(220, 80, 60); strokeWeight(3);
        line(-8, -8, -8, -15); line(8, -8, 8, -15);
        fill(255); noStroke(); circle(-8, -16, 8); circle(8, -16, 8);
        fill(0); circle(-8, -16, 4); circle(8, -16, 4);
        stroke(220, 80, 60); strokeWeight(2);
        for (let i = -2; i <= 2; i++) {
            if (i === 0) continue;
            let legX = i * 8;
            let legBob = sin(this.animFrame + i) * 2;
            line(legX, this.size * 0.3, legX, this.size * 0.5 + legBob);
        }
        pop();
    }
}

class Mine extends Enemy {
    constructor(x, y) {
        super('mine', x, y);
        this.size = 35; this.rotationSpeed = 0.02; this.rotation = 0;
    }
    update() {
        super.update(); this.rotation += this.rotationSpeed;
    }
    draw() {
        push(); translate(this.x, this.y - game.cameraY); rotate(this.rotation);
        fill(60, 60, 70); noStroke(); circle(0, 0, this.size);
        fill(40, 40, 50); arc(0, 0, this.size, this.size, PI * 0.5, PI * 1.5);
        fill(80, 80, 90);
        for (let i = 0; i < 8; i++) {
            let angle = (TWO_PI / 8) * i;
            push(); rotate(angle); rect(-3, this.size * 0.5, 6, 15); ellipse(0, this.size * 0.5 + 15, 8, 8); pop();
        }
        let pulseAlpha = map(sin(this.animFrame * 5), -1, 1, 100, 255);
        fill(255, 0, 0, pulseAlpha); circle(0, 0, 8);
        pop();
    }
}

class Urchin extends Enemy {
    constructor(x, y) {
        super('urchin', x, y);
        this.size = 45; this.spikeCount = 16;
    }
    draw() {
        push(); translate(this.x, this.y - game.cameraY);
        stroke(90, 50, 110); strokeWeight(4);
        for (let i = 0; i < this.spikeCount; i++) {
            let angle = (TWO_PI / this.spikeCount) * i;
            let len = this.size * 0.8 + sin(this.animFrame + i) * 5;
            let x1 = cos(angle) * (this.size * 0.3);
            let y1 = sin(angle) * (this.size * 0.3);
            let x2 = cos(angle) * len;
            let y2 = sin(angle) * len;
            line(x1, y1, x2, y2);
        }
        fill(120, 70, 140); noStroke(); circle(0, 0, this.size * 0.6);
        fill(100, 50, 120);
        for (let i = 0; i < 5; i++) {
            let angle = (TWO_PI / 5) * i + this.animFrame * 0.5;
            let x = cos(angle) * 8;
            let y = sin(angle) * 8;
            circle(x, y, 6);
        }
        pop();
    }
}

class SideJellyfish extends Enemy {
    constructor(x, y, direction) {
        super('sidejellyfish', x, y);
        this.size = 45; this.speed = 2; this.direction = direction;
        this.bobAmount = 40; this.baseY = y;
    }
    update() {
        super.update();
        this.x += this.speed * this.direction;
        this.y = this.baseY + sin(this.animFrame * 3) * this.bobAmount;
        if (this.x < -100 || this.x > width + 100) this.toRemove = true;
    }
    draw() {
        push(); translate(this.x, this.y - game.cameraY);
        if (this.direction < 0) scale(-1, 1);
        fill(180, 100, 255, 200); noStroke(); arc(0, 0, this.size * 1.3, this.size * 1.1, PI, TWO_PI);
        fill(200, 150, 255, 150); arc(0, -5, this.size * 0.9, this.size * 0.7, PI, TWO_PI);
        stroke(160, 80, 230, 180); strokeWeight(3);
        for (let i = 0; i < 8; i++) {
            let offset = (i - 3.5) * 7;
            let wave = sin(this.animFrame + i) * 12;
            noFill(); beginShape(); vertex(offset, this.size * 0.55);
            bezierVertex(offset + wave, this.size * 0.75, offset - wave, this.size * 0.95, offset + wave * 0.5, this.size * 1.3);
            endShape();
        }
        pop();
    }
}

class Shark extends Enemy {
    constructor(x, y, direction) {
        super('shark', x, y);
        this.size = 60; this.speed = 6; this.direction = direction;
    }
    update() {
        super.update();
        this.x += this.speed * this.direction;
        if (this.x < -150 || this.x > width + 150) this.toRemove = true;
    }
    draw() {
        push(); translate(this.x, this.y - game.cameraY);
        if (this.direction < 0) scale(-1, 1);
        fill(100, 120, 140); noStroke();
        ellipse(0, 0, this.size * 1.4, this.size * 0.6);
        triangle(this.size * 0.7, 0, this.size * 1.1, 0, this.size * 0.9, -this.size * 0.4);
        triangle(-this.size * 0.6, 0, -this.size * 0.9, 0, -this.size * 0.75, this.size * 0.5);
        triangle(-this.size * 0.6, 0, -this.size * 0.9, 0, -this.size * 0.75, -this.size * 0.5);
        fill(80, 100, 120);
        triangle(this.size * 0.2, -this.size * 0.3, this.size * 0.5, -this.size * 0.3, this.size * 0.35, -this.size * 0.7);
        fill(255); circle(this.size * 0.4, -this.size * 0.15, 12);
        fill(0); circle(this.size * 0.4, -this.size * 0.15, 6);
        fill(200, 210, 220); arc(-this.size * 0.3, this.size * 0.1, this.size * 0.6, this.size * 0.3, 0, PI);
        stroke(80, 90, 100); strokeWeight(2); noFill();
        for (let i = 0; i < 5; i++) {
            let x = -this.size * 0.5 + i * 8;
            line(x, this.size * 0.1, x + 4, this.size * 0.25);
        }
        pop();
    }
}

class Bomb extends Enemy {
    constructor(x, y, direction) {
        super('bomb', x, y);
        this.size = 70; this.speed = 1; this.direction = direction;
        this.exploding = false; this.explosionTimer = 0; this.maxExplosionTime = 30;
    }
    update() {
        super.update();
        if (this.exploding) {
            this.explosionTimer++;
            if (this.explosionTimer >= this.maxExplosionTime) this.toRemove = true;
        } else {
            this.x += this.speed * this.direction;
            if (this.x < -150 || this.x > width + 150) this.toRemove = true;
        }
    }
    checkCollision(carl) {
        if (this.exploding) return false;
        let d = dist(this.x, this.y, carl.x, carl.y);
        if (d < (this.size + carl.size) * 0.7) {
            this.exploding = true;
            return true;
        }
        return false;
    }
    draw() {
        push(); translate(this.x, this.y - game.cameraY);
        if (this.exploding) {
            let progress = this.explosionTimer / this.maxExplosionTime;
            let explosionSize = this.size * 3 * progress;
            let alpha = 255 * (1 - progress);
            fill(255, 150, 0, alpha); noStroke(); circle(0, 0, explosionSize);
            fill(255, 200, 100, alpha * 0.7); circle(0, 0, explosionSize * 0.7);
            fill(255, 255, 200, alpha * 0.5); circle(0, 0, explosionSize * 0.4);
            for (let i = 0; i < 8; i++) {
                let angle = (TWO_PI / 8) * i + this.explosionTimer * 0.1;
                let len = explosionSize * 0.6;
                stroke(255, 180, 50, alpha); strokeWeight(3);
                line(0, 0, cos(angle) * len, sin(angle) * len);
            }
        } else {
            fill(60, 60, 70); noStroke(); circle(0, 0, this.size);
            fill(40, 40, 50); arc(0, 0, this.size, this.size, PI * 0.5, PI * 1.5);
            fill(80, 80, 90);
            for (let i = 0; i < 12; i++) {
                let angle = (TWO_PI / 12) * i;
                push(); rotate(angle); rect(-2, this.size * 0.5, 4, this.size * 0.3); pop();
            }
            let pulseAlpha = map(sin(this.animFrame * 5), -1, 1, 100, 255);
            fill(255, 50, 50, pulseAlpha); circle(0, 0, 10);
            fill(255, 255, 255, 80); circle(-this.size * 0.2, -this.size * 0.2, this.size * 0.25);
        }
        pop();
    }
}

class Fishhook extends Enemy {
    constructor(x, y) {
        super('fishhook', x, y);
        this.size = 40; this.baseY = y; this.swayAmount = 15;
    }
    update() {
        super.update();
        this.y = this.baseY + sin(this.animFrame * 0.5) * this.swayAmount;
    }
    draw() {
        push(); translate(this.x, this.y - game.cameraY);
        let lineLength = 300;
        let segments = 20;
        for (let i = 0; i < segments; i++) {
            let progress = i / segments;
            let alpha = 255 * (1 - progress);
            let yPos = -this.size * 0.5 - (lineLength * progress);
            stroke(80, 80, 80, alpha); strokeWeight(2);
            let nextProgress = (i + 1) / segments;
            let nextYPos = -this.size * 0.5 - (lineLength * nextProgress);
            line(0, yPos, 0, nextYPos);
        }
        fill(150, 150, 160); noStroke();
        ellipse(0, -this.size * 0.5, 12, 8);
        stroke(180, 180, 190); strokeWeight(5); noFill();
        arc(0, 0, this.size * 0.8, this.size * 0.8, PI * 0.2, PI * 1.3);
        noStroke(); fill(180, 180, 190);
        triangle(-this.size * 0.15, this.size * 0.4, this.size * 0.15, this.size * 0.4, 0, this.size * 0.6);
        fill(200, 100, 100); circle(this.size * 0.2, -this.size * 0.2, 10);
        pop();
    }
}

class Powerup {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type; this.size = 30;
        this.collected = false; this.toRemove = false; this.animFrame = 0;
        this.bobAmount = 10; this.baseY = y;
    }
    update() {
        this.animFrame += 0.1;
        this.y = this.baseY + sin(this.animFrame) * this.bobAmount;
        if (!this.collected) {
            let d = dist(this.x, this.y, carl.x, carl.y);
            if (d < this.size + carl.size) this.collect();
        }
        if (abs(this.y - game.cameraY) > height * 2) this.toRemove = true;
    }
    collect() {
        this.collected = true; this.toRemove = true;
        sounds.play('powerup');
        if (this.type === 'speed') carl.applySpeedBoost(300);
        for (let i = 0; i < 15; i++) particles.push(new Particle(this.x, this.y, 'powerup'));
    }
    draw() {
        if (this.collected) return;
        push(); translate(this.x, this.y - game.cameraY); rotate(this.animFrame);
        fill(255, 255, 0, 100); noStroke(); circle(0, 0, this.size * 1.5);
        fill(255, 220, 0); beginShape();
        for (let i = 0; i < 10; i++) {
            let angle = (TWO_PI / 10) * i;
            let r = i % 2 === 0 ? this.size * 0.6 : this.size * 0.3;
            let x = cos(angle) * r;
            let y = sin(angle) * r;
            vertex(x, y);
        }
        endShape(CLOSE);
        fill(255, 100, 0); textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD);
        if (this.type === 'speed') text('', 0, 0);
        pop();
    }
}

class Particle {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.vx = random(-3, 3); this.vy = random(-3, 3);
        this.life = 255; this.size = random(5, 15); this.type = type; this.toRemove = false;
        if (type === 'hit') this.color = color(255, 100, 150);
        else if (type === 'boost') this.color = color(255, 255, 0);
        else if (type === 'powerup') this.color = color(255, 220, 0);
        else this.color = color(150, 200, 255);
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.vy += 0.2; this.life -= 5;
        if (this.life <= 0) this.toRemove = true;
    }
    draw() {
        push(); translate(0, -game.cameraY);
        this.color.setAlpha(this.life); fill(this.color); noStroke(); circle(this.x, this.y, this.size);
        pop();
    }
}

class BackgroundLayer {
    constructor(depth, color1, color2) {
        this.depth = depth; this.scrollSpeed = depth * 0.3;
        this.color1 = color1; this.color2 = color2; this.elements = [];
        for (let i = 0; i < 8; i++) {
            this.elements.push({
                x: random(width), y: random(-height * 3, height * 3),
                type: random() > 0.5 ? 'coral' : 'rock',
                size: random(30, 80) * depth, variant: floor(random(3))
            });
        }
    }
    update() {}
    draw() {
        push(); translate(0, -game.cameraY * this.scrollSpeed);
        for (let elem of this.elements) {
            push(); translate(elem.x, elem.y);
            let alpha = map(this.depth, 0, 1, 80, 180);
            if (elem.type === 'coral') {
                fill(this.color1.levels[0], this.color1.levels[1], this.color1.levels[2], alpha);
                noStroke();
                if (elem.variant === 0) {
                    rect(-elem.size * 0.1, 0, elem.size * 0.2, elem.size);
                    rect(-elem.size * 0.3, elem.size * 0.3, elem.size * 0.15, elem.size * 0.5);
                    rect(elem.size * 0.15, elem.size * 0.4, elem.size * 0.15, elem.size * 0.4);
                } else if (elem.variant === 1) {
                    triangle(0, elem.size, -elem.size * 0.5, 0, elem.size * 0.5, 0);
                } else {
                    ellipse(0, elem.size * 0.7, elem.size * 0.8, elem.size);
                }
            } else {
                fill(this.color2.levels[0], this.color2.levels[1], this.color2.levels[2], alpha);
                noStroke(); ellipse(0, 0, elem.size * 1.2, elem.size * 0.8);
            }
            pop();
        }
        pop();
    }
}

class Bubble {
    constructor(x, y) {
        this.x = x || random(width);
        this.y = y || random(game.seaLevel - 2000, game.seaLevel + height);
        this.size = random(5, 20); this.speed = random(1, 3);
        this.wobble = random(TWO_PI); this.wobbleSpeed = random(0.02, 0.05);
    }
    update() {
        this.y -= this.speed; this.wobble += this.wobbleSpeed;
        this.x += sin(this.wobble) * 0.5;
        if (this.y < game.cameraY - height) {
            this.y = game.cameraY + height + 50;
            this.x = random(width);
        }
    }
    draw() {
        push(); translate(0, -game.cameraY); noStroke();
        fill(255, 255, 255, 100); circle(this.x, this.y, this.size);
        fill(255, 255, 255, 200); circle(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.3);
        pop();
    }
}

function generatePlatforms() {
    while (lastPlatformY > game.cameraY - height * 3) {
        let gap = random(300, 600);
        lastPlatformY -= gap;
        
        // Stop generating platforms near/above water surface
        if (lastPlatformY < game.surfaceGoal + 500) {
            break;
        }
        
        let platformCount = floor(random(1, 3));
        let hasEnemies = random() > 0.6;
        let hasPowerup = random() > 0.85;
        for (let i = 0; i < platformCount; i++) {
            let platformWidth = random(200, 600);
            let platformHeight = random() > 0.7 ? random(30, 50) : random(80, 200);
            let platformX = random(50, width - platformWidth - 50);
            platforms.push(new Platform(platformX, lastPlatformY + random(-150, 150), platformWidth, platformHeight, hasEnemies && i === 0, hasPowerup && i === 0));
        }
    }
}

function spawnFloatingEnemies() {
    // Don't spawn enemies near/above water surface
    if (game.cameraY < game.surfaceGoal + 1000) {
        return;
    }
    
    let maxEnemies = 20;
    // Hard cap - no spawning if at max
    if (enemies.length >= maxEnemies) {
        return;
    }
    
    // Scale spawn chance based on enemy count (more enemies = harder to spawn)
    let enemyRatio = enemies.length / maxEnemies;
    let spawnChance = map(enemyRatio, 0, 1, 0.80, 0.995);
    
    if (random() > spawnChance) {
        let safeRadius = 300;
        let spawnX, spawnY;
        let attempts = 0;
        do {
            spawnY = game.cameraY - height / 2 + random(-height, -height / 2);
            spawnX = random(width);
            attempts++;
        } while (dist(spawnX, spawnY, carl.x, carl.y) < safeRadius && attempts < 10);
        
        if (attempts < 10) {
            let enemyType = floor(random(3));
            if (enemyType === 0) enemies.push(new Jellyfish(spawnX, spawnY));
            else if (enemyType === 1) enemies.push(new Mine(spawnX, spawnY));
            else enemies.push(new Urchin(spawnX, spawnY));
        }
    }
}

function spawnSideEnemies() {
    // Don't spawn enemies near/above water surface
    if (game.cameraY < game.surfaceGoal + 1000) {
        return;
    }
    
    let maxEnemies = 20;
    // Hard cap - no spawning if at max
    if (enemies.length >= maxEnemies) {
        return;
    }
    
    // Scale spawn chance based on enemy count (more enemies = harder to spawn)
    let enemyRatio = enemies.length / maxEnemies;
    let spawnChance = map(enemyRatio, 0, 1, 0.75, 0.99);
    
    if (random() > spawnChance) {
        let safeRadius = 300;
        let spawnY = game.cameraY + random(-height * 0.3, height * 0.3);
        
        if (Math.abs(spawnY - carl.y) < safeRadius) {
            return;
        }
        
        let direction = random() > 0.5 ? 1 : -1;
        let spawnX = direction > 0 ? -100 : width + 100;
        let enemyType = floor(random(4));
        
        if (enemyType === 3) {
            let hookX = random(width * 0.2, width * 0.8);
            if (dist(hookX, spawnY, carl.x, carl.y) < safeRadius) {
                return;
            }
            enemies.push(new Fishhook(hookX, spawnY));
        } else {
            if (enemyType === 0) enemies.push(new SideJellyfish(spawnX, spawnY, direction));
            else if (enemyType === 1) enemies.push(new Shark(spawnX, spawnY, direction));
            else if (enemyType === 2) enemies.push(new Bomb(spawnX, spawnY, direction));
        }
    }
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    loadSounds();
    initGame();
}

function draw() {
    drawBackground();
    for (let layer of background.layers) { layer.update(); layer.draw(); }
    drawSeabed();
    for (let bubble of background.bubbles) { bubble.update(); bubble.draw(); }
    
    if (game.state === 'playing') {
        carl.update();
        generatePlatforms();
        spawnFloatingEnemies();
        spawnSideEnemies();
        spawnSideEnemies();
        
        for (let i = platforms.length - 1; i >= 0; i--) {
            platforms[i].update();
            if (platforms[i].toRemove) platforms.splice(i, 1);
        }
        
        for (let i = powerups.length - 1; i >= 0; i--) {
            powerups[i].update();
            if (powerups[i].toRemove) powerups.splice(i, 1);
        }
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            if (enemies[i].checkCollision(carl)) {
                carl.hit();
                enemies.splice(i, 1);
                continue;
            }
            if (enemies[i].toRemove) enemies.splice(i, 1);
        }
        
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].toRemove) particles.splice(i, 1);
        }
    }
    
    for (let platform of platforms) platform.draw();
    for (let powerup of powerups) powerup.draw();
    for (let enemy of enemies) enemy.draw();
    for (let particle of particles) particle.draw();
    carl.draw();
    drawWaterSurface();
    drawSurfaceIndicator();
    updateHUD();
}

function drawBackground() {
    let depth = map(carl.y, game.seaLevel, game.surfaceGoal, 0, 1);
    depth = constrain(depth, 0, 1);
    let c1 = lerpColor(color(4, 30, 66), color(100, 180, 220), depth);
    let c2 = lerpColor(color(10, 77, 104), color(150, 200, 240), depth);
    let c3 = lerpColor(color(26, 123, 160), color(180, 220, 255), depth);
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = inter < 0.5 ? lerpColor(c1, c2, inter * 2) : lerpColor(c2, c3, (inter - 0.5) * 2);
        stroke(c); line(0, y, width, y);
    }
}

function drawSeabed() {
    push(); translate(0, -game.cameraY);
    let seabedY = game.seaLevel + 100;
    fill(194, 178, 128); noStroke(); rect(0, seabedY, width, 1000);
    fill(180, 160, 110);
    randomSeed(12345);
    for (let i = 0; i < width; i += 30) {
        let x = i + random(-10, 10);
        let y = seabedY + random(10, 40);
        ellipse(x, y, random(20, 40), random(15, 30));
    }
    randomSeed(67890);
    for (let i = 0; i < width; i += 80) {
        let x = i + random(-20, 20);
        stroke(50, 100, 50); strokeWeight(4); noFill(); beginShape();
        for (let j = 0; j < 5; j++) {
            let swayX = sin(frameCount * 0.02 + i) * 10;
            vertex(x + swayX, seabedY - j * 20);
        }
        endShape();
    }
    randomSeed(frameCount);
    pop();
}

function drawSurfaceIndicator() {
    let distToSurface = carl.y - game.surfaceGoal;
    if (distToSurface < 500 && distToSurface > 0) {
        push(); fill(255, 255, 0); textAlign(CENTER); textSize(24);
        text('Surface Nearby! ', width / 2, 50); pop();
    }
}

function drawWaterSurface() {
    let surfaceY = game.surfaceGoal - game.cameraY;
    if (surfaceY > -200 && surfaceY < height + 200) {
        push();
        let waveOffset = frameCount * 0.05;
        for (let i = 0; i < 3; i++) {
            let alpha = map(i, 0, 2, 150, 50);
            let offset = i * 3;
            stroke(100, 180, 220, alpha);
            strokeWeight(4 - i);
            noFill();
            beginShape();
            for (let x = -50; x < width + 50; x += 20) {
                let wave = sin(x * 0.02 + waveOffset + i * 0.5) * 8;
                vertex(x, surfaceY + wave + offset);
            }
            endShape();
        }
        fill(135, 206, 235, 100);
        noStroke();
        rect(0, 0, width, surfaceY);
        for (let i = 0; i < 20; i++) {
            let x = (frameCount * 2 + i * 50) % (width + 100) - 50;
            let size = random(3, 8);
            fill(255, 255, 255, 150);
            ellipse(x, surfaceY - 20 + random(-10, 10), size, size);
        }
        pop();
    }
}

function initGame() {
    game.state = 'playing'; game.altitude = 0; game.highestAltitude = 0;
    game.lives = 3; game.cameraY = 0; game.seaLevel = height / 2;
    game.surfaceGoal = game.seaLevel - 20000; game.frameCount = 0;
    game.flyingUp = false; game.flyTimer = 0;
    let saved = localStorage.getItem('carlHighScore');
    if (saved) game.highScore = parseInt(saved);
    carl = new Carl(width / 2, game.seaLevel);
    enemies = []; platforms = []; powerups = []; particles = []; lastPlatformY = game.seaLevel;
    for (let i = 0; i < 10; i++) generatePlatforms();
    background.layers = [
        new BackgroundLayer(0.2, color(60, 40, 80), color(40, 60, 80)),
        new BackgroundLayer(0.5, color(100, 50, 120), color(60, 80, 100)),
        new BackgroundLayer(0.8, color(150, 70, 160), color(80, 100, 120))
    ];
    background.bubbles = [];
    for (let i = 0; i < 50; i++) background.bubbles.push(new Bubble(random(width), random(game.seaLevel - 2000, game.seaLevel)));
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('gameover-menu').classList.add('hidden');
    sounds.loop('backgroundMusic');
}

function updateHUD() {
    document.getElementById('distance').textContent = Math.floor(game.altitude);
    document.getElementById('speed').textContent = carl.speedBoost.toFixed(1) + 'x';
    document.getElementById('lives').textContent = game.lives;
    document.getElementById('highscore').textContent = Math.floor(game.highScore);
}

function pauseGame() {
    if (game.state === 'playing') {
        game.state = 'paused';
        document.getElementById('pause-menu').classList.remove('hidden');
        sounds.stop('backgroundMusic');
        noLoop();
    }
}

function resumeGame() {
    if (game.state === 'paused') {
        game.state = 'playing';
        document.getElementById('pause-menu').classList.add('hidden');
        sounds.loop('backgroundMusic');
        loop();
    }
}

function gameOver() {
    game.state = 'gameover';
    sounds.stop('backgroundMusic');
    sounds.play('death');
    if (game.altitude > game.highScore) {
        game.highScore = game.altitude;
        localStorage.setItem('carlHighScore', Math.floor(game.highScore));
    }
    document.getElementById('final-distance').textContent = `Altitude: ${Math.floor(game.altitude)}m`;
    document.getElementById('gameover-message').textContent = 'Carl got caught!';
    let tryAgainBtn = document.getElementById('try-again-btn');
    tryAgainBtn.style.background = 'linear-gradient(135deg, #ff6b9d 0%, #c9184a 100%)';
    document.getElementById('gameover-menu').classList.remove('hidden');
    noLoop();
}

function winGame() {
    game.state = 'won';
    sounds.stop('backgroundMusic');
    sounds.play('win');
    if (game.altitude > game.highScore) {
        game.highScore = game.altitude;
        localStorage.setItem('carlHighScore', Math.floor(game.highScore));
    }
    document.getElementById('final-distance').textContent = `Carl flew away!`;
    document.getElementById('gameover-message').textContent = `And suffocated...`;
    let tryAgainBtn = document.getElementById('try-again-btn');
    tryAgainBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';
    document.getElementById('gameover-menu').classList.remove('hidden');
    noLoop();
}

function restartGame() {
    document.getElementById('gameover-menu').classList.add('hidden');
    initGame();
    loop();
}

function returnToTitle() {
    window.location.href = 'index.html';
}

function keyPressed() {
    keys[key] = true;
    if (key === 'Escape' || key === 'p' || key === 'P') {
        if (game.state === 'playing') pauseGame();
        else if (game.state === 'paused') resumeGame();
    }
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return false;
}

function keyReleased() {
    keys[key] = false;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function loadSounds() {
    console.log('Sound system ready. Add sound files to: Internal-Games/slop/carl/sounds/');
}