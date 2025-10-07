function checkGDPR() {
  const consent = localStorage.getItem('gdpr_consent');
  if (!consent) {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const eu = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
        if (eu.includes(data.country_code)) {
          const modal = document.getElementById('gdpr-modal'); if (modal) modal.style.display = 'flex';
        }
      }).catch(() => {});
  } else if (consent === 'true') {
    loadAdsterraScript();
  }
}

function saveConsent(acceptAll) {
  const ads = acceptAll || document.getElementById('consent-ads')?.checked;
  const analytics = acceptAll || document.getElementById('consent-analytics')?.checked;
  localStorage.setItem('gdpr_consent', acceptAll ? 'true' : 'false');
  localStorage.setItem('consent_ads', ads ? 'true' : 'false');
  localStorage.setItem('consent_analytics', analytics ? 'true' : 'false');
  const modal = document.getElementById('gdpr-modal'); if (modal) modal.style.display = 'none';
  if (ads) loadAdsterraScript();
}

// Wire buttons if present
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('gdpr-accept')?.addEventListener('click', () => saveConsent(true));
  document.getElementById('gdpr-reject')?.addEventListener('click', () => saveConsent(false));
});
