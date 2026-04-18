/**
 * HACKATHON 1.0 — Main Landing Page
 * Signal / Noise System
 */

// ============================================
// NOISE → SIGNAL STATE ENGINE
// ============================================
class SignalStateEngine {
  constructor() {
    this.state = 'noise'; // noise | transition | signal
    this.progress = 0; // 0 to 1
    this.listeners = [];
  }

  setState(state) {
    this.state = state;
    this.listeners.forEach(fn => fn(state, this.progress));
  }

  setProgress(p) {
    this.progress = Math.min(1, Math.max(0, p));
    if (this.progress < 0.3) this.setState('noise');
    else if (this.progress < 0.7) this.setState('transition');
    else this.setState('signal');
  }

  onStateChange(fn) {
    this.listeners.push(fn);
  }
}

const engine = new SignalStateEngine();

// ============================================
// TAGLINE LETTER ANIMATION
// ============================================
function animateTagline() {
  const tagline = document.getElementById('heroTagline');
  const text = 'COLLABORATE CREATE INNOVATE';
  tagline.innerHTML = '';

  [...text].forEach((char, i) => {
    const span = document.createElement('span');
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.animationDelay = `${2.0 + i * 0.05}s`;
    tagline.appendChild(span);
  });
}

// ============================================
// HERO SIGNAL STATE PROGRESSION
// ============================================
function initHeroProgression() {
  const college = document.getElementById('heroCollege');
  const dept = document.getElementById('heroDept');
  const presents = document.getElementById('heroPresents');

  // Gradual reveal over 3 seconds
  setTimeout(() => {
    college.dataset.state = 'transition';
    dept.dataset.state = 'transition';
    if (presents) presents.dataset.state = 'transition';
  }, 1000);

  setTimeout(() => {
    college.dataset.state = 'signal';
    dept.dataset.state = 'signal';
    if (presents) presents.dataset.state = 'signal';
    document.body.classList.remove('noise-active');
    document.body.classList.add('signal-active');
  }, 2500);
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function initCountdown() {
  // Set hackathon date (customize this)
  const hackathonDate = new Date('2026-05-09T09:00:00+05:30').getTime();
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  let lastSecs = -1;

  function update() {
    const now = Date.now();
    const diff = Math.max(0, hackathonDate - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minsEl.textContent = String(mins).padStart(2, '0');
    secsEl.textContent = String(secs).padStart(2, '0');

    // Jitter effect on second change
    if (secs !== lastSecs) {
      secsEl.classList.add('jitter');
      setTimeout(() => secsEl.classList.remove('jitter'), 100);
      lastSecs = secs;
    }

    if (diff > 0) {
      requestAnimationFrame(() => setTimeout(update, 1000 - (Date.now() % 1000)));
    }
  }

  update();
}

// ============================================
// SCROLL REVEAL (blur → clarity)
// ============================================
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

// ============================================
// SCROLL-BASED SIGNAL PROGRESSION
// ============================================
function initScrollProgress() {
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollY / docHeight;
        engine.setProgress(progress);

        // Update noise overlay opacity based on scroll
        const noiseOverlay = document.getElementById('noiseOverlay');
        const scanlines = document.getElementById('scanlines');
        if (noiseOverlay) {
          noiseOverlay.style.opacity = Math.max(0.02, 0.12 - progress * 0.1);
        }
        if (scanlines) {
          scanlines.style.opacity = Math.max(0, 0.5 - progress * 0.5);
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ============================================
// CTA RIPPLE EFFECT
// ============================================
function initCTAEffects() {
  const cta = document.getElementById('ctaButton');
  if (!cta) return;

  cta.addEventListener('click', (e) => {
    // Add ripple
    const ripple = document.createElement('span');
    const rect = cta.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
      transform: scale(0);
      animation: rippleOut 0.6s ease forwards;
      pointer-events: none;
    `;
    cta.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

// Ripple keyframes (inject once)
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes rippleOut {
    to { transform: scale(1); opacity: 0; }
  }
`;
document.head.appendChild(rippleStyle);

// ============================================
// FLOATING CTA VISIBILITY
// ============================================
function initFloatingCTA() {
  const cta = document.getElementById('floatingCta');
  if (!cta) return;

  let shown = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting && !shown) {
        cta.style.opacity = '1';
        cta.style.transform = 'translateX(-50%) translateY(0)';
        shown = true;
      }
    });
  }, { threshold: 0 });

  // Initially hide
  cta.style.opacity = '0';
  cta.style.transform = 'translateX(-50%) translateY(20px)';
  cta.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

  observer.observe(document.getElementById('hero'));
}

// ============================================
// DOMAIN TREE INTERACTION
// ============================================
function initDomainTree() {
  const container = document.getElementById('domainTreeContainer');
  const branches = document.querySelectorAll('.tree-branch');
  const backBtn = document.getElementById('domainBackBtn');
  const contentEl = document.getElementById('domainDetailsContent');
  const cloud = document.querySelector('.tree-cloud');
  const trunkWrap = document.querySelector('.tree-trunk-wrap');
  
  if (!container || branches.length === 0) return;

  const domainData = {
    web: { title: 'Web Development', desc: 'Build scalable and dynamic web applications. Focus on modern frameworks, responsive design, and robust backends.' },
    mobile: { title: 'Mobile App Development', desc: 'Create seamless native or cross-platform mobile experiences that solve real-world problems.' },
    ai: { title: 'AI / Machine Learning', desc: 'Develop intelligent systems, predictive models, and leverage data to provide innovative solutions.' },
    iot: { title: 'IoT / Hardware', desc: 'Connect the physical and digital world. Build smart devices, sensor networks, and edge computing apps.' },
    blockchain: { title: 'Blockchain', desc: 'Build decentralized applications, smart contracts, and secure ledger technologies for the future.' },
    cyber: { title: 'Cybersecurity', desc: 'Secure systems, detect vulnerabilities, and build robust defenses against modern cyber threats.' },
    game: { title: 'Game Development', desc: 'Design and develop engaging interactive experiences and games with modern game engines.' },
    open: { title: 'Open Innovation', desc: 'Have a groundbreaking idea that doesn\'t fit the other domains? Build it here.' }
  };

  // --- Click handlers ---
  branches.forEach(branch => {
    branch.addEventListener('click', () => {
      const id = branch.dataset.domain;
      const data = domainData[id];
      if (data) {
        contentEl.innerHTML = `
          <h2 class="detail-title">${data.title}</h2>
          <p class="detail-desc">${data.desc}</p>
          <div class="info-list" style="margin-top: 16px;">
            <div class="info-list-item">Open for all years</div>
            <div class="info-list-item">Mentors available</div>
          </div>
        `;
        container.classList.add('is-active');
        const section = document.getElementById('domainsSection');
        if (section) {
          setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      }
    });
  });

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      container.classList.remove('is-active');
      const section = document.getElementById('domainsSection');
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    });
  }

  // --- Neon Dot Tracer ---
  const branchArr = Array.from(branches);

  if (!trunkWrap) return;

  // Create the dot
  const dot = document.createElement('div');
  dot.className = 'neon-trace-dot';
  dot.style.left = '0px';
  dot.style.top = '0px';
  dot.style.opacity = '0';
  trunkWrap.appendChild(dot);

  // Move dot to a position with a given duration (uses CSS transition)
  function moveDot(x, y, duration) {
    return new Promise(resolve => {
      dot.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      setTimeout(resolve, duration);
    });
  }

  function getWaypoints() {
    const wrapRect = trunkWrap.getBoundingClientRect();
    const centerX = wrapRect.width / 2;
    const waypoints = [];

    // Start at the very top of the trunk
    waypoints.push({ x: centerX, y: 0, duration: 0 });

    branchArr.forEach(branch => {
      const branchRect = branch.getBoundingClientRect();
      const branchY = branchRect.top + branchRect.height / 2 - wrapRect.top;
      const box = branch.querySelector('.branch-box');
      const boxRect = box.getBoundingClientRect();
      const isLeft = branch.classList.contains('left');

      // Box position relative to trunk-wrap
      const bx = boxRect.left - wrapRect.left;
      const by = boxRect.top - wrapRect.top;
      const bw = boxRect.width;
      const bh = boxRect.height;

      // 1. Move down trunk to branch level
      waypoints.push({ x: centerX, y: branchY, duration: 350 });

      if (isLeft) {
        // 2. Move left along connector to box right edge center
        waypoints.push({ x: bx + bw, y: branchY, duration: 250 });
        // 3. Trace box border clockwise: right-mid → right-top → left-top → left-bottom → right-bottom → right-mid
        waypoints.push({ x: bx + bw, y: by, duration: 150, highlightBox: box });
        waypoints.push({ x: bx, y: by, duration: 180 });
        waypoints.push({ x: bx, y: by + bh, duration: 150 });
        waypoints.push({ x: bx + bw, y: by + bh, duration: 180 });
        waypoints.push({ x: bx + bw, y: branchY, duration: 150, unhighlightBox: box });
        // 4. Return to trunk
        waypoints.push({ x: centerX, y: branchY, duration: 250 });
      } else {
        // 2. Move right along connector to box left edge center
        waypoints.push({ x: bx, y: branchY, duration: 250 });
        // 3. Trace box border clockwise: left-mid → left-top → right-top → right-bottom → left-bottom → left-mid
        waypoints.push({ x: bx, y: by, duration: 150, highlightBox: box });
        waypoints.push({ x: bx + bw, y: by, duration: 180 });
        waypoints.push({ x: bx + bw, y: by + bh, duration: 150 });
        waypoints.push({ x: bx, y: by + bh, duration: 180 });
        waypoints.push({ x: bx, y: branchY, duration: 150, unhighlightBox: box });
        // 4. Return to trunk
        waypoints.push({ x: centerX, y: branchY, duration: 250 });
      }
    });

    // Move to bottom of trunk
    waypoints.push({ x: centerX, y: trunkWrap.offsetHeight, duration: 350 });

    return waypoints;
  }

  let dotRunning = true;

  async function runDotLoop() {
    while (dotRunning) {
      const waypoints = getWaypoints();
      if (waypoints.length === 0) { await new Promise(r => setTimeout(r, 1000)); continue; }

      // Position dot at start instantly
      dot.style.transition = 'none';
      dot.style.left = waypoints[0].x + 'px';
      dot.style.top = waypoints[0].y + 'px';
      dot.style.opacity = '1';
      // Force reflow
      dot.offsetHeight;

      for (let i = 1; i < waypoints.length; i++) {
        if (!dotRunning) break;
        const wp = waypoints[i];

        // Highlight box when dot arrives
        if (wp.highlightBox) wp.highlightBox.classList.add('neon-trace-active');
        if (wp.unhighlightBox) wp.unhighlightBox.classList.remove('neon-trace-active');

        await moveDot(wp.x, wp.y, wp.duration);
      }

      // Fade out at bottom
      dot.style.transition = 'opacity 0.3s';
      dot.style.opacity = '0';
      
      // Clear any remaining highlights
      branchArr.forEach(b => {
        b.querySelector('.branch-box')?.classList.remove('neon-trace-active');
      });

      // Pause before restarting
      await new Promise(r => setTimeout(r, 800));
    }
  }

  // Start after layout settles
  setTimeout(() => runDotLoop(), 1200);
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  animateTagline();
  initHeroProgression();
  initCountdown();
  initScrollReveal();
  initScrollProgress();
  initCTAEffects();
  initFloatingCTA();
  initDomainTree();

  // Mobile Nav Toggle
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileNavToggle && navLinks) {
    mobileNavToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
    // Close nav when a link is clicked
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
});
