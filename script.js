<script>
(function () {
  // ====== À MODIFIER ICI ======
  var CONFIG = {
    brand: '[myAgents]',                  
    whatsapp: '212644006421',           // format international, sans + ni espace
    email: 'contact@dragonetech.com',
    price: '2 500'                      // prix par agent (laisser vide pour afficher « communiqué sur WhatsApp »)
  };

  var LANGS = ['fr', 'en', 'ar'];
  var STORAGE_KEY = 'site_lang';
  var dict = null;
  var lang = 'fr';

  // Textes de secours (français) si translations.json ne se charge pas
  var FALLBACK_FR = {
    'meta.title': '{brand} | Neo et Veo, deux agents IA pour les entreprises du Maroc',
    'foot.line': '{brand}, Agadir',
    'offer.cur': 'DH',
    'price.line': '{amount} {cur}, paiement unique, à vie. 1 mois d’essai gratuit.',
    'price.ask': 'Tarif communiqué sur WhatsApp.',
    'wa.general': 'Bonjour, je souhaite en savoir plus sur vos agents Neo et Veo.',
    'wa.neo': 'Bonjour, je suis intéressé par Neo (agent de discussion pour mon site). Mon activité : ',
    'wa.veo': 'Bonjour, je suis intéressé par Veo (relances de factures). Mon activité : '
  };

  // Typographie française : espace insécable avant : ; ! ? » et après «
  function typo(s, key) {
    if (lang !== 'fr' || key.indexOf('wa.') === 0 || key.indexOf('meta.') === 0) return s;
    return s.replace(/ ([:;!?»])/g, '\u00A0$1').replace(/« /g, '«\u00A0');
  }

  function t(key, vars) {
    var s = null;
    if (dict && dict[lang] && dict[lang][key] != null) s = dict[lang][key];
    else if (dict && dict.fr && dict.fr[key] != null) s = dict.fr[key];
    else if (FALLBACK_FR[key] != null) s = FALLBACK_FR[key];
    if (s == null) return '';
    var all = Object.assign({ brand: CONFIG.brand }, vars || {});
    s = s.replace(/\{(\w+)\}/g, function (m, k) { return all[k] != null ? all[k] : m; });
    return typo(s, key);
  }

  function pickLang() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved && LANGS.indexOf(saved) > -1) return saved;
    var prefs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'fr'];
    for (var i = 0; i < prefs.length; i++) {
      var c = String(prefs[i]).slice(0, 2).toLowerCase();
      if (LANGS.indexOf(c) > -1) return c;
    }
    return 'fr';
  }

  var arabicFontLoaded = false;
  function loadArabicFont() {
    if (arabicFontLoaded) return;
    arabicFontLoaded = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400..800&display=swap';
    document.head.appendChild(l);
  }

  function apply() {
    var html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (lang === 'ar') loadArabicFont();

    var V = { amount: CONFIG.price, cur: t('offer.cur') };

    // Textes traduits (uniquement si le fichier JSON est chargé)
    if (dict) {
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var v = t(el.getAttribute('data-i18n'), V);
        if (v) el.textContent = v;
      });
      document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
        var v = t(el.getAttribute('data-i18n-aria'), V);
        if (v) el.setAttribute('aria-label', v);
      });
      var desc = t('meta.desc');
      var metaDesc = document.querySelector('meta[name="description"]');
      if (desc && metaDesc) metaDesc.setAttribute('content', desc);
    }

    document.title = t('meta.title');
    document.getElementById('brand').textContent = CONFIG.brand;
    document.getElementById('foot-line').textContent = t('foot.line');
    document.getElementById('offer-num').textContent = CONFIG.price;

    // Liens WhatsApp avec message prérempli
    document.querySelectorAll('[data-wa]').forEach(function (a) {
      var msg = t('wa.' + a.getAttribute('data-wa')) || t('wa.general');
      a.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
      a.target = '_blank';
      a.rel = 'noopener';
    });

    // Prix dans les blocs produits
    document.querySelectorAll('[data-price]').forEach(function (el) {
      el.textContent = CONFIG.price ? t('price.line', V) : t('price.ask');
    });

    // Boutons de langue
    document.querySelectorAll('#lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  // Pied de page
  var mail = document.getElementById('mail');
  mail.href = 'mailto:' + CONFIG.email;
  mail.textContent = CONFIG.email;
  document.getElementById('year').textContent = '© ' + new Date().getFullYear();

  // Premier affichage (français, sans attendre le fichier JSON)
  apply();

  // Chargement des traductions
  fetch('translations.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      dict = data;
      lang = pickLang();
      apply();
      document.getElementById('lang').hidden = false;
    })
    .catch(function () { /* La page reste en français, le sélecteur de langue reste masqué */ });

  document.getElementById('lang').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-lang]');
    if (!b) return;
    lang = b.getAttribute('data-lang');
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (err) {}
    apply();
  });

  // Bouton « Essayer Neo » : ouvre le widget s’il est chargé, sinon descend à la section Neo
  document.querySelectorAll('[data-open-neo]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var trigger = document.getElementById('neo-chat-trigger');
      var win = document.getElementById('neo-chat-window');
      if (!trigger) { location.hash = 'outils'; return; }
      if (!win || win.style.display !== 'flex') trigger.click();
      setTimeout(function () {
        var input = document.getElementById('neo-user-msg');
        if (input) input.focus();
      }, 300);
    });
  });

  // Barres d’ancienneté : une seule animation, quand elles apparaissent à l’écran
  var bars = document.querySelectorAll('.aging');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    bars.forEach(function (b) { io.observe(b); });
  } else {
    bars.forEach(function (b) { b.classList.add('in'); });
  }
})();
</script>
