/* ==========================================
   NEXUS PAINEL — Digital Field (Hero)
   Implementação baseada na arquitetura exata
   do projeto de referência (Violão do Zero).

   ENGENHARIA REVERSA — Valores originais:
   ─────────────────────────────────────────
   separation:  150       (espaçamento world-space)
   amountX:     40        (colunas)
   amountY:     60        (linhas / profundidade)
   dotSize:     8         (px tamanho base)
   waveAmpX:    50        (amplitude Y eixo X)
   waveAmpY:    50        (amplitude Y eixo Z)
   speed:       0.1       (incremento por frame)
   FOV:         60°
   Camera.y:    355
   Camera.z:    1220
   LookAt:      (0,0,0)   implícito (padrão)
   Fog:         THREE.Fog(0x0d0816, 2000, 10000)
   Opacity:     0.55
   VertexColors: true
   Color (dark): [0.75, 0.55, 1.0] → rgb(191,140,255)
   ─────────────────────────────────────────
   ADAPTAÇÃO NEXUS:
   • Cor: tons roxos Nexus (#8B42FF palette)
   • Mesma estrutura, mesma matemática
   • CSS container mapeado para .hero
   ========================================== */

(function () {

  /* ── Aguarda THREE.js carregar ── */
  function waitForThree(cb, attempts) {
    attempts = attempts || 0;
    if (typeof THREE !== 'undefined') { cb(); return; }
    if (attempts > 40) return; /* timeout ~2s */
    setTimeout(function () { waitForThree(cb, attempts + 1); }, 50);
  }

  waitForThree(function () {

    var container = document.querySelector('.hero');
    if (!container) return;

    /* ─────────────────────────────────────────────────
       CONFIGURAÇÃO — Replicação fiel dos valores do
       projeto de referência com adaptações de escala.
       A lógica matemática é idêntica; apenas os valores
       de cor e o mapeamento do container mudaram.
    ───────────────────────────────────────────────── */

    var isMobile = window.matchMedia('(max-width: 767px)').matches;

    var options = {
      /* ── Densidade do grid — igual ao original ── */
      amountX:    isMobile ? 28 : 40,   /* colunas */
      amountY:    isMobile ? 44 : 60,   /* linhas (profundidade) */

      /* ── Espaçamento world-space ── */
      separation: isMobile ? 170 : 150,

      /* ── Tamanho do ponto ── */
      dotSize:    isMobile ? 7 : 8,

      /* ── Amplitude da onda (igual ao original) ── */
      waveAmpX:   50,
      waveAmpY:   50,

      /* ── Velocidade de animação (igual ao original) ── */
      speed:      0.1,

      /* ── Opacidade geral (igual ao original) ── */
      opacity:    0.55,

      /* ── Cor Nexus: adaptação da cor original
            Original: [0.75, 0.55, 1.0] = rgb(191,140,255)
            Nexus:    [0.62, 0.34, 1.0] = rgb(158, 87, 255) → #9E57FF
            Mantém o tom roxo-claro característico ── */
      colorR: 0.62,
      colorG: 0.34,
      colorB: 1.00,
    };

    /* ── Estado interno ── */
    var scene, camera, renderer, geometry, material, points;
    var count = 0;
    var animId = null;
    var isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Handlers (bind antecipado) ── */
    var handleResize     = onResize.bind(null);
    var handleVisibility = onVisibility.bind(null);
    var handleMotion     = onMotionPref.bind(null);
    var handleAnimate    = animate.bind(null);

    /* ─────────────────────────────────────────────
       getSize — dimensões atuais do container
    ───────────────────────────────────────────── */
    function getSize() {
      var rect = container.getBoundingClientRect();
      return {
        width:  Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height))
      };
    }

    /* ─────────────────────────────────────────────
       createPoints — constrói o grid de partículas.
       Lógica IDÊNTICA ao projeto de referência:
         x = ix * sep - (amountX * sep) / 2
         z = iy * sep - (amountY * sep) / 2
         y = 0  (calculado no updateWave por CPU)
    ───────────────────────────────────────────── */
    function createPoints() {
      var sep     = options.separation;
      var amtX    = options.amountX;
      var amtY    = options.amountY;
      var dotSize = options.dotSize;

      var positions = [];
      var colors    = [];

      for (var ix = 0; ix < amtX; ix++) {
        for (var iy = 0; iy < amtY; iy++) {
          positions.push(
            ix * sep - (amtX * sep) / 2,  /* X centrado */
            0,                              /* Y = plano base */
            iy * sep - (amtY * sep) / 2   /* Z centrado */
          );
          /* Cor Nexus: roxo adaptado do original */
          colors.push(options.colorR, options.colorG, options.colorB);
        }
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));

      material = new THREE.PointsMaterial({
        size:         dotSize,
        vertexColors: true,
        transparent:  true,
        opacity:      options.opacity,
        sizeAttenuation: true,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);
    }

    /* ─────────────────────────────────────────────
       updateWave — animação por CPU, frame a frame.
       Fórmula IDÊNTICA ao projeto de referência:

         positions[y] =
           sin((ix + count) * 0.3) * waveAmpX +
           sin((iy + count) * 0.5) * waveAmpY

       Dois senos sobrepostos criam o movimento de
       "chão digital" coletivo e orgânico.
    ───────────────────────────────────────────── */
    function updateWave() {
      var amtX     = options.amountX;
      var amtY     = options.amountY;
      var waveAmpX = options.waveAmpX;
      var waveAmpY = options.waveAmpY;
      var posAttr  = geometry.getAttribute('position');
      var arr      = posAttr.array;
      var i        = 0;

      for (var ix = 0; ix < amtX; ix++) {
        for (var iy = 0; iy < amtY; iy++) {
          /* índice Y no array flat [x, y, z, x, y, z, ...] */
          arr[i * 3 + 1] =
            Math.sin((ix + count) * 0.3) * waveAmpX +
            Math.sin((iy + count) * 0.5) * waveAmpY;
          i++;
        }
      }

      posAttr.needsUpdate = true;
    }

    /* ─────────────────────────────────────────────
       renderFrame — renderiza um quadro e marca
       o canvas como pronto (fade-in via CSS).
    ───────────────────────────────────────────── */
    function renderFrame() {
      if (!renderer || !scene || !camera) return;
      renderer.render(scene, camera);

      /* Fade-in: adiciona classe após primeiro render */
      if (!container.classList.contains('dotted-ready')) {
        container.classList.add('dotted-ready');
      }
    }

    /* ─────────────────────────────────────────────
       animate — loop principal
    ───────────────────────────────────────────── */
    function animate() {
      animId = requestAnimationFrame(handleAnimate);
      updateWave();
      renderFrame();
      count += options.speed; /* igual ao original: count += 0.1 */
    }

    /* ─────────────────────────────────────────────
       init — inicializa cena, câmera e renderer.
       Parâmetros IDÊNTICOS ao projeto de referência:
         Camera FOV:      60
         Camera position: (0, 355, 1220)
         Fog:             THREE.Fog(cor, 2000, 10000)
    ───────────────────────────────────────────── */
    function init() {
      var size = getSize();
      if (size.width === 0 || size.height === 0) return;

      /* ── Cena com fog — cria o horizonte natural ── */
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0A0A0F, 2000, 10000);
      /* Note: 0x0d0816 no original → 0x0A0A0F no Nexus (bg-primary) */

      /* ── Câmera — valores idênticos ao original ── */
      camera = new THREE.PerspectiveCamera(60, size.width / size.height, 1, 10000);
      camera.position.set(0, 355, 1220);
      /* lookAt padrão = (0,0,0) — igual ao original */

      /* ── Renderer WebGL ── */
      renderer = new THREE.WebGLRenderer({
        alpha:          true,
        antialias:      true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(size.width, size.height);
      renderer.setClearColor(scene.fog.color, 0);

      /* ── Inserir canvas no hero ── */
      var cv = renderer.domElement;
      cv.id  = 'nexus-dotted-canvas';
      cv.setAttribute('aria-hidden', 'true');
      cv.style.cssText = [
        'position:absolute',
        'inset:0',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'z-index:0',
        'opacity:0',
        'transition:opacity 0.4s ease',
      ].join(';');
      container.insertBefore(cv, container.firstChild);

      /* ── Fade-in do canvas após primeiro render ── */
      setTimeout(function () {
        cv.style.opacity = '1';
      }, 100);

      /* ── Criar pontos ── */
      createPoints();

      /* ── Eventos ── */
      window.addEventListener('resize', handleResize, { passive: true });
      document.addEventListener('visibilitychange', handleVisibility, { passive: true });

      var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      motionQuery.addEventListener('change', handleMotion);

      /* ── Observador de tema (atualiza cores se mudar) ── */
      if (window.MutationObserver) {
        var themeObserver = new MutationObserver(function () {
          applyColors();
          renderFrame();
        });
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'data-theme'],
        });
      }

      /* ── Iniciar animação ── */
      if (isReducedMotion) {
        updateWave();
        renderFrame();
        return;
      }
      animate();
    }

    /* ─────────────────────────────────────────────
       applyColors — mantém cores roxas Nexus
       (equivalente ao applyThemeColors do original)
    ───────────────────────────────────────────── */
    function applyColors() {
      if (!geometry) return;
      var colorAttr = geometry.getAttribute('color');
      for (var i = 0; i < colorAttr.count; i++) {
        colorAttr.setXYZ(i, options.colorR, options.colorG, options.colorB);
      }
      colorAttr.needsUpdate = true;
    }

    /* ─────────────────────────────────────────────
       Handlers de eventos
    ───────────────────────────────────────────── */
    function onResize() {
      if (!camera || !renderer) return;
      var size = getSize();
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
      renderer.setSize(size.width, size.height);
      renderFrame();
    }

    function onVisibility() {
      if (document.hidden) {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        return;
      }
      if (!isReducedMotion && !animId) animate();
    }

    function onMotionPref(event) {
      isReducedMotion = event.matches;
      if (isReducedMotion) {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        renderFrame();
        return;
      }
      if (!animId) animate();
    }

    /* ─────────────────────────────────────────────
       destroy — limpeza de recursos
    ───────────────────────────────────────────── */
    function destroy() {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      if (points) {
        points.geometry.dispose();
        points.material.dispose();
        scene.remove(points);
      }
      if (renderer) {
        renderer.dispose();
        var cv = renderer.domElement;
        if (cv && container.contains(cv)) container.removeChild(cv);
      }
    }

    /* ── Verificação: DOM pronto ── */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    window.addEventListener('beforeunload', destroy, { once: true });

  }); /* waitForThree */

})();
