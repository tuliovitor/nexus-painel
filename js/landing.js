/* ==========================================
   NEXUS PAINEL — Landing Page Animations
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

  // Wait for GSAP + ScrollTrigger to load
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // ---------- FEATURE CARDS (ScrollTrigger) ----------
  var featureCards = document.querySelectorAll('.feature-card');
  if (featureCards.length > 0) {
    gsap.to(featureCards, {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#features',
        start: 'top 85%',
        once: true
      }
    });
  }

  // ---------- PHILOSOPHY (revelação palavra por palavra) ----------
  var philosophyWords = document.querySelectorAll('.philosophy-word');
  var philosophySection = document.getElementById('philosophy');

  if (philosophyWords.length > 0 && philosophySection) {
    gsap.registerPlugin(ScrollTrigger);

    // Estado inicial: todas as palavras com baixa opacidade
    gsap.set(philosophyWords, { opacity: 0.12 });

    ScrollTrigger.create({
      trigger: philosophySection,
      pin: true,
      pinSpacing: true,
      start: 'top top',
      end: '+=300%',
      scrub: 1.5,
      onUpdate: function (self) {
        var progress = self.progress;
        var total = philosophyWords.length;

        philosophyWords.forEach(function (word, i) {
          var threshold = i / total;
          var windowSize = 1.5 / total;
          var wordProg  = (progress - threshold) / windowSize;
          var opacity   = Math.min(1, Math.max(0.12, wordProg));
          word.style.opacity = opacity.toFixed(3);
        });
      }
    });
  }

  // ---------- JORNADA CARDS (Tilt effect + ScrollTrigger entrance) ----------
  var jornadaCards = document.querySelectorAll('.jornada-card');

  // Entrance animation
  if (jornadaCards.length > 0) {
    gsap.fromTo(jornadaCards,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#jornada',
          start: 'top 80%',
          once: true
        }
      }
    );
  }

  // Tilt effect on hover (per-card, using mouse position)
  jornadaCards.forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -5;
      var rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform =
        'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-6px)';
      card.style.boxShadow = '0 20px 40px rgba(139,66,255,0.15)';
      card.style.borderColor = 'rgba(139,66,255,0.25)';
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      card.style.boxShadow = 'none';
      card.style.borderColor = '';
    });
  });

});
