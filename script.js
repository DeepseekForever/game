const canvas = document.getElementById('snow');
const ctx = canvas.getContext('2d');

let particles = [];
let width = 0;
let height = 0;
let animationId;

function resize() {
  width = canvas.width = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  height = canvas.height = window.innerHeight * Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(Math.min(window.devicePixelRatio || 1, 2), Math.min(window.devicePixelRatio || 1, 2));

  const count = Math.max(60, Math.floor(window.innerWidth / 18));
  particles = Array.from({ length: count }, createParticle);
}

function createParticle() {
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 2.2 + 0.5,
    s: Math.random() * 0.55 + 0.15,
    vx: Math.random() * 0.35 - 0.175,
    a: Math.random() * Math.PI * 2,
    wa: Math.random() * 0.02 + 0.003
  };
}

function step() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (const p of particles) {
    p.a += p.wa;
    p.x += p.vx + Math.sin(p.a) * 0.18;
    p.y += p.s;

    if (p.y > window.innerHeight + 8) {
      p.y = -8;
      p.x = Math.random() * window.innerWidth;
    }

    if (p.x > window.innerWidth + 8) p.x = -8;
    if (p.x < -8) p.x = window.innerWidth + 8;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.35 + p.r / 8})`;
    ctx.fill();
  }

  animationId = requestAnimationFrame(step);
}

window.addEventListener('resize', () => {
  cancelAnimationFrame(animationId);
  resize();
  step();
});

resize();
step();
