# 🐙 Carl the Urgent Slug Urchin

A fast-paced underwater platformer inspired by Sonic the Hedgehog, featuring Carl - a purple slug-urchin hybrid racing through the ocean depths!

## 🎮 Game Overview

Guide Carl through an endless underwater environment, dodging enemies and obstacles while building up speed. The game progressively gets faster as you travel further, challenging your reflexes and reaction time.

### Features
- ✨ **Fully Animated Carl Character**: Procedurally drawn with breathing tentacles, rotating spikes, and momentum-based animations
- 🌊 **Dynamic Underwater Environment**: Multi-layer parallax scrolling with coral, rocks, and floating bubbles
- 👾 **4 Enemy Types**: Jellyfish, Sharks, Sea Mines, and Spiky Urchins
- 🎯 **Pattern-Based Spawning**: 8 carefully designed enemy patterns with randomized timing
- ⚡ **Physics-Based Movement**: Acceleration, momentum, water resistance, and smooth controls
- 💾 **High Score System**: LocalStorage-based score tracking
- 🎵 **Sound System Ready**: Infrastructure for background music and sound effects

## 🕹️ Controls

### Keyboard
- **Arrow Keys** or **WASD**: Move Carl in all directions
- **Space** or **Up Arrow**: Jump/Boost upward
- **Escape** or **P**: Pause game
- **ESC** (in pause): Resume game

### Movement
- Carl uses **momentum-based physics** - hold keys to build up speed
- Release keys to slow down naturally (water resistance)
- Jump provides an upward boost with limited air control
- Movement is smooth and responsive like classic Sonic games

## 📁 File Structure

```
Internal-Games/slop/carl/
├── index.html          # Title screen with animated underwater background
├── game.html           # Main game container with HUD
├── carl.css            # Underwater-themed styling
├── carl.js             # Complete game logic (1000+ lines)
├── carl.png            # Carl character image (PLACE THIS FILE HERE)
├── sounds/             # Sound effects directory
│   ├── background.mp3  # Background music (looping)
│   ├── jump.mp3        # Jump sound effect
│   ├── boost.mp3       # Boost sound effect
│   ├── hit.mp3         # Collision sound
│   ├── death.mp3       # Game over sound
│   ├── spawn.mp3       # Enemy spawn sound
│   └── README.md       # Sound file documentation
├── IMAGE_README.md     # Instructions for Carl image
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- The game uses **p5.js** library (already linked via CDN in HTML)

### Installation
1. Save the Carl character image as `carl.png` in the `carl/` directory
2. (Optional) Add sound files to the `sounds/` directory
3. Open `index.html` in a web browser
4. Click "Start Adventure" to begin!

### Running the Game
- **Title Screen**: `index.html`
- **Game**: `game.html` (launched from title screen)

## 🎨 Game Mechanics

### Carl's Abilities
- **Multi-directional Movement**: Full 360° control underwater
- **Momentum System**: Build speed over time, coast through obstacles
- **Jump/Boost**: Launch upward to avoid enemies
- **Invincibility Frames**: Brief invulnerability after taking damage

### Enemy Types

#### 1. 🪼 Jellyfish (Pink)
- **Behavior**: Bobs up and down slowly
- **Difficulty**: Easy to avoid
- **Lane**: Any

#### 2. 🦈 Shark (Gray)
- **Behavior**: Fast horizontal movement
- **Difficulty**: Medium - requires quick reactions
- **Lane**: Usually middle

#### 3. 💣 Sea Mine (Dark Gray)
- **Behavior**: Stationary with rotating spikes
- **Difficulty**: Easy if spotted early
- **Lane**: Any
- **Warning**: Red pulsing light

#### 4. 🦔 Spiky Urchin (Purple)
- **Behavior**: Stationary obstacle
- **Difficulty**: Medium - animated spikes make hitbox unclear
- **Lane**: Any

### Spawn Patterns

The game uses **8 pre-designed patterns** with randomized timing:
1. Single low enemy (easy warm-up)
2. High-low pair (requires lane switching)
3. Fast shark chase (urgency test)
4. Triple vertical stack (precise dodging)
5. Mine field (timing and patience)
6. Jellyfish wave (rhythm-based)
7. High shark with low mines (multi-threat)
8. Urchin corridor (narrow passage)

**Every level is beatable** with proper timing and positioning!

### Difficulty Progression
- **Speed**: Gradually increases from 2.0 to 12.0 based on distance
- **Spawn Rate**: More frequent patterns as distance increases
- **Lives**: 3 lives total, no continues

## 🎵 Adding Sounds

### Quick Setup
1. Place audio files (`.mp3` or `.ogg`) in `sounds/` directory
2. Open `carl.js`
3. Find the `loadSounds()` function (bottom of file)
4. Uncomment the sound loading lines

Example:
```javascript
// Change this:
// sounds.backgroundMusic = loadSound('sounds/background.mp3');

