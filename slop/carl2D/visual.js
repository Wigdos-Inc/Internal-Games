/* ============================================
   VISUAL EFFECTS - BACKGROUNDS, PARTICLES, BUBBLES
   ============================================ */

"use strict";

// ========== PARTICLES ==========
class Particle {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.life = 255; this.size = random(5, 15) * SCALE; this.type = type; this.toRemove = false;
        
        // Shield particles explode radially in all directions
        if (type === 'shield') {
            let angle = random(TWO_PI);
            let baseSpeedX = random(3, 6) * scaleX;
            let baseSpeedY = random(3, 6) * scaleY;
            let xComponent = cos(angle);
            let yComponent = sin(angle);
            
            // Adjust speed based on direction - more speed upward, less downward
            let speedMultiplier = 1.0;
            if (yComponent < 0) {
                // Moving upward (negative y) - increase speed
                speedMultiplier = map(yComponent, -1, 0, 1.5, 1.0);
            } else {
                // Moving downward (positive y) - decrease speed
                speedMultiplier = map(yComponent, 0, 1, 1.0, 0.4);
            }
            
            this.vx = xComponent * baseSpeedX * speedMultiplier;
            this.vy = yComponent * baseSpeedY * speedMultiplier;
        } else {
            this.vx = random(-3, 3) * scaleX;
            this.vy = random(-3, 3) * scaleY;
        }
        
        if (type === 'hit') this.color = color(255, 100, 150);
        else if (type === 'boost') this.color = color(255, 255, 0);
        else if (type === 'powerup') this.color = color(255, 220, 0);
        else if (type === 'shield') this.color = color(100, 200, 255);
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

// ========== BACKGROUND LAYERS ==========
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

// ========== BUBBLES ==========
class Bubble {
    constructor(x, y) {
        this.x = x || random(width);
        this.y = y || random(game.seaLevel - 2000, game.seaLevel + height);
        this.size = random(5, 20) * SCALE; this.speed = random(1, 3) * scaleY;
        this.wobble = random(TWO_PI); this.wobbleSpeed = random(0.02, 0.05);
    }
    update() {
        this.y -= this.speed; this.wobble += this.wobbleSpeed;
        this.x += sin(this.wobble) * 0.5 * scaleX;
        if (this.y < game.cameraY - height) {
            this.y = game.cameraY + height + 50 * scaleY;
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

// ========== DRAWING FUNCTIONS ==========
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
    let seabedY = game.seaLevel + 100 * scaleY;
    fill(194, 178, 128); noStroke(); rect(0, seabedY, width, 1000 * scaleY);
    fill(180, 160, 110);
    randomSeed(12345);
    for (let i = 0; i < width; i += 30 * scaleX) {
        let x = i + random(-10, 10) * scaleX;
        let y = seabedY + random(10, 40) * scaleY;
        ellipse(x, y, random(20, 40) * SCALE, random(15, 30) * SCALE);
    }
    randomSeed(67890);
    for (let i = 0; i < width; i += 80 * scaleX) {
        let x = i + random(-20, 20) * scaleX;
        stroke(50, 100, 50); strokeWeight(4 * SCALE); noFill(); beginShape();
        for (let j = 0; j < 5; j++) {
            let swayX = sin(frameCount * 0.02 + i) * 10 * scaleX;
            vertex(x + swayX, seabedY - j * 20 * scaleY);
        }
        endShape();
    }
    randomSeed(frameCount);
    pop();
}

function drawSurfaceIndicator() {
    let distToSurface = carl.y - game.surfaceGoal;
    if (distToSurface < 500 * scaleY && distToSurface > 0) {
        push(); fill(255, 255, 0); textAlign(CENTER); textSize(24 * SCALE);
        text('Surface Nearby! ☀️', width / 2, 50 * scaleY); pop();
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
