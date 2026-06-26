// State Management
const state = {
  red: 0,
  blue: 0,
  isSwapped: false
};

// DOM References
const panelRed = document.getElementById("panel-red");
const panelBlue = document.getElementById("panel-blue");
const scoreRed = document.getElementById("score-red");
const scoreBlue = document.getElementById("score-blue");
const flashRed = document.getElementById("flash-red");
const flashBlue = document.getElementById("flash-blue");
const btnReset = document.getElementById("btn-reset");
const btnSwap = document.getElementById("btn-swap");
const btnFullscreen = document.getElementById("btn-fullscreen");
const iconFullscreen = document.getElementById("icon-fullscreen");
const wakeLockIndicator = document.getElementById("wakelock-indicator");

// Prevent scrolling, pinch-zooming, and bounce effects on touch interfaces
document.addEventListener("touchstart", (e) => {
  if (e.target.tagName !== "BUTTON" && !e.target.closest(".dock-btn")) {
    e.preventDefault();
  }
}, { passive: false });

// Haptic feedback helper
function vibrate(pattern = 40) {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors
    }
  }
}

// Update Score Function
function updateScore(team, diff) {
  const oldScore = state[team];
  state[team] = Math.max(0, state[team] + diff);
  
  if (state[team] === oldScore) return; // No change (e.g. trying to go below 0)
  
  // Update UI
  const scoreDisplay = team === "red" ? scoreRed : scoreBlue;
  const flash = team === "red" ? flashRed : flashBlue;
  
  scoreDisplay.textContent = state[team];
  
  if (diff > 0) {
    // Add Score visual feedback (Bump animation)
    vibrate(60);
    scoreDisplay.classList.remove("bump");
    void scoreDisplay.offsetWidth; // Trigger reflow to restart animation
    scoreDisplay.classList.add("bump");
    setTimeout(() => scoreDisplay.classList.remove("bump"), 150);
  } else {
    // Deduct Score visual feedback (Flash animation)
    vibrate([30, 30]);
    flash.classList.remove("show");
    void flash.offsetWidth;
    flash.classList.add("show");
    setTimeout(() => flash.classList.remove("show"), 150);
  }
  
  // Disable swap button if scores are not both 0
  updateButtonStates();
  
  // Re-verify Wake Lock is still active on score update
  ensureWakeLock();
}

// Setup Touch Gestures
function initGestures(panel, team) {
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  
  panel.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
  }, { passive: true });
  
  panel.addEventListener("touchend", (e) => {
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;
    const duration = Date.now() - startTime;
    
    // Swipe detection (horizontal swipe > 45px, vertical deviation < 60px, fast swipe)
    if (Math.abs(diffX) > 45 && Math.abs(diffY) < 60 && duration < 350) {
      if (diffX > 0) {
        updateScore(team, 1); // Swipe Right -> Add
      } else {
        updateScore(team, -1); // Swipe Left -> Deduct
      }
    } else if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && duration < 300) {
      updateScore(team, 1); // Clean short tap -> Add
    }
  }, { passive: true });
  
  // Desktop fallback: mouse click to add
  panel.addEventListener("click", (e) => {
    // Only register clicks if touch didn't happen (avoid double triggers on mobile)
    if (e.pointerType === "mouse") {
      updateScore(team, 1);
    }
  });
}

initGestures(panelRed, "red");
initGestures(panelBlue, "blue");

// Swap Sides (Left/Right)
btnSwap.addEventListener("click", () => {
  vibrate(40);
  state.isSwapped = !state.isSwapped;
  
  if (state.isSwapped) {
    panelRed.style.order = "2";
    panelBlue.style.order = "1";
  } else {
    panelRed.style.order = "1";
    panelBlue.style.order = "2";
  }
  
  ensureWakeLock();
});

// Toggle swap button availability based on score
function updateButtonStates() {
  const isScoreZero = state.red === 0 && state.blue === 0;
  btnSwap.disabled = !isScoreZero;
  if (!isScoreZero) {
    btnSwap.setAttribute("title", "Swap Sides (Locked during match)");
  } else {
    btnSwap.setAttribute("title", "Swap Sides");
  }
}

// Reset Scores (Double click/tap to avoid accidental triggers)
let lastResetClick = 0;
function handleReset() {
  const now = Date.now();
  if (now - lastResetClick < 400) {
    // Confirmed reset
    state.red = 0;
    state.blue = 0;
    scoreRed.textContent = "0";
    scoreBlue.textContent = "0";
    vibrate([80, 50, 80]);
    updateButtonStates();
    ensureWakeLock();
  } else {
    // First tap indicator
    vibrate(30);
    // Visual hint of click
    btnReset.style.color = "#f43f5e";
    setTimeout(() => btnReset.style.color = "#f8fafc", 400);
  }
  lastResetClick = now;
}

btnReset.addEventListener("click", handleReset);

// Fullscreen API Handling
btnFullscreen.addEventListener("click", () => {
  vibrate(40);
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      iconFullscreen.innerHTML = '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>';
    }).catch(err => {
      console.warn("Fullscreen permission denied", err);
    });
  } else {
    document.exitFullscreen().then(() => {
      iconFullscreen.innerHTML = '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
    });
  }
});

// Sync fullscreen exit via OS controls/gestures
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    iconFullscreen.innerHTML = '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
  }
  ensureWakeLock();
});

// Screen Wake Lock API
let wakeLock = null;

async function ensureWakeLock() {
  if (!("wakeLock" in navigator)) {
    wakeLockIndicator.style.display = "none";
    return;
  }
  
  if (wakeLock !== null) return; // Already active
  
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLockIndicator.classList.add("active");
    
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
      wakeLockIndicator.classList.remove("active");
    });
  } catch (err) {
    console.warn("Wake Lock activation failed:", err.message);
    wakeLock = null;
    wakeLockIndicator.classList.remove("active");
  }
}

// Request wake lock on load
window.addEventListener("load", () => {
  ensureWakeLock();
  updateButtonStates(); // Set initial disabled status of swap button
  
  // Register PWA Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(reg => console.log("Service Worker registered!", reg.scope))
      .catch(err => console.error("Service Worker registration failed:", err));
  }
});

// Re-request wake lock when coming back to the page
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    ensureWakeLock();
  }
});

// Keyboard shortcuts for desktop testing/controllers
document.addEventListener("keydown", (e) => {
  // Determine left and right team based on swap state
  const leftTeam = state.isSwapped ? "blue" : "red";
  const rightTeam = state.isSwapped ? "red" : "blue";
  
  switch (e.key.toLowerCase()) {
    // Left Team Control
    case "q":
    case "a":
      updateScore(leftTeam, 1);
      break;
    case "z":
      updateScore(leftTeam, -1);
      break;
      
    // Right Team Control
    case "p":
    case "l":
      updateScore(rightTeam, 1);
      break;
    case "m":
      updateScore(rightTeam, -1);
      break;
      
    // Global controls
    case "s":
      if (!btnSwap.disabled) btnSwap.click();
      break;
    case "f":
      btnFullscreen.click();
      break;
    case " ":
      handleReset(); // Emulate reset double click / confirm logic
      break;
  }
});
