/* ============================================
   GAME LOOP AND STATE MANAGEMENT
   ============================================ */

"use strict";

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
            // Lock Carl at the WATER SURFACE (not seabed) during intro
            carl.y = game.surfaceGoal;
            carl.vx = 0;
            carl.vy = 0;
            // Don't set camera here - let it smoothly lerp during the intro
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
                
                // Keep Carl locked at the water surface during intro
                carl.y = game.surfaceGoal;
                carl.vx = 0;
                carl.vy = 0;
            }
        }
        
        // Update camera to follow Carl smoothly, even during boss intro
        game.cameraY = lerp(game.cameraY, carl.y - height / 2, 0.1);
        
        // Prevent Carl from going too far below the surface in boss mode
        if (game.bossMode) {
            let maxDepth = game.surfaceGoal + 500 * scaleY; // Increased from 300 to 500
            if (carl.y > maxDepth) {
                carl.y = maxDepth;
                carl.vy = min(carl.vy, 0); // Can't go down further
            }
            
            // Water healing system - heal 1 life every 5 seconds when underwater (reduced from 10)
            if (carl.y > game.surfaceGoal) {
                // Carl is underwater
                waterHealTimer++;
                // 5 seconds at 60fps = 300 frames (reduced from 600)
                if (waterHealTimer >= 300 && game.lives < GAME_CONFIG.STARTING_LIVES) {
                    game.lives++;
                    waterHealTimer = 0;
                    sounds.play('powerup');
                    // Healing particles
                    for (let i = 0; i < 20; i++) {
                        particles.push(new Particle(carl.x, carl.y, 'powerup'));
                    }
                }
            } else {
                // Reset timer when above water (re-entering water will start timer from 0)
                waterHealTimer = 0;
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
        
        // Generate platforms differently in boss mode
        if (game.bossMode) {
            generateBossPlatforms();
        } else {
            generatePlatforms();
        }
        
        // Spawn side enemies in boss mode when Carl is underwater
        if (game.bossMode) {
            spawnSideEnemies(); // Allow sharks and bombs when underwater
        } else {
            // Regular mode - spawn all enemy types
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
                // Don't remove the boss when hit - it has its own health system
                if (enemies[i].type !== 'sunboss') {
                    enemies.splice(i, 1);
                }
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
        // Move camera to Carl's position immediately
        game.cameraY = carl.y - height / 2;
        // Trigger boss mode immediately
        game.bossMode = true;
        console.log('Skipping to boss fight! Carl Y:', carl.y, 'Surface Y:', game.surfaceGoal, 'Camera Y:', game.cameraY);
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
