function validateUrl(url) {
  const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lower = (url || '').toLowerCase();
  if (dangerous.some(scheme => lower.startsWith(scheme))) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch { return false; }
}

function extractDomain(url) {
  try { return new URL(url).hostname; } catch { return 'Unknown'; }
}

function escapeHtml(unsafe = '') {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function calculateExpiration(option) {
  if (option === 'never') return null;
  const now = new Date();
  const hours = { '1h': 1, '24h': 24, '7d': 24 * 7, '30d': 24 * 30 };
  now.setHours(now.getHours() + (hours[option] || 0));
  return now.toISOString();
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('show'); }, 80);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 280); }, 3000);
}

function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target; img.src = img.dataset.src; img.removeAttribute('data-src'); imageObserver.unobserve(img);
      }
    });
  });
  images.forEach(img => imageObserver.observe(img));
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

async function hashIP() {
  // Lightweight IP hash (client-side). In production consider better privacy.
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const d = await r.json();
    let hash = 0; const s = d.ip || '';
    for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
    return String(hash);
  } catch { return '0'; }
}

function generateShortId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
