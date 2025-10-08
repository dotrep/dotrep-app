// DISC Game - Retro Arcade Throwing Game
class DISCGame {
  constructor() {
    this.canvas = document.getElementById('discCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // Game state
    this.score = 7450;
    this.xp = 35;
    this.maxXp = 100;
    this.level = 1;
    this.gameRunning = true;
    this.pulseActive = false;
    
    // Player data
    this.playerName = 'loading.fsn';
    this.userId = null;
    
    // Game objects
    this.discs = [];
    this.targets = [];
    this.particles = [];
    this.powerUps = [];
    
    // Input
    this.mouse = { x: 0, y: 0, pressed: false };
    this.crosshair = { x: this.width/2, y: this.height/2 };
    
    // Timing
    this.lastTime = 0;
    this.targetSpawnTimer = 0;
    this.pulseTimer = 0;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.loadUserData();
    this.spawnInitialTargets();
    this.gameLoop();
  }
  
  setupEventListeners() {
    // Mouse movement
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.crosshair.x = this.mouse.x;
      this.crosshair.y = this.mouse.y;
    });
    
    // Mouse click - throw disc
    this.canvas.addEventListener('click', (e) => {
      if (this.gameRunning) {
        this.throwDisc();
      }
    });
    
    // Exit button
    document.getElementById('exitBtn').addEventListener('click', () => {
      this.exitGame();
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.activatePulse();
      }
      if (e.code === 'Escape') {
        this.exitGame();
      }
    });
  }
  
  async loadUserData() {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        this.playerName = `${userData.username}.fsn`;
        this.userId = userData.id;
        document.getElementById('fsnName').textContent = this.playerName;
        
        // Load user stats
        const statsResponse = await fetch(`/api/disc-stats/${userData.id}`);
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          this.score = stats.highScore || 0;
          this.xp = stats.currentXp || 0;
          this.level = stats.level || 1;
          this.updateHUD();
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }
  
  throwDisc() {
    const disc = {
      x: this.width / 2,
      y: this.height - 50,
      targetX: this.crosshair.x,
      targetY: this.crosshair.y,
      speed: 15,
      trail: [],
      glowIntensity: 1
    };
    
    // Calculate direction
    const dx = disc.targetX - disc.x;
    const dy = disc.targetY - disc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    disc.vx = (dx / distance) * disc.speed;
    disc.vy = (dy / distance) * disc.speed;
    
    this.discs.push(disc);
    
    // Create throw particles
    this.createThrowParticles(disc.x, disc.y);
  }
  
  spawnInitialTargets() {
    for (let i = 0; i < 3; i++) {
      this.spawnTarget();
    }
  }
  
  spawnTarget() {
    const target = {
      x: Math.random() * (this.width - 100) + 50,
      y: Math.random() * (this.height / 2) + 50,
      width: 80,
      height: 60,
      health: 3,
      maxHealth: 3,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 2,
      color: this.getRandomTargetColor(),
      pulsePhase: Math.random() * Math.PI * 2,
      isDestroyed: false,
      points: 100
    };
    
    this.targets.push(target);
  }
  
  getRandomTargetColor() {
    const colors = ['#ff0064', '#00ff64', '#6400ff', '#ff6400', '#0064ff'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  activatePulse() {
    if (!this.pulseActive) {
      this.pulseActive = true;
      this.pulseTimer = 1000; // 1 second
      
      // Show pulse overlay
      const overlay = document.getElementById('pulseOverlay');
      overlay.classList.remove('hidden');
      
      // Hide overlay after animation
      setTimeout(() => {
        overlay.classList.add('hidden');
      }, 1000);
      
      // Slow down all targets
      this.targets.forEach(target => {
        target.vx *= 0.3;
        target.vy *= 0.3;
      });
      
      // Award XP for pulse activation
      this.addXP(10);
    }
  }
  
  addXP(amount) {
    this.xp += amount;
    if (this.xp >= this.maxXp) {
      this.levelUp();
    }
    this.updateHUD();
    this.saveProgress();
  }
  
  levelUp() {
    this.level++;
    this.xp = 0;
    this.maxXp = Math.floor(this.maxXp * 1.2);
    
    // Create level up particles
    this.createLevelUpParticles();
  }
  
  updateScore(points) {
    this.score += points;
    this.addXP(Math.floor(points / 10));
    this.updateHUD();
  }
  
  updateHUD() {
    document.getElementById('score').textContent = this.score.toLocaleString();
    document.getElementById('xpText').textContent = `XP: ${this.xp} / ${this.maxXp}`;
    
    const xpPercent = (this.xp / this.maxXp) * 100;
    document.getElementById('xpFill').style.width = `${xpPercent}%`;
  }
  
  async saveProgress() {
    if (!this.userId) return;
    
    try {
      await fetch('/api/disc-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          score: this.score,
          xp: this.xp,
          level: this.level
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }
  
  exitGame() {
    this.gameRunning = false;
    this.saveProgress();
    // Return to Game Center
    window.parent.postMessage({ type: 'exitGame' }, '*');
  }
  
  update(deltaTime) {
    if (!this.gameRunning) return;
    
    // Update pulse timer
    if (this.pulseActive) {
      this.pulseTimer -= deltaTime;
      if (this.pulseTimer <= 0) {
        this.pulseActive = false;
        // Restore target speeds
        this.targets.forEach(target => {
          target.vx /= 0.3;
          target.vy /= 0.3;
        });
      }
    }
    
    // Update discs
    this.discs.forEach((disc, index) => {
      // Add to trail
      disc.trail.push({ x: disc.x, y: disc.y });
      if (disc.trail.length > 10) disc.trail.shift();
      
      // Move disc
      disc.x += disc.vx;
      disc.y += disc.vy;
      
      // Remove if off screen
      if (disc.x < -50 || disc.x > this.width + 50 || 
          disc.y < -50 || disc.y > this.height + 50) {
        this.discs.splice(index, 1);
      }
    });
    
    // Update targets
    this.targets.forEach((target, index) => {
      if (target.isDestroyed) return;
      
      // Move target
      target.x += target.vx;
      target.y += target.vy;
      
      // Bounce off walls
      if (target.x <= 0 || target.x >= this.width - target.width) {
        target.vx = -target.vx;
      }
      if (target.y <= 0 || target.y >= this.height / 2) {
        target.vy = -target.vy;
      }
      
      // Update pulse phase
      target.pulsePhase += deltaTime * 0.005;
    });
    
    // Check collisions
    this.checkCollisions();
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Spawn new targets
    this.targetSpawnTimer += deltaTime;
    if (this.targetSpawnTimer > 3000 && this.targets.length < 5) {
      this.spawnTarget();
      this.targetSpawnTimer = 0;
    }
  }
  
  checkCollisions() {
    this.discs.forEach((disc, discIndex) => {
      this.targets.forEach((target, targetIndex) => {
        if (target.isDestroyed) return;
        
        const dx = disc.x - (target.x + target.width/2);
        const dy = disc.y - (target.y + target.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) {
          // Hit!
          target.health--;
          this.createHitParticles(disc.x, disc.y, target.color);
          this.discs.splice(discIndex, 1);
          
          if (target.health <= 0) {
            // Destroy target
            target.isDestroyed = true;
            this.updateScore(target.points);
            this.createDestroyParticles(target.x + target.width/2, target.y + target.height/2, target.color);
            
            setTimeout(() => {
              const idx = this.targets.indexOf(target);
              if (idx > -1) this.targets.splice(idx, 1);
            }, 100);
          }
        }
      });
    });
  }
  
  createThrowParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 2,
        life: 1,
        maxLife: 1,
        color: '#00ffff',
        size: Math.random() * 3 + 2
      });
    }
  }
  
  createHitParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        maxLife: 1,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  }
  
  createDestroyParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1.5,
        maxLife: 1.5,
        color: color,
        size: Math.random() * 6 + 3
      });
    }
  }
  
  createLevelUpParticles() {
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: this.width / 2,
        y: this.height / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 2,
        maxLife: 2,
        color: '#ffff00',
        size: Math.random() * 8 + 4
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // gravity
      particle.life -= deltaTime / 1000;
      
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
      }
    });
  }
  
  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000008';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw grid background
    this.drawGrid();
    
    // Draw targets
    this.targets.forEach(target => {
      if (!target.isDestroyed) {
        this.drawTarget(target);
      }
    });
    
    // Draw discs
    this.discs.forEach(disc => {
      this.drawDisc(disc);
    });
    
    // Draw particles
    this.particles.forEach(particle => {
      this.drawParticle(particle);
    });
    
    // Draw crosshair
    this.drawCrosshair();
    
    // Draw pulse effect
    if (this.pulseActive) {
      this.drawPulseEffect();
    }
  }
  
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < this.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < this.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }
  
  drawTarget(target) {
    const pulseScale = 1 + Math.sin(target.pulsePhase) * 0.1;
    const width = target.width * pulseScale;
    const height = target.height * pulseScale;
    
    // Main body
    this.ctx.fillStyle = target.color;
    this.ctx.fillRect(target.x, target.y, width, height);
    
    // Glow effect
    this.ctx.shadowColor = target.color;
    this.ctx.shadowBlur = 15;
    this.ctx.strokeStyle = target.color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(target.x, target.y, width, height);
    this.ctx.shadowBlur = 0;
    
    // Health bar
    if (target.health < target.maxHealth) {
      const healthWidth = (target.health / target.maxHealth) * width;
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(target.x, target.y - 8, width, 4);
      this.ctx.fillStyle = '#00ff00';
      this.ctx.fillRect(target.x, target.y - 8, healthWidth, 4);
    }
    
    // Computer screen effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(target.x + 10, target.y + 10, width - 20, height - 20);
    
    // Screen pattern
    this.ctx.fillStyle = target.color;
    for (let i = 0; i < 3; i++) {
      this.ctx.fillRect(target.x + 15 + i * 15, target.y + 15, 10, height - 30);
    }
  }
  
  drawDisc(disc) {
    // Draw trail
    disc.trail.forEach((point, index) => {
      const alpha = index / disc.trail.length;
      this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.8})`;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 3 * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Draw disc
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.beginPath();
    this.ctx.arc(disc.x, disc.y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Inner ring
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(disc.x, disc.y, 5, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }
  
  drawParticle(particle) {
    const alpha = particle.life / particle.maxLife;
    this.ctx.fillStyle = particle.color;
    this.ctx.globalAlpha = alpha;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
  
  drawCrosshair() {
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#ffff00';
    this.ctx.shadowBlur = 10;
    
    const size = 20;
    // Horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(this.crosshair.x - size, this.crosshair.y);
    this.ctx.lineTo(this.crosshair.x + size, this.crosshair.y);
    this.ctx.stroke();
    
    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(this.crosshair.x, this.crosshair.y - size);
    this.ctx.lineTo(this.crosshair.x, this.crosshair.y + size);
    this.ctx.stroke();
    
    // Center dot
    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();
    this.ctx.arc(this.crosshair.x, this.crosshair.y, 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }
  
  drawPulseEffect() {
    const pulseAlpha = this.pulseTimer / 1000;
    this.ctx.fillStyle = `rgba(0, 255, 255, ${pulseAlpha * 0.2})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  gameLoop(currentTime = 0) {
    if (!this.gameRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
  new DISCGame();
});