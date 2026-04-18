/**
 * HACKATHON 1.0 — Admin Dashboard
 * Authentication, Team Management, Search, Filter, Export
 */

// ============================================
// STATE
// ============================================
let token = localStorage.getItem('hackathon_admin_token') || null;
let teams = [];
let filteredTeams = [];
let currentFilter = 'all';
let searchQuery = '';
let deleteTargetId = null;

// ============================================
// DOM
// ============================================
const loginSection = document.getElementById('adminLogin');
const dashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const filterChips = document.getElementById('filterChips');
const teamList = document.getElementById('teamList');
const exportBar = document.getElementById('exportBar');
const exportBtn = document.getElementById('exportBtn');
const teamModal = document.getElementById('teamModal');
const modalClose = document.getElementById('modalClose');
const deleteModal = document.getElementById('deleteModal');
const toast = document.getElementById('toast');

// ============================================
// AUTH
// ============================================
async function login(username, password) {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    token = data.token;
    localStorage.setItem('hackathon_admin_token', token);
    showDashboard();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.add('visible');
  }
}

function logout() {
  token = null;
  localStorage.removeItem('hackathon_admin_token');
  showLogin();
}

function showLogin() {
  loginSection.style.display = 'flex';
  dashboard.classList.remove('active');
  exportBar.style.display = 'none';
}

function showDashboard() {
  loginSection.style.display = 'none';
  dashboard.classList.add('active');
  exportBar.style.display = 'block';
  loadTeams();
}

