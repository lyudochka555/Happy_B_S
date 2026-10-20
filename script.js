/* ============================================================
   1. ФОНОВЫЕ СЕРДЕЧКИ
   ============================================================ */
(function initBgHearts() {
  const container = document.getElementById('bgHearts');
  const emojis = ['♥', '♡', '✿', '❀', '☁', '✦'];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div');
    el.className = 'bg-heart';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (16 + Math.random() * 28) + 'px';
    el.style.animationDuration = (12 + Math.random() * 18) + 's';
    el.style.animationDelay = (-Math.random() * 20) + 's';
    container.appendChild(el);
  }
})();

/* ============================================================
   2. ТОСТЫ (Уведомления)
   ============================================================ */
const toast = document.getElementById('toast');
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ============================================================
   3. КОНФЕТТИ
   ============================================================ */
(function initConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId = null;

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);

  const colors = ['#f7d6d0', '#e8b4b8', '#d4a373', '#f0dcc8', '#c9a6a0', '#fdf6f0', '#d4858a'];
  const shapes = ['circle', 'rect', 'heart'];

  function createParticles(count) {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      particles.push({
        x: cx + (Math.random() - 0.5) * 80, y: cy + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
        size: 6 + Math.random() * 10, color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.3,
        shape: shapes[Math.floor(Math.random() * shapes.length)], life: 1
      });
    }
  }

  function drawHeart(x, y, size, rotation) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(size / 20, size / 20);
    ctx.beginPath(); ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-12, -6, -20, -2, -20, 8);
    ctx.bezierCurveTo(-20, 16, -8, 22, 0, 28);
    ctx.bezierCurveTo(8, 22, 20, 16, 20, 8);
    ctx.bezierCurveTo(20, -2, 12, -6, 0, 6);
    ctx.fill(); ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed; p.life -= 0.008;
      if (p.life <= 0 || p.y > canvas.height + 60) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      else if (p.shape === 'rect') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore(); }
      else { drawHeart(p.x, p.y, p.size, p.rotation); }
    }
    ctx.globalAlpha = 1;
    if (particles.length > 0) { animId = requestAnimationFrame(loop); }
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); animId = null; }
  }

  window.launchConfetti = function (count = 140) {
    createParticles(count);
    if (!animId) animId = requestAnimationFrame(loop);
  };
})();

/* ============================================================
   4. ИГРА: ПОЙМАЙ ТОРТ
   ============================================================ */
