/**
 * HACKATHON 1.0 — Success Page
 * Confetti, Receipt Generation, Download
 */

// ============================================
// GET REGISTRATION DATA
// ============================================
const successData = JSON.parse(sessionStorage.getItem('hackathon_success') || 'null');

if (!successData) {
  // No data — redirect to register
  window.location.href = '/register.html';
}

// ============================================
// DISPLAY TEAM ID
// ============================================
function displayData() {
  if (!successData) return;
  document.getElementById('teamIdDisplay').textContent = successData.teamId;
}

// ============================================
// CONFETTI SYSTEM
// ============================================
class ConfettiEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.colors = ['#B4FF00', '#00E5FF', '#FF3B3B', '#FFFFFF', '#FFD700'];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawn(count = 100) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 2,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        decay: 0.002 + Math.random() * 0.003,
      });
    }
    this.animate();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter(p => p.opacity > 0 && p.y < this.canvas.height + 20);

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.rotation += p.rotationSpeed;
      p.opacity -= p.decay;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
    });

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animate());
    }
  }
}

// ============================================
// RECEIPT GENERATION
// ============================================
function generateReceiptHTML() {
  if (!successData) return '';

  const timestamp = new Date(successData.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const participantsHtml = successData.participants.map((p, i) => `
    <div class="receipt-participant">
      <div class="receipt-p-name">${i + 1}. ${escapeHtml(p.name)}</div>
      <div class="receipt-p-detail">USN: ${escapeHtml(p.usn)} · ${escapeHtml(p.branch)} · ${escapeHtml(p.phone)}</div>
      <div class="receipt-p-detail">${escapeHtml(p.email)}</div>
    </div>
  `).join('');

  return `
    <div style="background:#fff;color:#111;padding:32px 20px;font-family:'IBM Plex Mono',monospace;font-size:13px;width:360px;">
      <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px dashed #ddd;">
        <div style="font-family:'Clash Display',sans-serif;font-size:24px;font-weight:700;">BRAINWAVE</div>
        <div style="font-size:10px;color:#888;margin-top:4px;">PDA College of Engineering</div>
        <div style="font-size:9px;color:#aaa;margin-top:2px;">Registration Receipt</div>
      </div>

      <div style="display:flex;justify-content:space-between;padding:8px 0;">
        <span style="color:#888;font-size:11px;">TEAM ID</span>
        <span style="font-weight:700;">${escapeHtml(successData.teamId)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;">
        <span style="color:#888;font-size:11px;">TEAM NAME</span>
        <span style="font-weight:600;">${escapeHtml(successData.teamName)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;">
        <span style="color:#888;font-size:11px;">DOMAIN</span>
        <span style="font-weight:600;">${escapeHtml(successData.domain)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;">
        <span style="color:#888;font-size:11px;">TEAM SIZE</span>
        <span style="font-weight:600;">${successData.teamSize}</span>
      </div>

      <div style="border-top:1px dashed #ddd;margin:12px 0;"></div>

      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Participants</div>
      ${participantsHtml}

      <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:2px dashed #ddd;">
        <div style="font-size:10px;color:#999;">Generated: ${timestamp}</div>
        <div style="font-size:9px;color:#bbb;margin-top:4px;">This is an auto-generated receipt. Keep it safe.</div>
      </div>
    </div>
  `;
}

function downloadReceipt() {
  const receiptHtml = generateReceiptHTML();

  // Create a printable window
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt — BRAINWAVE — ${escapeHtml(successData.teamId)}</title>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; justify-content: center; padding: 20px; background: #f5f5f5; }
        @media print {
          body { background: white; padding: 0; }
        }
      </style>
    </head>
    <body>
      ${receiptHtml}
      <script>
        setTimeout(() => {
          window.print();
        }, 500);
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// ============================================
// UTILS
// ============================================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  displayData();

  // Confetti
  const canvas = document.getElementById('confetti-canvas');
  const confetti = new ConfettiEngine(canvas);
  setTimeout(() => confetti.spawn(120), 800);
  setTimeout(() => confetti.spawn(60), 2000);

  // Download button
  document.getElementById('btnDownload').addEventListener('click', downloadReceipt);
});
