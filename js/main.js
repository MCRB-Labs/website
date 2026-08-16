(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  // Motion (motion.dev) — the vanilla-JS sibling of framer-motion, loaded from a
  // pinned CDN version. Everything core to the page (reveal-on-scroll, nav, menu)
  // works without it; if the CDN is unreachable this just resolves to null and the
  // affected enhancements (spring-based ring/counter easing, magnetic buttons,
  // menu stagger) quietly no-op instead of breaking the page.
  var motionReady = reduceMotion
    ? Promise.resolve(null)
    : import('https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm').catch(function () { return null; });

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
        if (open) {
          motionReady.then(function (motion) {
            if (!motion) return;
            menuLinks.forEach(function (a, i) {
              motion.animate(a, { opacity: [0, 1], x: [-16, 0] }, { type: 'spring', bounce: 0.25, duration: 0.5, delay: i * 0.05 });
            });
          });
        }
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

    // ---- scroll reveal (reliable vanilla path, independent of the CDN) ----
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

    // ---- numeric tweens: stat counters + score-ring fill, spring-driven when
    // Motion is available, eased rAF fallback otherwise ----
    function fallbackTween(target, duration, onUpdate, onDone) {
      if (reduceMotion) { onUpdate(target); if (onDone) onDone(); return; }
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        onUpdate(target * eased);
        if (p < 1) requestAnimationFrame(step); else if (onDone) onDone();
      }
      requestAnimationFrame(step);
    }

    function springTween(motion, target, springOpts, onUpdate, onDone) {
      if (reduceMotion) { onUpdate(target); if (onDone) onDone(); return; }
      motion.animate(0, target, Object.assign({ onUpdate: onUpdate, onComplete: onDone }, springOpts));
    }

    var statEls = document.querySelectorAll('.stat-num');
    var ringEls = document.querySelectorAll('.score-ring[data-score]');

    if (statEls.length || ringEls.length) {
      motionReady.then(function (motion) {
        if (statEls.length && 'IntersectionObserver' in window) {
          var statIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              statIo.unobserve(entry.target);
              var el = entry.target;
              var raw = el.textContent.trim();
              var suffix = raw.replace(/[0-9]/g, '');
              var target = parseInt(raw, 10);
              if (isNaN(target)) return;
              var paint = function (v) { el.textContent = Math.round(v) + suffix; };
              var done = function () { el.textContent = target + suffix; };
              if (motion) springTween(motion, target, { type: 'spring', bounce: 0, duration: 0.8 }, paint, done);
              else fallbackTween(target, 900, paint, done);
            });
          }, { threshold: 0.4 });
          statEls.forEach(function (el) { statIo.observe(el); });
        }

        if (ringEls.length && 'IntersectionObserver' in window) {
          var paintRing = function (el, pct) {
            el.style.background = 'conic-gradient(var(--productive-fg, var(--productive)) 0% ' + pct + '%, rgba(255,255,255,0.08) ' + pct + '% 100%)';
          };
          var ringIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              ringIo.unobserve(entry.target);
              var el = entry.target;
              var target = parseFloat(el.dataset.score);
              if (isNaN(target)) return;
              var paint = function (v) { paintRing(el, v); };
              if (motion) springTween(motion, target, { type: 'spring', bounce: 0.18, duration: 1 }, paint, null);
              else fallbackTween(target, 900, paint, null);
            });
          }, { threshold: 0.4 });
          ringEls.forEach(function (el) { ringIo.observe(el); });
        }
      });
    }

    // ---- subtle parallax on hero glow ----
    var glows = document.querySelectorAll('.bg-glow');
    if (glows.length && !reduceMotion) {
      var baseTops = Array.prototype.map.call(glows, function (el) {
        return parseFloat(getComputedStyle(el).top) || 0;
      });
      var ticking = false;
      var updateParallax = function () {
        var y = window.scrollY;
        glows.forEach(function (el, i) {
          if (y < 700) el.style.top = (baseTops[i] + y * 0.18) + 'px';
        });
        ticking = false;
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
      }, { passive: true });
    }

    // ---- cursor-follow spotlight + real 3D tilt on cards ----
    // (a card is a flat plane rotated in 3D space toward the cursor, spring-
    // eased via Motion; the grid it lives in carries the CSS `perspective`
    // that makes the rotation actually read as depth rather than a skew)
    if (!reduceMotion && canHover) {
      var spotlightEls = document.querySelectorAll('.card-hover, .metric-card, .step-card, .team-card');
      spotlightEls.forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          el.style.setProperty('--mx', (px * 100) + '%');
          el.style.setProperty('--my', (py * 100) + '%');
          motionReady.then(function (motion) {
            if (!motion) return;
            var rotateY = (px - 0.5) * 10;
            var rotateX = (0.5 - py) * 10;
            motion.animate(el, { rotateX: rotateX, rotateY: rotateY, y: -4, scale: 1.012 }, { type: 'spring', stiffness: 220, damping: 22, mass: 0.6 });
          });
        });
        el.addEventListener('mouseleave', function () {
          motionReady.then(function (motion) {
            if (!motion) return;
            motion.animate(el, { rotateX: 0, rotateY: 0, y: 0, scale: 1 }, { type: 'spring', stiffness: 220, damping: 18 });
          });
        });
      });
    }

    // ---- magnetic buttons: spring toward the cursor, spring back on leave ----
    if (!reduceMotion && canHover) {
      motionReady.then(function (motion) {
        if (!motion) return;
        var buttons = document.querySelectorAll('.btn');
        buttons.forEach(function (btn) {
          var strength = 0.3, maxOffset = 10;
          btn.addEventListener('mousemove', function (e) {
            var r = btn.getBoundingClientRect();
            var dx = Math.max(-maxOffset, Math.min(maxOffset, (e.clientX - (r.left + r.width / 2)) * strength));
            var dy = Math.max(-maxOffset, Math.min(maxOffset, (e.clientY - (r.top + r.height / 2)) * strength));
            motion.animate(btn, { x: dx, y: dy }, { type: 'spring', stiffness: 300, damping: 20, mass: 0.5 });
          });
          btn.addEventListener('mouseleave', function () {
            motion.animate(btn, { x: 0, y: 0 }, { type: 'spring', stiffness: 300, damping: 14 });
          });
        });
      });
    }
  });
})();
