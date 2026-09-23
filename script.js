/**
 * ====================================================================
 * NOCTURNA — O LADRÃO DE SOMBRAS
 * Jogo 2D Completo de Plataforma, Stealth e Puzzles em Quadrinhos Noir
 * ====================================================================
 * Desenvolvido em HTML5 Canvas, CSS3 e JavaScript puro.
 * Sem bibliotecas externas, sem frameworks e sem backend.
 * 
 * Sumário da Arquitetura:
 * 1. AudioManager — Síntese de áudio procedural via Web Audio API
 * 2. InputManager — Teclado com buffer de pulo e coyote time
 * 3. ParticleSystem — Chuva, fumaça, névoa de sombras e balões HQ
 * 4. Physics & Collision — Resolução AABB, plataformas móveis e troca segura
 * 5. Player (Noct) — Capa procedural, olhos expressivos e animações
 * 6. ShadowClone — Mecânica da Sombra Separada (Fase 4+)
 * 7. Enemies — Guarda (lanterna), Sentinela (refletor) e Caçador das Sombras
 * 8. Interactive Objects — Botões, alavancas [E], portas, caixas, checkpoints e gatos
 * 9. LevelManager — Estrutura e dados das 6 fases progressivas
 * 10. Camera — Câmera suave com travamento de limites
 * 11. SaveSystem & UI — LocalStorage, HUD estilizado e modais
 * 12. GameEngine — Loop principal a 60 FPS e inicialização
 * ====================================================================
 */

// ====================================================================
// 1. SISTEMA DE ÁUDIO (WEB AUDIO API SINTETIZADO)
// ====================================================================
class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.isInitialized = false;

    try {
      const saved = localStorage.getItem('nocturna_audio_muted');
      if (saved !== null) this.muted = (saved === 'true');
    } catch (e) {
      this.muted = false;
    }
  }

  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.isInitialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API não inicializada:', e);
    }
  }

  toggleMute() {
    this.init();
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.35, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('nocturna_audio_muted', this.muted);
    } catch (e) {}
    return this.muted;
  }

  playJump() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.14);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.14);
    } catch (e) {}
  }

  playWorldSwap(isShadow) {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isShadow ? 'triangle' : 'sine';
      if (isShadow) {
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.22);
      } else {
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(380, t + 0.2);
      }
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }

  playCollectShard() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t + idx * 0.04);
        gain.gain.setValueAtTime(0.2, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.25);
      });
    } catch (e) {}
  }

  playButtonClick() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }

  playDoorSlide() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.3);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {}
  }

  playHurt() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.2);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  playCheckpoint() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [392, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);
        gain.gain.setValueAtTime(0.22, t + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.28);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.28);
      });
    } catch (e) {}
  }

  playGuardAlert() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(880, t + 0.05);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {}
  }

  playShadowClone() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(640, t + 0.15);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {}
  }

  playMeow() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(650, t + 0.15);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.35);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  playVictory() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const chords = [
        { f: 523.25, delay: 0.0 },
        { f: 659.25, delay: 0.12 },
        { f: 783.99, delay: 0.24 },
        { f: 1046.50, delay: 0.38 },
        { f: 1318.51, delay: 0.52 }
      ];
      chords.forEach(c => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(c.f, t + c.delay);
        gain.gain.setValueAtTime(0.28, t + c.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + c.delay + 0.5);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + c.delay);
        osc.stop(t + c.delay + 0.5);
      });
    } catch (e) {}
  }
}

// ====================================================================
// 2. GERENCIAMENTO DE ENTRADA (TECLADO)
// ====================================================================
class InputManager {
  constructor(audio) {
    this.audio = audio;
    this.keys = {};
    this.justPressedKeys = {};

    this.keyMap = {
      'KeyA': 'left',
      'ArrowLeft': 'left',
      'KeyD': 'right',
      'ArrowRight': 'right',
      'Space': 'jump',
      'ShiftLeft': 'swap',
      'ShiftRight': 'swap',
      'KeyE': 'interact',
      'KeyQ': 'shadow',
      'Escape': 'pause',
      'KeyR': 'restart',
      'KeyM': 'mute'
    };

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  handleKeyDown(e) {
    if (this.audio) this.audio.init();

    const action = this.keyMap[e.code];
    if (action) {
      if (['jump', 'left', 'right', 'swap', 'interact', 'shadow'].includes(action)) {
        e.preventDefault();
      }
      if (!this.keys[action]) {
        this.justPressedKeys[action] = true;
      }
      this.keys[action] = true;
    }
  }

  handleKeyUp(e) {
    const action = this.keyMap[e.code];
    if (action) {
      this.keys[action] = false;
    }
  }

  isDown(action) {
    return !!this.keys[action];
  }

  wasJustPressed(action) {
    return !!this.justPressedKeys[action];
  }

  clearJustPressed() {
    this.justPressedKeys = {};
  }
}

// ====================================================================
// 3. SISTEMA DE PARTÍCULAS E EFEITOS VISUAIS
// ====================================================================
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.comicTexts = [];
    this.rainDrops = [];

