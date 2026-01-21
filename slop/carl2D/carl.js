/* ============================================
   CARL THE URGENT SLUG URCHIN - MAIN GAME LOGIC
   Vertical Climbing Edition
   ============================================ */

"use strict";

// ========== GLOBAL GAME STATE ==========
let game = {
    state: 'waiting', // Start in waiting state until menu is closed
    started: false,
    altitude: 0,
    highestAltitude: 0,
    lives: GAME_CONFIG.STARTING_LIVES,
    cameraY: 0,
    seaLevel: 0,
    surfaceGoal: GAME_CONFIG.SURFACE_GOAL,
    startTime: 0,
    currentTime: 0,
    pauseStartTime: 0,
    bestTime: null,
    frameCount: 0,
    flyingUp: false,
    flyTimer: 0,
    lastSideEnemySpawnTime: 0,  // Track last spawn time to prevent bunching
    bossMode: false,  // Boss fight active
    bossSpawned: false,  // Has boss been created
    boss: null,  // Reference to boss enemy
    bossIntroActive: false,  // Boss intro cutscene active
    bossIntroTimer: 0,  // Timer for boss intro
    musicFading: false,  // Is main music fading out
    musicFadeAmount: 1.0  // Current volume for fade
};

let carl;
let enemies = [];
let platforms = [];
let powerups = [];
let particles = [];
let background = { layers: [], bubbles: [], clouds: [] };
let keys = {};
let spacePressed = false;
let sounds = { backgroundMusic: null, jump: null, boost: null, hit: null, death: null, powerup: null, win: null, loaded: false, play(s) { if (this[s] && this.loaded) { try { this[s].play(); } catch (e) {} } }, stop(s) { if (this[s] && this.loaded) { try { this[s].stop(); } catch (e) {} } }, loop(s) { if (this[s] && this.loaded) { try { this[s].loop(); } catch (e) {} } }, pause(s) { if (this[s] && this.loaded) { try { this[s].pause(); } catch (e) {} } } };
let lastPlatformY = 0;
let platformGap = 600;

// ========== CARL CHARACTER ==========
class Carl {
    constructor(x, y) {
        this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.size = CARL_CONFIG.SIZE;
        this.rotation = 0; this.animFrame = 0; this.animSpeed = CARL_CONFIG.ANIM_SPEED;
        this.acceleration = CARL_CONFIG.ACCELERATION; this.friction = CARL_CONFIG.FRICTION; this.waterResistance = CARL_CONFIG.WATER_RESISTANCE;
        this.maxSpeed = CARL_CONFIG.MAX_SPEED; this.jumpPower = CARL_CONFIG.JUMP_POWER; this.gravity = CARL_CONFIG.GRAVITY;
        this.speedBoost = 1.0; this.boostTimer = 0;
        this.hasShield = false;
        this.isGrounded = false; this.onPlatform = null;
        this.isInvincible = false; this.invincibleTimer = 0;
        this.tentacles = [];
        for (let i = 0; i < CARL_CONFIG.TENTACLE_COUNT; i++) {
            this.tentacles.push({ angle: (TWO_PI / CARL_CONFIG.TENTACLE_COUNT) * i, length: CARL_CONFIG.TENTACLE_LENGTH, wave: random(TWO_PI) });
        }
    }
    
