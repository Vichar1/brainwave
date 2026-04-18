/**
 * HACKATHON 1.0 — Registration System
 * Multi-step form with validation, duplicate prevention, and data persistence
 */

// ============================================
// STATE
// ============================================
const state = {
  currentStep: 1,
  totalSteps: 3,
  teamName: '',
  domain: '',
  teamSize: 3,
  participants: [],
  currentParticipant: 0,
  isSubmitting: false,
};

// Restore from sessionStorage on refresh
const saved = sessionStorage.getItem('hackathon_reg');
if (saved) {
  try {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  } catch (e) { /* ignore */ }
}

function saveState() {
  sessionStorage.setItem('hackathon_reg', JSON.stringify(state));
}

// ============================================
// DOM REFS
// ============================================
const stepIndicator = document.getElementById('stepIndicator');
const stepLabel = document.getElementById('stepLabel');
const steps = document.querySelectorAll('.form-step');
const btnBack = document.getElementById('btnBack');
const btnNext = document.getElementById('btnNext');
const confirmModal = document.getElementById('confirmModal');
const toast = document.getElementById('toast');

// ============================================
// TEAM SIZE SELECTOR
// ============================================
const sizeSelector = document.getElementById('sizeSelector');
const sizeOptions = sizeSelector.querySelectorAll('.size-option');

sizeOptions.forEach(btn => {
  btn.addEventListener('click', () => {
    sizeOptions.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.teamSize = parseInt(btn.dataset.size);
    // Initialize participant array
    initParticipants();
    saveState();
  });
});

function initParticipants() {
  while (state.participants.length < state.teamSize) {
    state.participants.push({ name: '', usn: '', branch: '', semester: '', phone: '', email: '' });
  }
  state.participants = state.participants.slice(0, state.teamSize);
}

