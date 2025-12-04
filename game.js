/* ------------------------------------------------
1. HIGH PERFORMANCE RENDER ENGINE (Background)
------------------------------------------------ */
const bgCanvas = document.getElementById("bgCanvas");
const ctx = bgCanvas.getContext("2d");
let W, H;

function resize() {
    W = bgCanvas.width = window.innerWidth;
    H = bgCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// Background Stars (Static array for performance)
const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    s: Math.random() * 2,
    a: Math.random(),
}));

function drawBg() {
    // Clear with gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Draw Stars (with subtle flicker animation)
    ctx.fillStyle = "#fff";
    stars.forEach((st) => {
        ctx.globalAlpha =
            0.3 + Math.sin(performance.now() * 0.003 + st.x) * 0.2;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawBg);
}
drawBg();

/* ------------------------------------------------
2. GAME LOGIC (STATE & ENTITIES)
------------------------------------------------ */
const gameArea = document.getElementById("gameArea");
const hippoEl = document.getElementById("hippo");
const scoreEl = document.getElementById("scoreVal");
const livesEl = document.getElementById("livesDisplay");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreEl = document.getElementById("finalScore");


// Config
const HIPPO_SIZE = 70;
const ITEM_SIZE = 50;
const HIPPO_SPEED = 800; // pixels per second (fast responsiveness)
const HIPPO_Y_OFFSET = 20; // pixels from bottom

// State
let isPlaying = false;
let lastTime = 0;
let score = 0;
let lives = 3;
let spawnTimer = 0;
let spawnInterval = 800; // ms

// Coordinate System
let gameW = window.innerWidth;
let gameH = window.innerHeight;
let hippoX = gameW / 2;
let hippoY = gameH - HIPPO_SIZE - HIPPO_Y_OFFSET;

// Entities
let items = [];

const ITEMS_TYPES = [
    { char: "🍉", type: "good", points: 10, speed: 300 },
    { char: "🍍", type: "good", points: 20, speed: 350 },
    { char: "🍇", type: "good", points: 15, speed: 320 },
    { char: "⚡", type: "bad", damage: 1, speed: 450 },
    { char: "❄️", type: "bad", damage: 1, speed: 350 },
    { char: "💣", type: "bad", damage: 2, speed: 400 },
];

// Input State
const keys = { Left: false, Right: false };
let touchTargetX = null;

// Listeners
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") keys.Left = true;
    if (e.key === "ArrowRight") keys.Right = true;
});
window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.Left = false;
    if (e.key === "ArrowRight") keys.Right = false;
});

// Optimized Touch: follow finger
gameArea.addEventListener("touchstart", (e) => {
    touchTargetX = e.touches[0].clientX;
});
gameArea.addEventListener("touchmove", (e) => {
    e.preventDefault(); // prevent scroll
    touchTargetX = e.touches[0].clientX;
});
gameArea.addEventListener("touchend", () => {
    touchTargetX = null;
});

// Resize Handler for Game Logic
window.addEventListener("resize", () => {
    gameW = window.innerWidth;
    gameH = window.innerHeight;
    hippoY = gameH - HIPPO_SIZE - HIPPO_Y_OFFSET;
});

window.startGame = function() {
    isPlaying = true;
    score = 0;
    lives = 3;
    spawnInterval = 800;
    
    // Clean up old items
    items.forEach((i) => i.el.remove());
    items = [];

    updateHUD();
    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";

    hippoX = (gameW - HIPPO_SIZE) / 2;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    isPlaying = false;
    finalScoreEl.innerText = score;
    gameOverScreen.style.display = "flex";
}

function spawnItem() {
    const type = ITEMS_TYPES[Math.floor(Math.random() * ITEMS_TYPES.length)];

    // DOM Creation
    const el = document.createElement("div");
    el.className = "item";
    el.innerText = type.char;
    gameArea.appendChild(el);

    // Logic Object
    const item = {
        el: el,
        x: Math.random() * (gameW - ITEM_SIZE),
        y: -ITEM_SIZE, // start above screen
        type: type.type,
        speed: type.speed + score * 0.5, // Difficulty scaling
        points: type.points,
        damage: type.damage,
    };
    items.push(item);
}

