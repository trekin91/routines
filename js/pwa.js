// === PWA Install + Service Worker ===

let deferredPrompt = null;

// Register service worker
export function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install buttons that may already exist
    document.querySelectorAll('.install-btn').forEach(b => b.style.display = '');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.querySelectorAll('.install-btn').forEach(b => b.style.display = 'none');
  });
}

export function getInstallPrompt() {
  return deferredPrompt;
}

export async function triggerInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  if (result.outcome === 'accepted') {
    deferredPrompt = null;
    document.querySelectorAll('.install-btn').forEach(b => b.style.display = 'none');
    return true;
  }
  return false;
}