    for (let i = 0; i < 75; i++) {
      this.rainDrops.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        speed: 11 + Math.random() * 6,
        length: 12 + Math.random() * 8,
        alpha: 0.16 + Math.random() * 0.18
      });
    }
  }

  update(worldWidth, worldHeight, camera) {
    for (let r of this.rainDrops) {
      r.y += r.speed;
      r.x -= r.speed * 0.16;
      if (r.y > 540) {
        r.y = -20;
        r.x = Math.random() * 1050;
      }
      if (r.x < -20) {
        r.x = 980;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag || 0.98;
      p.vy *= p.drag || 0.98;
      p.alpha -= p.fade;
      p.size += p.grow || 0;

      if (p.alpha <= 0 || p.size <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.comicTexts.length - 1; i >= 0; i--) {
      const ct = this.comicTexts[i];
      ct.y += ct.vy;
      ct.life -= 1;
      if (ct.life <= 0) {
        this.comicTexts.splice(i, 1);
      }
    }
  }

  spawnDust(x, y, count = 4, color = '#6b7280') {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y,
        vx: (Math.random() - 0.5) * 1.6,
        vy: -Math.random() * 1.2,
        size: 2 + Math.random() * 3,
        alpha: 0.7,
        fade: 0.04,
        color: color
      });
    }
  }

  spawnShadowWisps(x, y, count = 8, color = '#9d4edd') {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -0.5 - Math.random() * 2.0,
        size: 3 + Math.random() * 4,
        alpha: 0.85,
        fade: 0.035,
        drag: 0.94,
        color: color
      });
    }
  }

  spawnShardSparkles(x, y) {
    const colors = ['#3bf4d1', '#9d4edd', '#ffffff', '#f8c23a'];
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = 2.5 + Math.random() * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        alpha: 1,
        fade: 0.04,
        color: colors[i % colors.length]
      });
    }
  }

  spawnComicText(text, x, y, color = '#f8c23a', bgColor = '#000') {
    this.comicTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -0.7,
      life: 55,
      color: color,
      bgColor: bgColor
    });
  }

  renderWorld(ctx, camera) {
    for (let p of this.particles) {
      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;
      if (screenX < -20 || screenX > 980 || screenY < -20 || screenY > 560) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let ct of this.comicTexts) {
      const screenX = ct.x - camera.x;
      const screenY = ct.y - camera.y;

      ctx.save();
      ctx.font = 'bold 14px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(ct.text);
      const padX = 8;
      const padY = 4;

      ctx.fillStyle = ct.bgColor;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fillRect(screenX - metrics.width / 2 - padX, screenY - 10 - padY, metrics.width + padX * 2, 20 + padY * 2);
      ctx.strokeRect(screenX - metrics.width / 2 - padX, screenY - 10 - padY, metrics.width + padX * 2, 20 + padY * 2);

      ctx.fillStyle = ct.color;
      ctx.fillText(ct.text, screenX, screenY);
      ctx.restore();
    }
  }

  renderScreen(ctx) {
    ctx.save();
    ctx.strokeStyle = '#8ba3d4';
    ctx.lineWidth = 1.2;
    for (let r of this.rainDrops) {
      ctx.globalAlpha = r.alpha;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 2, r.y + r.length);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ====================================================================
// 4. PERSONAGEM PRINCIPAL: NOCT
// ====================================================================
class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 36;
    this.vx = 0;
    this.vy = 0;

    // Física refinada para pulos confortáveis e responsivos
    this.accel = 0.6;
    this.friction = 0.78;
    this.maxSpeed = 3.8;
    this.jumpForce = -9.6; // Alcance vertical de até 110px
    this.gravity = 0.42;
    this.maxFallSpeed = 10;

    this.grounded = false;
    this.facing = 1;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.invulnerableTimer = 0;
    this.animTimer = 0;
    this.capeSway = 0;

    this.isCastingShadow = false;

    this.capeSegments = [
      { x: this.x, y: this.y + 12 },
      { x: this.x, y: this.y + 22 },
      { x: this.x, y: this.y + 32 }
    ];
  }

  resetPosition(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.invulnerableTimer = 0;
    this.isCastingShadow = false;
  }

  update(input, level, audio, particles) {
    if (this.isCastingShadow) {
      this.vx *= 0.5;
      this.vy += this.gravity;
      this.y += this.vy;
      this.resolveVerticalCollisions(level);
      this.updateCape();
      return null;
    }

    // Movimento Lateral
    if (input.isDown('left')) {
      this.vx -= this.accel;
      this.facing = -1;
      if (this.grounded && Math.random() < 0.2) {
        particles.spawnDust(this.x + this.width, this.y + this.height, 1);
      }
    } else if (input.isDown('right')) {
      this.vx += this.accel;
      this.facing = 1;
      if (this.grounded && Math.random() < 0.2) {
        particles.spawnDust(this.x, this.y + this.height, 1);
      }
    } else {
      this.vx *= this.friction;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));

    // Coyote Time & Jump Buffer
    if (this.grounded) {
      this.coyoteTimer = 6;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer--;
    }

    if (input.wasJustPressed('jump')) {
      this.jumpBufferTimer = 6;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }

    // Pulo
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = this.jumpForce;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      audio.playJump();
      particles.spawnDust(this.x + this.width / 2, this.y + this.height, 5);
    }

    // Pulo de altura variável
    if (!input.isDown('jump') && this.vy < -2) {
      this.vy *= 0.6;
    }

    this.vy += this.gravity;
    if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;

    // Resolução AABB nos eixos X e Y
    this.x += this.vx;
    this.resolveHorizontalCollisions(level);

    const wasGrounded = this.grounded;
    this.grounded = false;
    this.y += this.vy;
    this.resolveVerticalCollisions(level);

    if (!wasGrounded && this.grounded && this.vy >= 0) {
      particles.spawnDust(this.x + this.width / 2, this.y + this.height, 4);
    }

    this.updateCape();
    this.animTimer += 0.15;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    // Limites de mapa
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > level.width) this.x = level.width - this.width;
    if (this.y > level.height + 80) {
      return 'fell_into_void';
    }
    return null;
  }

  resolveHorizontalCollisions(level) {
    const solids = level.getSolidBlocks();
    for (let block of solids) {
      if (this.intersects(block)) {
        if (this.vx > 0) {
          this.x = block.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = block.x + block.width;
          this.vx = 0;
        }
      }
    }
  }

  resolveVerticalCollisions(level) {
    const solids = level.getSolidBlocks();
    for (let block of solids) {
      if (this.intersects(block)) {
        if (this.vy > 0) {
          this.y = block.y - this.height;
          this.vy = 0;
          this.grounded = true;
        } else if (this.vy < 0) {
          this.y = block.y + block.height;
          this.vy = 0;
        }
      }
    }

    // Plataformas semi-sólidas
    const oneWays = level.getOneWayPlatforms();
    for (let plat of oneWays) {
      if (this.vy >= 0 && (this.y + this.height - this.vy) <= plat.y + 4) {
        if (this.x + this.width > plat.x && this.x < plat.x + plat.width) {
          if (this.y + this.height >= plat.y && this.y + this.height <= plat.y + 12) {
            this.y = plat.y - this.height;
            this.vy = 0;
            this.grounded = true;
          }
        }
      }
    }
  }

  ensureSafePosition(level) {
    const solids = level.getSolidBlocks();
    for (let block of solids) {
      if (this.intersects(block)) {
        const pushUp = (this.y + this.height) - block.y;
        const pushDown = (block.y + block.height) - this.y;
        const pushLeft = (this.x + this.width) - block.x;
        const pushRight = (block.x + block.width) - this.x;

        const minPush = Math.min(pushUp, pushDown, pushLeft, pushRight);
        if (minPush === pushUp) {
          this.y -= pushUp;
          this.vy = 0;
          this.grounded = true;
        } else if (minPush === pushLeft) {
          this.x -= pushLeft;
          this.vx = 0;
        } else if (minPush === pushRight) {
          this.x += pushRight;
          this.vx = 0;
        } else {
          this.y += pushDown;
          this.vy = 0;
        }
      }
    }
  }

  intersects(rect) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }

  updateCape() {
    this.capeSway += 0.08;
    const anchorX = this.facing === 1 ? this.x + 5 : this.x + this.width - 5;
    const anchorY = this.y + 12;

    this.capeSegments[0].x = anchorX;
    this.capeSegments[0].y = anchorY;

    const wind = Math.sin(this.capeSway) * 1.5;
    const dragX = -this.vx * 3.5 - (this.facing * 5) + wind;
    const dragY = -this.vy * 1.5;

    this.capeSegments[1].x += (anchorX + dragX * 0.6 - this.capeSegments[1].x) * 0.35;
    this.capeSegments[1].y += (anchorY + 10 + dragY * 0.4 - this.capeSegments[1].y) * 0.35;

    this.capeSegments[2].x += (this.capeSegments[1].x + dragX * 0.9 - this.capeSegments[2].x) * 0.35;
    this.capeSegments[2].y += (this.capeSegments[1].y + 12 + dragY * 0.7 - this.capeSegments[2].y) * 0.35;
  }

  render(ctx, camera, isShadowWorld) {
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();

    if (this.grounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(screenX + this.width / 2, screenY + this.height, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1. Capa curta dinâmica
    ctx.fillStyle = isShadowWorld ? '#480ca8' : '#0e111d';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.capeSegments[0].x - camera.x, this.capeSegments[0].y - camera.y);
    ctx.quadraticCurveTo(
      this.capeSegments[1].x - camera.x, this.capeSegments[1].y - camera.y,
      this.capeSegments[2].x - camera.x, this.capeSegments[2].y - camera.y
    );
    ctx.lineTo(this.capeSegments[2].x - camera.x + (this.facing * -6), this.capeSegments[2].y - camera.y - 2);
    ctx.quadraticCurveTo(
      this.capeSegments[1].x - camera.x + (this.facing * -4), this.capeSegments[1].y - camera.y - 2,
      this.capeSegments[0].x - camera.x, this.capeSegments[0].y - camera.y
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Brilho no Mundo das Sombras
    if (isShadowWorld) {
      ctx.shadowColor = '#3bf4d1';
      ctx.shadowBlur = 10;
    }

    // 3. Traje e Torso
    ctx.fillStyle = isShadowWorld ? '#1a0b2e' : '#141724';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(screenX + 3, screenY + 12, this.width - 6, this.height - 12, [3, 3, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Cinto com fivela âmbar
    ctx.fillStyle = '#f8c23a';
    ctx.fillRect(screenX + this.width / 2 - 3, screenY + 22, 6, 4);

    // 4. Máscara com Orelhas Cartoon Estilizadas
    ctx.fillStyle = isShadowWorld ? '#240046' : '#10131e';
    ctx.beginPath();
    ctx.roundRect(screenX + 2, screenY + 2, this.width - 4, 16, [6, 6, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Orelha esquerda
    ctx.beginPath();
    ctx.moveTo(screenX + 4, screenY + 3);
    ctx.lineTo(screenX + 1, screenY - 5);
    ctx.lineTo(screenX + 8, screenY + 2);
    ctx.fill();
    ctx.stroke();

    // Orelha direita
    ctx.beginPath();
    ctx.moveTo(screenX + this.width - 8, screenY + 2);
    ctx.lineTo(screenX + this.width - 1, screenY - 5);
    ctx.lineTo(screenX + this.width - 4, screenY + 3);
    ctx.fill();
    ctx.stroke();

    // 5. Olhos Expressivos
    ctx.shadowBlur = 0;
    ctx.fillStyle = isShadowWorld ? '#3bf4d1' : '#ffffff';
    const eyeOffsetX = this.facing === 1 ? 5 : 2;
    ctx.beginPath();
    ctx.ellipse(screenX + eyeOffsetX + 4, screenY + 9, 3, 2.2, (this.facing * 0.15), 0, Math.PI * 2);
    ctx.ellipse(screenX + eyeOffsetX + 10, screenY + 9, 3, 2.2, (this.facing * 0.15), 0, Math.PI * 2);
    ctx.fill();

    // Se estiver projetando sombra
    if (this.isCastingShadow) {
      ctx.strokeStyle = '#9d4edd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(screenX + this.width / 2, screenY + this.height / 2, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ====================================================================
// 5. MECÂNICA DA SOMBRA SEPARADA (FASE 4+)
// ====================================================================
class ShadowClone {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.width = 24;
    this.height = 36;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.facing = 1;
    this.maxDuration = 420; // 7 segundos a 60 FPS
    this.timer = 0;
    this.maxDistance = 300;
  }

  activate(player) {
    this.active = true;
    this.x = player.x;
    this.y = player.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = player.facing;
    this.timer = this.maxDuration;
    player.isCastingShadow = true;
  }

  deactivate(player) {
    this.active = false;
    player.isCastingShadow = false;
  }

  update(input, player, level, particles, audio) {
    if (!this.active) return;

    this.timer--;
    if (this.timer <= 0 || input.wasJustPressed('shadow')) {
      audio.playShadowClone();
      particles.spawnShadowWisps(this.x + this.width / 2, this.y + this.height / 2, 8);
      this.deactivate(player);
      return;
    }

    const accel = 0.6;
    const friction = 0.78;
    const maxSpeed = 3.8;

    if (input.isDown('left')) {
      this.vx -= accel;
      this.facing = -1;
    } else if (input.isDown('right')) {
      this.vx += accel;
      this.facing = 1;
    } else {
      this.vx *= friction;
    }
    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

    if (input.wasJustPressed('jump') && this.grounded) {
      this.vy = -9.6;
      this.grounded = false;
      audio.playJump();
    }

    this.vy += 0.42;
    if (this.vy > 10) this.vy = 10;

    this.x += this.vx;
    this.resolveHorizontal(level);

    this.grounded = false;
    this.y += this.vy;
    this.resolveVertical(level);

    // Limite de Distância da Corda de Sombra
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.maxDistance) {
      const angle = Math.atan2(dy, dx);
      this.x = player.x + Math.cos(angle) * this.maxDistance;
      this.y = player.y + Math.sin(angle) * this.maxDistance;
      this.vx *= 0.5;
    }

    if (Math.random() < 0.25) {
      particles.spawnShadowWisps(this.x + this.width / 2, this.y + this.height, 1, '#3bf4d1');
    }
  }

  resolveHorizontal(level) {
    const solids = level.getSolidBlocks(true);
    for (let block of solids) {
      if (this.intersects(block)) {
        if (this.vx > 0) {
          this.x = block.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = block.x + block.width;
          this.vx = 0;
        }
      }
    }
  }

  resolveVertical(level) {
    const solids = level.getSolidBlocks(true);
    for (let block of solids) {
      if (this.intersects(block)) {
        if (this.vy > 0) {
          this.y = block.y - this.height;
          this.vy = 0;
          this.grounded = true;
        } else if (this.vy < 0) {
          this.y = block.y + block.height;
          this.vy = 0;
        }
      }
    }
  }

  intersects(rect) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }

  render(ctx, camera, player) {
    if (!this.active) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    const playerScreenX = player.x - camera.x + player.width / 2;
    const playerScreenY = player.y - camera.y + player.height / 2;

    ctx.save();

    // Linha de Vínculo Etéreo
    ctx.strokeStyle = 'rgba(59, 244, 209, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(playerScreenX, playerScreenY);
    ctx.lineTo(screenX + this.width / 2, screenY + this.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Silhueta da Sombra
    ctx.shadowColor = '#9d4edd';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(157, 78, 221, 0.85)';
    ctx.beginPath();
    ctx.roundRect(screenX, screenY, this.width, this.height, 4);
    ctx.fill();

    // Olhos ciano da sombra
    ctx.fillStyle = '#3bf4d1';
    const eyeOffsetX = this.facing === 1 ? 6 : 2;
    ctx.beginPath();
    ctx.arc(screenX + eyeOffsetX + 4, screenY + 10, 2.5, 0, Math.PI * 2);
    ctx.arc(screenX + eyeOffsetX + 10, screenY + 10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ====================================================================
// 6. PLATAFORMAS MÓVEIS (ELEVADORES)
// ====================================================================
class MovingPlatform {
  constructor(data) {
    this.id = data.id;
    this.x = data.x;
    this.y = data.y;
    this.width = data.width || 120;
    this.height = data.height || 18;
    this.axis = data.axis || 'x'; // 'x' ou 'y'
    this.min = data.min;
    this.max = data.max;
    this.speed = data.speed || 1.2;
    this.dir = 1;
    this.world = data.world || 'all';
    this.prevX = this.x;
    this.prevY = this.y;
  }

  update(player, shadowClone, isShadowWorld) {
    if (this.world === 'real' && isShadowWorld) return;
    if (this.world === 'shadow' && !isShadowWorld) return;

    this.prevX = this.x;
    this.prevY = this.y;

    if (this.axis === 'x') {
      this.x += this.speed * this.dir;
      if (this.x <= this.min) { this.x = this.min; this.dir = 1; }
      else if (this.x >= this.max) { this.x = this.max; this.dir = -1; }
    } else {
      this.y += this.speed * this.dir;
      if (this.y <= this.min) { this.y = this.min; this.dir = 1; }
      else if (this.y >= this.max) { this.y = this.max; this.dir = -1; }
    }

    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;

    // Deslocar passageiros suavemente
    if (player.grounded &&
        player.x + player.width > this.x &&
        player.x < this.x + this.width &&
        Math.abs((player.y + player.height) - this.y) <= 8) {
      player.x += dx;
      player.y += dy;
    }

    if (shadowClone && shadowClone.active && shadowClone.grounded &&
        shadowClone.x + shadowClone.width > this.x &&
        shadowClone.x < this.x + this.width &&
        Math.abs((shadowClone.y + shadowClone.height) - this.y) <= 8) {
      shadowClone.x += dx;
      shadowClone.y += dy;
    }
  }

  render(ctx, camera, isShadowWorld) {
    if (this.world === 'real' && isShadowWorld) return;
    if (this.world === 'shadow' && !isShadowWorld) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.fillStyle = isShadowWorld ? '#480ca8' : '#28314a';
    ctx.strokeStyle = isShadowWorld ? '#3bf4d1' : '#000000';
    ctx.lineWidth = 2.5;
    ctx.fillRect(screenX, screenY, this.width, this.height);
    ctx.strokeRect(screenX, screenY, this.width, this.height);

    // Detalhe mecânico
    ctx.fillStyle = isShadowWorld ? '#3bf4d1' : '#f8c23a';
    ctx.fillRect(screenX + this.width / 2 - 12, screenY + 4, 24, 4);
    ctx.restore();
  }
}

// ====================================================================
// 7. INIMIGOS: GUARDA, SENTINELA E CAÇADOR DAS SOMBRAS
// ====================================================================
class Enemy {
  constructor(type, x, y, minX, maxX, options = {}) {
    this.type = type; // 'guard', 'sentinel', 'hunter'
    this.x = x;
    this.y = y;
    this.minX = minX;
    this.maxX = maxX;
    this.width = options.width || 26;
    this.height = options.height || 38;
    this.speed = options.speed || 1.2;
    this.facing = options.facing || 1;
    this.state = 'patrol';
    this.searchTimer = 0;
    this.visionRange = options.visionRange || 140;
    this.coneAngle = options.coneAngle || 0.45;
    this.sweepAngle = 0;
  }

  update(player, shadowClone, isShadowWorld, audio, particles, level) {
    if (this.type === 'guard') {
      this.updateGuard(player, isShadowWorld, audio, particles, level);
    } else if (this.type === 'sentinel') {
      this.updateSentinel(player, isShadowWorld, audio, particles);
    } else if (this.type === 'hunter') {
      this.updateHunter(player, isShadowWorld, audio, particles, level);
    }
  }

  // 1. GUARDA DA NOITE
  // Patrulha com lanterna. Enxerga no MUNDO REAL. Ignora Noct no MUNDO DAS SOMBRAS.
  updateGuard(player, isShadowWorld, audio, particles, level) {
    const canSee = !isShadowWorld && this.hasLineOfSight(player, level);

    if (canSee) {
      if (this.state !== 'alert') {
        this.state = 'alert';
        audio.playGuardAlert();
        particles.spawnComicText('!', this.x + this.width / 2, this.y - 10, '#ff2a5f');
      }
      this.facing = player.x > this.x ? 1 : -1;
      this.x += this.facing * (this.speed * 1.5);
    } else {
      if (this.state === 'alert') {
        this.state = 'search';
        this.searchTimer = 75;
        particles.spawnComicText('?', this.x + this.width / 2, this.y - 10, '#f8c23a');
      } else if (this.state === 'search') {
        this.searchTimer--;
        if (this.searchTimer <= 0) this.state = 'patrol';
      } else {
        this.x += this.facing * this.speed;
        if (this.x <= this.minX) {
          this.x = this.minX;
          this.facing = 1;
        } else if (this.x >= this.maxX) {
          this.x = this.maxX;
          this.facing = -1;
        }
      }
    }
  }

  // 2. SENTINELA FIXO
  // Refletor de varredura. Causa dano no MUNDO REAL. Inofensivo nas sombras.
  updateSentinel(player, isShadowWorld, audio, particles) {
    this.sweepAngle += 0.025;
    const currentAngle = Math.sin(this.sweepAngle) * 0.7 + (this.facing === 1 ? 0 : Math.PI);

    if (!isShadowWorld) {
      const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
      const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy);

      if (dist < this.visionRange) {
        const angleToPlayer = Math.atan2(dy, dx);
        let diff = Math.abs(currentAngle - angleToPlayer);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

        if (diff < this.coneAngle) {
          this.state = 'alert';
          return;
        }
      }
    }
    this.state = 'patrol';
  }

  // 3. CAÇADOR DAS SOMBRAS (Fases 5 e 6)
  // Cão/Espectro. Enxerga Noct apenas no MUNDO DAS SOMBRAS!
  updateHunter(player, isShadowWorld, audio, particles, level) {
    const canSee = isShadowWorld && this.hasLineOfSight(player, level);

    if (canSee) {
      if (this.state !== 'alert') {
        this.state = 'alert';
        audio.playGuardAlert();
        particles.spawnComicText('ROSNA!', this.x + this.width / 2, this.y - 12, '#9d4edd', '#110224');
      }
      this.facing = player.x > this.x ? 1 : -1;
      this.x += this.facing * (this.speed * 1.6);
    } else {
      if (this.state === 'alert') {
        this.state = 'search';
        this.searchTimer = 60;
        particles.spawnComicText('?', this.x + this.width / 2, this.y - 10, '#3bf4d1');
      } else if (this.state === 'search') {
        this.searchTimer--;
        if (this.searchTimer <= 0) this.state = 'patrol';
      } else {
        this.x += this.facing * this.speed;
        if (this.x <= this.minX) {
          this.x = this.minX;
          this.facing = 1;
        } else if (this.x >= this.maxX) {
          this.x = this.maxX;
          this.facing = -1;
        }
      }
    }
  }

  hasLineOfSight(target, level) {
    const myCenterX = this.x + this.width / 2;
    const myCenterY = this.y + this.height / 2;
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;

    const dx = targetCenterX - myCenterX;
    const dy = targetCenterY - myCenterY;
    const dist = Math.hypot(dx, dy);

    if (dist > this.visionRange) return false;

    const isFacingTarget = (this.facing === 1 && dx > -10) || (this.facing === -1 && dx < 10);
    if (!isFacingTarget) return false;

    if (Math.abs(dy) > 55) return false;

    // Checar se há paredes sólidas bloqueando
    if (level) {
      const solids = level.getSolidBlocks();
      for (let s of solids) {
        const wallMinX = Math.min(myCenterX, targetCenterX);
        const wallMaxX = Math.max(myCenterX, targetCenterX);
        if (s.x > wallMinX && s.x + s.width < wallMaxX) {
          if (s.y <= Math.max(myCenterY, targetCenterY) && s.y + s.height >= Math.min(myCenterY, targetCenterY)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  checkPlayerCollision(player, isShadowWorld) {
    // Sentinela causa dano no cone de varredura
    if (this.type === 'sentinel') {
      return !isShadowWorld && this.state === 'alert';
    }

    // Colisão direta de corpo com Guarda ou Caçador
    return (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    );
  }

  render(ctx, camera, isShadowWorld) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();

    // 1. CONES DE VISÃO
    if (this.type === 'guard') {
      if (!isShadowWorld) {
        ctx.fillStyle = this.state === 'alert' ? 'rgba(255, 42, 95, 0.35)' : 'rgba(248, 194, 58, 0.22)';
        ctx.beginPath();
        const originX = screenX + (this.facing === 1 ? this.width : 0);
        const originY = screenY + 14;
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + this.facing * this.visionRange, originY - 32);
        ctx.lineTo(originX + this.facing * this.visionRange, originY + 42);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.type === 'sentinel') {
      if (!isShadowWorld) {
        ctx.fillStyle = this.state === 'alert' ? 'rgba(255, 42, 95, 0.4)' : 'rgba(248, 194, 58, 0.25)';
        ctx.beginPath();
        const originX = screenX + this.width / 2;
        const originY = screenY + this.height / 2;
        const angle = Math.sin(this.sweepAngle) * 0.7 + (this.facing === 1 ? 0 : Math.PI);
        ctx.moveTo(originX, originY);
        ctx.arc(originX, originY, this.visionRange, angle - this.coneAngle, angle + this.coneAngle);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.type === 'hunter') {
      if (isShadowWorld) {
        ctx.fillStyle = this.state === 'alert' ? 'rgba(255, 42, 95, 0.45)' : 'rgba(157, 78, 221, 0.32)';
        ctx.beginPath();
        const originX = screenX + (this.facing === 1 ? this.width : 0);
        const originY = screenY + 16;
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + this.facing * this.visionRange, originY - 28);
        ctx.lineTo(originX + this.facing * this.visionRange, originY + 38);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 2. SPRITE DO INIMIGO
    if (this.type === 'guard') {
      ctx.fillStyle = '#1c2541';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(screenX + 3, screenY + 12, this.width - 6, this.height - 12);
      ctx.strokeRect(screenX + 3, screenY + 12, this.width - 6, this.height - 12);

      ctx.fillStyle = '#f1c098';
      ctx.fillRect(screenX + 6, screenY + 4, this.width - 12, 10);

      ctx.fillStyle = '#0b132b';
      ctx.fillRect(screenX + 4, screenY, this.width - 8, 6);

      ctx.fillStyle = '#f8c23a';
      const lanternX = this.facing === 1 ? screenX + this.width - 2 : screenX - 6;
      ctx.fillRect(lanternX, screenY + 14, 8, 6);
    } else if (this.type === 'sentinel') {
      ctx.fillStyle = '#3a3f58';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(screenX + this.width / 2, screenY + this.height / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = this.state === 'alert' ? '#ff2a5f' : '#f8c23a';
      ctx.beginPath();
      ctx.arc(screenX + this.width / 2, screenY + this.height / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'hunter') {
      ctx.fillStyle = isShadowWorld ? '#240046' : 'rgba(36, 0, 70, 0.4)';
      ctx.strokeStyle = '#3bf4d1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(screenX, screenY + 6, this.width, this.height - 6, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ff2a5f';
      const hEyeX = this.facing === 1 ? screenX + this.width - 8 : screenX + 4;
      ctx.fillRect(hEyeX, screenY + 12, 4, 3);
    }

    ctx.restore();
  }
}

// ====================================================================
// 8. OBJETOS INTERATIVOS E DETALHES DE AMBIENTAÇÃO
// ====================================================================
class PuzzleObject {
  constructor(data) {
    this.id = data.id;
    this.type = data.type; // 'button', 'door', 'lever', 'crate', 'checkpoint', 'shard', 'goal', 'cat', 'sign'
    this.world = data.world || 'all';
    this.x = data.x;
    this.y = data.y;
    this.width = data.width || 32;
    this.height = data.height || 32;
    this.state = data.state || false;
    this.targetId = data.targetId || null;
    this.keepPressed = data.keepPressed || false;
    this.initialY = data.y;
    this.vy = 0;
    this.canInteract = false;
    this.label = data.label || '';
    this.catMeowed = false;
  }

  update(player, shadowClone, level, audio, particles, input) {
    // 1. BOTÃO / PLACA DE PRESSÃO
    if (this.type === 'button') {
      const isOccupied = this.checkActivation(player, shadowClone, level);
      if (isOccupied && !this.state) {
        this.state = true;
        audio.playButtonClick();
        particles.spawnComicText('CLICK!', this.x + this.width / 2, this.y - 12);
        if (this.targetId) level.toggleObject(this.targetId, true);
      } else if (!isOccupied && this.state && !this.keepPressed) {
        this.state = false;
        if (this.targetId) level.toggleObject(this.targetId, false);
      }
    }

    // 2. ALAVANCA MECÂNICA [E]
    if (this.type === 'lever') {
      const distPlayer = Math.hypot((player.x + player.width / 2) - (this.x + this.width / 2), (player.y + player.height / 2) - (this.y + this.height / 2));
      const distShadow = (shadowClone && shadowClone.active) ? Math.hypot((shadowClone.x + shadowClone.width / 2) - (this.x + this.width / 2), (shadowClone.y + shadowClone.height / 2) - (this.y + this.height / 2)) : 999;

      if (distPlayer < 45 || distShadow < 45) {
        this.canInteract = true;
        if (input.wasJustPressed('interact')) {
          this.state = !this.state;
          audio.playButtonClick();
          particles.spawnComicText(this.state ? 'ABERTO!' : 'TRAVADO!', this.x + this.width / 2, this.y - 12);
          if (this.targetId) level.toggleObject(this.targetId, this.state);
        }
      } else {
        this.canInteract = false;
      }
    }

    // 3. PORTA / GRADE DE SEGURANÇA
    if (this.type === 'door') {
      if (this.state) {
        if (this.y > this.initialY - this.height + 4) {
          this.y -= 3;
        }
      } else {
        if (this.y < this.initialY) {
          this.y += 3;
        }
      }
    }

    // 4. CAIXA EMPURRÁVEL (CRATE)
    if (this.type === 'crate') {
      this.vy += 0.42;
      this.y += this.vy;

      const solids = level.getSolidBlocks(level.isShadowWorld);
      for (let s of solids) {
        if (s !== this && this.intersects(s)) {
          if (this.vy > 0) {
            this.y = s.y - this.height;
            this.vy = 0;
          }
        }
      }

      if (player.intersects(this)) {
        if (player.vx > 0) this.x += 1.6;
        if (player.vx < 0) this.x -= 1.6;
      }
    }

    // 5. CHECKPOINT
    if (this.type === 'checkpoint' && !this.state) {
      if (player.intersects(this)) {
        this.state = true;
        audio.playCheckpoint();
        level.setCheckpoint(this.x, this.y);
        particles.spawnComicText('CHECKPOINT!', this.x + this.width / 2, this.y - 20, '#f8c23a');
      }
    }

    // 6. FRAGMENTO DE SOMBRA
    if (this.type === 'shard' && !this.state) {
      if (player.intersects(this)) {
        this.state = true;
        audio.playCollectShard();
        particles.spawnShardSparkles(this.x + this.width / 2, this.y + this.height / 2);
        level.collectShard(this.id);
      }
    }

    // 7. GATO NO BECO (Detalhe engraçado de HQ)
    if (this.type === 'cat' && !this.catMeowed) {
      const dist = Math.hypot((player.x + player.width / 2) - (this.x + this.width / 2), (player.y + player.height / 2) - (this.y + this.height / 2));
      if (dist < 50) {
        this.catMeowed = true;
        audio.playMeow();
        particles.spawnComicText('MIAU~ 🐈', this.x + this.width / 2, this.y - 14, '#3bf4d1');
      }
    }
  }

  checkActivation(player, shadowClone, level) {
    if (player.intersects(this)) return true;
    if (shadowClone && shadowClone.active && shadowClone.intersects(this)) return true;
    for (let obj of level.objects) {
      if (obj.type === 'crate' && obj.intersects(this)) return true;
    }
    return false;
  }

  intersects(rect) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }

  render(ctx, camera, isShadowWorld) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (this.world === 'real' && isShadowWorld) return;
    if (this.world === 'shadow' && !isShadowWorld) return;

    ctx.save();

    if (this.type === 'button') {
      ctx.fillStyle = this.state ? '#3bf4d1' : (this.world === 'shadow' ? '#9d4edd' : '#f8c23a');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      const btnHeight = this.state ? 4 : 8;
      ctx.fillRect(screenX, screenY + (this.height - btnHeight), this.width, btnHeight);
      ctx.strokeRect(screenX, screenY + (this.height - btnHeight), this.width, btnHeight);
    } else if (this.type === 'door') {
      ctx.fillStyle = '#2b3044';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.fillRect(screenX, screenY, this.width, this.height);
      ctx.strokeRect(screenX, screenY, this.width, this.height);
      ctx.strokeStyle = '#151928';
      for (let lx = screenX + 6; lx < screenX + this.width; lx += 8) {
        ctx.beginPath();
        ctx.moveTo(lx, screenY);
        ctx.lineTo(lx, screenY + this.height);
        ctx.stroke();
      }
    } else if (this.type === 'lever') {
      ctx.fillStyle = '#0f121d';
      ctx.fillRect(screenX + 8, screenY + 16, 16, 12);
      ctx.strokeStyle = this.state ? '#3bf4d1' : '#ff2a5f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(screenX + 16, screenY + 20);
      ctx.lineTo(screenX + (this.state ? 26 : 6), screenY + 4);
      ctx.stroke();

      if (this.canInteract) {
        ctx.fillStyle = '#f8c23a';
        ctx.font = 'bold 11px "Impact", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('[E] ALAVANCA', screenX + 16, screenY - 4);
      }
    } else if (this.type === 'crate') {
      ctx.fillStyle = '#5c4d3c';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.fillRect(screenX, screenY, this.width, this.height);
      ctx.strokeRect(screenX, screenY, this.width, this.height);
      ctx.strokeRect(screenX + 4, screenY + 4, this.width - 8, this.height - 8);
    } else if (this.type === 'checkpoint') {
      ctx.fillStyle = '#1c2236';
      ctx.fillRect(screenX + this.width / 2 - 3, screenY + 10, 6, this.height - 10);
      ctx.fillStyle = this.state ? '#3bf4d1' : '#f8c23a';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenX + this.width / 2, screenY + 10, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'shard' && !this.state) {
      const bob = Math.sin(Date.now() * 0.005) * 4;
      ctx.shadowColor = '#9d4edd';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#9d4edd';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(screenX + this.width / 2, screenY + bob);
      ctx.lineTo(screenX + this.width, screenY + this.height / 2 + bob);
      ctx.lineTo(screenX + this.width / 2, screenY + this.height + bob);
      ctx.lineTo(screenX, screenY + this.height / 2 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'goal') {
      ctx.strokeStyle = '#f8c23a';
      ctx.lineWidth = 3;
      ctx.strokeRect(screenX, screenY, this.width, this.height);
      ctx.fillStyle = 'rgba(248, 194, 58, 0.2)';
      ctx.fillRect(screenX, screenY, this.width, this.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Impact", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.label || 'SAÍDA', screenX + this.width / 2, screenY - 6);
    } else if (this.type === 'cat') {
      // Gato preto de beco com olhos amarelos
      ctx.fillStyle = '#08080c';
      ctx.beginPath();
      ctx.ellipse(screenX + 12, screenY + 14, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cabeça e orelhas
      ctx.beginPath();
      ctx.arc(screenX + 6, screenY + 9, 6, 0, Math.PI * 2);
      ctx.fill();
      // Olhos amarelos
      ctx.fillStyle = '#f8c23a';
      ctx.fillRect(screenX + 4, screenY + 8, 2, 2);
      // Rabo curvado
      ctx.strokeStyle = '#08080c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(screenX + 22, screenY + 15);
      ctx.quadraticCurveTo(screenX + 28, screenY + 5, screenX + 24, screenY);
      ctx.stroke();
    } else if (this.type === 'sign') {
      // Placa com texto de quadrinhos
      ctx.fillStyle = '#22283a';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fillRect(screenX, screenY, this.width, this.height);
      ctx.strokeRect(screenX, screenY, this.width, this.height);
      ctx.fillStyle = '#f8c23a';
      ctx.font = 'bold 9px "Impact", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, screenX + this.width / 2, screenY + 12);
    }

    ctx.restore();
  }
}

// ====================================================================
// 9. GERENCIADOR DE FASES (AS 6 FASES COMPLETAS E BALANCEADAS)
// ====================================================================
class LevelManager {
  constructor() {
    this.currentLevelIndex = 1;
    this.isShadowWorld = false;
    this.collectedShards = new Set();
    this.shardsCount = 0;
    this.totalShardsInLevel = 3;

    this.width = 1600;
    this.height = 540;
    this.platforms = [];
    this.movingPlatforms = [];
    this.objects = [];
    this.enemies = [];
    this.checkpointPos = { x: 50, y: 400 };

    this.levelNames = [
      '',
      'O BECO',
      'A CIDADE ESCURA',
      'O OUTRO LADO',
      'A SOMBRA SOLTA',
      'CAÇADO',
      'A CIDADE SEM LUZ'
    ];

    this.objectives = [
      '',
      'Atravesse o beco usando o Mundo das Sombras (SHIFT).',
      'Ative o mecanismo nas sombras para abrir o portão.',
      'Atravesse os telhados alternando entre as realidades.',
      'Projete sua sombra (tecla Q) para acionar os mecanismos.',
      'Infiltre-se no Museu Noturno evitando os Caçadores.',
      'Alcance o topo da Torre e recupere o Coração da Noite!'
    ];
  }

  loadLevel(index, player) {
    this.currentLevelIndex = index;
    this.isShadowWorld = false;
    this.collectedShards.clear();
    this.shardsCount = 0;
    this.platforms = [];
    this.movingPlatforms = [];
    this.objects = [];
    this.enemies = [];

    const builder = this['buildLevel' + index];
    if (builder) {
      builder.call(this, player);
    }
  }

  // ----------------------------------------------------
  // FASE 1: O BECO (Dificuldade 2/10)
  // ----------------------------------------------------
  buildLevel1(player) {
    this.width = 1600;
    this.height = 540;
    this.checkpointPos = { x: 60, y: 420 };
    player.resetPosition(this.checkpointPos.x, this.checkpointPos.y);

    // Chão contínuo
    this.platforms.push({ x: 0, y: 480, width: 1600, height: 60, type: 'all' });

    // Plataformas de tutorial de pulo (degraus confortáveis de 70px)
    this.platforms.push({ x: 240, y: 410, width: 140, height: 20, type: 'all' });
    this.platforms.push({ x: 440, y: 340, width: 130, height: 20, type: 'all' });

    // Parede no Mundo Real que DESAPARECE no Mundo das Sombras
    this.platforms.push({ x: 640, y: 240, width: 32, height: 240, type: 'real' });

    // Placa de dica
    this.objects.push(new PuzzleObject({ id: 'sign1', type: 'sign', x: 570, y: 440, width: 60, height: 20, label: 'SHIFT=SOMBRA' }));

    // Gato de beco
    this.objects.push(new PuzzleObject({ id: 'cat1', type: 'cat', x: 700, y: 460, width: 24, height: 20 }));

    // Checkpoint intermediário
    this.objects.push(new PuzzleObject({ id: 'cp1', type: 'checkpoint', x: 740, y: 440, width: 20, height: 40 }));

    // Plataforma elevada
    this.platforms.push({ x: 860, y: 410, width: 160, height: 20, type: 'all' });

    // Guarda da Noite no final do beco
    this.enemies.push(new Enemy('guard', 1120, 442, 1050, 1380, { speed: 1.2 }));

    // Fragmentos de Sombra
    this.objects.push(new PuzzleObject({ id: 's1', type: 'shard', x: 290, y: 360, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's2', type: 'shard', x: 920, y: 360, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's3', type: 'shard', x: 1280, y: 440, width: 20, height: 20 }));

    // Saída do Beco
    this.objects.push(new PuzzleObject({ id: 'goal', type: 'goal', x: 1500, y: 400, width: 48, height: 80, label: 'SAÍDA' }));
  }

  // ----------------------------------------------------
  // FASE 2: A CIDADE ESCURA (Dificuldade 4/10)
  // ----------------------------------------------------
  buildLevel2(player) {
    this.width = 1900;
    this.height = 540;
    this.checkpointPos = { x: 50, y: 420 };
    player.resetPosition(this.checkpointPos.x, this.checkpointPos.y);

    this.platforms.push({ x: 0, y: 480, width: 1900, height: 60, type: 'all' });

    // Telhados
    this.platforms.push({ x: 180, y: 410, width: 180, height: 20, type: 'all' });
    this.platforms.push({ x: 400, y: 340, width: 160, height: 20, type: 'all' });

    // Guarda 1 nos telhados
    this.enemies.push(new Enemy('guard', 420, 302, 410, 540, { speed: 1.0 }));

    // Plataforma de sombra para alcançar o botão
    this.platforms.push({ x: 440, y: 260, width: 140, height: 18, type: 'shadow' });

    // Botão permanente no Mundo das Sombras que abre o portão
    this.objects.push(new PuzzleObject({ id: 'btn1', type: 'button', world: 'shadow', targetId: 'door1', keepPressed: true, x: 490, y: 252, width: 32, height: 8 }));

    // Portão de segurança
    this.objects.push(new PuzzleObject({ id: 'door1', type: 'door', x: 680, y: 320, width: 26, height: 160 }));

    // Checkpoint
    this.objects.push(new PuzzleObject({ id: 'cp2', type: 'checkpoint', x: 760, y: 440, width: 20, height: 40 }));

    // Elevador horizontal no armazém
    this.movingPlatforms.push(new MovingPlatform({ id: 'mp1', x: 880, y: 400, width: 120, height: 18, axis: 'x', min: 880, max: 1100, speed: 1.3 }));

    // Passarela alta com alavanca
    this.platforms.push({ x: 1200, y: 340, width: 180, height: 20, type: 'all' });
    this.objects.push(new PuzzleObject({ id: 'lev1', type: 'lever', targetId: 'door2', x: 1260, y: 308, width: 24, height: 32 }));
    this.objects.push(new PuzzleObject({ id: 'door2', type: 'door', x: 1440, y: 320, width: 26, height: 160 }));

    // Guarda 2 patrulhando no chão
    this.enemies.push(new Enemy('guard', 1050, 442, 950, 1380, { speed: 1.3 }));

    // Fragmentos
    this.objects.push(new PuzzleObject({ id: 's1', type: 'shard', x: 500, y: 200, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's2', type: 'shard', x: 1320, y: 290, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's3', type: 'shard', x: 1600, y: 440, width: 20, height: 20 }));

    // Saída
    this.objects.push(new PuzzleObject({ id: 'goal', type: 'goal', x: 1800, y: 400, width: 48, height: 80, label: 'ESCONDERIJO' }));
  }

  // ----------------------------------------------------
  // FASE 3: O OUTRO LADO (Dificuldade 5/10)
  // ----------------------------------------------------
  buildLevel3(player) {
    this.width = 2100;
    this.height = 540;
    this.checkpointPos = { x: 50, y: 420 };
    player.resetPosition(this.checkpointPos.x, this.checkpointPos.y);

    // Chão inicial e final com grande vão
    this.platforms.push({ x: 0, y: 480, width: 420, height: 60, type: 'all' });
    this.platforms.push({ x: 1680, y: 480, width: 420, height: 60, type: 'all' });

    // Pontes alternadas entre Real e Sombra
    this.platforms.push({ x: 460, y: 420, width: 110, height: 20, type: 'real' });
    this.platforms.push({ x: 620, y: 360, width: 110, height: 20, type: 'shadow' });
    this.platforms.push({ x: 780, y: 310, width: 110, height: 20, type: 'real' });

    // Elevador Vertical
    this.movingPlatforms.push(new MovingPlatform({ id: 'mp_vert', x: 940, y: 380, width: 120, height: 18, axis: 'y', min: 230, max: 400, speed: 1.4 }));

    // Sentinela fixo de varredura
    this.enemies.push(new Enemy('sentinel', 1120, 200, 1120, 1120, { visionRange: 160, facing: -1 }));

    // Checkpoint central
    this.platforms.push({ x: 1180, y: 330, width: 160, height: 210, type: 'all' });
    this.objects.push(new PuzzleObject({ id: 'cp3', type: 'checkpoint', x: 1240, y: 290, width: 20, height: 40 }));

    // Plataformas finais
    this.platforms.push({ x: 1390, y: 370, width: 120, height: 20, type: 'shadow' });
    this.platforms.push({ x: 1540, y: 420, width: 120, height: 20, type: 'real' });

    // Guarda na área final
    this.enemies.push(new Enemy('guard', 1780, 442, 1700, 1960, { speed: 1.3 }));

    // Fragmentos
    this.objects.push(new PuzzleObject({ id: 's1', type: 'shard', x: 660, y: 310, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's2', type: 'shard', x: 1430, y: 320, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's3', type: 'shard', x: 1850, y: 440, width: 20, height: 20 }));

    // Saída
    this.objects.push(new PuzzleObject({ id: 'goal', type: 'goal', x: 2000, y: 400, width: 48, height: 80, label: 'SAÍDA' }));
  }

  // ----------------------------------------------------
  // FASE 4: A SOMBRA SOLTA (Dificuldade 6/10)
  // ----------------------------------------------------
  buildLevel4(player) {
    this.width = 2000;
    this.height = 540;
    this.checkpointPos = { x: 50, y: 420 };
    player.resetPosition(this.checkpointPos.x, this.checkpointPos.y);

    this.platforms.push({ x: 0, y: 480, width: 2000, height: 60, type: 'all' });

    // SALA TUTORIAL DA SOMBRA: Grade sólida no Real, mas a Sombra (Q) atravessa
    this.platforms.push({ x: 360, y: 260, width: 20, height: 220, type: 'real' });
    this.objects.push(new PuzzleObject({ id: 'sign_q', type: 'sign', x: 270, y: 440, width: 80, height: 20, label: 'PRESSIONE [Q]' }));

    // Botão além da grade
    this.objects.push(new PuzzleObject({ id: 'btn_tut', type: 'button', targetId: 'door_tut', keepPressed: true, x: 440, y: 472, width: 32, height: 8 }));
    this.objects.push(new PuzzleObject({ id: 'door_tut', type: 'door', x: 540, y: 320, width: 24, height: 160 }));

    // Checkpoint 1
    this.objects.push(new PuzzleObject({ id: 'cp4_1', type: 'checkpoint', x: 620, y: 440, width: 20, height: 40 }));

    // PUZZLE DE 2 ANDARES COM SOMBRA
    this.platforms.push({ x: 750, y: 370, width: 260, height: 20, type: 'all' });
    this.platforms.push({ x: 860, y: 260, width: 180, height: 20, type: 'all' });

    // Guarda patrulhando no andar intermediário
    this.enemies.push(new Enemy('guard', 800, 332, 760, 980, { speed: 1.2 }));

    // Alavanca no topo operável pela sombra
    this.objects.push(new PuzzleObject({ id: 'lev_top', type: 'lever', targetId: 'door_final', x: 920, y: 228, width: 24, height: 32 }));
    this.objects.push(new PuzzleObject({ id: 'door_final', type: 'door', x: 1260, y: 320, width: 26, height: 160 }));

    // Checkpoint 2
    this.objects.push(new PuzzleObject({ id: 'cp4_2', type: 'checkpoint', x: 1340, y: 440, width: 20, height: 40 }));

    // Plataforma móvel na reta final
    this.movingPlatforms.push(new MovingPlatform({ id: 'mp_f4', x: 1480, y: 400, width: 120, height: 18, axis: 'x', min: 1480, max: 1700, speed: 1.4 }));

    // Fragmentos
    this.objects.push(new PuzzleObject({ id: 's1', type: 'shard', x: 440, y: 410, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's2', type: 'shard', x: 930, y: 190, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's3', type: 'shard', x: 1650, y: 350, width: 20, height: 20 }));

    // Saída
    this.objects.push(new PuzzleObject({ id: 'goal', type: 'goal', x: 1880, y: 400, width: 48, height: 80, label: 'TORRE' }));
  }

  // ----------------------------------------------------
  // FASE 5: CAÇADO (Dificuldade 8/10)
  // ----------------------------------------------------
  buildLevel5(player) {
    this.width = 2250;
    this.height = 540;
    this.checkpointPos = { x: 50, y: 420 };
    player.resetPosition(this.checkpointPos.x, this.checkpointPos.y);

    this.platforms.push({ x: 0, y: 480, width: 620, height: 60, type: 'all' });
    this.platforms.push({ x: 740, y: 480, width: 720, height: 60, type: 'all' });
    this.platforms.push({ x: 1600, y: 480, width: 650, height: 60, type: 'all' });

    // Setor 1: Guarda e Sentinela
    this.enemies.push(new Enemy('guard', 260, 442, 180, 440, { speed: 1.3 }));
    this.enemies.push(new Enemy('sentinel', 500, 360, 500, 500, { visionRange: 140, facing: -1 }));

    // Checkpoint 1
    this.objects.push(new PuzzleObject({ id: 'cp5_1', type: 'checkpoint', x: 580, y: 440, width: 20, height: 40 }));

    // SETOR 2: O CAÇADOR DAS SOMBRAS (enxerga nas sombras!)
    this.enemies.push(new Enemy('hunter', 980, 442, 850, 1260, { speed: 1.5 }));

    // Plataformas elevadas
    this.platforms.push({ x: 800, y: 380, width: 140, height: 20, type: 'all' });
    this.platforms.push({ x: 1020, y: 310, width: 150, height: 20, type: 'shadow' });

    // Caixa empurrável e botão
    this.objects.push(new PuzzleObject({ id: 'crate1', type: 'crate', x: 840, y: 340, width: 32, height: 32 }));
    this.objects.push(new PuzzleObject({ id: 'btn_mus', type: 'button', targetId: 'gate_mus', keepPressed: true, x: 1080, y: 472, width: 32, height: 8 }));
    this.objects.push(new PuzzleObject({ id: 'gate_mus', type: 'door', x: 1400, y: 320, width: 26, height: 160 }));

    // Checkpoint 2
    this.objects.push(new PuzzleObject({ id: 'cp5_2', type: 'checkpoint', x: 1480, y: 440, width: 20, height: 40 }));

    // Setor 3: Cruzamento Perigoso
    this.enemies.push(new Enemy('guard', 1700, 442, 1620, 1850, { speed: 1.3 }));
    this.enemies.push(new Enemy('hunter', 1950, 442, 1880, 2120, { speed: 1.6 }));

    // Fragmentos
    this.objects.push(new PuzzleObject({ id: 's1', type: 'shard', x: 380, y: 390, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's2', type: 'shard', x: 1060, y: 260, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's3', type: 'shard', x: 1850, y: 430, width: 20, height: 20 }));

    // Saída
    this.objects.push(new PuzzleObject({ id: 'goal', type: 'goal', x: 2160, y: 400, width: 48, height: 80, label: 'MUSEU' }));
  }

  // ----------------------------------------------------
  // FASE 6: A CIDADE SEM LUZ (Dificuldade 9/10 - Clímax)
  // ----------------------------------------------------
  buildLevel6(player) {
    this.width = 2400;
    this.height = 540;
    this.checkpointPos = { x: 60, y: 420 };
    player.resetPosition(this.checkpointPos.x, this.checkpointPos.y);

    this.platforms.push({ x: 0, y: 480, width: 800, height: 60, type: 'all' });
    this.platforms.push({ x: 920, y: 480, width: 1480, height: 60, type: 'all' });

    // Andar 1 da Torre
    this.enemies.push(new Enemy('guard', 320, 442, 200, 520, { speed: 1.4 }));
    this.objects.push(new PuzzleObject({ id: 'gate_t1', type: 'door', x: 620, y: 320, width: 26, height: 160 }));
    this.objects.push(new PuzzleObject({ id: 'btn_t1', type: 'button', world: 'shadow', targetId: 'gate_t1', keepPressed: true, x: 460, y: 472, width: 32, height: 8 }));

    // Checkpoint 1
    this.objects.push(new PuzzleObject({ id: 'cp6_1', type: 'checkpoint', x: 720, y: 440, width: 20, height: 40 }));

    // Andar 2: Engrenagens e Caçador
    this.movingPlatforms.push(new MovingPlatform({ id: 'mp_tower', x: 860, y: 380, width: 120, height: 18, axis: 'y', min: 240, max: 400, speed: 1.4 }));
    this.enemies.push(new Enemy('hunter', 1100, 442, 980, 1300, { speed: 1.6 }));
    this.enemies.push(new Enemy('sentinel', 1380, 240, 1380, 1380, { visionRange: 160, facing: -1 }));

    // Plataformas de escalada do relógio
    this.platforms.push({ x: 1220, y: 380, width: 120, height: 20, type: 'real' });
    this.platforms.push({ x: 1420, y: 310, width: 120, height: 20, type: 'shadow' });
    this.platforms.push({ x: 1620, y: 240, width: 140, height: 20, type: 'real' });

    // Checkpoint 2
    this.objects.push(new PuzzleObject({ id: 'cp6_2', type: 'checkpoint', x: 1680, y: 200, width: 20, height: 40 }));

    // Portão do Cume e Alavanca da Sombra
    this.objects.push(new PuzzleObject({ id: 'gate_summit', type: 'door', x: 1940, y: 160, width: 26, height: 160 }));
    this.objects.push(new PuzzleObject({ id: 'lev_summit', type: 'lever', targetId: 'gate_summit', x: 1820, y: 208, width: 24, height: 32 }));

    // O Altar do Pináculo sob a Lua
    this.platforms.push({ x: 1980, y: 320, width: 360, height: 20, type: 'all' });
    this.objects.push(new PuzzleObject({ id: 'goal', type: 'goal', x: 2240, y: 240, width: 50, height: 80, label: 'CORAÇÃO DA NOITE' }));

    // Fragmentos
    this.objects.push(new PuzzleObject({ id: 's1', type: 'shard', x: 420, y: 380, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's2', type: 'shard', x: 1460, y: 260, width: 20, height: 20 }));
    this.objects.push(new PuzzleObject({ id: 's3', type: 'shard', x: 1860, y: 170, width: 20, height: 20 }));
  }

  getSolidBlocks(overrideShadow) {
    const isShadow = (overrideShadow !== undefined) ? overrideShadow : this.isShadowWorld;
    const solids = [];

    for (let p of this.platforms) {
      if (p.type === 'all') solids.push(p);
      else if (p.type === 'real' && !isShadow) solids.push(p);
      else if (p.type === 'shadow' && isShadow) solids.push(p);
    }

    for (let mp of this.movingPlatforms) {
      if (mp.world === 'all') solids.push(mp);
      else if (mp.world === 'real' && !isShadow) solids.push(mp);
      else if (mp.world === 'shadow' && isShadow) solids.push(mp);
    }

    for (let obj of this.objects) {
      if (obj.type === 'door' && !obj.state) {
        solids.push(obj);
      }
      if (obj.type === 'crate') {
        solids.push(obj);
      }
    }
    return solids;
  }

  getOneWayPlatforms() {
    return this.platforms.filter(p => p.type === 'one_way');
  }

  toggleObject(id, state) {
    const obj = this.objects.find(o => o.id === id);
    if (obj) obj.state = state;
  }

  setCheckpoint(x, y) {
    this.checkpointPos = { x, y };
  }

  collectShard(id) {
    if (!this.collectedShards.has(id)) {
      this.collectedShards.add(id);
      this.shardsCount = this.collectedShards.size;
    }
  }

  render(ctx, camera) {
    const isShadow = this.isShadowWorld;

    // 1. Plataformas Estáticas
    for (let p of this.platforms) {
      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;
      if (screenX + p.width < 0 || screenX > 960) continue;

      ctx.save();
      if (p.type === 'all') {
        ctx.fillStyle = isShadow ? '#101322' : '#1e2438';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.fillRect(screenX, screenY, p.width, p.height);
        ctx.strokeRect(screenX, screenY, p.width, p.height);

        ctx.strokeStyle = isShadow ? '#1b2238' : '#2b344d';
        ctx.lineWidth = 1;
        for (let bx = screenX + 16; bx < screenX + p.width; bx += 24) {
          ctx.beginPath();
          ctx.moveTo(bx, screenY + 4);
          ctx.lineTo(bx, screenY + Math.min(p.height, 20));
          ctx.stroke();
        }
      } else if (p.type === 'real') {
        if (!isShadow) {
          ctx.fillStyle = '#2d3752';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.fillRect(screenX, screenY, p.width, p.height);
          ctx.strokeRect(screenX, screenY, p.width, p.height);
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(screenX, screenY, p.width, p.height);
          ctx.setLineDash([]);
        }
      } else if (p.type === 'shadow') {
        if (isShadow) {
          ctx.fillStyle = '#480ca8';
          ctx.strokeStyle = '#3bf4d1';
          ctx.lineWidth = 2;
          ctx.fillRect(screenX, screenY, p.width, p.height);
          ctx.strokeRect(screenX, screenY, p.width, p.height);
        } else {
          ctx.strokeStyle = 'rgba(157, 78, 221, 0.25)';
          ctx.setLineDash([3, 5]);
          ctx.strokeRect(screenX, screenY, p.width, p.height);
          ctx.setLineDash([]);
        }
      }
      ctx.restore();
    }

    // 2. Plataformas Móveis
    for (let mp of this.movingPlatforms) {
      mp.render(ctx, camera, isShadow);
    }

    // 3. Objetos Interativos
    for (let obj of this.objects) {
      obj.render(ctx, camera, isShadow);
    }

    // 4. Inimigos
    for (let enemy of this.enemies) {
      enemy.render(ctx, camera, isShadow);
    }
  }
}

// ====================================================================
// 10. CÂMERA COM TRAVAMENTO DE LIMITES
// ====================================================================
class Camera {
  constructor(viewportWidth = 960, viewportHeight = 540) {
    this.x = 0;
    this.y = 0;
    this.width = viewportWidth;
    this.height = viewportHeight;
  }

  follow(target, levelWidth, levelHeight) {
    const targetX = target.x + target.width / 2 - this.width / 2;
    const targetY = 0;

    this.x += (targetX - this.x) * 0.1;
    this.y += (targetY - this.y) * 0.1;

    this.x = Math.max(0, Math.min(levelWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(levelHeight - this.height, this.y));
  }
}

// ====================================================================
// 11. SISTEMA DE SALVAMENTO E PONTUAÇÃO (LOCALSTORAGE)
// ====================================================================
class SaveSystem {
  static getRecords() {
    try {
      const data = localStorage.getItem('nocturna_records_v1');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {
      highScore: 0,
      levelsCleared: 0,
      totalShards: 0,
      bestTimes: {},
      shardsPerLevel: {}
    };
  }

  static saveRecords(records) {
    try {
      localStorage.setItem('nocturna_records_v1', JSON.stringify(records));
    } catch (e) {}
  }

  static clearRecords() {
    try {
      localStorage.removeItem('nocturna_records_v1');
    } catch (e) {}
  }
}

// ====================================================================
// 12. MOTOR DO JOGO (GAME ENGINE)
// ====================================================================
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.audio = new AudioManager();
    this.input = new InputManager(this.audio);
    this.particles = new ParticleSystem();
    this.player = new Player(50, 420);
    this.shadowClone = new ShadowClone();
    this.level = new LevelManager();
    this.camera = new Camera(960, 540);

    this.gameState = 'menu';
    this.score = 0;
    this.lives = 3;
    this.levelTimer = 0;
    this.totalGameTimer = 0;
    this.lostLifeThisLevel = false;

    this.initDOMElements();
    this.setupEventListeners();
    this.renderMenuPreview();

    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  initDOMElements() {
    this.hud = document.getElementById('game-hud');
    this.hudLevel = document.getElementById('hud-level');
    this.hudScore = document.getElementById('hud-score');
    this.hudLives = document.getElementById('hud-lives');
    this.hudTimer = document.getElementById('hud-timer');
    this.hudShards = document.getElementById('hud-shards');
    this.hudModeBadge = document.getElementById('hud-mode-badge');
    this.hudModeText = document.getElementById('hud-mode-text');
    this.hudObjective = document.getElementById('hud-objective');
    this.hudShadowGauge = document.getElementById('hud-shadow-gauge');
    this.gaugeFill = document.getElementById('gauge-fill');
    this.gaugeTime = document.getElementById('gauge-time');

    this.screenMenu = document.getElementById('screen-menu');
    this.screenHow = document.getElementById('screen-how');
    this.screenRecords = document.getElementById('screen-records');
    this.screenPause = document.getElementById('screen-pause');
    this.screenGameOver = document.getElementById('screen-gameover');
    this.screenVictory = document.getElementById('screen-victory');

    this.vignette = document.getElementById('world-vignette');
    this.banner = document.getElementById('game-banner');
    this.bannerText = document.getElementById('banner-text');
    this.bannerIcon = document.getElementById('banner-icon');

    this.btnPlay = document.getElementById('btn-play');
    this.btnHow = document.getElementById('btn-how');
    this.btnRecords = document.getElementById('btn-records');
    this.btnCloseHow = document.getElementById('btn-close-how');
    this.btnBackHow = document.getElementById('btn-back-how');
    this.btnCloseRecords = document.getElementById('btn-close-records');
    this.btnBackRecords = document.getElementById('btn-back-records');
    this.btnResetRecords = document.getElementById('btn-reset-records');
    this.btnResume = document.getElementById('btn-resume');
    this.btnPauseRestart = document.getElementById('btn-pause-restart');
    this.btnPauseMenu = document.getElementById('btn-pause-menu');
    this.btnGameOverRetry = document.getElementById('btn-gameover-retry');
    this.btnGameOverMenu = document.getElementById('btn-gameover-menu');
    this.btnVictoryReplay = document.getElementById('btn-victory-replay');
    this.btnVictoryMenu = document.getElementById('btn-victory-menu');
    this.btnSound = document.getElementById('btn-sound');
    this.btnQuickRestart = document.getElementById('btn-quick-restart');
    this.btnQuickPause = document.getElementById('btn-quick-pause');
  }

  setupEventListeners() {
    this.btnPlay.addEventListener('click', () => this.startGame());
    this.btnHow.addEventListener('click', () => this.showModal('how'));
    this.btnCloseHow.addEventListener('click', () => this.hideModal('how'));
    this.btnBackHow.addEventListener('click', () => this.hideModal('how'));

    this.btnRecords.addEventListener('click', () => this.showRecords());
    this.btnCloseRecords.addEventListener('click', () => this.hideModal('records'));
    this.btnBackRecords.addEventListener('click', () => this.hideModal('records'));
    this.btnResetRecords.addEventListener('click', () => this.resetRecords());

    this.btnResume.addEventListener('click', () => this.togglePause());
    this.btnPauseRestart.addEventListener('click', () => this.restartLevel());
    this.btnPauseMenu.addEventListener('click', () => this.goToMenu());

    this.btnGameOverRetry.addEventListener('click', () => this.retryFromGameOver());
    this.btnGameOverMenu.addEventListener('click', () => this.goToMenu());

    this.btnVictoryReplay.addEventListener('click', () => this.startGame());
    this.btnVictoryMenu.addEventListener('click', () => this.goToMenu());

    this.btnSound.addEventListener('click', () => this.toggleSound());
    this.btnQuickRestart.addEventListener('click', () => this.restartLevel());
    this.btnQuickPause.addEventListener('click', () => this.togglePause());
  }

  startGame() {
    this.audio.init();
    this.score = 0;
    this.lives = 3;
    this.totalGameTimer = 0;
    this.startLevel(1);
    this.hideAllScreens();
    this.hud.classList.remove('hud-hidden');
    this.gameState = 'playing';
  }

  startLevel(index) {
    this.level.loadLevel(index, this.player);
    this.levelTimer = 0;
    this.lostLifeThisLevel = false;
    this.shadowClone.deactivate(this.player);
    this.updateHUD();
    this.showBanner(`FASE ${index}: ${this.level.levelNames[index]}`, '★');
  }

  restartLevel() {
    this.lives = Math.max(1, this.lives);
    this.startLevel(this.level.currentLevelIndex);
    this.hideAllScreens();
    this.gameState = 'playing';
  }

  retryFromGameOver() {
    this.lives = 3;
    this.startLevel(this.level.currentLevelIndex);
    this.hideAllScreens();
    this.hud.classList.remove('hud-hidden');
    this.gameState = 'playing';
  }

  goToMenu() {
    this.hideAllScreens();
    this.hud.classList.add('hud-hidden');
    this.screenMenu.classList.remove('hidden');
    this.gameState = 'menu';
    this.renderMenuPreview();
  }

  togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'pause';
      this.screenPause.classList.remove('hidden');
    } else if (this.gameState === 'pause') {
      this.gameState = 'playing';
      this.screenPause.classList.add('hidden');
    }
  }

  toggleSound() {
    const isMuted = this.audio.toggleMute();
    this.btnSound.textContent = isMuted ? '🔇' : '🔊';
  }

  showModal(name) {
    if (name === 'how') this.screenHow.classList.remove('hidden');
    if (name === 'records') this.screenRecords.classList.remove('hidden');
  }

  hideModal(name) {
    if (name === 'how') this.screenHow.classList.add('hidden');
    if (name === 'records') this.screenRecords.classList.add('hidden');
  }

  hideAllScreens() {
    this.screenMenu.classList.add('hidden');
    this.screenHow.classList.add('hidden');
    this.screenRecords.classList.add('hidden');
    this.screenPause.classList.add('hidden');
    this.screenGameOver.classList.add('hidden');
    this.screenVictory.classList.add('hidden');
  }

  showBanner(msg, icon = '★') {
    this.bannerText.textContent = msg;
    this.bannerIcon.textContent = icon;
    this.banner.classList.remove('banner-hidden');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.banner.classList.add('banner-hidden');
    }, 2800);
  }

  toggleWorld() {
    this.level.isShadowWorld = !this.level.isShadowWorld;
    this.audio.playWorldSwap(this.level.isShadowWorld);

    if (this.level.isShadowWorld) {
      this.vignette.className = 'vignette-shadow';
      this.hudModeBadge.className = 'mode-badge mode-shadow';
      this.hudModeText.textContent = 'SOMBRA';
      this.particles.spawnShadowWisps(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 12);
    } else {
      this.vignette.className = 'vignette-real';
      this.hudModeBadge.className = 'mode-badge mode-real';
      this.hudModeText.textContent = 'REAL';
    }

    this.player.ensureSafePosition(this.level);
  }

  playerTakeDamage() {
    if (this.player.invulnerableTimer > 0) return;

    this.lives--;
    this.lostLifeThisLevel = true;
    this.player.invulnerableTimer = 80;
    this.audio.playHurt();
    this.particles.spawnComicText('POW!', this.player.x + this.player.width / 2, this.player.y - 10, '#ff2a5f');

    if (this.lives <= 0) {
      this.handleGameOver();
    } else {
      this.player.resetPosition(this.level.checkpointPos.x, this.level.checkpointPos.y);
      this.player.ensureSafePosition(this.level);
      this.showBanner('RETORNOU AO CHECKPOINT', '⚠️');
      this.updateHUD();
    }
  }

  handleGameOver() {
    this.gameState = 'gameover';
    this.screenGameOver.classList.remove('hidden');
    document.getElementById('defeat-level-name').textContent = `Fase ${this.level.currentLevelIndex}: ${this.level.levelNames[this.level.currentLevelIndex]}`;
    document.getElementById('defeat-score').textContent = this.score;
  }

  completeLevel() {
    this.audio.playVictory();
    let bonus = 100;
    if (!this.lostLifeThisLevel) bonus += 100;
    if (this.levelTimer < 3600) bonus += 50;
    this.score += bonus;

    this.saveLevelProgress();

    if (this.level.currentLevelIndex >= 6) {
      this.handleGameVictory();
    } else {
      this.showBanner('OBJETIVO CONCLUÍDO ✓', '★');
      setTimeout(() => {
        this.startLevel(this.level.currentLevelIndex + 1);
      }, 1500);
    }
  }

  handleGameVictory() {
    this.gameState = 'victory';
    this.screenVictory.classList.remove('hidden');
    this.hud.classList.add('hud-hidden');

    document.getElementById('v-final-score').textContent = this.score;
    document.getElementById('v-final-time').textContent = this.formatTime(this.totalGameTimer);
    document.getElementById('v-final-shards').textContent = `${this.getTotalCollectedShards()} / 18`;
    document.getElementById('v-final-lives').textContent = '♥'.repeat(Math.max(1, this.lives));

    this.renderVictoryArt();
  }

  saveLevelProgress() {
    const records = SaveSystem.getRecords();
    records.highScore = Math.max(records.highScore, this.score);
    records.levelsCleared = Math.max(records.levelsCleared, this.level.currentLevelIndex);
    records.bestTimes[this.level.currentLevelIndex] = Math.min(
      records.bestTimes[this.level.currentLevelIndex] || 999999,
      this.levelTimer
    );
    records.shardsPerLevel[this.level.currentLevelIndex] = Math.max(
      records.shardsPerLevel[this.level.currentLevelIndex] || 0,
      this.level.shardsCount
    );
    SaveSystem.saveRecords(records);
  }

  showRecords() {
    const records = SaveSystem.getRecords();
    document.getElementById('rec-high-score').textContent = records.highScore;
    document.getElementById('rec-levels-cleared').textContent = `${records.levelsCleared} / 6`;
    document.getElementById('rec-total-shards').textContent = `${this.getTotalCollectedShards()} / 18`;

    let totalTimeSec = 0;
    for (let k in records.bestTimes) totalTimeSec += records.bestTimes[k] / 60;
    document.getElementById('rec-best-time').textContent = totalTimeSec > 0 ? this.formatTime(totalTimeSec * 60) : '--:--';

    const tbody = document.getElementById('records-table-body');
    tbody.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
      const tr = document.createElement('tr');
      const time = records.bestTimes[i] ? this.formatTime(records.bestTimes[i]) : '--:--';
      const shards = records.shardsPerLevel[i] ? `${records.shardsPerLevel[i]} / 3` : '0 / 3';
      tr.innerHTML = `
        <td>${i}</td>
        <td>${this.level.levelNames[i]}</td>
        <td>${time}</td>
        <td>${shards}</td>
      `;
      tbody.appendChild(tr);
    }
    this.showModal('records');
  }

  resetRecords() {
    if (confirm('Tem certeza de que deseja zerar todos os recordes salvos?')) {
      SaveSystem.clearRecords();
      this.showRecords();
    }
  }

  getTotalCollectedShards() {
    const records = SaveSystem.getRecords();
    let sum = 0;
    for (let i = 1; i <= 6; i++) {
      sum += records.shardsPerLevel[i] || 0;
    }
    return sum;
  }

  gameLoop(timestamp) {
    const dt = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    if (this.gameState === 'playing') {
      this.update();
    }
    this.render();

    this.input.clearJustPressed();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update() {
    this.levelTimer++;
    this.totalGameTimer++;

    if (this.input.wasJustPressed('pause')) {
      this.togglePause();
      return;
    }
    if (this.input.wasJustPressed('restart')) {
      this.restartLevel();
      return;
    }
    if (this.input.wasJustPressed('mute')) {
      this.toggleSound();
    }

    if (this.input.wasJustPressed('swap')) {
      this.toggleWorld();
    }

    if (this.level.currentLevelIndex >= 4) {
      this.hudShadowGauge.classList.remove('hidden');
      if (this.input.wasJustPressed('shadow')) {
        if (!this.shadowClone.active) {
          this.shadowClone.activate(this.player);
          this.audio.playShadowClone();
        } else {
          this.shadowClone.deactivate(this.player);
          this.audio.playShadowClone();
        }
      }
    } else {
      this.hudShadowGauge.classList.add('hidden');
    }

    const playerResult = this.player.update(this.input, this.level, this.audio, this.particles);
    if (playerResult === 'fell_into_void') {
      this.playerTakeDamage();
    }

    if (this.shadowClone.active) {
      this.shadowClone.update(this.input, this.player, this.level, this.particles, this.audio);
      const pct = Math.max(0, (this.shadowClone.timer / this.shadowClone.maxDuration) * 100);
      this.gaugeFill.style.width = `${pct}%`;
      this.gaugeTime.textContent = `${Math.ceil(pct)}%`;
    }

    // Plataformas Móveis
    for (let mp of this.level.movingPlatforms) {
      mp.update(this.player, this.shadowClone, this.level.isShadowWorld);
    }

    // Inimigos
    for (let enemy of this.level.enemies) {
      enemy.update(this.player, this.shadowClone, this.level.isShadowWorld, this.audio, this.particles, this.level);
      if (enemy.checkPlayerCollision(this.player, this.level.isShadowWorld)) {
        this.playerTakeDamage();
      }
    }

    // Objetos
    for (let obj of this.level.objects) {
      obj.update(this.player, this.shadowClone, this.level, this.audio, this.particles, this.input);
    }

    // Checar Saída
    const goal = this.level.objects.find(o => o.type === 'goal');
    if (goal && this.player.intersects(goal)) {
      this.completeLevel();
    }

    // Partículas e Câmera
    this.particles.update(this.level.width, this.level.height, this.camera);
    const cameraTarget = this.shadowClone.active ? this.shadowClone : this.player;
    this.camera.follow(cameraTarget, this.level.width, this.level.height);

    this.updateHUD();
  }

  updateHUD() {
    this.hudLevel.textContent = `${this.level.currentLevelIndex}/6`;
    this.hudScore.textContent = String(this.score).padStart(4, '0');
    this.hudLives.textContent = '♥'.repeat(Math.max(0, this.lives));
    this.hudTimer.textContent = this.formatTime(this.levelTimer);
    this.hudShards.textContent = `${this.level.shardsCount}/${this.level.totalShardsInLevel}`;
    this.hudObjective.textContent = this.level.objectives[this.level.currentLevelIndex] || '';
  }

  formatTime(frames) {
    const totalSec = Math.floor(frames / 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  render() {
    this.ctx.clearRect(0, 0, 960, 540);

    this.renderParallaxBackground();
    this.level.render(this.ctx, this.camera);
    this.particles.renderWorld(this.ctx, this.camera);

    this.player.render(this.ctx, this.camera, this.level.isShadowWorld);
    if (this.shadowClone.active) {
      this.shadowClone.render(this.ctx, this.camera, this.player);
    }

    this.particles.renderScreen(this.ctx);
  }

  renderParallaxBackground() {
    const isShadow = this.level.isShadowWorld;

    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 540);
    if (isShadow) {
      skyGrad.addColorStop(0, '#100520');
      skyGrad.addColorStop(1, '#05030c');
    } else {
      skyGrad.addColorStop(0, '#090d1f');
      skyGrad.addColorStop(1, '#060812');
    }
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, 960, 540);

    // Lua Cheia Gigante
    const moonScreenX = 720 - this.camera.x * 0.04;
    const moonScreenY = 120;
    this.ctx.save();
    this.ctx.shadowColor = isShadow ? '#9d4edd' : '#f8c23a';
    this.ctx.shadowBlur = 24;
    this.ctx.fillStyle = isShadow ? '#c77dff' : '#fdf6e2';
    this.ctx.beginPath();
    this.ctx.arc(moonScreenX, moonScreenY, 52, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Silhuetas de Arranha-céus (Paralaxe suave)
    this.ctx.fillStyle = isShadow ? '#0a0518' : '#0a0d1b';
    const bldOffset = this.camera.x * 0.15;
    for (let i = 0; i < 15; i++) {
      const bx = (i * 90) - (bldOffset % 90);
      const bh = 140 + ((i * 37) % 160);
      this.ctx.fillRect(bx, 540 - bh, 80, bh);
    }

    // Janelas Iluminadas Estilo Quadrinhos
    this.ctx.fillStyle = isShadow ? 'rgba(59, 244, 209, 0.4)' : 'rgba(248, 194, 58, 0.5)';
    for (let i = 0; i < 15; i++) {
      const bx = (i * 90) - (bldOffset % 90);
      const bh = 140 + ((i * 37) % 160);
      if (i % 2 === 0) {
        this.ctx.fillRect(bx + 15, 540 - bh + 30, 8, 10);
        this.ctx.fillRect(bx + 35, 540 - bh + 30, 8, 10);
        this.ctx.fillRect(bx + 15, 540 - bh + 60, 8, 10);
      }
    }
  }

  renderMenuPreview() {
    const previewCanvas = document.getElementById('menuPreviewCanvas');
    if (!previewCanvas) return;
    const pctx = previewCanvas.getContext('2d');

    let t = 0;
    const animatePreview = () => {
      pctx.clearRect(0, 0, 120, 120);

      pctx.fillStyle = '#080a16';
      pctx.fillRect(0, 0, 120, 120);

      pctx.fillStyle = '#f8c23a';
      pctx.beginPath();
      pctx.arc(90, 30, 16, 0, Math.PI * 2);
      pctx.fill();

      pctx.fillStyle = '#1c2236';
      pctx.fillRect(20, 80, 80, 40);

      const floatY = Math.sin(t) * 2;
      pctx.fillStyle = '#141724';
      pctx.fillRect(48, 48 + floatY, 24, 32);

      pctx.fillStyle = '#0e111d';
      pctx.beginPath();
      pctx.moveTo(50, 52 + floatY);
      pctx.lineTo(25 + Math.sin(t * 1.5) * 6, 75 + floatY);
      pctx.lineTo(50, 78 + floatY);
      pctx.fill();

      pctx.fillStyle = '#ffffff';
      pctx.fillRect(54, 56 + floatY, 4, 3);
      pctx.fillRect(62, 56 + floatY, 4, 3);

      t += 0.05;
      if (this.gameState === 'menu') {
        requestAnimationFrame(animatePreview);
      }
    };
    animatePreview();
  }

  renderVictoryArt() {
    const vCanvas = document.getElementById('victoryCanvas');
    if (!vCanvas) return;
    const vctx = vCanvas.getContext('2d');

    vctx.fillStyle = '#070914';
    vctx.fillRect(0, 0, 280, 150);

    vctx.fillStyle = '#fdf6e2';
    vctx.shadowColor = '#f8c23a';
    vctx.shadowBlur = 20;
    vctx.beginPath();
    vctx.arc(140, 75, 45, 0, Math.PI * 2);
    vctx.fill();
    vctx.shadowBlur = 0;

    vctx.fillStyle = '#0e1222';
    vctx.beginPath();
    vctx.moveTo(110, 150);
    vctx.lineTo(140, 85);
    vctx.lineTo(170, 150);
    vctx.fill();

    vctx.fillStyle = '#141724';
    vctx.fillRect(132, 60, 16, 26);

    vctx.fillStyle = '#ff2a5f';
    vctx.shadowColor = '#ff2a5f';
    vctx.shadowBlur = 12;
    vctx.beginPath();
    vctx.arc(140, 50, 7, 0, Math.PI * 2);
    vctx.fill();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.nocturnaGame = new GameEngine();
});
