async function loadPad() {
  const urlParams = new URLSearchParams(window.location.search);
  const shortId = urlParams.get('id');
  if (!shortId) { return showError('Invalid share link'); }
  try {
    if (location.protocol === 'file:') throw new Error('file:// protocol not supported for API calls');
    const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/get-pad?id=${encodeURIComponent(shortId)}`, { headers: { 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY } });
    if (!response.ok) {
      let msg = 'Failed to load pad';
      try { const d = await response.json(); msg = d.error || msg; } catch {}
      throw new Error(msg);
    }
    const data = await response.json();
    if (data.is_protected && !sessionStorage.getItem('verified_' + shortId)) {
      showPasswordModal(shortId);
    } else {
      renderPad(data);
      if (data.monetize) showInterstitial();
    }
  } catch (e) {
    console.warn('get-pad failed, attempting local mock', e);
    try {
      const local = localStorage.getItem('mock_pad_' + shortId);
      if (local) {
        const pad = JSON.parse(local);
        showToast('Mock mode: loading local pad', 'success');
        renderPad(pad);
        return;
      }
    } catch {}
    console.error(e); showError('Failed to load pad');
  }
}

function showPasswordModal(shortId) {
  const modal = document.getElementById('password-modal'); if (!modal) return;
  modal.style.display = 'flex';
  const form = document.getElementById('password-form');
  const err = document.getElementById('password-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.style.display = 'none'; err.textContent = '';
    const password = document.getElementById('password-verify').value;
    try {
      const resp = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/verify-pad`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY }, body: JSON.stringify({ short_id: shortId, password }) });
      const data = await resp.json();
      if (data.valid) { sessionStorage.setItem('verified_' + shortId, 'true'); modal.style.display = 'none'; renderPad(data.pad); showInterstitial(); }
      else { err.textContent = 'Incorrect password'; err.style.display = 'block'; }
    } catch { err.textContent = 'Error verifying password'; err.style.display = 'block'; }
  }, { once: true });
}

function renderPad(pad) {
  window.__currentPadId = pad.id || null;
  document.getElementById('loading-screen').style.display = 'none';
  const content = document.getElementById('content'); content.style.display = 'block';
  const title = pad.title || 'Untitled Pad';
  document.getElementById('pad-title').textContent = title;
  document.getElementById('pad-description').textContent = pad.description || '';
  updateMetaTags({ title, description: pad.description || `Collection of ${pad.items?.length || 0} links`, items: pad.items || [] });

  const grid = document.getElementById('links-grid');
  grid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  (pad.items || []).forEach((item, index) => {
    const card = createLinkCard(item); fragment.appendChild(card);
    if ((index + 1) % 5 === 0 && (pad.items.length > 4) && pad.monetize) {
      const adCard = createNativeAdSlot(index); fragment.appendChild(adCard);
    }
  });
  grid.appendChild(fragment);
  initLazyAds();

  // Wire actions
  document.getElementById('copy-all-btn')?.addEventListener('click', () => copyAllUrls());
  document.getElementById('open-all-btn')?.addEventListener('click', () => openAllUrls());
}

function createLinkCard(item) {
  const card = document.createElement('div');
  card.className = 'link-card';
  card.setAttribute('data-item-id', item.id);
  card.setAttribute('data-url', item.url);
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.url)}&sz=64`;
  const domain = extractDomain(item.url);
  card.innerHTML = `
    <div class="link-card-icon">
      <img data-src="${favicon}" alt="" onerror="this.src='default-icon.svg'">
    </div>
    <div class="link-card-content">
      <h3 class="link-card-title">${escapeHtml(item.title || domain)}</h3>
      <p class="link-card-url">${escapeHtml(domain)}</p>
      <div class="link-card-stats"><span class="click-count">${item.clicks || 0}</span> views</div>
    </div>
  `;
  card.addEventListener('click', function () {
    trackClick(item.id);
    window.open(item.url, '_blank', 'noopener,noreferrer');
  });
  return card;
}

function createNativeAdSlot(index) {
  const adCard = document.createElement('div');
  adCard.className = 'ad-native ad-slot ad-loading';
  adCard.setAttribute('data-lazy', 'true'); adCard.setAttribute('data-slot', 'native'); adCard.setAttribute('data-index', String(index));
  adCard.innerHTML = `<div class="ad-label">Advertisement</div><div id="ad-native-${index}"></div>`;
  return adCard;
}

async function trackClick(itemId) {
  const ipHash = await hashIP();
  try {
    await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/track-click`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY }, body: JSON.stringify({ item_id: itemId, ip_hash: ipHash, user_agent: navigator.userAgent }) });
  } catch {}
  const counter = document.querySelector(`[data-item-id="${CSS.escape(String(itemId))}"] .click-count`);
  if (counter) counter.textContent = String(parseInt(counter.textContent || '0') + 1);
}

function copyAllUrls() {
  const links = Array.from(document.querySelectorAll('.link-card')).map(card => card.getAttribute('data-url')).filter(Boolean).join('\n');
  if (!links) return;
  navigator.clipboard.writeText(links).then(() => showToast('All links copied to clipboard!')).catch(() => {
    const textarea = document.createElement('textarea'); textarea.value = links; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea); showToast('Links copied!');
  });
}

function openAllUrls() {
  const ids = Array.from(document.querySelectorAll('.link-card')).map(card => card.getAttribute('data-item-id'));
  if (ids.length > 10 && !window.confirm(`This will open ${ids.length} tabs. Continue?`)) return;
  ids.forEach((itemId, idx) => { setTimeout(() => { const card = document.querySelector(`[data-item-id="${CSS.escape(String(itemId))}"]`); card?.click(); }, idx * 100); });
}

function showError(message) {
  document.getElementById('loading-screen').style.display = 'none';
  const e = document.getElementById('error-screen'); e.style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

function updateMetaTags(pad) {
  document.title = `${pad.title || 'Link Collection'} - MultiLinkPad`;
  const desc = pad.description || `Collection of ${pad.items.length} links`;
  document.getElementById('page-title').textContent = document.title;
  document.getElementById('page-description').setAttribute('content', desc);
  document.getElementById('og-title').setAttribute('content', pad.title || 'MultiLinkPad');
  document.getElementById('og-description').setAttribute('content', desc);
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: pad.title || 'MultiLinkPad', description: desc, numberOfItems: pad.items.length };
  const script = document.createElement('script'); script.type = 'application/ld+json'; script.textContent = JSON.stringify(ld); document.head.appendChild(script);
}

window.addEventListener('DOMContentLoaded', () => { loadPad(); lazyLoadImages(); initLazyAds(); const btn = document.getElementById('adblocker-continue'); btn?.addEventListener('click', closeAdBlockerModal); });
