import"./style-CPaPKTxi.js";var e=JSON.parse(sessionStorage.getItem(`hackathon_success`)||`null`);e||(window.location.href=`/register.html`);function t(){e&&(document.getElementById(`teamIdDisplay`).textContent=e.teamId)}var n=class{constructor(e){this.canvas=e,this.ctx=e.getContext(`2d`),this.particles=[],this.colors=[`#B4FF00`,`#00E5FF`,`#FF3B3B`,`#FFFFFF`,`#FFD700`],this.resize(),window.addEventListener(`resize`,()=>this.resize())}resize(){this.canvas.width=window.innerWidth,this.canvas.height=window.innerHeight}spawn(e=100){for(let t=0;t<e;t++)this.particles.push({x:Math.random()*this.canvas.width,y:-20-Math.random()*200,vx:(Math.random()-.5)*4,vy:Math.random()*3+2,w:Math.random()*8+4,h:Math.random()*6+2,color:this.colors[Math.floor(Math.random()*this.colors.length)],rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.2,opacity:1,decay:.002+Math.random()*.003});this.animate()}animate(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.particles=this.particles.filter(e=>e.opacity>0&&e.y<this.canvas.height+20),this.particles.forEach(e=>{e.x+=e.vx,e.y+=e.vy,e.vy+=.05,e.rotation+=e.rotationSpeed,e.opacity-=e.decay,this.ctx.save(),this.ctx.translate(e.x,e.y),this.ctx.rotate(e.rotation),this.ctx.globalAlpha=e.opacity,this.ctx.fillStyle=e.color,this.ctx.fillRect(-e.w/2,-e.h/2,e.w,e.h),this.ctx.restore()}),this.particles.length>0&&requestAnimationFrame(()=>this.animate())}};function r(){if(!e)return``;let t=new Date(e.timestamp).toLocaleString(`en-IN`,{dateStyle:`medium`,timeStyle:`short`}),n=e.participants.map((e,t)=>`
    <div class="receipt-participant">
      <div class="receipt-p-name">${t+1}. ${a(e.name)}</div>
      <div class="receipt-p-detail">USN: ${a(e.usn)} · ${a(e.branch)} · ${a(e.phone)}</div>
      <div class="receipt-p-detail">${a(e.email)}</div>
    </div>
  `).join(``);return`
    <div style="background:#fff;color:#111;padding:32px 20px;font-family:'IBM Plex Mono',monospace;font-size:13px;width:360px;">
      <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px dashed #ddd;">
        <div style="font-family:'Clash Display',sans-serif;font-size:24px;font-weight:700;">BRAINWAVE</div>
        <div style="font-size:10px;color:#888;margin-top:4px;">PDA College of Engineering</div>
        <div style="font-size:9px;color:#aaa;margin-top:2px;">Registration Receipt</div>
      </div>

      <div style="display:flex;justify-content:space-between;padding:8px 0;">
        <span style="color:#888;font-size:11px;">TEAM ID</span>
        <span style="font-weight:700;">${a(e.teamId)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;">
        <span style="color:#888;font-size:11px;">TEAM NAME</span>
        <span style="font-weight:600;">${a(e.teamName)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;">
        <span style="color:#888;font-size:11px;">DOMAIN</span>
        <span style="font-weight:600;">${a(e.domain)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;">
        <span style="color:#888;font-size:11px;">TEAM SIZE</span>
        <span style="font-weight:600;">${e.teamSize}</span>
      </div>

      <div style="border-top:1px dashed #ddd;margin:12px 0;"></div>

      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Participants</div>
      ${n}

      <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:2px dashed #ddd;">
        <div style="font-size:10px;color:#999;">Generated: ${t}</div>
        <div style="font-size:9px;color:#bbb;margin-top:4px;">This is an auto-generated receipt. Keep it safe.</div>
      </div>
    </div>
  `}function i(){let t=r(),n=window.open(``,`_blank`,`width=400,height=600`);n.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt — BRAINWAVE — ${a(e.teamId)}</title>
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
      ${t}
      <script>
        setTimeout(() => {
          window.print();
        }, 500);
      <\/script>
    </body>
    </html>
  `),n.document.close()}function a(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}document.addEventListener(`DOMContentLoaded`,()=>{t();let e=new n(document.getElementById(`confetti-canvas`));setTimeout(()=>e.spawn(120),800),setTimeout(()=>e.spawn(60),2e3),document.getElementById(`btnDownload`).addEventListener(`click`,i)});