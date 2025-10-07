// Load Adsterra script lazily when idle
window.addEventListener('load', function () {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => loadAdsterraScript(), { timeout: 2000 });
  } else {
    setTimeout(() => loadAdsterraScript(), 1200);
  }
});

function loadAdsterraScript() {
  if (document.getElementById('adsterra-script')) return;
  const script = document.createElement('script');
  script.id = 'adsterra-script';
  script.src = 'YOUR_ADSTERRA_SCRIPT_URL'; // Replace with your Adsterra script
  script.async = true;
  script.onerror = function () { console.warn('Adsterra script failed'); detectAdBlocker(); };
  document.body.appendChild(script);
}

function initLazyAds() {
  const adSlots = document.querySelectorAll('.ad-slot[data-lazy="true"]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const slot = entry.target; loadAdInSlot(slot); observer.unobserve(slot);
      }
    });
  }, { rootMargin: '200px' });
  adSlots.forEach((slot) => observer.observe(slot));
}

function loadAdInSlot(slot) {
  // Placeholder: integrate your Adsterra slot code here based on slot.dataset.slot and CONFIG.ADSTERRA_SLOTS
  slot.classList.remove('ad-loading');
  const label = document.createElement('div'); label.className = 'ad-label'; label.textContent = 'Advertisement'; slot.appendChild(label);
  // Track impression (non-blocking)
  try { trackAdImpression(slot.dataset.slot || 'unknown', 'A'); } catch {}
}

function detectAdBlocker() {
  const bait = document.createElement('div');
  bait.className = 'ad adsbox adsbygoogle';
  bait.style.position = 'absolute'; bait.style.top = '-1px'; bait.style.height = '1px';
  document.body.appendChild(bait);
  setTimeout(function () { if (bait.offsetHeight === 0) { showAdBlockerMessage(); } bait.remove(); }, 100);
}

function showAdBlockerMessage() { const m = document.getElementById('adblocker-modal'); if (m) m.style.display = 'flex'; }
function closeAdBlockerModal() { const m = document.getElementById('adblocker-modal'); if (m) m.style.display = 'none'; }

function showInterstitial() {
  try {
    const lastShown = localStorage.getItem('interstitial_last_shown');
    const now = Date.now(); const twelveHours = 12 * 60 * 60 * 1000;
    if (!lastShown || now - parseInt(lastShown) > twelveHours) {
      setTimeout(() => {
        const interstitial = document.getElementById('interstitial-modal');
        if (!interstitial) return;
        interstitial.style.display = 'flex';
        localStorage.setItem('interstitial_last_shown', String(now));
        const btn = document.getElementById('interstitial-close');
        const timer = document.getElementById('close-timer');
        let remaining = 5; btn.disabled = true; timer.textContent = String(remaining);
        const i = setInterval(() => { remaining -= 1; timer.textContent = String(remaining); if (remaining <= 0) { clearInterval(i); btn.disabled = false; } }, 1000);
        btn?.addEventListener('click', () => { interstitial.style.display = 'none'; }, { once: true });
      }, 2000);
    }
  } catch {}
}

async function trackAdImpression(slotType, variant) {
  if (!window.supabase || !window.CONFIG) return;
  try {
    await supabase.from('ad_analytics').insert({
      pad_id: window.__currentPadId || null,
      slot_type: slotType,
      variant: variant,
      impressions: 1,
      date: new Date().toISOString().split('T')[0]
    });
  } catch (e) { /* ignore */ }
}

// Helpers for sticky ad
function setupStickyAd() {
  if (!isMobile()) return;
  const container = document.getElementById('sticky-ad-container');
  if (!container) return;
  container.style.display = 'block';
  document.body.classList.add('has-sticky-ad');
  const closeBtn = document.getElementById('sticky-ad-close');
  closeBtn?.addEventListener('click', () => { container.style.display = 'none'; document.body.classList.remove('has-sticky-ad'); });
  setTimeout(() => initLazyAds(), 3000);
}
