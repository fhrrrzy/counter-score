# Scoreboard - Badminton Tracker 🫨

A clean, ad-free, lightweight Progressive Web App (PWA) designed to track scores for badminton matches.

Live URL: **[https://fhrrrzy.github.io/counter-score/](https://fhrrrzy.github.io/counter-score/)**

---

## Features

- **Split-Screen Design:** 
  - **Portrait:** Splits screen vertically (Top vs Bottom).
  - **Landscape:** Splits screen horizontally (Left vs Right) for optimal viewing when placed on a net post or bench.
- **Gestural Control:**
  - **Tap:** Increments score by `+1` (triggers a light haptic key-click on touch screens).
  - **Swipe Right:** Increments score by `+1` (silent).
  - **Swipe Left:** Decrements score by `-1` (silent, triggers a subtle dark flash).
  - *No text selection or default scroll bouncing.*
- **Screen Wake Lock:** Prevents screen dimming or locking during matches using the native Screen Wake Lock API.
- **Reset Protection:** Double-tap is required on the Reset button to prevent accidental resets mid-game.
- **Lightweight Architecture:** Built purely with Vanilla HTML, CSS, and JS (zero build steps, offline-ready PWA service worker).

---

## Keyboard Shortcuts (Desktop / Controller Testing)

| Key | Action |
|-----|--------|
| `Q` or `A` | Left (Red) Team score `+1` (haptic) |
| `Z` | Left (Red) Team score `-1` |
| `P` or `L` | Right (Blue) Team score `+1` (haptic) |
| `M` | Right (Blue) Team score `-1` |
| `F` | Toggle Fullscreen |
| `Space` | Reset Scores (Double press to confirm) |

---

## Local Development

Start a static local server in the project directory:
```bash
npx -y http-server . -p 8080
```
Open `http://localhost:8080` in your browser.
