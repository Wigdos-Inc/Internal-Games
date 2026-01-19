/* ============================================
   MACRO.JS - GLOBAL CONSTANTS & CONFIG
   All editable game parameters in one place
   ============================================ */

"use strict";

// ========== SCREEN SCALING ==========
// Reference screen size (1920x1080 minus browser chrome ~100px)
const REFERENCE_WIDTH = 1920;
const REFERENCE_HEIGHT = 980;
const REFERENCE_AREA = REFERENCE_WIDTH * REFERENCE_HEIGHT; // Total reference surface area

// Global scale multipliers - calculated based on current screen size
let scaleX = 1.0;
let scaleY = 1.0;
let SCALE = 1.0; // Area-based scale for aspect-ratio-locked objects (Carl, enemies)

// Function to calculate scale based on current window size
// Uses: baseObjectSize / standardScreenSize * currentScreenSize
function calculateScale() {
    scaleX = window.innerWidth / REFERENCE_WIDTH;
    scaleY = window.innerHeight / REFERENCE_HEIGHT;
    
    // SCALE uses total surface area for objects with locked aspect ratios
    // Formula: sqrt(baseSize / (1920 * 980) * (currentWidth * currentHeight))
    // Use sqrt to moderate scaling - prevents things from becoming too small on small screens
    let currentArea = window.innerWidth * window.innerHeight;
    SCALE = Math.sqrt(currentArea / REFERENCE_AREA);
    
    // Scale UI elements (HUD text, menus) based on screen size
    // Use a base font size of 16px and scale it
    let baseFontSize = 16;
    let scaledFontSize = baseFontSize * Math.sqrt(SCALE); // Use sqrt for more reasonable font scaling
    // Clamp font size to readable range (min 14px, max 28px)
    scaledFontSize = Math.max(14, Math.min(28, scaledFontSize));
    document.documentElement.style.fontSize = scaledFontSize + 'px';
}

// ========== GAME CONSTANTS ==========
const GAME_CONFIG = {
    // Win condition
    SURFACE_GOAL: -20000,        // Distance to climb to win
    STARTING_LIVES: 3,            // Number of lives at start
    
    // Grace period
    GRACE_PERIOD_SECONDS: 3,      // Reduced spawn rate for first N seconds
    GRACE_PERIOD_SPAWN_CHANCE: 0.5, // 50% chance to skip spawn during grace period
    
    // Enemy spawning (these will be scaled)
    MAX_TOTAL_ENEMIES: 20,        // Hard cap on total enemies (increased for more challenge)
    get ENEMY_SAFE_RADIUS() { return 400 * SCALE; },       // Min distance from Carl for spawning enemies
    get PLATFORM_START_SAFE_ZONE() { return 1000 * SCALE; }, // No platforms spawn within this distance of start (increased from 1200)
    get PLATFORM_CRAB_SAFE_RADIUS() { return 2000 * SCALE; }, // Safe radius for crab spawning near start
    
    // Spawn chances - floating enemies
    SPAWN_CHANCE_FLOATING_MIN: 0.20,  // Spawn chance at 0 enemies (lowered for much more frequent spawns)
    SPAWN_CHANCE_FLOATING_MAX: 0.50, // Spawn chance at max enemies (lowered for much more frequent spawns)
    
    // Spawn chances - side enemies  
    SPAWN_CHANCE_SIDE_MIN: 0.20,      // Spawn chance at 0 enemies (lowered for much more frequent spawns)
    SPAWN_CHANCE_SIDE_MAX: 0.50,      // Spawn chance at max enemies (lowered for much more frequent spawns)
    
    // Platform generation
    get PLATFORM_GAP_MIN() { return 300 * scaleY; },        // Min vertical gap between platform clusters
    get PLATFORM_GAP_MAX() { return 600 * scaleY; },        // Max vertical gap between platform clusters
    get PLATFORM_WIDTH_MIN() { return 200 * scaleX; },      // Min platform width
    get PLATFORM_WIDTH_MAX() { return 500 * scaleX; },      // Max platform width (reduced from 600 to prevent blocking)
    get PLATFORM_MIN_WIDTH_FOR_SPAWNS() { return 150 * scaleX; }, // Platforms must be this wide for crabs/powerups
    
    // Enemy off-screen removal
    ENEMY_REMOVAL_DISTANCE: 2,  // Remove enemies this many screen heights away (increased for ahead-spawning)
    
    // Platform/powerup spawn chances
    CRAB_CHANCE_2: 0.05,          // 5% chance for 2 crabs
    CRAB_CHANCE_1: 0.25,          // 25% cumulative for 1+ crabs (20% for exactly 1)
    POWERUP_SHIELD_CHANCE: 0.05,  // 5% chance for shield powerup
    POWERUP_SPEED_CHANCE: 0.15    // 15% cumulative for any powerup (10% for speed)
};

// ========== ENEMY LIMITS ==========
const ENEMY_LIMITS = {
    'fishhook': 5,
    'mine': 5,
    'bomb': 5,
    'jellyfish': 3,
    'sidejellyfish': 8,  // Separate limit for side-spawning jellyfish
    'shark': 5,
    'urchin': 5
};

// ========== CARL PHYSICS ==========
const CARL_CONFIG = {
    get SIZE() { return 50 * SCALE; },
    // Use average of SCALE and scaleX to improve responsiveness on thin screens
    get ACCELERATION() { return 2.5 * ((SCALE + scaleX) / 2); },
    FRICTION: 0.92,
    WATER_RESISTANCE: 0.97,
    get MAX_SPEED() { return 28 * scaleX; },
    get JUMP_POWER() { return -18 * scaleY; },
    // Reduce gravity on smaller screens to make vertical movement easier
    get GRAVITY() { return 0.3 * scaleY * Math.min(scaleY, 1.0); },
    
    // Powerups
    SPEED_BOOST_DURATION: 300,    // Frames
    
    // Invincibility
    INVINCIBLE_DURATION: 96,      // Frames after getting hit
    
    // Visuals
    TENTACLE_COUNT: 8,
    get TENTACLE_LENGTH() { return 25 * SCALE; },
    ANIM_SPEED: 0.15
};

// ========== CONTROLS ==========
const CONTROLS = {
    LEFT: ['ArrowLeft', 'a', 'A'],
    RIGHT: ['ArrowRight', 'd', 'D'],
    UP: ['ArrowUp', 'w', 'W'],
    DOWN: ['ArrowDown', 's', 'S'],
    PAUSE: 'Escape'
};

// ========== ENEMY SPEEDS ==========
const ENEMY_CONFIG = {
    get CRAB_SPEED() { return 3.0 * scaleX; },
    get SHARK_SPEED() { return 8 * scaleX; },
    get SHARK_ACCELERATION() { return 0.6 * scaleX; },
    get BOMB_SPEED() { return 6 * scaleX; }
};