// ============================================
// VALIDATION
// ============================================
function validateStep1() {
  let valid = true;
  const teamName = document.getElementById('teamName');
  const teamDomain = document.getElementById('teamDomain');

  state.teamName = teamName.value.trim();
  state.domain = teamDomain.value;

  // Team Name
  if (!state.teamName) {
    teamName.classList.add('error');
    document.getElementById('teamNameError').style.display = 'block';
    valid = false;
  } else {
    teamName.classList.remove('error');
    document.getElementById('teamNameError').style.display = 'none';
  }

  // Domain
  if (!state.domain) {
    teamDomain.parentElement.querySelector('select').classList.add('error');
    document.getElementById('teamDomainError').style.display = 'block';
    valid = false;
  } else {
    teamDomain.parentElement.querySelector('select').classList.remove('error');
    document.getElementById('teamDomainError').style.display = 'none';
  }

  return valid;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

function validateParticipant(index) {
  const p = state.participants[index];
  const container = document.querySelector(`[data-participant="${index}"]`);
  if (!container) return false;

  let valid = true;
  const fields = {
    name: { check: v => v.length > 0, msg: 'Name is required' },
    usn: { check: v => v.length > 0, msg: 'USN is required' },
    branch: { check: v => v.length > 0, msg: 'Select branch' },
    semester: { check: v => v.length > 0, msg: 'Select semester' },
    phone: { check: v => validatePhone(v), msg: 'Valid 10-digit phone required' },
    email: { check: v => validateEmail(v), msg: 'Valid email required' },
  };

  Object.entries(fields).forEach(([key, rule]) => {
    const input = container.querySelector(`[data-field="${key}"]`);
    const error = container.querySelector(`[data-error="${key}"]`);
    if (!input) return;

    if (!rule.check(p[key])) {
      input.classList.add('error');
      if (error) { error.textContent = rule.msg; error.style.display = 'block'; }
      valid = false;
    } else {
      input.classList.remove('error');
      if (error) error.style.display = 'none';
    }
  });

  // Check duplicate USN
  const usns = state.participants.map((pp, i) => i !== index ? pp.usn.toUpperCase() : null).filter(Boolean);
  if (p.usn && usns.includes(p.usn.toUpperCase())) {
    const usnInput = container.querySelector(`[data-field="usn"]`);
    const usnError = container.querySelector(`[data-error="usn"]`);
    usnInput.classList.add('error');
    usnError.textContent = 'Duplicate USN detected';
    usnError.style.display = 'block';
    valid = false;
  }

  return valid;
}

function validateAllParticipants() {
  let valid = true;
  for (let i = 0; i < state.teamSize; i++) {
    if (!validateParticipant(i)) valid = false;
  }
  return valid;
}

// ============================================
// PARTICIPANT FORM GENERATION
// ============================================
function renderParticipants() {
  const container = document.getElementById('participantsContainer');
  container.innerHTML = '';
  initParticipants();

  state.participants.forEach((p, i) => {
    const div = document.createElement('div');
    div.dataset.participant = i;
    div.style.display = i === state.currentParticipant ? 'block' : 'none';
    div.style.animation = 'stepIn 0.4s cubic-bezier(0.4,0,0.2,1)';

    div.innerHTML = `
      <div class="participant-header">
        <span class="participant-num font-display">Participant ${i + 1}</span>
        <span class="participant-badge">${i + 1} / ${state.teamSize}</span>
      </div>

      <div class="field-group">
        <label class="field-label">Full Name</label>
        <input type="text" class="field-input" data-field="name" placeholder="Full name" value="${escapeHtml(p.name)}" autocomplete="off" />
        <div class="field-error" data-error="name"></div>
      </div>

      <div class="field-group">
        <label class="field-label">USN</label>
        <input type="text" class="field-input" data-field="usn" placeholder="e.g., 2PD21CS001" value="${escapeHtml(p.usn)}" autocomplete="off" style="text-transform: uppercase;" />
        <div class="field-error" data-error="usn"></div>
      </div>

      <div class="field-group">
        <label class="field-label">Branch</label>
        <div class="field-select">
          <select data-field="branch">
            <option value="">Select branch</option>
            <option value="CSE" ${p.branch === 'CSE' ? 'selected' : ''}>Computer Science & Engineering</option>
            <option value="CSD" ${p.branch === 'CSD' ? 'selected' : ''}>Computer Science & Design</option>
          </select>
        </div>
        <div class="field-error" data-error="branch"></div>
      </div>

      <div class="field-group">
        <label class="field-label">Semester</label>
        <div class="field-select">
          <select data-field="semester">
            <option value="">Select semester</option>
            <option value="2nd Sem" ${p.semester === '2nd Sem' ? 'selected' : ''}>2nd Semester</option>
            <option value="4th Sem" ${p.semester === '4th Sem' ? 'selected' : ''}>4th Semester</option>
            <option value="6th Sem" ${p.semester === '6th Sem' ? 'selected' : ''}>6th Semester</option>
          </select>
        </div>
        <div class="field-error" data-error="semester"></div>
      </div>

      <div class="field-group">
        <label class="field-label">Phone</label>
        <input type="tel" class="field-input" data-field="phone" placeholder="10-digit phone number" value="${escapeHtml(p.phone)}" maxlength="10" autocomplete="off" />
        <div class="field-error" data-error="phone"></div>
      </div>

      <div class="field-group">
        <label class="field-label">Email</label>
        <input type="email" class="field-input" data-field="email" placeholder="your@email.com" value="${escapeHtml(p.email)}" autocomplete="off" />
        <div class="field-error" data-error="email"></div>
      </div>

      ${state.teamSize > 1 ? `
      <div class="participant-nav">
        ${i > 0 ? `<button class="participant-nav-btn" onclick="navParticipant(${i - 1})">← Prev</button>` : ''}
        <span style="flex:1;"></span>
        ${i < state.teamSize - 1 ? `<button class="participant-nav-btn primary" onclick="navParticipant(${i + 1})">Next →</button>` : ''}
      </div>
      ` : ''}
    `;

    container.appendChild(div);
  });

  // Bind input events
  container.querySelectorAll('[data-field]').forEach(input => {
    const pIndex = parseInt(input.closest('[data-participant]').dataset.participant);
    const field = input.dataset.field;

    input.addEventListener('input', () => {
      let value = input.value;
      if (field === 'usn') value = value.toUpperCase();
      state.participants[pIndex][field] = value.trim();
      input.classList.remove('error');
      const errorEl = input.parentElement.querySelector(`[data-error="${field}"]`) ||
                       input.closest('.field-group').querySelector(`[data-error="${field}"]`);
      if (errorEl) errorEl.style.display = 'none';
      saveState();
    });

    input.addEventListener('change', () => {
      state.participants[pIndex][field] = input.value.trim();
      saveState();
    });
  });
}

// Navigate between participants
window.navParticipant = function(index) {
  // Save current participant data first
  saveCurrentParticipant();

  const containers = document.querySelectorAll('[data-participant]');
  containers.forEach(c => c.style.display = 'none');

  state.currentParticipant = index;
  const target = document.querySelector(`[data-participant="${index}"]`);
  if (target) {
    target.style.display = 'block';
    target.style.animation = 'none';
    target.offsetHeight; // trigger reflow
    target.style.animation = 'stepIn 0.4s cubic-bezier(0.4,0,0.2,1)';
  }
  saveState();
};

function saveCurrentParticipant() {
  const container = document.querySelector(`[data-participant="${state.currentParticipant}"]`);
  if (!container) return;
  container.querySelectorAll('[data-field]').forEach(input => {
    state.participants[state.currentParticipant][input.dataset.field] = input.value.trim();
  });
}

// ============================================
// REVIEW STEP
// ============================================
function renderReview() {
  const container = document.getElementById('reviewContent');

  let participantsHtml = state.participants.map((p, i) => `
    <div class="review-participant">
      <div class="review-participant-name">${escapeHtml(p.name) || 'Unnamed'}</div>
      <div class="review-data-grid">
        <div class="review-data-item">
          <span class="review-data-key">USN</span>
          <span class="review-data-val">${escapeHtml(p.usn)}</span>
        </div>
        <div class="review-data-item">
          <span class="review-data-key">Branch</span>
          <span class="review-data-val">${escapeHtml(p.branch)}</span>
        </div>
        <div class="review-data-item">
          <span class="review-data-key">Semester</span>
          <span class="review-data-val">${escapeHtml(p.semester)}</span>
        </div>
        <div class="review-data-item">
          <span class="review-data-key">Phone</span>
          <span class="review-data-val">${escapeHtml(p.phone)}</span>
        </div>
        <div class="review-data-item">
          <span class="review-data-key">Email</span>
          <span class="review-data-val">${escapeHtml(p.email)}</span>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="review-section">
      <div class="review-label">Team Name</div>
      <div class="review-value">${escapeHtml(state.teamName)}</div>
    </div>
    <div class="review-section">
      <div class="review-label">Domain</div>
      <div class="review-value text-accent">${escapeHtml(state.domain)}</div>
    </div>
    <div class="review-section">
      <div class="review-label">Team Size</div>
      <div class="review-value">${state.teamSize} member${state.teamSize > 1 ? 's' : ''}</div>
    </div>
    <div class="review-divider"></div>
    <div class="review-label" style="margin-bottom: var(--sp-3);">Participants</div>
    ${participantsHtml}
  `;
}

// ============================================
// STEP NAVIGATION
// ============================================
function goToStep(step) {
  // Validate current step before going forward
  if (step > state.currentStep) {
    if (state.currentStep === 1 && !validateStep1()) return;
    if (state.currentStep === 2) {
      saveCurrentParticipant();
      if (!validateAllParticipants()) {
        showToast('Please fill all participant details correctly', 'error');
        return;
      }
    }
  }

  state.currentStep = step;

  // Update step indicators
  stepIndicator.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'completed');
    if (i + 1 === step) dot.classList.add('active');
    if (i + 1 < step) dot.classList.add('completed');
  });
  stepLabel.textContent = `Step ${step} / ${state.totalSteps}`;

  // Show correct step
  steps.forEach(s => s.classList.remove('active'));
  document.getElementById(`step${step}`).classList.add('active');

  // Update buttons
  btnBack.style.display = step > 1 ? 'block' : 'none';
  if (step === 3) {
    btnNext.textContent = 'Submit →';
    renderReview();
  } else {
    btnNext.textContent = 'Next →';
  }

  if (step === 2) {
    renderParticipants();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  saveState();
}