// To this:
sounds.backgroundMusic = loadSound('sounds/background.mp3');
```

### Required Sound Files
See `sounds/README.md` for detailed specifications.

## 🎯 Scoring System

- **Distance**: Primary score metric (measured in meters)
- **Speed**: Current velocity (displayed in HUD)
- **Lives**: Starts at 3, lose 1 per enemy collision
- **High Score**: Automatically saved to browser localStorage

## 🐛 Troubleshooting

### Carl Image Not Showing
- Ensure `carl.png` exists in the `carl/` directory
- Check filename matches exactly (case-sensitive)
- Verify image format is PNG or JPG

### Game Won't Start
- Check browser console for errors (F12)
- Ensure p5.js library is loading (requires internet connection)
- Try refreshing the page (Ctrl+F5)

### Sounds Not Playing
- Verify sound files exist in `sounds/` directory
- Check that sound loading lines are uncommented in `carl.js`
- Browser may block autoplay - click the page first
- Check browser console for audio errors

### Performance Issues
- Close other browser tabs
- Reduce browser zoom to 100%
- Update graphics drivers
- Try a different browser

## 🎮 Gameplay Tips

1. **Master Momentum**: Don't overcorrect - use water resistance to your advantage
2. **Look Ahead**: Enemies spawn off-screen - watch for patterns
3. **Stay Centered**: Middle of the screen gives you more reaction time
4. **Use Vertical Space**: Don't just dodge left/right - move up and down!
5. **Learn Patterns**: Each spawn pattern has an optimal strategy
6. **Manage Lives**: Invincibility frames let you safely pass through enemies temporarily
7. **Speed Control**: Sometimes slowing down helps avoid mistakes

## 🏆 Challenge Goals

- 🥉 **Bronze**: Survive to 500m
- 🥈 **Silver**: Survive to 1000m  
- 🥇 **Gold**: Survive to 2000m
- 💎 **Diamond**: Survive to 5000m

## 🛠️ Technical Details

### Built With
- **p5.js**: Graphics and animation library
- **Vanilla JavaScript**: Game logic (ES6+)
- **CSS3**: Styling and animations
- **HTML5**: Structure and canvas container

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Performance
- Target: 60 FPS
- Resolution: Responsive (fullscreen)
- Optimized for: Desktop and tablets

## 📝 Code Structure

### carl.js Organization
1. **Global State**: Game variables and configuration
2. **Sound System**: Audio loading and playback
3. **Spawn Patterns**: Enemy pattern definitions
4. **Carl Class**: Player character with full animation
5. **Enemy Classes**: Jellyfish, Shark, Mine, Urchin
6. **Particle System**: Hit effects and visual feedback
7. **Background System**: Parallax layers and bubbles
8. **Game Functions**: setup(), draw(), game loop
9. **Input Handling**: Keyboard controls
10. **Sound Loading**: Audio initialization

### Key Variables
```javascript
game.speed        // Current scroll speed
game.distance     // Total distance traveled
game.lives        // Remaining lives
carl.vx, carl.vy  // Carl's velocity
enemies[]         // Active enemy array
particles[]       // Visual effect particles
```

## 🎨 Customization

### Easy Modifications

**Change Game Difficulty**:
```javascript
// In carl.js, adjust these values:
game.baseSpeed = 2;      // Starting speed
game.maxSpeed = 12;      // Top speed
game.speedIncrement = 0.0005; // Speed increase rate
carl.lives = 3;          // Starting lives
```

**Adjust Physics**:
```javascript
// In Carl class constructor:
this.acceleration = 0.8;    // Movement responsiveness
this.friction = 0.92;       // How fast Carl slows down
this.jumpPower = -12;       // Jump strength
this.gravity = 0.4;         // Falling speed
```

**Modify Spawn Rate**:
```javascript
// In spawnEnemyPattern():
if (game.distance - lastPatternDistance < 100 + random(50)) {
    // Decrease "100" for more enemies
}
```

## 📜 License

This is a custom game created for entertainment purposes. Feel free to modify and share!

## 🙏 Credits

- **Character Design**: Carl the Urgent Slug Urchin
- **Game Design**: Sonic-inspired underwater platformer
- **Programming**: Complete p5.js implementation
- **Art Style**: Procedurally drawn characters and environments

## 🐛 Known Issues

None currently! Report bugs by creating an issue.

## 🚧 Future Enhancements

Potential additions:
- [ ] Power-ups (speed boost, shield, extra life)
- [ ] Multiple level themes (coral reef, deep trench, kelp forest)
- [ ] Boss encounters
- [ ] Multiplayer mode
- [ ] Mobile touch controls
- [ ] Achievement system
- [ ] Level editor

## 📞 Support

For questions or issues:
1. Check this README
2. Review `sounds/README.md` for audio issues
3. Check browser console for errors (F12)
4. Ensure all files are in correct locations

---

**Have fun playing Carl the Urgent Slug Urchin! 🐙🌊**

*Remember: The ocean is vast, but Carl is faster!*
