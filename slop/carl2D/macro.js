/* ============================================
   MACRO.JS - GLOBAL CONSTANTS & CONFIG
   All editable game parameters in one place
   ============================================ */

"use strict";

// ========== SCREEN SCALING ==========
// Reference screen size (1920x1080 minus browser chrome ~100px)
const REFERENCE_WIDTH = 1920;
const REFERENCE_HEIGHT = 980;

// Global scale multipliers - calculated based on current screen size
let scaleX = 1.0;
let scaleY = 1.0;
let SCALE = 1.0; // Average scale for objects that need uniform scaling

// Function to calculate scale based on current window size
// Uses: baseObjectSize / standardScreenSize * currentScreenSize
function calculateScale() {
    scaleX = window.innerWidth / REFERENCE_WIDTH;
    scaleY = window.innerHeight / REFERENCE_HEIGHT;
    // SCALE is used for objects that need uniform scaling (like Carl, enemies)
    // Use the smaller dimension to ensure visibility on all screens
    SCALE = Math.min(scaleX, scaleY);
    
    // Scale UI elements (HUD text, menus) based on screen size
    // Use a base font size of 16px and scale it
    let baseFontSize = 16;
    let scaledFontSize = baseFontSize * SCALE;
    // Clamp font size to readable range (min 12px, max 24px)
    scaledFontSize = Math.max(12, Math.min(24, scaledFontSize));
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
    MAX_TOTAL_ENEMIES: 20,        // Hard cap on total enemies
    get ENEMY_SAFE_RADIUS() { return 500 * SCALE; },       // Min distance from Carl for spawning enemies
    get PLATFORM_START_SAFE_ZONE() { return 800 * SCALE; }, // No platforms spawn within this distance of start
    get PLATFORM_CRAB_SAFE_RADIUS() { return 250 * SCALE; }, // Safe radius for crab spawning near start
    
    // Spawn chances - floating enemies
    SPAWN_CHANCE_FLOATING_MIN: 0.80,  // Spawn chance at 0 enemies
    SPAWN_CHANCE_FLOATING_MAX: 0.995, // Spawn chance at max enemies
    
    // Spawn chances - side enemies  
    SPAWN_CHANCE_SIDE_MIN: 0.75,      // Spawn chance at 0 enemies
    SPAWN_CHANCE_SIDE_MAX: 0.99,      // Spawn chance at max enemies
    
    // Platform generation
    get PLATFORM_GAP_MIN() { return 300 * scaleY; },        // Min vertical gap between platform clusters
    get PLATFORM_GAP_MAX() { return 600 * scaleY; },        // Max vertical gap between platform clusters
    get PLATFORM_WIDTH_MIN() { return 200 * scaleX; },      // Min platform width
    get PLATFORM_WIDTH_MAX() { return 500 * scaleX; },      // Max platform width (reduced from 600 to prevent blocking)
    get PLATFORM_MIN_WIDTH_FOR_SPAWNS() { return 150 * scaleX; }, // Platforms must be this wide for crabs/powerups
    
    // Enemy off-screen removal
    ENEMY_REMOVAL_DISTANCE: 2.5,  // Remove enemies this many screen heights away
    
    // Platform/powerup spawn chances
    CRAB_CHANCE_2: 0.05,          // 5% chance for 2 crabs
    CRAB_CHANCE_1: 0.25,          // 25% cumulative for 1+ crabs (20% for exactly 1)
    POWERUP_SHIELD_CHANCE: 0.05,  // 5% chance for shield powerup
    POWERUP_SPEED_CHANCE: 0.15    // 15% cumulative for any powerup (10% for speed)
};

// ========== ENEMY LIMITS ==========
const ENEMY_LIMITS = {
    'fishhook': 3,
    'mine': 4,
    'bomb': 3,
    'jellyfish': 5,
    'shark': 3,
    'urchin': 3
};

// ========== CARL PHYSICS ==========
const CARL_CONFIG = {
    get SIZE() { return 50 * SCALE; },
    get ACCELERATION() { return 2.5 * SCALE; },
    FRICTION: 0.92,
    WATER_RESISTANCE: 0.97,
    get MAX_SPEED() { return 28 * scaleX; },
    get JUMP_POWER() { return -18 * scaleY; },
    get GRAVITY() { return 0.3 * scaleY; },
    
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
    get CRAB_SPEED() { return 1.5 * scaleX; },
    get SHARK_SPEED() { return 4 * scaleX; },
    get SHARK_ACCELERATION() { return 0.3 * scaleX; },
    get BOMB_SPEED() { return 3 * scaleX; }
};