// ============================================
// BUTTON HANDLERS
// ============================================
btnNext.addEventListener('click', () => {
  if (state.currentStep < state.totalSteps) {
    goToStep(state.currentStep + 1);
  } else {
    // Open confirmation modal
    openConfirmModal();
  }
});

btnBack.addEventListener('click', () => {
  if (state.currentStep === 2) saveCurrentParticipant();
  if (state.currentStep > 1) {
    goToStep(state.currentStep - 1);
  }
});

// ============================================
// CONFIRMATION MODAL
// ============================================
function openConfirmModal() {
  const summary = document.getElementById('confirmSummary');
  summary.innerHTML = `
    <div style="padding: var(--sp-3); background: var(--surface); border-radius: var(--r-sm); margin-bottom: var(--sp-3);">
      <div class="text-mono text-caption text-dim" style="margin-bottom: var(--sp-1);">Team</div>
      <div style="font-weight: 600;">${escapeHtml(state.teamName)}</div>
    </div>
    <div style="padding: var(--sp-3); background: var(--surface); border-radius: var(--r-sm);">
      <div class="text-mono text-caption text-dim" style="margin-bottom: var(--sp-1);">Members</div>
      <div style="font-weight: 600;">${state.participants.map(p => escapeHtml(p.name)).join(', ')}</div>
    </div>
  `;
  confirmModal.classList.add('visible');
}