(function initGame() {
  const area = document.getElementById('gameArea');
  const basket = document.getElementById('gameBasket');
  const scoreEl = document.getElementById('gameScore');
  const timeEl = document.getElementById('gameTime');
  const overlay = document.getElementById('gameStartOverlay');
  
  let score = 0, timeLeft = 15, isPlaying = false;
  let items = [], gameLoopId, spawnInterval, timerInterval;
  let basketX = 50; // В процентах

  const emojis = ['🎂', '🍰', '🧁', '🍩', '💖', '🎈'];
  const badEmoji = '💣';

  function moveBasket(e) {
    if (!isPlaying) return;
    const rect = area.getBoundingClientRect();
    let clientX = e.clientX;
    if (e.touches) clientX = e.touches[0].clientX;
    
    let x = clientX - rect.left;
    basketX = Math.max(10, Math.min(90, (x / rect.width) * 100));
    basket.style.left = basketX + '%';
  }

  area.addEventListener('mousemove', moveBasket);
  area.addEventListener('touchmove', (e) => { e.preventDefault(); moveBasket(e); }, { passive: false });

  function spawnItem() {
    if (!isPlaying) return;
    const el = document.createElement('div');
    el.className = 'game-item';
    const isBad = Math.random() < 0.2; // 20% шанс на бомбу
    el.textContent = isBad ? badEmoji : emojis[Math.floor(Math.random() * emojis.length)];
    
    const x = 10 + Math.random() * 80; // 10% - 90%
    el.style.left = x + '%';
    el.style.top = '-40px';
    area.appendChild(el);

    const speed = 2 + Math.random() * 3;
    items.push({ el, x, y: -40, speed, isBad });
  }

  function updateGame() {
    if (!isPlaying) return;

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.y += item.speed;
      item.el.style.top = item.y + 'px';

      const areaH = area.offsetHeight;
      // Зона корзины (снизу)
      if (item.y > areaH - 80 && item.y < areaH) {
        // Проверка попадания по X
        if (Math.abs(item.x - basketX) < 15) {
          if (item.isBad) {
            score = Math.max(0, score - 5);
            showToast('💥 Ой! Это была бомба! -5');
          } else {
            score += 10;
            if (window.launchConfetti && Math.random() < 0.3) window.launchConfetti(10);
          }
          scoreEl.textContent = `Счёт: ${score}`;
          item.el.remove();
          items.splice(i, 1);
          continue;
        }
      }

      // Упало мимо
      if (item.y > areaH) {
        item.el.remove();
        items.splice(i, 1);
      }
    }
    gameLoopId = requestAnimationFrame(updateGame);
  }

  function startGame() {
    score = 0; timeLeft = 15; isPlaying = true;
    scoreEl.textContent = `Счёт: ${score}`;
    timeEl.textContent = `Время: ${timeLeft}с`;
    overlay.classList.add('hidden');
    items.forEach(i => i.el.remove());
    items = [];
    basketX = 50; basket.style.left = '50%';

    spawnInterval = setInterval(spawnItem, 700);
    timerInterval = setInterval(() => {
      timeLeft--;
      timeEl.textContent = `Время: ${timeLeft}с`;
      if (timeLeft <= 0) endGame();
    }, 1000);

    updateGame();
  }

  function endGame() {
    isPlaying = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);
    cancelAnimationFrame(gameLoopId);
    items.forEach(i => i.el.remove());
    items = [];
    
    let msg = '';
    if (score >= 100) msg = '🏆 Ты просто бог сладостей!';
    else if (score >= 50) msg = '🍰 Отличный результат!';
    else msg = '🧁 Неплохо, но торт тебя ждёт!';

    overlay.classList.remove('hidden');
    overlay.innerHTML = `<div class="center">
      <h3 style="margin-bottom:10px;color:var(--text);">Твой счёт: ${score}</h3>
      <p style="margin-bottom:15px;color:var(--text);">${msg}</p>
      <button class="btn" id="gameRestartBtn">Ещё раз 🔄</button>
    </div>`;

    document.getElementById('gameRestartBtn').addEventListener('click', () => {
      overlay.innerHTML = `<button class="btn" id="gameStartBtn">Играть 🎮</button>`;
      document.getElementById('gameStartBtn').addEventListener('click', startGame);
    });
    window.launchConfetti(60);
  }

  document.getElementById('gameStartBtn').addEventListener('click', startGame);
})();

/* ============================================================
   5. КНОПКА ПРАЗДНИКА
   ============================================================ */
const partyBtn = document.getElementById('partyBtn');
let partyClicks = 0;
partyBtn.addEventListener('click', () => {
  window.launchConfetti(160);
  partyClicks++;
  const phrases = ['🎉 Ура! Свете 20!', '💖 Ты — ЛУЧШАЯ!', '🥳 Пусть всё сбудется!', '✨ Двадцать — это красиво!'];
  showToast(phrases[(partyClicks - 1) % phrases.length]);
});

/* ============================================================
   6. АВТОКОНФЕТТИ И ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ
   ============================================================ */
window.addEventListener('load', () => setTimeout(() => window.launchConfetti(90), 600));

(function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach((el, i) => {
    el.style.transitionDelay = (i * 0.08) + 's';
    obs.observe(el);
  });
})();

/* ============================================================
   7. ПАСХАЛКА (клик по имени)
   ============================================================ */
document.getElementById('nameTrigger').addEventListener('click', () => {
  window.launchConfetti(80);
  showToast('😘 Света, ты супер!');
});