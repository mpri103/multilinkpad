async function createPad() {
  const textarea = document.getElementById('urls-input').value;
  const title = document.getElementById('title-input').value.trim();
  const description = document.getElementById('description-input').value.trim();
  const passwordChecked = document.getElementById('password-checkbox').checked;
  const password = passwordChecked ? document.getElementById('password-input').value : '';
  const expiration = document.getElementById('expiration-select').value;
  const monetize = document.getElementById('monetize-checkbox').checked;

  const lines = textarea.split('\n').map(s => s.trim()).filter(Boolean);
  const items = [];
  const errorEl = document.getElementById('urls-error');
  if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
  for (const line of lines) {
    if (!validateUrl(line)) {
      if (errorEl) { errorEl.textContent = 'Invalid URL: ' + line; errorEl.style.display = 'block'; }
      return;
    }
    items.push({ url: line, title: extractDomain(line) });
  }
  if (items.length === 0) { showToast('Please enter at least one URL', 'error'); return; }

  const btn = document.getElementById('create-btn');
  const btnText = btn.querySelector('.btn-text');
  const btnLoading = btn.querySelector('.btn-loading');
  btn.disabled = true; if (btnText && btnLoading) { btnText.style.display='none'; btnLoading.style.display='inline-flex'; }

  try {
    if (location.protocol === 'file:') {
      throw new Error('App is opened via file://. Please serve over http://localhost to call Supabase. Falling back to local mock.');
    }
    const resp = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/create-pad`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY },
      body: JSON.stringify({ items, title, description, password: password || null, expires_at: calculateExpiration(expiration), monetize })
    });
    if (!resp.ok) {
      let msg = 'Failed to create pad';
      try { const data = await resp.json(); msg = data.error || msg; } catch {}
      throw new Error(msg);
    }
    const data = await resp.json();
    showSuccessModal(data.short_id);
  } catch (e) {
    console.warn('Create-pad failed, using local mock.', e);
    // Fallback mock mode for demo: store pad in localStorage
    const shortId = generateShortId(8);
    const mockPad = {
      id: 'local-' + shortId,
      short_id: shortId,
      title,
      description,
      monetize,
      items: items.map((it, idx) => ({ id: 'local-item-' + idx, url: it.url, title: it.title, clicks: 0, position: idx }))
    };
    try { localStorage.setItem('mock_pad_' + shortId, JSON.stringify(mockPad)); } catch {}
    showToast('Mock mode: data saved locally for preview', 'success');
    showSuccessModal(shortId);
  } finally {
    btn.disabled = false; if (btnText && btnLoading) { btnText.style.display='inline'; btnLoading.style.display='none'; }
  }
}

function showSuccessModal(shortId) {
  const modal = document.getElementById('success-modal'); if (!modal) return;
  const shareInput = document.getElementById('share-link');
  const linkUrl = `${CONFIG.SITE_ORIGIN}/share.html?id=${encodeURIComponent(shortId)}`;
  shareInput.value = linkUrl;
  modal.style.display = 'flex';
  modal.classList.add('show');
  launchConfetti(modal);
  const wa = document.getElementById('share-whatsapp'); if (wa) wa.href = `https://wa.me/?text=${encodeURIComponent(linkUrl)}`;
  const tw = document.getElementById('share-twitter'); if (tw) tw.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(linkUrl)}&text=${encodeURIComponent('Check out my MultiLinkPad')}`;
  const fb = document.getElementById('share-facebook'); if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkUrl)}`;
}

function copyShareLink() {
  const inp = document.getElementById('share-link'); if (!inp) return;
  navigator.clipboard.writeText(inp.value).then(()=>showToast('Link copied!')).catch(()=>{
    const ta = document.createElement('textarea'); ta.value = inp.value; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('Link copied!');
  });
}

function closeSuccessModal(){ const m = document.getElementById('success-modal'); if (m) { m.style.display='none'; m.classList.remove('show'); } }

// Confetti launcher (neon palette)
function launchConfetti(containerEl) {
  const containerRoot = containerEl || document.body;
  const container = containerRoot.querySelector?.('.modal-content') || containerRoot;
  const colors = ['#00f5ff', '#ff006e', '#ffbe0b', '#c0ffea', '#9d4edd'];
  const count = 60;
  const rect = container.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const size = 6 + Math.floor(Math.random() * 8);
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 1.4}px`;
    piece.style.left = `${Math.random() * (rect.width - 10)}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.2 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    piece.style.transform = `translateY(-100px) rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

// Robust binding (works regardless of DOMContentLoaded timing)
(function setupBindings(){
  const btn = document.getElementById('create-btn');
  if (btn) {
    btn.setAttribute('type','button');
    if (!btn.__bound) { btn.addEventListener('click', createPad); btn.__bound = true; }
  }
  const copyBtn = document.getElementById('copy-share-link-btn');
  if (copyBtn && !copyBtn.__bound) { copyBtn.addEventListener('click', copyShareLink); copyBtn.__bound = true; }
  const closeBtn = document.getElementById('success-close-btn');
  if (closeBtn && !closeBtn.__bound) { closeBtn.addEventListener('click', closeSuccessModal); closeBtn.__bound = true; }
})();
