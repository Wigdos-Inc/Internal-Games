# Carl the Urgent Slug Urchin - Sound Files

Place your audio files in this directory for the game to load them.

## Required Sound Files

All files should be in `.mp3` or `.ogg` format:

### 1. **background.mp3** (or background.ogg)
- **Type:** Looping background music
- **Description:** Underwater ambient music with a sense of urgency
- **Duration:** 1-3 minutes (will loop)
- **Suggested style:** Fast-paced electronic/chiptune with underwater bubbling effects

### 2. **jump.mp3** (or jump.ogg)
- **Type:** Sound effect
- **Description:** Quick whoosh or water displacement sound when Carl jumps
- **Duration:** 0.2-0.5 seconds
- **Suggested style:** Short "bwoop" or swoosh sound

### 3. **boost.mp3** (or boost.ogg)
- **Type:** Sound effect
- **Description:** Stronger propulsion sound (currently same as jump, can be differentiated)
- **Duration:** 0.3-0.6 seconds
- **Suggested style:** More powerful whoosh with slight reverb

### 4. **hit.mp3** (or hit.ogg)
- **Type:** Sound effect
- **Description:** Collision/damage sound when Carl hits an enemy
- **Duration:** 0.3-0.7 seconds
- **Suggested style:** Squishy impact sound with slight "oof" or boing

### 5. **death.mp3** (or death.ogg)
- **Type:** Sound effect
- **Description:** Game over sound when Carl loses all lives
- **Duration:** 1-2 seconds
- **Suggested style:** Descending tone or sad trombone, underwater muffled effect

### 6. **spawn.mp3** (or spawn.ogg)
- **Type:** Sound effect
- **Description:** Enemy appearance sound (plays occasionally)
- **Duration:** 0.3-0.5 seconds
- **Suggested style:** Subtle "bloop" or warning beep

## How to Enable Sounds

Once you've added the sound files to this directory:

1. Open `carl.js`
2. Find the `loadSounds()` function at the bottom of the file
3. Uncomment the sound loading lines (remove the `//` at the start of each line)
4. The game will automatically load and play the sounds

## Example:

Change this:
```javascript
// sounds.backgroundMusic = loadSound('sounds/background.mp3');
```

To this:
```javascript
sounds.backgroundMusic = loadSound('sounds/background.mp3');
```

## File Structure

```
Internal-Games/slop/carl/
├── sounds/
│   ├── background.mp3  ← Background music (looping)
│   ├── jump.mp3        ← Jump sound effect
│   ├── boost.mp3       ← Boost sound effect
│   ├── hit.mp3         ← Hit/collision sound
│   ├── death.mp3       ← Game over sound
│   └── spawn.mp3       ← Enemy spawn sound
├── index.html
├── game.html
├── carl.css
└── carl.js
```

## Tips

- Keep sound files under 1MB each for faster loading
- Test volume levels - effects should be clear but not overwhelming
- Background music should be quieter than sound effects
- Consider using royalty-free sound libraries or creating sounds with tools like:
  - Audacity (free audio editor)
  - BFXR or SFXR (free retro sound generators)
  - FreeSound.org (royalty-free sound library)