    update() {
        if (game.state === 'playing') {
            let accel = this.acceleration * this.speedBoost;
            
            // Check if Carl is above water in boss mode
            let isAboveWater = game.bossMode && this.y < game.surfaceGoal;
            
            // Touch/mouse controls - move Carl towards touch position
            if (mouseIsPressed || touches.length > 0) {
                // Check if tapping the pause button - if so, don't move
                let pauseButton = document.getElementById('pause-button');
                let clickedElement = document.elementFromPoint(mouseX, mouseY);
                let isClickingPauseButton = clickedElement && (
                    clickedElement === pauseButton || 
                    pauseButton.contains(clickedElement)
                );
                
                if (!isClickingPauseButton) {
                    let targetX = mouseX;
                    let targetY = mouseY + game.cameraY; // Convert screen Y to world Y
                    
                    // If using touches, use first touch
                    if (touches.length > 0) {
                        targetX = touches[0].x;
                        targetY = touches[0].y + game.cameraY;
                    }
                    
                    // Calculate direction to target
                    let dx = targetX - this.x;
                    let dy = targetY - this.y;
                    
                    // Apply acceleration towards target
                    // Horizontal movement
                    if (Math.abs(dx) > 10 * SCALE) { // Dead zone
                        if (dx < 0) this.vx -= accel;
                        else this.vx += accel;
                    }
                    
                    // Vertical movement - disable upward acceleration if above water
                    if (Math.abs(dy) > 10 * SCALE) { // Dead zone
                        if (dy < 0 && !isAboveWater) this.vy -= accel; // Only allow upward acceleration underwater
                        else if (dy > 0) this.vy += accel; // Always allow downward acceleration
                    }
                }
            } else {
                // Keyboard controls
                if (CONTROLS.LEFT.some(k => keys[k])) this.vx -= accel;
                if (CONTROLS.RIGHT.some(k => keys[k])) this.vx += accel;
                if (CONTROLS.UP.some(k => keys[k]) && !isAboveWater) this.vy -= accel; // Disable upward acceleration above water
                if (CONTROLS.DOWN.some(k => keys[k])) this.vy += accel;
            }
        }
        
        // Check if Carl is above water in boss mode for physics adjustments
        let isAboveWater = game.bossMode && this.y < game.surfaceGoal;
        
        // Apply friction and water resistance only when underwater
        if (!isAboveWater) {
            this.vx *= this.friction * this.waterResistance;
            this.vy *= this.friction * this.waterResistance;
        } else {
            // Air physics when above water
            // Apply stronger deceleration on platforms, lighter in air
            if (this.onPlatform) {
                // On platform - strong friction to stop quickly
                this.vx *= 0.85;
            } else {
                // In air - lighter friction for momentum preservation
                this.vx *= 0.96;
            }
            // Almost no vertical air resistance
            this.vy *= 0.995;
        }
        
        this.vy += this.gravity;
        
        let maxSpd = this.maxSpeed * this.speedBoost;
        this.vx = constrain(this.vx, -maxSpd, maxSpd);
        this.vy = constrain(this.vy, -maxSpd * 1.5, maxSpd * 1.5);
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        
        let seabedY = game.seaLevel + 30 * scaleY;
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
        
        if (this.y <= game.surfaceGoal && !game.bossMode) {
            game.bossMode = true;
            this.vy = 0;
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
        
        // Speed boost visual effect
        if (this.boostTimer > 0) { 
            // Speed trail effect - emanates from the glow bubble
            for (let i = 1; i <= 4; i++) {
                push();
                let trailAlpha = map(i, 1, 4, 100, 20);
                let trailSize = map(i, 1, 4, 1.0, 0.6);
                fill(255, 255, 0, trailAlpha);
                noStroke();
                // Position trails behind the bubble based on velocity
                let trailX = -this.vx * i * 0.8;
                let trailY = -this.vy * i * 0.8;
                translate(trailX, trailY);
                circle(0, 0, this.size * 2 * trailSize);
                pop();
            }
            // Main glow effect
            fill(255, 255, 0, 100); noStroke(); circle(0, 0, this.size * 2);
        }
        
        // Draw shield visual if Carl has one
        if (this.hasShield) {
            push();
            noFill();
            stroke(100, 200, 255, 150);
            strokeWeight(3 * SCALE);
            let shieldPulse = sin(frameCount * 0.1) * 5 * SCALE;
            circle(0, 0, this.size * 1.8 + shieldPulse);
            // Add hexagonal pattern
            strokeWeight(2 * SCALE);
            for (let i = 0; i < 6; i++) {
                let angle = (TWO_PI / 6) * i;
                let x1 = cos(angle) * (this.size * 0.9 + shieldPulse);
                let y1 = sin(angle) * (this.size * 0.9 + shieldPulse);
                let x2 = cos(angle + TWO_PI / 6) * (this.size * 0.9 + shieldPulse);
                let y2 = sin(angle + TWO_PI / 6) * (this.size * 0.9 + shieldPulse);
                line(x1, y1, x2, x2);
            }
            pop();
        }
        
        for (let i = 0; i < this.tentacles.length; i++) {
            let t = this.tentacles[i];
            let waveOffset = sin(this.animFrame + t.wave) * 5 * SCALE;
            let tentacleLength = t.length + waveOffset;
            let endX = cos(t.angle) * tentacleLength;
            let endY = sin(t.angle) * tentacleLength;
            let grad = drawingContext.createLinearGradient(0, 0, endX, endY);
            grad.addColorStop(0, '#8b5dbf');
            grad.addColorStop(1, '#c98dd9');
            strokeWeight(6 * SCALE);
            drawingContext.strokeStyle = grad;
            line(0, 0, endX, endY);
            noStroke(); fill(100, 60, 130);
            for (let j = 0; j < 3; j++) {
                let t_pos = (j + 1) / 4;
                circle(endX * t_pos, endY * t_pos, 4 * SCALE);
            }
        }
        
        let bodyGrad = drawingContext.createRadialGradient(0, -5, 5, 0, 0, this.size * 0.6);
        bodyGrad.addColorStop(0, '#b19cd9');
        bodyGrad.addColorStop(0.5, '#8b5dbf');
        bodyGrad.addColorStop(1, '#6b4a9e');
        noStroke();
        drawingContext.fillStyle = bodyGrad;
        ellipse(0, 0, this.size * 1.2, this.size);
        
        stroke(100, 60, 130, 150); strokeWeight(3 * SCALE); noFill();
        for (let i = 0; i < 3; i++) { let offset = i * 8 * SCALE - 8 * SCALE; arc(offset, 0, 15 * SCALE, 15 * SCALE, 0, PI); }
        
        fill(90, 50, 120); noStroke();
        for (let i = 0; i < 12; i++) {
            let spikeAngle = (PI / 12) * i + PI * 0.3;
            let spikeX = cos(spikeAngle) * (this.size * 0.45);
            let spikeY = sin(spikeAngle) * (this.size * 0.35);
            let spikeSize = (8 + sin(this.animFrame + i) * 2) * SCALE;
            push(); translate(spikeX, spikeY); rotate(spikeAngle);
            triangle(-spikeSize/2, 0, spikeSize/2, 0, 0, -spikeSize * 1.5);
            pop();
        }
        
        fill(255); ellipse(-12 * SCALE, -8 * SCALE, 16 * SCALE, 20 * SCALE); ellipse(12 * SCALE, -8 * SCALE, 16 * SCALE, 20 * SCALE);
        let pupilX = constrain(this.vx * 2 * SCALE, -3 * SCALE, 3 * SCALE);
        let pupilY = constrain(this.vy * 0.5 * SCALE, -3 * SCALE, 3 * SCALE);
        fill(50, 180, 100); ellipse(-12 * SCALE + pupilX, -8 * SCALE + pupilY, 8 * SCALE, 10 * SCALE); ellipse(12 * SCALE + pupilX, -8 * SCALE + pupilY, 8 * SCALE, 10 * SCALE);
        fill(255, 255, 255, 200); ellipse(-14 * SCALE + pupilX, -10 * SCALE + pupilY, 3 * SCALE, 3 * SCALE); ellipse(10 * SCALE + pupilX, -10 * SCALE + pupilY, 3 * SCALE, 3 * SCALE);
        stroke(80, 40, 100); strokeWeight(2 * SCALE); noFill(); arc(0, 2 * SCALE, 20 * SCALE, 15 * SCALE, 0, PI);
        strokeWeight(1 * SCALE); line(-6 * SCALE, 2 * SCALE, -6 * SCALE, 6 * SCALE); line(-2 * SCALE, 2 * SCALE, -2 * SCALE, 6 * SCALE); line(2 * SCALE, 2 * SCALE, 2 * SCALE, 6 * SCALE); line(6 * SCALE, 2 * SCALE, 6 * SCALE, 6 * SCALE);
        pop();
    }
    
    hit() {
        if (!this.isInvincible) {
            // Check if Carl has a shield
            if (this.hasShield) {
                // Shield absorbs the hit
                this.hasShield = false;
                this.isInvincible = true;
                this.invincibleTimer = CARL_CONFIG.INVINCIBLE_DURATION;
                sounds.play('powerup');
                // Shield breaking particles
                for (let i = 0; i < 30; i++) particles.push(new Particle(this.x, this.y, 'shield'));
            } else {
                // No shield, take damage
                game.lives--;
                this.isInvincible = true;
                this.invincibleTimer = CARL_CONFIG.INVINCIBLE_DURATION;
                sounds.play('hit');
                for (let i = 0; i < 15; i++) particles.push(new Particle(this.x, this.y, 'hit'));
                if (game.lives <= 0) gameOver();
            }
        }
    }
    
    reset() {
        this.x = width / 2; this.y = game.seaLevel; this.vx = 0; this.vy = 0;
        this.rotation = 0; this.isInvincible = false; this.invincibleTimer = 0;
        this.speedBoost = 1.0; this.boostTimer = 0; this.hasShield = false;
    }
}

// ========== GAME LOOP ==========
function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    calculateScale(); // Calculate scaling based on window size
    loadSounds();
    initGame();
}

