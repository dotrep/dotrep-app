
const canvas = document.getElementById('discCanvas');
const ctx = canvas.getContext('2d');
let xp = 0;
let targets = [];

function spawnTarget() {
  let y = Math.random() > 0.5 ? 200 : 300;
  targets.push({ x: 800, y: y, hit: false });
}

function shoot(x, y) {
  targets.forEach(target => {
    if (!target.hit && Math.abs(x - target.x) < 30 && Math.abs(y - target.y) < 30) {
      target.hit = true;
      xp += 33;
      document.getElementById('xpBar').innerText = `XP: ${xp} / 100`;
      if (xp >= 100) alert('Pulse Activated!');
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  targets.forEach(target => {
    if (!target.hit) {
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(target.x, target.y, 30, 30);
      target.x -= 2;
    }
  });
  requestAnimationFrame(draw);
}

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  shoot(e.clientX - rect.left, e.clientY - rect.top);
});

document.getElementById("exitBtn").onclick = () => window.parent.postMessage("exitDISC", "*");

setInterval(spawnTarget, 1200);
draw();
