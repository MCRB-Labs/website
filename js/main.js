(function () {
  var root = document.documentElement;
  var stored = localStorage.getItem('mcrb-theme');
  if (stored) root.setAttribute('data-theme', stored);

  function currentTheme() {
    var attr = root.getAttribute('data-theme');
    if (attr) return attr;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('mcrb-theme', next);
      });
    }

    var navToggle = document.querySelector('.nav-toggle');
    var mobileMenu = document.querySelector('.mobile-menu');
    if (navToggle && mobileMenu) {
      navToggle.addEventListener('click', function () {
        mobileMenu.classList.toggle('open');
      });
      mobileMenu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { mobileMenu.classList.remove('open'); });
      });
    }

    var revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  });
})();