function draw() {
    // Only update time if actually playing (not waiting or paused)
    if (game.state === 'playing') {
        game.currentTime = (Date.now() - game.startTime) / 1000;
    }
    
    drawBackground();
    for (let layer of background.layers) { layer.update(); layer.draw(); }
    drawGreyRock();
    drawSeabedGrass();
    drawSeabed();
    for (let bubble of background.bubbles) { bubble.update(); bubble.draw(); }
    // Update and draw clouds above water
    for (let cloud of background.clouds) { cloud.update(); cloud.draw(); }
    
    if (game.state === 'playing') {
        // Handle music fading when approaching surface
        if (!game.bossMode && !game.musicFading) {
            let distToSurface = carl.y - game.surfaceGoal;
            if (distToSurface < 1000 * scaleY && distToSurface > 0) {
                game.musicFading = true;
            }
        }
        
        // Fade out main music as Carl approaches surface
        if (game.musicFading && !game.bossMode) {
            let distToSurface = carl.y - game.surfaceGoal;
            if (distToSurface > 0) {
                game.musicFadeAmount = map(distToSurface, 0, 1000 * scaleY, 0, 1);
                game.musicFadeAmount = constrain(game.musicFadeAmount, 0, 1);
                if (window.gameMusic && window.gameMusicLoaded) {
                    window.gameMusic.setVolume(0.5 * game.musicFadeAmount);
                }
            }
        }
        
        // Boss intro sequence
        if (game.bossMode && !game.bossIntroActive && !game.bossSpawned) {
            game.bossIntroActive = true;
            game.bossIntroTimer = 0;
            // Stop main music completely
            if (window.gameMusic && window.gameMusicLoaded) {
                window.gameMusic.stop();
            }
            // Freeze Carl
            carl.vx = 0;
            carl.vy = 0;
        }
        
        // Boss mode initialization
        if (game.bossMode && !game.bossSpawned) {
            // During intro, animate the sun coming down
            if (game.bossIntroActive) {
                game.bossIntroTimer++;
                
                // Clear all enemies below the surface (only once at start)
                if (game.bossIntroTimer === 1) {
                    for (let i = enemies.length - 1; i >= 0; i--) {
                        if (enemies[i].y > game.surfaceGoal) {
                            enemies.splice(i, 1);
                        }
                    }
                    
                    // Clear all platforms below the surface
                    for (let i = platforms.length - 1; i >= 0; i--) {
                        if (platforms[i].y > game.surfaceGoal) {
                            platforms.splice(i, 1);
                        }
                    }
                    
                    // Create manual boss platforms above water
                    createBossPlatforms();
                    
                    // Create the sun boss off-screen above
                    let bossX = width / 2;
                    let bossY = game.surfaceGoal - height; // Start way above
                    game.boss = new SunBoss(bossX, bossY);
                    game.boss.introMode = true; // Special flag for intro
                    game.boss.targetY = game.surfaceGoal - 400 * scaleY; // Target position
                    enemies.push(game.boss);
                    
                    // Reset last platform Y for boss platforms
                    lastPlatformY = game.surfaceGoal;
                }
                
                // Animate sun descending
                if (game.boss && game.boss.introMode) {
                    let descendSpeed = 3 * scaleY;
                    game.boss.y += descendSpeed;
                    game.boss.baseY = game.boss.y;
                    
                    // Check if sun reached target position
                    if (game.boss.y >= game.boss.targetY) {
                        game.boss.y = game.boss.targetY;
                        game.boss.baseY = game.boss.targetY;
                        game.boss.introMode = false;
                        game.bossSpawned = true;
                        game.bossIntroActive = false;
                        
                        // Start boss music
                        if (window.bossMusic && window.bossMusicLoaded) {
                            window.bossMusic.setVolume(0.5);
                            window.bossMusic.loop();
                        }
                        
                        // Give player a moment before attacks start
                        game.boss.attackCooldown = 60; // 1 second delay
                    }
                }
                
                // Keep Carl frozen during intro
                carl.vx = 0;
                carl.vy = 0;
            }
        }
        
        // Prevent Carl from going too far below the surface in boss mode
        if (game.bossMode) {
            let maxDepth = game.surfaceGoal + 500 * scaleY; // Increased from 300 to 500
            if (carl.y > maxDepth) {
                carl.y = maxDepth;
                carl.vy = min(carl.vy, 0); // Can't go down further
            }
            
            // Add buoyancy force when Carl goes deeper than a threshold below the surface
            let buoyancyThreshold = game.surfaceGoal + 350 * scaleY; // Increased from 150 to 350 - allow deeper diving
            if (carl.y > buoyancyThreshold) {
                // Calculate how far below the threshold Carl is
                let depthBelowThreshold = carl.y - buoyancyThreshold;
                // Apply upward buoyancy force that gets stronger the deeper Carl goes past the threshold
                let buoyancyForce = depthBelowThreshold * 0.03;
                carl.vy -= buoyancyForce;
                
                // Add visual feedback - bubbles rising from Carl when in buoyancy zone
                if (frameCount % 5 === 0) {
                    particles.push(new Particle(carl.x + random(-20, 20) * SCALE, carl.y, 'boost'));
                }
            }
            
            // Apply proper gravity and physics above water
            if (carl.y < game.surfaceGoal) {
                // Carl is above water - apply very weak gravity for higher jumps
                let airGravity = 0.2 * scaleY; // Reduced from 0.4 to 0.2 for even higher jumps
                carl.vy += airGravity;
                
                // Higher velocity cap for bigger jumps
                if (carl.vy < -20 * scaleY) {
                    carl.vy = -20 * scaleY; // Cap at -20
                }
            }
        }
        
        carl.update();
        
        // Freeze Carl completely during boss intro
        if (game.bossIntroActive) {
            carl.vx = 0;
            carl.vy = 0;
        }
        
        // Generate platforms differently in boss mode
        if (game.bossMode) {
            generateBossPlatforms();
        } else {
            generatePlatforms();
        }
        
        // Don't spawn regular enemies in boss mode
        if (!game.bossMode) {
            spawnFloatingEnemies();
            spawnSideEnemies();
            spawnSideEnemies();
        }
        
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

// ========== GAME STATE FUNCTIONS ==========
function initGame() {
    game.state = 'waiting'; game.altitude = 0; game.highestAltitude = 0;
    // Position sea floor near bottom (90% down) so most of screen shows playable area
    game.lives = GAME_CONFIG.STARTING_LIVES; game.cameraY = 0; game.seaLevel = height * 0.9;
    game.surfaceGoal = game.seaLevel + GAME_CONFIG.SURFACE_GOAL; game.frameCount = 0;
    game.flyingUp = false; game.flyTimer = 0;
    game.startTime = Date.now();
    game.currentTime = 0;
    
    // Reset all boss-related state
    game.bossMode = false;
    game.bossSpawned = false;
    game.boss = null;
    game.bossIntroActive = false;
    game.bossIntroTimer = 0;
    game.musicFading = false;
    game.musicFadeAmount = 1.0;
    
    let saved = localStorage.getItem('carlBestTime');
    if (saved) game.bestTime = parseFloat(saved);
    
    carl = new Carl(width / 2, game.seaLevel);
    enemies = []; platforms = []; powerups = []; particles = []; lastPlatformY = game.seaLevel;
    for (let i = 0; i < 10; i++) generatePlatforms();
    background.layers = [
        new BackgroundLayer(0.2, color(60, 40, 80), color(40, 60, 80)),
        new BackgroundLayer(0.5, color(100, 50, 120), color(60, 80, 100)),
        new BackgroundLayer(0.8, color(150, 70, 160), color(80, 100, 120))
    ];
    background.bubbles = [];
    // Spawn bubbles across the full screen height around the starting position
    for (let i = 0; i < 50; i++) background.bubbles.push(new Bubble(random(width), random(game.cameraY, game.cameraY + height)));
    background.clouds = [];
    // Spawn clouds above the water surface
    for (let i = 0; i < 15; i++) background.clouds.push(new Cloud());
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('gameover-menu').classList.add('hidden');
    // Don't start background music here - will be started when game actually begins
}

// Function called from menu to start gameplay
window.startGamePlay = function() {
    game.state = 'playing';
    game.startTime = Date.now();
    loop();
};

function updateHUD() {
    // Format time as MM:SS.mmm
    let minutes = Math.floor(game.currentTime / 60);
    let seconds = Math.floor(game.currentTime % 60);
    let milliseconds = Math.floor((game.currentTime % 1) * 1000);
    let timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    
    document.getElementById('distance').textContent = timeString;
    document.getElementById('speed').textContent = carl.speedBoost.toFixed(1) + 'x';
    document.getElementById('lives').textContent = game.lives;
    
    // Display best time
    if (game.bestTime !== null) {
        let bestMinutes = Math.floor(game.bestTime / 60);
        let bestSeconds = Math.floor(game.bestTime % 60);
        let bestMilliseconds = Math.floor((game.bestTime % 1) * 1000);
        let bestTimeString = `${bestMinutes}:${bestSeconds.toString().padStart(2, '0')}.${bestMilliseconds.toString().padStart(3, '0')}`;
        document.getElementById('highscore').textContent = bestTimeString;
    } else {
        document.getElementById('highscore').textContent = '--:--:---';
    }
}

function pauseGame() {
    if (game.state === 'playing') {
        game.state = 'paused';
        game.pauseStartTime = Date.now();
        document.getElementById('pause-menu').classList.remove('hidden');
        // Pause whichever music is currently playing
        if (game.bossMode && window.bossMusic && window.bossMusicLoaded) {
            window.bossMusic.pause();
        } else if (window.gameMusic && window.gameMusicLoaded) {
            window.gameMusic.pause();
        }
        noLoop();
    }
}

function resumeGame() {
    if (game.state === 'paused') {
        // Calculate how long we were paused and adjust startTime to exclude that duration
        let pauseDuration = Date.now() - game.pauseStartTime;
        game.startTime += pauseDuration;
        
        game.state = 'playing';
        document.getElementById('pause-menu').classList.add('hidden');
        // Resume whichever music should be playing
        if (game.bossMode && window.bossMusic && window.bossMusicLoaded) {
            window.bossMusic.play();
        } else if (window.gameMusic && window.gameMusicLoaded) {
            window.gameMusic.play();
        }
        loop();
    }
}

function gameOver() {
    game.state = 'gameover';
    // Stop whichever music is playing
    if (game.bossMode && window.bossMusic && window.bossMusicLoaded) {
        window.bossMusic.stop();
    } else if (window.gameMusic && window.gameMusicLoaded) {
        window.gameMusic.stop();
    }
    sounds.play('death');
    
    let minutes = Math.floor(game.currentTime / 60);
    let seconds = Math.floor(game.currentTime % 60);
    let milliseconds = Math.floor((game.currentTime % 1) * 1000);
    let timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    
    document.querySelector('#gameover-menu h2').textContent = 'GAME OVER';
    document.getElementById('final-distance').textContent = `Time: ${timeString}`;
    document.getElementById('gameover-message').textContent = 'Carl got caught!';
    let tryAgainBtn = document.getElementById('try-again-btn');
    tryAgainBtn.style.background = 'linear-gradient(135deg, #ff6b9d 0%, #c9184a 100%)';
    document.getElementById('gameover-menu').classList.remove('hidden');
    noLoop();
}

function winGame() {
    game.state = 'won';
    // Stop boss music when winning
    if (window.bossMusic && window.bossMusicLoaded) {
        window.bossMusic.stop();
    }
    sounds.play('win');
    
    // Check if this is a new best time
    if (game.bestTime === null || game.currentTime < game.bestTime) {
        game.bestTime = game.currentTime;
        localStorage.setItem('carlBestTime', game.bestTime.toString());
    }
    
    let minutes = Math.floor(game.currentTime / 60);
    let seconds = Math.floor(game.currentTime % 60);
    let milliseconds = Math.floor((game.currentTime % 1) * 1000);
    let timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    
    let isNewRecord = (game.bestTime === game.currentTime);
    
    document.querySelector('#gameover-menu h2').textContent = 'YOU WON!';
    document.getElementById('final-distance').textContent = `Time: ${timeString}${isNewRecord ? ' 🏆 NEW RECORD!' : ''}`;
    document.getElementById('gameover-message').textContent = `Carl escaped! (and suffocated...)`;
    let tryAgainBtn = document.getElementById('try-again-btn');
    tryAgainBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';
    document.getElementById('gameover-menu').classList.remove('hidden');
    noLoop();
}

function restartGame() {
    document.getElementById('gameover-menu').classList.add('hidden');
    // Stop any music that might be playing
    if (window.bossMusic && window.bossMusicLoaded) {
        window.bossMusic.stop();
    }
    if (window.gameMusic && window.gameMusicLoaded) {
        window.gameMusic.stop();
    }
    initGame();
    game.state = 'playing';
    game.startTime = Date.now();
    // Start regular music from the beginning
    if (window.gameMusic && window.gameMusicLoaded) {
        window.gameMusic.setVolume(0.5);
        window.gameMusic.loop();
    }
    loop();
}

function returnToTitle() {
    // Show the main menu overlay again
    const menuOverlay = document.getElementById('main-menu-overlay');
    if (menuOverlay) {
        menuOverlay.classList.remove('hidden');
        
        // Stop all music when returning to main menu
        if (window.gameMusic && window.gameMusicLoaded) {
            window.gameMusic.stop();
        }
        if (window.bossMusic && window.bossMusicLoaded) {
            window.bossMusic.stop();
        }
        
        // Reset game state
        game.state = 'waiting';
        initGame();
        noLoop();
    }
}

// ========== INPUT HANDLERS ==========
function keyPressed() {
    keys[key] = true;
    
    // Boss skip cheat code - press 'y' to skip to boss fight
    if ((key === 'y' || key === 'Y') && game.state === 'playing' && !game.bossMode) {
        // Teleport Carl to just above the surface (remember: surfaceGoal is negative, lower Y = higher up)
        carl.y = game.surfaceGoal - 100 * scaleY;
        carl.vy = 0;
        carl.vx = 0;
        // Trigger boss mode immediately
        game.bossMode = true;
        console.log('Skipping to boss fight! Carl Y:', carl.y, 'Surface Y:', game.surfaceGoal);
        return false;
    }
    
    if (key === CONTROLS.PAUSE || key === 'Escape' || key === 'p' || key === 'P') {
        // Only allow pausing if actually playing (not waiting)
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
    calculateScale(); // Recalculate scaling on window resize
}

// ========== SOUND LOADING ==========
function loadSounds() {
    soundFormats('mp3', 'ogg', 'wav');
    
    // Load game music (carlMainTheme.mp3) - don't auto-play
    window.gameMusic = loadSound('sounds/carlMainTheme.mp3', 
        () => { 
            console.log('Game music (carlMainTheme) loaded successfully');
            window.gameMusicLoaded = true;
        },
        (err) => { 
            console.log('Failed to load game music:', err);
            window.gameMusicLoaded = false;
        }
    );
    
    // Load boss battle music
    window.bossMusic = loadSound('sounds/carlSunBattle.mp3',
        () => {
            console.log('Boss battle music loaded successfully');
            window.bossMusicLoaded = true;
        },
        (err) => {
            console.log('Failed to load boss music:', err);
            window.bossMusicLoaded = false;
        }
    );
    
    sounds.backgroundMusic = window.gameMusic;
    sounds.loaded = true;
    console.log('Sound system initialized. Music files ready.');
}