function updateHUD() {
    scoreEl.innerText = score;
    livesEl.innerText = "❤️".repeat(Math.max(0, lives));
}

// Visual Effects
function createFloatingText(text, x, y, color) {
    const el = document.createElement("div");
    el.innerText = text;
    el.style.position = "absolute";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.color = color;
    el.style.fontWeight = "bold";
    el.style.fontSize = "24px";
    el.style.pointerEvents = "none";
    el.style.transition = "all 0.8s ease-out";
    el.style.zIndex = 50;
    el.style.textShadow = "0 2px 4px rgba(0,0,0,0.5)";
    gameArea.appendChild(el);

    // Trigger animation next frame
    requestAnimationFrame(() => {
        el.style.transform = "translateY(-50px)";
        el.style.opacity = "0";
    });

    setTimeout(() => el.remove(), 800);
}

/* ------------------------------------------------
3. THE MAIN LOOP (60 FPS LOGIC)
------------------------------------------------ */
function gameLoop(now) {
    if (!isPlaying) return;

    const dt = (now - lastTime) / 1000;
    lastTime = now;

    // 1. Move Hippo
    // Keyboard
    if (keys.Left) hippoX -= HIPPO_SPEED * dt;
    if (keys.Right) hippoX += HIPPO_SPEED * dt;

    // Touch (Smooth lerp towards finger)
    if (touchTargetX !== null) {
        const diff = touchTargetX - (hippoX + HIPPO_SIZE / 2);
        if (Math.abs(diff) > 5) {
            hippoX += diff * 10 * dt; // Lerp factor 10
        }
    }

    // Boundaries
    if (hippoX < 0) hippoX = 0;
    if (hippoX > gameW - HIPPO_SIZE) hippoX = gameW - HIPPO_SIZE;

    // Render Hippo (GPU Transform)
    hippoEl.style.setProperty("--x", `${hippoX}px`);
    hippoEl.style.setProperty("--y", `${hippoY}px`);
    hippoEl.style.transform = `translate3d(${hippoX}px, ${hippoY}px, 0)`;

    // 2. Spawn Items
    spawnTimer += dt * 1000;
    if (spawnTimer > spawnInterval) {
        spawnItem();
        spawnTimer = 0;
        // Increase difficulty (faster items spawn)
        spawnInterval = Math.max(300, 800 - score * 2);
    }

    // 3. Update Items & Collisions
    // Hippo Hitbox is slightly smaller than visual for fairness
    const hitX = hippoX + 10;
    const hitY = hippoY + 20;
    const hitW = HIPPO_SIZE - 20;
    const hitH = HIPPO_SIZE - 20;

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];

        // Move
        item.y += item.speed * dt;

        // Render Item
        item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;

        // Check Collision (AABB)
        if (
            item.x < hitX + hitW &&
            item.x + ITEM_SIZE > hitX &&
            item.y < hitY + hitH &&
            item.y + ITEM_SIZE > hitY
        ) {
            // HIT!
            if (item.type === "good") {
                score += item.points;
                createFloatingText(`+${item.points}`, item.x, item.y, "#4ade80");
            } else {
                lives -= item.damage;
                createFloatingText(`💥`, item.x, item.y, "#ff4d4d");
                hippoEl.classList.add("hurt");
                setTimeout(() => hippoEl.classList.remove("hurt"), 300);
            }

            updateHUD();
            item.el.remove();
            items.splice(i, 1);

            if (lives <= 0) {
                endGame();
                return;
            }
            continue;
        }

        // Check Floor (Miss)
        if (item.y > gameH) {
            item.el.remove();
            items.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}