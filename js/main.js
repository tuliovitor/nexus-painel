/* ==========================================
   NEXUS PAINEL — Main JavaScript
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- LENIS SMOOTH SCROLL ---------- */
  var lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.4,
      easing: function (t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      },
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.5
    });

    lenis.on('scroll', function () {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.update();
      }
    });

    function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);
  }

  /* ---------- PRELOADER + SVG LOGO ANIMATION ---------- */
  (function preloaderAnimation() {
    var preloader = document.getElementById('preloader');
    var paths = document.querySelectorAll('.draw');

    if (!preloader || paths.length === 0) return;

    // RESET FORÇADO — apaga qualquer estado inline do GSAP ou bfcache
    gsap.set(preloader, {
      clearProps: 'all'
    });
    preloader.style.display    = 'flex';
    preloader.style.clipPath   = 'circle(150% at 50% 50%)';
    preloader.style.opacity    = '1';
    preloader.style.visibility = 'visible';

    // Reset dos paths SVG
    paths.forEach(function (path) {
      var length = path.getTotalLength ? path.getTotalLength() : 300;
      gsap.set(path, { clearProps: 'all' });
      path.style.strokeDasharray  = length;
      path.style.strokeDashoffset = length;
      path.style.fillOpacity      = 0;
    });

    // Timeline
    var tl = gsap.timeline({
      onComplete: function () {
        // Reveal cinematográfico: clip-path encolhe para centro
        gsap.to(preloader, {
          clipPath: 'circle(0% at 50% 50%)',
          duration: 1,
          ease: 'power3.inOut',
          onComplete: function () {
            preloader.style.visibility = 'hidden';
            preloader.style.pointerEvents = 'none';
            preloader.style.opacity = '0';
          }
        });

        // Hero entrance
        var heroContent = document.getElementById('heroContent');
        if (heroContent) {
          gsap.set(heroContent, { opacity: 1 });

          var heroEls = [
            document.getElementById('heroBadge'),
            document.getElementById('heroTitle'),
            document.getElementById('heroSubtitle'),
            document.getElementById('heroCta')
          ].filter(Boolean);

          gsap.fromTo(heroEls,
            { opacity: 0, y: 30 },
            {
              opacity: 1, y: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: 'power3.out',
              delay: 0.5,
              overwrite: 'auto'
            }
          );

          // Fade-in dos floats UMA VEZ, após hero content
          gsap.to('.hero-floating', {
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power2.out',
            delay: 1.0,
            overwrite: 'auto'
          });
        }
      }
    });

    // 1) Draw each letter (stroke animation)
    tl.to(paths, {
      strokeDashoffset: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power2.inOut'
    }, 0);

    // 2) Fill each letter (overlap with end of stroke)
    tl.to(paths, {
      fillOpacity: 1,
      duration: 0.4,
      stagger: 0.06,
      ease: 'power1.out'
    }, '-=0.2');

    // 3) Hold visible moment
    tl.to({}, { duration: 0.5 });
  })();

  /* ---------- NAVBAR SCROLL EFFECT ---------- */
  (function navbarScroll() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  })();

  /* ---------- FLOATING ELEMENTS — separar entrada e movimento ---------- */
  (function floatingAnimations() {
    var floats = document.querySelectorAll('.hero-floating');
    if (floats.length === 0) return;

    // O loop de movimento NUNCA anima opacity — apenas x e y
    // Opacity é controlada EXCLUSIVAMENTE pelo preloader onComplete
    floats.forEach(function (el) {
      gsap.to(el, {
        x: 'random(-40, 40)',
        y: 'random(-30, 30)',
        duration: 'random(4, 8)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 'random(0, 2)'
      });
    });
  })();

});