function authHeaders() {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ============================================
// TEAMS
// ============================================
async function loadTeams() {
  try {
    const res = await fetch('/api/admin/teams', { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    const data = await res.json();
    teams = data.teams || [];
    updateStats();
    applyFilters();
  } catch (err) {
    showToast('Failed to load teams', 'error');
  }
}

function updateStats() {
  document.getElementById('statTeams').textContent = teams.length;
  document.getElementById('statMembers').textContent = teams.reduce((sum, t) => sum + (t.teamSize || 0), 0);
}

function applyFilters() {
  filteredTeams = teams.filter(t => {
    const matchFilter = currentFilter === 'all' || t.domain === currentFilter;
    const matchSearch = !searchQuery ||
      t.teamName.toLowerCase().includes(searchQuery) ||
      t.teamId.toLowerCase().includes(searchQuery) ||
      (t.participants && t.participants.some(p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.usn.toLowerCase().includes(searchQuery)
      ));
    return matchFilter && matchSearch;
  });
  renderTeams();
}

function renderTeams() {
  if (filteredTeams.length === 0) {
    teamList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">${searchQuery || currentFilter !== 'all' ? 'No matching teams' : 'No registrations yet'}</div>
      </div>
    `;
    return;
  }

  teamList.innerHTML = filteredTeams.map(t => `
    <div class="team-item" data-id="${esc(t.teamId)}">
      <div class="team-item-header">
        <span class="team-item-name">${esc(t.teamName)}</span>
        <span class="team-item-id">${esc(t.teamId)}</span>
      </div>
      <div class="team-item-meta">
        <span class="team-item-meta-item team-item-domain">${esc(t.domain)}</span>
        <span class="team-item-meta-item">${t.teamSize} member${t.teamSize > 1 ? 's' : ''}</span>
        <span class="team-item-meta-item">${formatDate(t.createdAt)}</span>
      </div>
      <div class="team-item-actions">
        <button class="team-action-btn view" onclick="viewTeam('${esc(t.teamId)}')">View</button>
        <button class="team-action-btn delete" onclick="confirmDelete('${esc(t.teamId)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// ============================================
// VIEW TEAM
// ============================================
window.viewTeam = function(teamId) {
  const team = teams.find(t => t.teamId === teamId);
  if (!team) return;

  const content = document.getElementById('teamModalContent');
  content.innerHTML = `
    <h3 class="modal-title font-display">${esc(team.teamName)}</h3>

    <div class="review-section">
      <div class="review-label">Team ID</div>
      <div class="review-value text-mono text-accent">${esc(team.teamId)}</div>
    </div>
    <div class="review-section">
      <div class="review-label">Domain</div>
      <div class="review-value">${esc(team.domain)}</div>
    </div>
    <div class="review-section">
      <div class="review-label">Registered</div>
      <div class="review-value text-mono text-muted">${new Date(team.createdAt).toLocaleString('en-IN')}</div>
    </div>

    <div class="review-divider"></div>
    <div class="review-label" style="margin-bottom: var(--sp-3);">Participants (${team.teamSize})</div>

    ${(team.participants || []).map((p, i) => `
      <div class="review-participant">
        <div class="review-participant-name">${i + 1}. ${esc(p.name)}</div>
        <div class="review-data-grid">
          <div class="review-data-item">
            <span class="review-data-key">USN</span>
            <span class="review-data-val">${esc(p.usn)}</span>
          </div>
          <div class="review-data-item">
            <span class="review-data-key">Branch</span>
            <span class="review-data-val">${esc(p.branch)}</span>
          </div>
          <div class="review-data-item">
            <span class="review-data-key">Phone</span>
            <span class="review-data-val">${esc(p.phone)}</span>
          </div>
          <div class="review-data-item">
            <span class="review-data-key">Email</span>
            <span class="review-data-val">${esc(p.email)}</span>
          </div>
        </div>
      </div>
    `).join('')}
  `;

  teamModal.classList.add('visible');
};

// ============================================
// DELETE TEAM
// ============================================
window.confirmDelete = function(teamId) {
  deleteTargetId = teamId;
  deleteModal.classList.add('visible');
};

async function deleteTeam() {
  if (!deleteTargetId) return;

  try {
    const res = await fetch(`/api/admin/teams/${deleteTargetId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Delete failed');
    }

    teams = teams.filter(t => t.teamId !== deleteTargetId);
    updateStats();
    applyFilters();
    showToast('Team deleted successfully', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }

  deleteTargetId = null;
  deleteModal.classList.remove('visible');
}

// ============================================
// CSV EXPORT
// ============================================
function exportCSV() {
  if (teams.length === 0) {
    showToast('No data to export', 'error');
    return;
  }

  const headers = ['Team ID', 'Team Name', 'Domain', 'Team Size', 'Participant Name', 'USN', 'Branch', 'Phone', 'Email', 'Registered'];
  const rows = [];

  teams.forEach(t => {
    (t.participants || []).forEach((p, i) => {
      rows.push([
        i === 0 ? t.teamId : '',
        i === 0 ? t.teamName : '',
        i === 0 ? t.domain : '',
        i === 0 ? t.teamSize : '',
        p.name,
        p.usn,
        p.branch,
        p.phone,
        p.email,
        i === 0 ? new Date(t.createdAt).toLocaleString('en-IN') : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hackathon1.0_teams_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported!', 'success');
}

// ============================================
// UTILS
// ============================================
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} visible`;
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ============================================
// EVENT LISTENERS
// ============================================
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  if (!username || !password) {
    loginError.textContent = 'Please fill both fields';
    loginError.classList.add('visible');
    return;
  }
  login(username, password);
});

logoutBtn.addEventListener('click', logout);

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  applyFilters();
});

filterChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  filterChips.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentFilter = chip.dataset.filter;
  applyFilters();
});

modalClose.addEventListener('click', () => teamModal.classList.remove('visible'));
teamModal.addEventListener('click', (e) => {
  if (e.target === teamModal) teamModal.classList.remove('visible');
});

document.getElementById('deleteCancelBtn').addEventListener('click', () => {
  deleteModal.classList.remove('visible');
  deleteTargetId = null;
});
document.getElementById('deleteConfirmBtn').addEventListener('click', deleteTeam);
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    deleteModal.classList.remove('visible');
    deleteTargetId = null;
  }
});

exportBtn.addEventListener('click', exportCSV);

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }
});
