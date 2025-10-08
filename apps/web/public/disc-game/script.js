const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

const background = new Image();
background.src = "bg.png";

const disc = new Image();
disc.src = "disc.png";

const crosshair = new Image();
crosshair.src = "crosshair.png";

const enemies = [
  { x: 100, y: 100, image: "enemy1.png" },
  { x: 300, y: 150, image: "enemy2.png" },
];

const loadedEnemies = enemies.map((e) => {
  const img = new Image();
  img.src = e.image;
  return { ...e, img };
});

let crosshairX = canvas.width / 2;
let crosshairY = canvas.height / 2;

document.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  crosshairX = e.clientX - rect.left;
  crosshairY = e.clientY - rect.top;
});

document.addEventListener("click", () => {
  // Add sound, scoring, and hit detection here
  console.log("Disc thrown at", crosshairX, crosshairY);
});

function gameLoop() {
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  loadedEnemies.forEach((e) => ctx.drawImage(e.img, e.x, e.y));
  ctx.drawImage(disc, crosshairX - 20, crosshairY - 20);
  ctx.drawImage(crosshair, crosshairX - 16, crosshairY - 16);
  requestAnimationFrame(gameLoop);
}

gameLoop();
