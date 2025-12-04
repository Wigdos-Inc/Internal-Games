# 🚀 Quick Start Guide - Carl the Urgent Slug Urchin

## ⚡ 3 Steps to Play

### Step 1: Add Carl's Image
Save the Carl character image as **`carl.png`** in this folder:
```
Internal-Games/slop/carl/carl.png
```

### Step 2: Open the Game
Double-click **`index.html`** to open the title screen in your browser.

### Step 3: Play!
Click "Start Adventure" and use these controls:
- **Arrow Keys** or **WASD**: Move Carl
- **Space**: Jump/Boost
- **Escape**: Pause

## 🎵 Adding Sound (Optional)

1. Place audio files in the `sounds/` folder:
   - `background.mp3` - Background music
   - `jump.mp3` - Jump sound
   - `hit.mp3` - Collision sound
   - `death.mp3` - Game over sound
   - And more (see `sounds/README.md`)

2. Open `carl.js` in a text editor

3. Find the `loadSounds()` function at the bottom

4. Uncomment these lines (remove the `//`):
   ```javascript
   sounds.backgroundMusic = loadSound('sounds/background.mp3');
   sounds.jump = loadSound('sounds/jump.mp3');
   sounds.hit = loadSound('sounds/hit.mp3');
   sounds.death = loadSound('sounds/death.mp3');
   // ... etc
   ```

5. Save and refresh the game!

## 🎯 Goal

Avoid enemies and survive as long as possible! The game gets faster the further you travel.

## 🏆 Score Goals

- 🥉 500m - Bronze
- 🥈 1000m - Silver  
- 🥇 2000m - Gold
- 💎 5000m - Diamond

## ❓ Need Help?

Check the **`README.md`** file for complete documentation!

---

**Ready? Let's go! 🐙💨**
