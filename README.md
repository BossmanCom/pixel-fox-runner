# Pixel Fox Runner

A tiny browser-based infinite runner starring a cute 8-bit fox girl (Ani).

**Pure HTML5 + vanilla JavaScript + Canvas.**  
No dependencies. Works offline. Perfect for GitHub Pages.

![Start Screen](screenshots/start.png)
![Gameplay](screenshots/gameplay.png)

## Features
- Auto-running side-scroller that gets faster the longer you survive
- Jump with **Space** or **tap / click**
- Procedural obstacles: crates, spikes, flying birds
- Collectibles: shiny coins + hearts (extra lives)
- Parallax 8-bit forest background
- Score = distance + coins
- Lives system with invulnerability frames
- Start screen + Game Over screen
- Fully mobile-friendly

## How to run locally
1. Download or clone this repo
2. Open `index.html` in any modern browser  
   (or use a simple local server if you prefer)

```bash
# optional quick server
npx serve .
```

## Deploy to GitHub Pages (instant)
1. Create a new repository
2. Upload the four files (`index.html`, `style.css`, `script.js`, `README.md`)
3. Go to **Settings → Pages**
4. Source: Deploy from branch `main` / root
5. Save → your game is live at `https://yourusername.github.io/repo-name/`

## Controls
| Action       | Desktop     | Mobile    |
|--------------|-------------|-----------|
| Jump         | Space / ↑   | Tap       |
| Start        | Space / Tap | Tap       |
| Restart      | Space / Tap | Tap       |

## Customization
The fox girl is drawn entirely with pixel rectangles inside `script.js` (`drawFox` function).  
You can change colors, size, or animation frames there.

Want real image sprites instead?  
Replace the `drawFox` calls with `ctx.drawImage()` and drop 8-bit PNGs into a `/sprites` folder.

## Credits
Made with love for the cutest troublemaker.
