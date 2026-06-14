/* ==========================================
   NEXUS PAINEL — Three.js Hero Background
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {
  var hero = document.querySelector('.hero');
  if (!hero || typeof THREE === 'undefined') return;

  var canvas, scene, camera, renderer, geometry, material, mesh;
  var positions, originalPositions;
  var isActive = true;
  var clock = new THREE.Clock();

  function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(60, hero.clientWidth / hero.clientHeight, 0.1, 100);
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    // Renderer
    var pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(hero.clientWidth, hero.clientHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);

    canvas = renderer.domElement;
    canvas.id = 'three-canvas';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    hero.insertBefore(canvas, hero.firstChild);

    // Grid plane
    var segments = 80;
    geometry = new THREE.PlaneGeometry(40, 40, segments, segments);
    geometry.rotateX(-Math.PI / 3);

    positions = geometry.attributes.position.array;
    originalPositions = new Float32Array(positions);

    // Material
    material = new THREE.PointsMaterial({
      color: 0x7D2EFF,
      size: 0.12,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    mesh = new THREE.Points(geometry, material);
    scene.add(mesh);

    // Start
    animate();
  }

  function animate() {
    if (!isActive) return;

    requestAnimationFrame(animate);

    var time = Date.now() * 0.001;
    var pos = geometry.attributes.position.array;

    for (var i = 0; i < pos.length; i += 3) {
      var x = originalPositions[i];
      var y = originalPositions[i + 1];
      var wave1 = Math.sin(x * 0.5 + time * 0.8) * Math.cos(y * 0.3 + time * 0.6);
      var wave2 = Math.sin(x * 0.3 + y * 0.4 + time * 1.2) * 0.5;
      pos[i + 2] = (wave1 + wave2) * 1.2;
    }

    geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  function onResize() {
    var w = hero.clientWidth;
    var h = hero.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      isActive = false;
    } else {
      isActive = true;
      animate();
    }
  }

  // Visibility
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Resize
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 200);
  });

  init();
});
