// Central Google Analytics loader without hardcoded IDs.
// Expects GA_MEASUREMENT_ID to be supplied via inline script setting window.GA_MEASUREMENT_ID
// or via a data attribute on the script tag that includes this file (data-ga-id).
(function(){
  try {
    if(window.GA_INITIALIZED) return; // idempotent
    var id = window.GA_MEASUREMENT_ID;
    if(!id) {
      // Try data attribute on current script tag
      var current = document.currentScript;
      if(current && current.dataset && current.dataset.gaId) {
        id = current.dataset.gaId;
      }
    }
    if(!id) {
      console.warn('[GA] Measurement ID not provided; analytics disabled.');
      return;
    }
    window.GA_INITIALIZED = true;
    // Load gtag script
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    // Init gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', id, { anonymize_ip: true });
  } catch(e){
    console.error('[GA] Loader error', e);
  }
})();
