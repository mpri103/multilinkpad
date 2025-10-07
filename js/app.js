function initParticles() {
  const canvas = document.getElementById('particles-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  const particles = []; for (let i = 0; i < 50; i++) { particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5 }); }
  function animate(){
    ctx.fillStyle = 'rgba(10,10,15,0.1)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    particles.forEach((p,i)=>{
      p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>canvas.width) p.vx*=-1; if(p.y<0||p.y>canvas.height) p.vy*=-1;
      ctx.fillStyle='#00f5ff'; ctx.shadowBlur=10; ctx.shadowColor='#00f5ff'; ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill();
      for(let j=i+1;j<particles.length;j++){ const p2=particles[j]; const dx=p.x-p2.x, dy=p.y-p2.y; const d=Math.hypot(dx,dy); if(d<150){ ctx.strokeStyle=`rgba(0,245,255,${1-d/150})`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y); ctx.stroke(); } }
    });
    requestAnimationFrame(animate);
  }
  animate();
  window.addEventListener('resize', () => { clearTimeout(window.__rT); window.__rT=setTimeout(resize, 200); });
}

window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  checkGDPR();
  setupStickyAd();

  // Password checkbox toggle on index
  const pwCb = document.getElementById('password-checkbox');
  const pwGroup = document.getElementById('password-group');
  if (pwCb && pwGroup) { pwCb.addEventListener('change', () => { pwGroup.style.display = pwCb.checked ? 'block' : 'none'; }); }

  // Success modal buttons
  document.getElementById('copy-share-link-btn')?.addEventListener('click', copyShareLink);
  document.getElementById('success-close-btn')?.addEventListener('click', closeSuccessModal);

  // Init lazy ads after DOM ready
  initLazyAds();
});