document.getElementById('btnConfirmCancel').addEventListener('click', () => {
  confirmModal.classList.remove('visible');
});

document.getElementById('btnConfirmSubmit').addEventListener('click', async () => {
  if (state.isSubmitting) return;
  state.isSubmitting = true;
  const btn = document.getElementById('btnConfirmSubmit');
  btn.innerHTML = '<span class="spinner"></span> Submitting...';
  btn.disabled = true;

  try {
    const response = await fetch('/api/teams/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: state.teamName,
        domain: state.domain,
        teamSize: state.teamSize,
        participants: state.participants,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Clear session storage
    sessionStorage.removeItem('hackathon_reg');

    // Store success data for success page
    sessionStorage.setItem('hackathon_success', JSON.stringify({
      teamId: data.teamId,
      teamName: state.teamName,
      domain: state.domain,
      teamSize: state.teamSize,
      participants: state.participants,
      timestamp: new Date().toISOString(),
    }));

    // Redirect to success page
    window.location.href = '/success.html';
  } catch (err) {
    showToast(err.message || 'Something went wrong. Please try again.', 'error');
    btn.innerHTML = 'Submit Registration';
    btn.disabled = false;
    state.isSubmitting = false;
  }
});

// Close modal on overlay click
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    confirmModal.classList.remove('visible');
  }
});

// ============================================
// TOAST
// ============================================
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} visible`;
  setTimeout(() => toast.classList.remove('visible'), 3000);
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
  // Restore state
  const teamName = document.getElementById('teamName');
  const teamDomain = document.getElementById('teamDomain');

  if (state.teamName) teamName.value = state.teamName;
  if (state.domain) teamDomain.value = state.domain;

  // Set size selector
  sizeOptions.forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.size) === state.teamSize);
  });

  initParticipants();

  // Bind step 1 inputs for live state
  teamName.addEventListener('input', () => {
    state.teamName = teamName.value.trim();
    teamName.classList.remove('error');
    document.getElementById('teamNameError').style.display = 'none';
    saveState();
  });

  teamDomain.addEventListener('change', () => {
    state.domain = teamDomain.value;
    document.getElementById('teamDomainError').style.display = 'none';
    saveState();
  });

  // If returning to a specific step
  if (state.currentStep > 1) {
    goToStep(state.currentStep);
  }
});

// Warn on page leave during registration, except when submitting successfully
window.addEventListener('beforeunload', (e) => {
  if (state.isSubmitting) return; // Allow navigation if we are actively submitting/redirecting
  
  if (state.teamName || state.participants.some(p => p.name)) {
    e.preventDefault();
    e.returnValue = '';
  }
});
