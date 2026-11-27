// Fallback script served when a stale index-*.js or chunk is requested by a cached HTML page.
(function () {
  console.warn('[Vite] Stale build hash detected. Automatically refreshing to load the latest version...');
  try {
    var ONCE_KEY = 'unityteck_stale_bundle_refresh';
    var last = sessionStorage.getItem(ONCE_KEY);
    var now = Date.now();
    if (!last || (now - Number(last)) > 15000) {
      sessionStorage.setItem(ONCE_KEY, String(now));
      var url = new URL(window.location.href);
      url.searchParams.set('_v', String(now));
      window.location.replace(url.toString());
    }
  } catch (e) {
    window.location.reload();
  }
})();
