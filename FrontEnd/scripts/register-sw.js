// Centralized service worker registration for all pages
(function(){
  if (!('serviceWorker' in navigator)) return;
  const register = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => {
      // optional: listen for updates
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed') {
            // new content available
          }
        });
      });
    }).catch(()=>{});
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') register();
  else window.addEventListener('DOMContentLoaded', register);
})();
