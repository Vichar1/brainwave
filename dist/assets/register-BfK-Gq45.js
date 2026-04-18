import"./style-CPaPKTxi.js";var e={currentStep:1,totalSteps:3,teamName:``,domain:``,teamSize:3,participants:[],currentParticipant:0,isSubmitting:!1},t=sessionStorage.getItem(`hackathon_reg`);if(t)try{let n=JSON.parse(t);Object.assign(e,n)}catch{}function n(){sessionStorage.setItem(`hackathon_reg`,JSON.stringify(e))}var r=document.getElementById(`stepIndicator`),i=document.getElementById(`stepLabel`),a=document.querySelectorAll(`.form-step`),o=document.getElementById(`btnBack`),s=document.getElementById(`btnNext`),c=document.getElementById(`confirmModal`),l=document.getElementById(`toast`),u=document.getElementById(`sizeSelector`).querySelectorAll(`.size-option`);u.forEach(t=>{t.addEventListener(`click`,()=>{u.forEach(e=>e.classList.remove(`selected`)),t.classList.add(`selected`),e.teamSize=parseInt(t.dataset.size),d(),n()})});function d(){for(;e.participants.length<e.teamSize;)e.participants.push({name:``,usn:``,branch:``,semester:``,phone:``,email:``});e.participants=e.participants.slice(0,e.teamSize)}function f(){let t=!0,n=document.getElementById(`teamName`),r=document.getElementById(`teamDomain`);return e.teamName=n.value.trim(),e.domain=r.value,e.teamName?(n.classList.remove(`error`),document.getElementById(`teamNameError`).style.display=`none`):(n.classList.add(`error`),document.getElementById(`teamNameError`).style.display=`block`,t=!1),e.domain?(r.parentElement.querySelector(`select`).classList.remove(`error`),document.getElementById(`teamDomainError`).style.display=`none`):(r.parentElement.querySelector(`select`).classList.add(`error`),document.getElementById(`teamDomainError`).style.display=`block`,t=!1),t}function p(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}function m(e){return/^[6-9]\d{9}$/.test(e.replace(/\s/g,``))}function h(t){let n=e.participants[t],r=document.querySelector(`[data-participant="${t}"]`);if(!r)return!1;let i=!0;Object.entries({name:{check:e=>e.length>0,msg:`Name is required`},usn:{check:e=>e.length>0,msg:`USN is required`},branch:{check:e=>e.length>0,msg:`Select branch`},semester:{check:e=>e.length>0,msg:`Select semester`},phone:{check:e=>m(e),msg:`Valid 10-digit phone required`},email:{check:e=>p(e),msg:`Valid email required`}}).forEach(([e,t])=>{let a=r.querySelector(`[data-field="${e}"]`),o=r.querySelector(`[data-error="${e}"]`);a&&(t.check(n[e])?(a.classList.remove(`error`),o&&(o.style.display=`none`)):(a.classList.add(`error`),o&&(o.textContent=t.msg,o.style.display=`block`),i=!1))});let a=e.participants.map((e,n)=>n===t?null:e.usn.toUpperCase()).filter(Boolean);if(n.usn&&a.includes(n.usn.toUpperCase())){let e=r.querySelector(`[data-field="usn"]`),t=r.querySelector(`[data-error="usn"]`);e.classList.add(`error`),t.textContent=`Duplicate USN detected`,t.style.display=`block`,i=!1}return i}function g(){let t=!0;for(let n=0;n<e.teamSize;n++)h(n)||(t=!1);return t}function _(){let t=document.getElementById(`participantsContainer`);t.innerHTML=``,d(),e.participants.forEach((n,r)=>{let i=document.createElement(`div`);i.dataset.participant=r,i.style.display=r===e.currentParticipant?`block`:`none`,i.style.animation=`stepIn 0.4s cubic-bezier(0.4,0,0.2,1)`,i.innerHTML=`
      <div class="participant-header">
        <span class="participant-num font-display">Participant ${r+1}</span>
        <span class="participant-badge">${r+1} / ${e.teamSize}</span>
      </div>

      <div class="field-group">
        <label class="field-label">Full Name</label>
        <input type="text" class="field-input" data-field="name" placeholder="Full name" value="${C(n.name)}" autocomplete="off" />
        <div class="field-error" data-error="name"></div>
      </div>

      <div class="field-group">
        <label class="field-label">USN</label>
        <input type="text" class="field-input" data-field="usn" placeholder="e.g., 2PD21CS001" value="${C(n.usn)}" autocomplete="off" style="text-transform: uppercase;" />
        <div class="field-error" data-error="usn"></div>
      </div>

      <div class="field-group">
        <label class="field-label">Branch</label>
        <div class="field-select">
          <select data-field="branch">
            <option value="">Select branch</option>
            <option value="CSE" ${n.branch===`CSE`?`selected`:``}>Computer Science & Engineering</option>
            <option value="CSD" ${n.branch===`CSD`?`selected`:``}>Computer Science & Design</option>
          </select>
        </div>
        <div class="field-error" data-error="branch"></div>
      </div>

      <div class="field-group">
        <label class="field-label">Semester</label>
        <div class="field-select">
          <select data-field="semester">
            <option value="">Select semester</option>
            <option value="2nd Sem" ${n.semester===`2nd Sem`?`selected`:``}>2nd Semester</option>
            <option value="4th Sem" ${n.semester===`4th Sem`?`selected`:``}>4th Semester</option>
            <option value="6th Sem" ${n.semester===`6th Sem`?`selected`:``}>6th Semester</option>
          </select>
        </div>
        <div class="field-error" data-error="semester"></div>
      </div>

      <div class="field-group">
        <label class="field-label">Phone</label>
        <input type="tel" class="field-input" data-field="phone" placeholder="10-digit phone number" value="${C(n.phone)}" maxlength="10" autocomplete="off" />
        <div class="field-error" data-error="phone"></div>
      </div>

      <div class="field-group">
        <label class="field-label">Email</label>
        <input type="email" class="field-input" data-field="email" placeholder="your@email.com" value="${C(n.email)}" autocomplete="off" />
        <div class="field-error" data-error="email"></div>
      </div>

      ${e.teamSize>1?`
      <div class="participant-nav">
        ${r>0?`<button class="participant-nav-btn" onclick="navParticipant(${r-1})">← Prev</button>`:``}
        <span style="flex:1;"></span>
        ${r<e.teamSize-1?`<button class="participant-nav-btn primary" onclick="navParticipant(${r+1})">Next →</button>`:``}
      </div>
      `:``}
    `,t.appendChild(i)}),t.querySelectorAll(`[data-field]`).forEach(t=>{let r=parseInt(t.closest(`[data-participant]`).dataset.participant),i=t.dataset.field;t.addEventListener(`input`,()=>{let a=t.value;i===`usn`&&(a=a.toUpperCase()),e.participants[r][i]=a.trim(),t.classList.remove(`error`);let o=t.parentElement.querySelector(`[data-error="${i}"]`)||t.closest(`.field-group`).querySelector(`[data-error="${i}"]`);o&&(o.style.display=`none`),n()}),t.addEventListener(`change`,()=>{e.participants[r][i]=t.value.trim(),n()})})}window.navParticipant=function(t){v(),document.querySelectorAll(`[data-participant]`).forEach(e=>e.style.display=`none`),e.currentParticipant=t;let r=document.querySelector(`[data-participant="${t}"]`);r&&(r.style.display=`block`,r.style.animation=`none`,r.offsetHeight,r.style.animation=`stepIn 0.4s cubic-bezier(0.4,0,0.2,1)`),n()};function v(){let t=document.querySelector(`[data-participant="${e.currentParticipant}"]`);t&&t.querySelectorAll(`[data-field]`).forEach(t=>{e.participants[e.currentParticipant][t.dataset.field]=t.value.trim()})}function y(){let t=document.getElementById(`reviewContent`),n=e.participants.map((e,t)=>`
    <div class="review-participant">
      <div class="review-participant-name">${C(e.name)||`Unnamed`}</div>
      <div class="review-data-grid">
        <div class="review-data-item">
          <span class="review-data-key">USN</span>
          <span class="review-data-val">${C(e.usn)}</span>
        </div>
        <div class="review-data-item">
          <span class="review-data-key">Branch</span>
          <span class="review-data-val">${C(e.branch)}</span>
        </div>
        <div class="review-data-item">
          <span class="review-data-key">Semester</span>
          <span class="review-data-val">${C(e.semester)}</span>
        </div>
        <div class="review-data-item">
          <span class="review-data-key">Phone</span>
          <span class="review-data-val">${C(e.phone)}</span>
        </div>
        <div class="review-data-item">
          <span class="review-data-key">Email</span>
          <span class="review-data-val">${C(e.email)}</span>
        </div>
      </div>
    </div>
  `).join(``);t.innerHTML=`
    <div class="review-section">
      <div class="review-label">Team Name</div>
      <div class="review-value">${C(e.teamName)}</div>
    </div>
    <div class="review-section">
      <div class="review-label">Domain</div>
      <div class="review-value text-accent">${C(e.domain)}</div>
    </div>
    <div class="review-section">
      <div class="review-label">Team Size</div>
      <div class="review-value">${e.teamSize} member${e.teamSize>1?`s`:``}</div>
    </div>
    <div class="review-divider"></div>
    <div class="review-label" style="margin-bottom: var(--sp-3);">Participants</div>
    ${n}
  `}function b(t){if(t>e.currentStep){if(e.currentStep===1&&!f())return;if(e.currentStep===2&&(v(),!g())){S(`Please fill all participant details correctly`,`error`);return}}e.currentStep=t,r.querySelectorAll(`.step-dot`).forEach((e,n)=>{e.classList.remove(`active`,`completed`),n+1===t&&e.classList.add(`active`),n+1<t&&e.classList.add(`completed`)}),i.textContent=`Step ${t} / ${e.totalSteps}`,a.forEach(e=>e.classList.remove(`active`)),document.getElementById(`step${t}`).classList.add(`active`),o.style.display=t>1?`block`:`none`,t===3?(s.textContent=`Submit →`,y()):s.textContent=`Next →`,t===2&&_(),window.scrollTo({top:0,behavior:`smooth`}),n()}s.addEventListener(`click`,()=>{e.currentStep<e.totalSteps?b(e.currentStep+1):x()}),o.addEventListener(`click`,()=>{e.currentStep===2&&v(),e.currentStep>1&&b(e.currentStep-1)});function x(){let t=document.getElementById(`confirmSummary`);t.innerHTML=`
    <div style="padding: var(--sp-3); background: var(--surface); border-radius: var(--r-sm); margin-bottom: var(--sp-3);">
      <div class="text-mono text-caption text-dim" style="margin-bottom: var(--sp-1);">Team</div>
      <div style="font-weight: 600;">${C(e.teamName)}</div>
    </div>
    <div style="padding: var(--sp-3); background: var(--surface); border-radius: var(--r-sm);">
      <div class="text-mono text-caption text-dim" style="margin-bottom: var(--sp-1);">Members</div>
      <div style="font-weight: 600;">${e.participants.map(e=>C(e.name)).join(`, `)}</div>
    </div>
  `,c.classList.add(`visible`)}document.getElementById(`btnConfirmCancel`).addEventListener(`click`,()=>{c.classList.remove(`visible`)}),document.getElementById(`btnConfirmSubmit`).addEventListener(`click`,async()=>{if(e.isSubmitting)return;e.isSubmitting=!0;let t=document.getElementById(`btnConfirmSubmit`);t.innerHTML=`<span class="spinner"></span> Submitting...`,t.disabled=!0;try{let t=await fetch(`/api/teams/register`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({teamName:e.teamName,domain:e.domain,teamSize:e.teamSize,participants:e.participants})}),n=await t.json();if(!t.ok)throw Error(n.error||`Registration failed`);sessionStorage.removeItem(`hackathon_reg`),sessionStorage.setItem(`hackathon_success`,JSON.stringify({teamId:n.teamId,teamName:e.teamName,domain:e.domain,teamSize:e.teamSize,participants:e.participants,timestamp:new Date().toISOString()})),window.location.href=`/success.html`}catch(n){S(n.message||`Something went wrong. Please try again.`,`error`),t.innerHTML=`Submit Registration`,t.disabled=!1,e.isSubmitting=!1}}),c.addEventListener(`click`,e=>{e.target===c&&c.classList.remove(`visible`)});function S(e,t=`success`){l.textContent=e,l.className=`toast ${t} visible`,setTimeout(()=>l.classList.remove(`visible`),3e3)}function C(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}document.addEventListener(`DOMContentLoaded`,()=>{let t=document.getElementById(`teamName`),r=document.getElementById(`teamDomain`);e.teamName&&(t.value=e.teamName),e.domain&&(r.value=e.domain),u.forEach(t=>{t.classList.toggle(`selected`,parseInt(t.dataset.size)===e.teamSize)}),d(),t.addEventListener(`input`,()=>{e.teamName=t.value.trim(),t.classList.remove(`error`),document.getElementById(`teamNameError`).style.display=`none`,n()}),r.addEventListener(`change`,()=>{e.domain=r.value,document.getElementById(`teamDomainError`).style.display=`none`,n()}),e.currentStep>1&&b(e.currentStep)}),window.addEventListener(`beforeunload`,t=>{e.isSubmitting||(e.teamName||e.participants.some(e=>e.name))&&(t.preventDefault(),t.returnValue=``)});