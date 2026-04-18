import"./style-CPaPKTxi.js";var e=localStorage.getItem(`hackathon_admin_token`)||null,t=[],n=[],r=`all`,i=``,a=null,o=document.getElementById(`adminLogin`),s=document.getElementById(`adminDashboard`),c=document.getElementById(`loginForm`),l=document.getElementById(`loginError`),u=document.getElementById(`logoutBtn`),d=document.getElementById(`searchInput`),f=document.getElementById(`filterChips`),p=document.getElementById(`teamList`),m=document.getElementById(`exportBar`),h=document.getElementById(`exportBtn`),g=document.getElementById(`teamModal`),_=document.getElementById(`modalClose`),v=document.getElementById(`deleteModal`),y=document.getElementById(`toast`);async function b(t,n){try{let r=await fetch(`/api/admin/login`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({username:t,password:n})}),i=await r.json();if(!r.ok)throw Error(i.error||`Login failed`);e=i.token,localStorage.setItem(`hackathon_admin_token`,e),C()}catch(e){l.textContent=e.message,l.classList.add(`visible`)}}function x(){e=null,localStorage.removeItem(`hackathon_admin_token`),S()}function S(){o.style.display=`flex`,s.classList.remove(`active`),m.style.display=`none`}function C(){o.style.display=`none`,s.classList.add(`active`),m.style.display=`block`,T()}function w(){return{Authorization:`Bearer ${e}`,"Content-Type":`application/json`}}async function T(){try{let e=await fetch(`/api/admin/teams`,{headers:w()});if(e.status===401||e.status===403){x();return}t=(await e.json()).teams||[],E(),D()}catch{N(`Failed to load teams`,`error`)}}function E(){document.getElementById(`statTeams`).textContent=t.length,document.getElementById(`statMembers`).textContent=t.reduce((e,t)=>e+(t.teamSize||0),0)}function D(){n=t.filter(e=>{let t=r===`all`||e.domain===r,n=!i||e.teamName.toLowerCase().includes(i)||e.teamId.toLowerCase().includes(i)||e.participants&&e.participants.some(e=>e.name.toLowerCase().includes(i)||e.usn.toLowerCase().includes(i));return t&&n}),O()}function O(){if(n.length===0){p.innerHTML=`
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">${i||r!==`all`?`No matching teams`:`No registrations yet`}</div>
      </div>
    `;return}p.innerHTML=n.map(e=>`
    <div class="team-item" data-id="${j(e.teamId)}">
      <div class="team-item-header">
        <span class="team-item-name">${j(e.teamName)}</span>
        <span class="team-item-id">${j(e.teamId)}</span>
      </div>
      <div class="team-item-meta">
        <span class="team-item-meta-item team-item-domain">${j(e.domain)}</span>
        <span class="team-item-meta-item">${e.teamSize} member${e.teamSize>1?`s`:``}</span>
        <span class="team-item-meta-item">${M(e.createdAt)}</span>
      </div>
      <div class="team-item-actions">
        <button class="team-action-btn view" onclick="viewTeam('${j(e.teamId)}')">View</button>
        <button class="team-action-btn delete" onclick="confirmDelete('${j(e.teamId)}')">Delete</button>
      </div>
    </div>
  `).join(``)}window.viewTeam=function(e){let n=t.find(t=>t.teamId===e);if(!n)return;let r=document.getElementById(`teamModalContent`);r.innerHTML=`
    <h3 class="modal-title font-display">${j(n.teamName)}</h3>

    <div class="review-section">
      <div class="review-label">Team ID</div>
      <div class="review-value text-mono text-accent">${j(n.teamId)}</div>
    </div>
    <div class="review-section">
      <div class="review-label">Domain</div>
      <div class="review-value">${j(n.domain)}</div>
    </div>
    <div class="review-section">
      <div class="review-label">Registered</div>
      <div class="review-value text-mono text-muted">${new Date(n.createdAt).toLocaleString(`en-IN`)}</div>
    </div>

    <div class="review-divider"></div>
    <div class="review-label" style="margin-bottom: var(--sp-3);">Participants (${n.teamSize})</div>

    ${(n.participants||[]).map((e,t)=>`
      <div class="review-participant">
        <div class="review-participant-name">${t+1}. ${j(e.name)}</div>
        <div class="review-data-grid">
          <div class="review-data-item">
            <span class="review-data-key">USN</span>
            <span class="review-data-val">${j(e.usn)}</span>
          </div>
          <div class="review-data-item">
            <span class="review-data-key">Branch</span>
            <span class="review-data-val">${j(e.branch)}</span>
          </div>
          <div class="review-data-item">
            <span class="review-data-key">Phone</span>
            <span class="review-data-val">${j(e.phone)}</span>
          </div>
          <div class="review-data-item">
            <span class="review-data-key">Email</span>
            <span class="review-data-val">${j(e.email)}</span>
          </div>
        </div>
      </div>
    `).join(``)}
  `,g.classList.add(`visible`)},window.confirmDelete=function(e){a=e,v.classList.add(`visible`)};async function k(){if(a){try{let e=await fetch(`/api/admin/teams/${a}`,{method:`DELETE`,headers:w()});if(!e.ok){let t=await e.json();throw Error(t.error||`Delete failed`)}t=t.filter(e=>e.teamId!==a),E(),D(),N(`Team deleted successfully`,`success`)}catch(e){N(e.message,`error`)}a=null,v.classList.remove(`visible`)}}function A(){if(t.length===0){N(`No data to export`,`error`);return}let e=[`Team ID`,`Team Name`,`Domain`,`Team Size`,`Participant Name`,`USN`,`Branch`,`Phone`,`Email`,`Registered`],n=[];t.forEach(e=>{(e.participants||[]).forEach((t,r)=>{n.push([r===0?e.teamId:``,r===0?e.teamName:``,r===0?e.domain:``,r===0?e.teamSize:``,t.name,t.usn,t.branch,t.phone,t.email,r===0?new Date(e.createdAt).toLocaleString(`en-IN`):``].map(e=>`"${String(e).replace(/"/g,`""`)}"`).join(`,`))})});let r=[e.join(`,`),...n].join(`
`),i=new Blob([r],{type:`text/csv`}),a=URL.createObjectURL(i),o=document.createElement(`a`);o.href=a,o.download=`hackathon1.0_teams_${Date.now()}.csv`,o.click(),URL.revokeObjectURL(a),N(`CSV exported!`,`success`)}function j(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function M(e){return e?new Date(e).toLocaleDateString(`en-IN`,{day:`numeric`,month:`short`}):``}function N(e,t=`success`){y.textContent=e,y.className=`toast ${t} visible`,setTimeout(()=>y.classList.remove(`visible`),3e3)}c.addEventListener(`submit`,e=>{e.preventDefault();let t=document.getElementById(`adminUser`).value.trim(),n=document.getElementById(`adminPass`).value;if(!t||!n){l.textContent=`Please fill both fields`,l.classList.add(`visible`);return}b(t,n)}),u.addEventListener(`click`,x),d.addEventListener(`input`,e=>{i=e.target.value.toLowerCase().trim(),D()}),f.addEventListener(`click`,e=>{let t=e.target.closest(`.filter-chip`);t&&(f.querySelectorAll(`.filter-chip`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`),r=t.dataset.filter,D())}),_.addEventListener(`click`,()=>g.classList.remove(`visible`)),g.addEventListener(`click`,e=>{e.target===g&&g.classList.remove(`visible`)}),document.getElementById(`deleteCancelBtn`).addEventListener(`click`,()=>{v.classList.remove(`visible`),a=null}),document.getElementById(`deleteConfirmBtn`).addEventListener(`click`,k),v.addEventListener(`click`,e=>{e.target===v&&(v.classList.remove(`visible`),a=null)}),h.addEventListener(`click`,A),document.addEventListener(`DOMContentLoaded`,()=>{e?C():S()});