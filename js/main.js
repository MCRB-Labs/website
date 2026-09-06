(function () {
  document.addEventListener('DOMContentLoaded', function () {

    // ---- mobile menu ----
    var navToggle = document.querySelector('.nav-toggle');
    var mobileMenu = document.querySelector('.mobile-menu');
    if (navToggle && mobileMenu) {
      var menuLinks = mobileMenu.querySelectorAll('a');
      navToggle.addEventListener('click', function () {
        var open = mobileMenu.classList.toggle('open');
        navToggle.classList.toggle('is-open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      menuLinks.forEach(function (a) {
        a.addEventListener('click', function () {
          mobileMenu.classList.remove('open');
          navToggle.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.setAttribute('aria-label', 'Open menu');
        });
      });
    }

    // ---- nav elevates once the page has scrolled past the top ----
    var nav = document.querySelector('.site-nav');
    if (nav) {
      var setNavState = function () {
        nav.classList.toggle('is-scrolled', window.scrollY > 8);
      };
      setNavState();
      window.addEventListener('scroll', setNavState, { passive: true });
    }
  });
})();
